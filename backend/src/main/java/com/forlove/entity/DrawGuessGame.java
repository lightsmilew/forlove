package com.forlove.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "draw_guess_games")
public class DrawGuessGame {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String inviter;

    @Column(nullable = false)
    private String player1;

    @Column(nullable = false)
    private String player2;

    @Column(nullable = false)
    private String drawer;

    @Column(nullable = false)
    private String guesser;

    private String word;

    @Column(nullable = false)
    private int roundNumber = 1;

    @Column(nullable = false)
    private int maxRounds = 6;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String scoresJson = "{}";

    @Column(nullable = false, columnDefinition = "TEXT")
    private String strokesJson = "[]";

    private String lastMessage;

    @Column(nullable = false)
    private String status = "PENDING";

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getInviter() { return inviter; }
    public void setInviter(String inviter) { this.inviter = inviter; }
    public String getPlayer1() { return player1; }
    public void setPlayer1(String player1) { this.player1 = player1; }
    public String getDrawer() { return drawer; }
    public void setDrawer(String drawer) { this.drawer = drawer; }
    public String getGuesser() { return guesser; }
    public void setGuesser(String guesser) { this.guesser = guesser; }
    public String getPlayer2() { return player2; }
    public void setPlayer2(String player2) { this.player2 = player2; }
    public String getWord() { return word; }
    public void setWord(String word) { this.word = word; }
    public int getRoundNumber() { return roundNumber; }
    public void setRoundNumber(int roundNumber) { this.roundNumber = roundNumber; }
    public int getMaxRounds() { return maxRounds; }
    public void setMaxRounds(int maxRounds) { this.maxRounds = maxRounds; }
    public String getScoresJson() { return scoresJson; }
    public void setScoresJson(String scoresJson) { this.scoresJson = scoresJson; }
    public String getStrokesJson() { return strokesJson; }
    public void setStrokesJson(String strokesJson) { this.strokesJson = strokesJson; }
    public String getLastMessage() { return lastMessage; }
    public void setLastMessage(String lastMessage) { this.lastMessage = lastMessage; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
