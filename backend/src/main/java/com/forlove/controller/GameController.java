package com.forlove.controller;

import com.forlove.dto.GameScoreRequest;
import com.forlove.entity.GameScore;
import com.forlove.repository.GameScoreRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private final GameScoreRepository gameScoreRepository;

    public GameController(GameScoreRepository gameScoreRepository) {
        this.gameScoreRepository = gameScoreRepository;
    }

    @PostMapping("/score")
    public GameScore saveScore(@RequestBody GameScoreRequest request, Authentication auth) {
        GameScore score = gameScoreRepository
            .findByUsernameAndGameType(auth.getName(), request.gameType())
            .orElse(new GameScore());
        score.setUsername(auth.getName());
        score.setGameType(request.gameType());
        if (request.score() != null) {
            score.setScore(Math.max(score.getScore(), request.score()));
        }
        if (request.extraData() != null) {
            score.setExtraData(request.extraData());
        }
        score.setUpdatedAt(LocalDateTime.now());
        return gameScoreRepository.save(score);
    }

    @GetMapping("/scores")
    public List<GameScore> allScores() {
        return gameScoreRepository.findAll();
    }

    @GetMapping("/compatibility")
    public Map<String, Object> compatibility() {
        var scores1 = gameScoreRepository.findByGameType("quiz");
        int matchCount = 0;
        int total = 0;
        for (GameScore s : scores1) {
            if (s.getExtraData() != null) {
                total++;
                if (s.getExtraData().contains("match")) matchCount++;
            }
        }
        int compatibility = total > 0 ? (matchCount * 100 / total) : 85;
        return Map.of("compatibility", compatibility, "message",
            compatibility >= 80 ? "心有灵犀，天生一对！" :
            compatibility >= 60 ? "默契不错，继续了解彼此~" : "多玩几局，默契会越来越高！");
    }
}
