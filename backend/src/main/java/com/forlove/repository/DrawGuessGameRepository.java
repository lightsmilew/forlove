package com.forlove.repository;

import com.forlove.entity.DrawGuessGame;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DrawGuessGameRepository extends JpaRepository<DrawGuessGame, Long> {

    @Query("""
        SELECT g FROM DrawGuessGame g
        WHERE g.status IN :statuses
          AND (g.player1 = :username OR g.player2 = :username)
        ORDER BY g.updatedAt DESC
        """)
    List<DrawGuessGame> findActiveForUser(@Param("username") String username, @Param("statuses") List<String> statuses);

    @Query("""
        SELECT g FROM DrawGuessGame g
        WHERE g.status = 'PENDING'
          AND g.inviter <> :username
          AND (g.player1 = :username OR g.player2 = :username)
        ORDER BY g.updatedAt DESC
        """)
    List<DrawGuessGame> findPendingInvitesForUser(@Param("username") String username);
}
