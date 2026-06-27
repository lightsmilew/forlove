package com.forlove.repository;

import com.forlove.entity.GomokuGame;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GomokuGameRepository extends JpaRepository<GomokuGame, Long> {

    @Query("""
        SELECT g FROM GomokuGame g
        WHERE g.status IN :statuses
          AND (g.blackPlayer = :username OR g.whitePlayer = :username)
        ORDER BY g.updatedAt DESC
        """)
    List<GomokuGame> findActiveForUser(@Param("username") String username, @Param("statuses") List<String> statuses);

    @Query("""
        SELECT g FROM GomokuGame g
        WHERE g.status = 'PENDING'
          AND g.inviter <> :username
          AND (g.blackPlayer = :username OR g.whitePlayer = :username)
        ORDER BY g.updatedAt DESC
        """)
    List<GomokuGame> findPendingInvitesForUser(@Param("username") String username);

    Optional<GomokuGame> findFirstByStatusAndBlackPlayerOrStatusAndWhitePlayer(
        String status1, String black, String status2, String white
    );
}
