package com.forlove.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "gomoku_games")
public class GomokuGame {

    public static final int BOARD_SIZE = 15;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String inviter;

    @Column(nullable = false)
    private String blackPlayer;

    @Column(nullable = false)
    private String whitePlayer;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String boardJson;

    @Column(nullable = false)
    private String currentTurn;

    @Column(nullable = false)
    private String status = "PENDING";

    private String winner;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getInviter() { return inviter; }
    public void setInviter(String inviter) { this.inviter = inviter; }
    public String getBlackPlayer() { return blackPlayer; }
    public void setBlackPlayer(String blackPlayer) { this.blackPlayer = blackPlayer; }
    public String getWhitePlayer() { return whitePlayer; }
    public void setWhitePlayer(String whitePlayer) { this.whitePlayer = whitePlayer; }
    public String getBoardJson() { return boardJson; }
    public void setBoardJson(String boardJson) { this.boardJson = boardJson; }
    public String getCurrentTurn() { return currentTurn; }
    public void setCurrentTurn(String currentTurn) { this.currentTurn = currentTurn; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getWinner() { return winner; }
    public void setWinner(String winner) { this.winner = winner; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
