package com.forlove.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.forlove.config.CoupleProperties;
import com.forlove.entity.GomokuGame;
import com.forlove.repository.GomokuGameRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class GomokuService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final GomokuGameRepository repository;
    private final CoupleProperties coupleProperties;
    private final SimpMessagingTemplate messagingTemplate;

    public GomokuService(
            GomokuGameRepository repository,
            CoupleProperties coupleProperties,
            SimpMessagingTemplate messagingTemplate) {
        this.repository = repository;
        this.coupleProperties = coupleProperties;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public Map<String, Object> invite(String username) {
        String partner = requirePartner(username);
        cancelPendingForUser(username);

        GomokuGame game = new GomokuGame();
        game.setInviter(username);
        game.setBlackPlayer(username);
        game.setWhitePlayer(partner);
        game.setBoardJson(emptyBoardJson());
        game.setCurrentTurn(username);
        game.setStatus("PENDING");
        game = repository.save(game);

        notifyUser(partner, "invite", game);
        return toView(game, username);
    }

    @Transactional
    public Map<String, Object> accept(Long gameId, String username) {
        GomokuGame game = loadGameForUser(gameId, username);
        if (!"PENDING".equals(game.getStatus())) {
            throw new IllegalStateException("邀请已失效");
        }
        if (username.equals(game.getInviter())) {
            throw new IllegalStateException("不能接受自己发出的邀请");
        }

        game.setStatus("ACTIVE");
        game.setUpdatedAt(LocalDateTime.now());
        game = repository.save(game);
        broadcastGame(game, "start");
        return toView(game, username);
    }

    @Transactional
    public Map<String, Object> decline(Long gameId, String username) {
        GomokuGame game = loadGameForUser(gameId, username);
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
    public Map<String, Object> move(Long gameId, String username, int x, int y) {
        GomokuGame game = loadGameForUser(gameId, username);
        if (!"ACTIVE".equals(game.getStatus())) {
            throw new IllegalStateException("对局未开始或已结束");
        }
        if (!username.equals(game.getCurrentTurn())) {
            throw new IllegalStateException("还没轮到你下棋");
        }

        int[][] board = parseBoard(game.getBoardJson());
        if (x < 0 || x >= GomokuGame.BOARD_SIZE || y < 0 || y >= GomokuGame.BOARD_SIZE) {
            throw new IllegalArgumentException("落子位置无效");
        }
        if (board[x][y] != 0) {
            throw new IllegalStateException("该位置已有棋子");
        }

        int stone = username.equals(game.getBlackPlayer()) ? 1 : 2;
        board[x][y] = stone;
        game.setBoardJson(toBoardJson(board));
        game.setUpdatedAt(LocalDateTime.now());

        if (checkWin(board, x, y, stone)) {
            game.setStatus("FINISHED");
            game.setWinner(username);
        } else {
            game.setCurrentTurn(username.equals(game.getBlackPlayer())
                ? game.getWhitePlayer() : game.getBlackPlayer());
        }

        game = repository.save(game);
        broadcastGame(game, "move");
        return toView(game, username);
    }

    @Transactional
    public Map<String, Object> resign(Long gameId, String username) {
        GomokuGame game = loadGameForUser(gameId, username);
        if (!"ACTIVE".equals(game.getStatus())) {
            throw new IllegalStateException("对局未进行中");
        }

        String winner = username.equals(game.getBlackPlayer())
            ? game.getWhitePlayer() : game.getBlackPlayer();
        game.setStatus("FINISHED");
        game.setWinner(winner);
        game.setUpdatedAt(LocalDateTime.now());
        game = repository.save(game);
        broadcastGame(game, "resign");
        return toView(game, username);
    }

    public List<Map<String, Object>> pendingInvites(String username) {
        return repository.findPendingInvitesForUser(username).stream()
            .map(g -> toView(g, username))
            .toList();
    }

    public Map<String, Object> currentGame(String username) {
        List<GomokuGame> games = repository.findActiveForUser(username, List.of("PENDING", "ACTIVE"));
        if (games.isEmpty()) return null;
        return toView(games.get(0), username);
    }

    public Map<String, Object> getGame(Long gameId, String username) {
        return toView(loadGameForUser(gameId, username), username);
    }

    private void cancelPendingForUser(String username) {
        List<GomokuGame> pending = repository.findActiveForUser(username, List.of("PENDING"));
        for (GomokuGame game : pending) {
            if (username.equals(game.getInviter())) {
                game.setStatus("CANCELLED");
                game.setUpdatedAt(LocalDateTime.now());
                repository.save(game);
            }
        }
    }

    private GomokuGame loadGameForUser(Long gameId, String username) {
        GomokuGame game = repository.findById(gameId)
            .orElseThrow(() -> new NoSuchElementException("对局不存在"));
        if (!username.equals(game.getBlackPlayer()) && !username.equals(game.getWhitePlayer())) {
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

    private void notifyUser(String username, String type, GomokuGame game) {
        Map<String, Object> message = new LinkedHashMap<>();
        message.put("type", type);
        message.put("game", toView(game, username));
        messagingTemplate.convertAndSendToUser(username, "/queue/gomoku", message);
    }

    private void broadcastGame(GomokuGame game, String type) {
        notifyUser(game.getBlackPlayer(), type, game);
        notifyUser(game.getWhitePlayer(), type, game);
    }

    public Map<String, Object> toView(GomokuGame game, String viewer) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", game.getId());
        map.put("status", game.getStatus());
        map.put("inviter", game.getInviter());
        map.put("inviterNickname", coupleProperties.getNickname(game.getInviter()));
        map.put("blackPlayer", game.getBlackPlayer());
        map.put("whitePlayer", game.getWhitePlayer());
        map.put("blackNickname", coupleProperties.getNickname(game.getBlackPlayer()));
        map.put("whiteNickname", coupleProperties.getNickname(game.getWhitePlayer()));
        map.put("currentTurn", game.getCurrentTurn());
        map.put("currentTurnNickname", coupleProperties.getNickname(game.getCurrentTurn()));
        map.put("winner", game.getWinner());
        map.put("winnerNickname", game.getWinner() != null ? coupleProperties.getNickname(game.getWinner()) : null);
        map.put("board", parseBoard(game.getBoardJson()));
        map.put("myColor", viewer.equals(game.getBlackPlayer()) ? "black"
            : viewer.equals(game.getWhitePlayer()) ? "white" : null);
        map.put("isMyTurn", viewer.equals(game.getCurrentTurn()));
        map.put("updatedAt", game.getUpdatedAt());
        return map;
    }

    private String emptyBoardJson() {
        return toBoardJson(new int[GomokuGame.BOARD_SIZE][GomokuGame.BOARD_SIZE]);
    }

    private int[][] parseBoard(String json) {
        try {
            return MAPPER.readValue(json, new TypeReference<int[][]>() {});
        } catch (Exception e) {
            return new int[GomokuGame.BOARD_SIZE][GomokuGame.BOARD_SIZE];
        }
    }

    private String toBoardJson(int[][] board) {
        try {
            return MAPPER.writeValueAsString(board);
        } catch (Exception e) {
            throw new RuntimeException("棋盘数据保存失败");
        }
    }

    private boolean checkWin(int[][] board, int x, int y, int stone) {
        int[][] dirs = {{1, 0}, {0, 1}, {1, 1}, {1, -1}};
        for (int[] d : dirs) {
            int count = 1;
            for (int sign : new int[] {1, -1}) {
                int cx = x + d[0] * sign;
                int cy = y + d[1] * sign;
                while (cx >= 0 && cx < GomokuGame.BOARD_SIZE
                    && cy >= 0 && cy < GomokuGame.BOARD_SIZE
                    && board[cx][cy] == stone) {
                    count++;
                    cx += d[0] * sign;
                    cy += d[1] * sign;
                }
            }
            if (count >= 5) return true;
        }
        return false;
    }
}
