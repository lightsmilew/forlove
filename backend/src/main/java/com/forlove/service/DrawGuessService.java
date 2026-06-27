package com.forlove.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.forlove.config.CoupleProperties;
import com.forlove.config.DrawGuessProperties;
import com.forlove.dto.DrawGuessStrokeRequest;
import com.forlove.entity.DrawGuessGame;
import com.forlove.repository.DrawGuessGameRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class DrawGuessService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final DrawGuessGameRepository repository;
    private final CoupleProperties coupleProperties;
    private final DrawGuessProperties drawGuessProperties;
    private final SimpMessagingTemplate messagingTemplate;

    public DrawGuessService(
            DrawGuessGameRepository repository,
            CoupleProperties coupleProperties,
            DrawGuessProperties drawGuessProperties,
            SimpMessagingTemplate messagingTemplate) {
        this.repository = repository;
        this.coupleProperties = coupleProperties;
        this.drawGuessProperties = drawGuessProperties;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public Map<String, Object> invite(String username) {
        String partner = requirePartner(username);
        cancelPendingForUser(username);

        DrawGuessGame game = new DrawGuessGame();
        game.setInviter(username);
        game.setPlayer1(username);
        game.setPlayer2(partner);
        game.setDrawer(username);
        game.setGuesser(partner);
        game.setMaxRounds(drawGuessProperties.getMaxRounds());
        game.setScoresJson(emptyScoresJson(username, partner));
        game.setStatus("PENDING");
        game = repository.save(game);

        notifyUser(partner, "invite", game);
        return toView(game, username);
    }

    @Transactional
    public Map<String, Object> accept(Long gameId, String username) {
        DrawGuessGame game = loadGameForUser(gameId, username);
        if (!"PENDING".equals(game.getStatus())) {
            throw new IllegalStateException("邀请已失效");
        }
        if (username.equals(game.getInviter())) {
            throw new IllegalStateException("不能接受自己发出的邀请");
        }

        game.setStatus("ACTIVE");
        startRound(game, true);
        game = repository.save(game);
        broadcastGame(game, "start");
        return toView(game, username);
    }

    @Transactional
    public Map<String, Object> decline(Long gameId, String username) {
        DrawGuessGame game = loadGameForUser(gameId, username);
        if (!"PENDING".equals(game.getStatus())) {
            throw new IllegalStateException("邀请已失效");
        }
        if (username.equals(game.getInviter())) {
            throw new IllegalStateException("不能拒绝自己发出的邀请");
        }

        game.setStatus("DECLINED");
        game.setUpdatedAt(LocalDateTime.now());
        game = repository.save(game);
        notifyUser(game.getInviter(), "declined", game);
        return toView(game, username);
    }

    @Transactional
    public Map<String, Object> stroke(Long gameId, String username, DrawGuessStrokeRequest request) {
        DrawGuessGame game = loadGameForUser(gameId, username);
        ensureDrawing(game, username);

        if (request.points() == null || request.points().isEmpty()) {
            throw new IllegalArgumentException("笔画无效");
        }

        boolean eraser = Boolean.TRUE.equals(request.eraser())
            || "eraser".equalsIgnoreCase(request.mode())
            || "eraser".equalsIgnoreCase(request.color());

        Map<String, Object> stroke = new LinkedHashMap<>();
        stroke.put("points", request.points());
        stroke.put("mode", eraser ? "eraser" : "brush");
        stroke.put("eraser", eraser);
        stroke.put("color", eraser ? "#ffffff" : (request.color() != null ? request.color() : "#333333"));
        stroke.put("width", request.width() != null ? request.width() : (eraser ? 20.0 : 4.0));

        List<Map<String, Object>> strokes = parseStrokes(game.getStrokesJson());
        strokes.add(stroke);
        game.setStrokesJson(toStrokesJson(strokes));
        game.setUpdatedAt(LocalDateTime.now());
        game = repository.save(game);

        notifyUser(game.getGuesser(), "stroke", game, stroke);
        return toView(game, username);
    }

    @Transactional
    public Map<String, Object> clearCanvas(Long gameId, String username) {
        DrawGuessGame game = loadGameForUser(gameId, username);
        ensureDrawing(game, username);

        game.setStrokesJson("[]");
        game.setUpdatedAt(LocalDateTime.now());
        game = repository.save(game);

        broadcastGame(game, "clear");
        return toView(game, username);
    }

    @Transactional
    public Map<String, Object> guess(Long gameId, String username, String guessText) {
        DrawGuessGame game = loadGameForUser(gameId, username);
        if (!"ACTIVE".equals(game.getStatus())) {
            throw new IllegalStateException("对局未进行中");
        }
        if (!username.equals(game.getGuesser())) {
            throw new IllegalStateException("只有猜词方可以提交答案");
        }
        if (guessText == null || guessText.isBlank()) {
            throw new IllegalArgumentException("请输入答案");
        }

        boolean correct = matchesWord(guessText, game.getWord());
        if (correct) {
            Map<String, Integer> scores = parseScores(game.getScoresJson());
            scores.merge(username, 1, Integer::sum);
            game.setScoresJson(toScoresJson(scores));
            game.setLastMessage(coupleProperties.getNickname(username) + " 猜对了！答案是「" + game.getWord() + "」");
            game.setUpdatedAt(LocalDateTime.now());
            game = repository.save(game);
            broadcastGame(game, "correct", Map.of("guess", guessText.trim()));

            if (game.getRoundNumber() >= game.getMaxRounds()) {
                game.setStatus("FINISHED");
                game.setLastMessage("游戏结束！" + scoreSummary(game));
                game.setUpdatedAt(LocalDateTime.now());
                game = repository.save(game);
                broadcastGame(game, "finished");
            } else {
                advanceRound(game);
                game = repository.save(game);
                broadcastGame(game, "round_start");
            }
        } else {
            game.setLastMessage("「" + guessText.trim() + "」不对，再想想~");
            game.setUpdatedAt(LocalDateTime.now());
            game = repository.save(game);
            broadcastGame(game, "wrong", Map.of("guess", guessText.trim()));
        }

        return toView(game, username);
    }

    @Transactional
    public Map<String, Object> skip(Long gameId, String username) {
        DrawGuessGame game = loadGameForUser(gameId, username);
        ensureDrawing(game, username);

        game.setLastMessage("画手跳过，答案是「" + game.getWord() + "」");
        game.setUpdatedAt(LocalDateTime.now());
        game = repository.save(game);
        broadcastGame(game, "skip");

        if (game.getRoundNumber() >= game.getMaxRounds()) {
            game.setStatus("FINISHED");
            game.setLastMessage("游戏结束！" + scoreSummary(game));
            game.setUpdatedAt(LocalDateTime.now());
            game = repository.save(game);
            broadcastGame(game, "finished");
        } else {
            advanceRound(game);
            game = repository.save(game);
            broadcastGame(game, "round_start");
        }

        return toView(game, username);
    }

    @Transactional
    public Map<String, Object> forfeit(Long gameId, String username) {
        DrawGuessGame game = loadGameForUser(gameId, username);
        if (!"ACTIVE".equals(game.getStatus())) {
            throw new IllegalStateException("对局未进行中");
        }

        String winner = username.equals(game.getPlayer1()) ? game.getPlayer2() : game.getPlayer1();
        Map<String, Integer> scores = parseScores(game.getScoresJson());
        scores.merge(winner, 1, Integer::sum);
        game.setScoresJson(toScoresJson(scores));
        game.setStatus("FINISHED");
        game.setLastMessage(coupleProperties.getNickname(winner) + " 获胜（对方退出）");
        game.setUpdatedAt(LocalDateTime.now());
        game = repository.save(game);
        broadcastGame(game, "forfeit");
        return toView(game, username);
    }

    public List<Map<String, Object>> pendingInvites(String username) {
        return repository.findPendingInvitesForUser(username).stream()
            .map(g -> toView(g, username))
            .toList();
    }

    public Map<String, Object> currentGame(String username) {
        List<DrawGuessGame> games = repository.findActiveForUser(username, List.of("PENDING", "ACTIVE"));
        if (games.isEmpty()) return null;
        return toView(games.get(0), username);
    }

    public Map<String, Object> getGame(Long gameId, String username) {
        return toView(loadGameForUser(gameId, username), username);
    }

    private void startRound(DrawGuessGame game, boolean firstRound) {
        if (!firstRound) {
            String drawer = game.getDrawer();
            game.setDrawer(game.getGuesser());
            game.setGuesser(drawer);
            game.setRoundNumber(game.getRoundNumber() + 1);
        }
        game.setWord(pickWord());
        game.setStrokesJson("[]");
        game.setUpdatedAt(LocalDateTime.now());
        if (firstRound) {
            game.setLastMessage("第 1 轮开始，" + coupleProperties.getNickname(game.getDrawer()) + " 作画");
        } else {
            game.setLastMessage("第 " + game.getRoundNumber() + " 轮开始，"
                + coupleProperties.getNickname(game.getDrawer()) + " 作画");
        }
    }

    private void advanceRound(DrawGuessGame game) {
        startRound(game, false);
    }

    private String pickWord() {
        List<String> words = drawGuessProperties.getWords();
        if (words == null || words.isEmpty()) {
            return "樱花";
        }
        return words.get(ThreadLocalRandom.current().nextInt(words.size()));
    }

    private boolean matchesWord(String guess, String word) {
        if (word == null) return false;
        String g = normalize(guess);
        String w = normalize(word);
        return g.equals(w) || g.contains(w) || w.contains(g);
    }

    private String normalize(String s) {
        return s.trim().replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
    }

    private void ensureDrawing(DrawGuessGame game, String username) {
        if (!"ACTIVE".equals(game.getStatus())) {
            throw new IllegalStateException("对局未进行中");
        }
        if (!username.equals(game.getDrawer())) {
            throw new IllegalStateException("只有画手可以操作画布");
        }
    }

    private void cancelPendingForUser(String username) {
        List<DrawGuessGame> pending = repository.findActiveForUser(username, List.of("PENDING"));
        for (DrawGuessGame game : pending) {
            if (username.equals(game.getInviter())) {
                game.setStatus("CANCELLED");
                game.setUpdatedAt(LocalDateTime.now());
                repository.save(game);
            }
        }
    }

    private DrawGuessGame loadGameForUser(Long gameId, String username) {
        DrawGuessGame game = repository.findById(gameId)
            .orElseThrow(() -> new NoSuchElementException("对局不存在"));
        if (!username.equals(game.getPlayer1()) && !username.equals(game.getPlayer2())) {
            throw new SecurityException("无权访问该对局");
        }
        return game;
    }

    private String requirePartner(String username) {
        String partner = coupleProperties.getPartnerUsername(username);
        if (partner == null) {
            throw new IllegalStateException("未找到对战对象");
        }
        return partner;
    }

    private void notifyUser(String username, String type, DrawGuessGame game) {
        send(username, type, game, null, null);
    }

    private void notifyUser(String username, String type, DrawGuessGame game, Map<String, Object> stroke) {
        send(username, type, game, stroke, null);
    }

    private void broadcastGame(DrawGuessGame game, String type) {
        send(game.getPlayer1(), type, game, null, null);
        send(game.getPlayer2(), type, game, null, null);
    }

    private void broadcastGame(DrawGuessGame game, String type, Map<String, Object> fields) {
        send(game.getPlayer1(), type, game, null, fields);
        send(game.getPlayer2(), type, game, null, fields);
    }

    private void send(String username, String type, DrawGuessGame game,
                      Map<String, Object> stroke, Map<String, Object> fields) {
        Map<String, Object> message = new LinkedHashMap<>();
        message.put("type", type);
        message.put("game", toView(game, username));
        if (stroke != null) {
            message.put("stroke", stroke);
        }
        if (fields != null) {
            message.putAll(fields);
        }
        messagingTemplate.convertAndSendToUser(username, "/queue/drawguess", message);
    }

    public Map<String, Object> toView(DrawGuessGame game, String viewer) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", game.getId());
        map.put("status", game.getStatus());
        map.put("inviter", game.getInviter());
        map.put("inviterNickname", coupleProperties.getNickname(game.getInviter()));
        map.put("player1", game.getPlayer1());
        map.put("player2", game.getPlayer2());
        map.put("player1Nickname", coupleProperties.getNickname(game.getPlayer1()));
        map.put("player2Nickname", coupleProperties.getNickname(game.getPlayer2()));
        map.put("drawer", game.getDrawer());
        map.put("guesser", game.getGuesser());
        map.put("drawerNickname", coupleProperties.getNickname(game.getDrawer()));
        map.put("guesserNickname", coupleProperties.getNickname(game.getGuesser()));
        map.put("roundNumber", game.getRoundNumber());
        map.put("maxRounds", game.getMaxRounds());
        map.put("scores", parseScores(game.getScoresJson()));
        map.put("strokes", parseStrokes(game.getStrokesJson()));
        map.put("lastMessage", game.getLastMessage());
        map.put("updatedAt", game.getUpdatedAt());
        map.put("isDrawer", viewer.equals(game.getDrawer()));
        map.put("isGuesser", viewer.equals(game.getGuesser()));

        boolean revealWord = "FINISHED".equals(game.getStatus())
            || (viewer.equals(game.getDrawer()) && "ACTIVE".equals(game.getStatus()));
        map.put("word", revealWord ? game.getWord() : null);

        return map;
    }

    private String scoreSummary(DrawGuessGame game) {
        Map<String, Integer> scores = parseScores(game.getScoresJson());
        return coupleProperties.getNickname(game.getPlayer1()) + " "
            + scores.getOrDefault(game.getPlayer1(), 0) + " : "
            + scores.getOrDefault(game.getPlayer2(), 0) + " "
            + coupleProperties.getNickname(game.getPlayer2());
    }

    private String emptyScoresJson(String u1, String u2) {
        Map<String, Integer> scores = new LinkedHashMap<>();
        scores.put(u1, 0);
        scores.put(u2, 0);
        return toScoresJson(scores);
    }

    private Map<String, Integer> parseScores(String json) {
        try {
            return new LinkedHashMap<>(MAPPER.readValue(json, new TypeReference<Map<String, Integer>>() {}));
        } catch (Exception e) {
            return new LinkedHashMap<>();
        }
    }

    private String toScoresJson(Map<String, Integer> scores) {
        try {
            return MAPPER.writeValueAsString(scores);
        } catch (Exception e) {
            throw new RuntimeException("分数保存失败");
        }
    }

    private List<Map<String, Object>> parseStrokes(String json) {
        try {
            return new ArrayList<>(MAPPER.readValue(json, new TypeReference<List<Map<String, Object>>>() {}));
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private String toStrokesJson(List<Map<String, Object>> strokes) {
        try {
            return MAPPER.writeValueAsString(strokes);
        } catch (Exception e) {
            throw new RuntimeException("笔画保存失败");
        }
    }
}
