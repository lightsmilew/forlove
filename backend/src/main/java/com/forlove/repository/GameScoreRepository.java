package com.forlove.repository;

import com.forlove.entity.GameScore;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface GameScoreRepository extends JpaRepository<GameScore, Long> {
    Optional<GameScore> findByUsernameAndGameType(String username, String gameType);
    List<GameScore> findByGameType(String gameType);
}
