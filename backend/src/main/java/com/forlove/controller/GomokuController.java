package com.forlove.controller;

import com.forlove.dto.GomokuMoveRequest;
import com.forlove.service.GomokuService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/games/gomoku")
public class GomokuController {

    private final GomokuService gomokuService;

    public GomokuController(GomokuService gomokuService) {
        this.gomokuService = gomokuService;
    }

    @PostMapping("/invite")
    public Map<String, Object> invite(Authentication auth) {
        return gomokuService.invite(auth.getName());
    }

    @GetMapping("/pending")
    public List<Map<String, Object>> pending(Authentication auth) {
        return gomokuService.pendingInvites(auth.getName());
    }

    @GetMapping("/current")
    public Map<String, Object> current(Authentication auth) {
        Map<String, Object> game = gomokuService.currentGame(auth.getName());
        if (game == null) {
            return Map.of("game", (Object) null);
        }
        return Map.of("game", game);
    }

    @GetMapping("/{id}")
    public Map<String, Object> get(@PathVariable Long id, Authentication auth) {
        return gomokuService.getGame(id, auth.getName());
    }

    @PostMapping("/{id}/accept")
    public Map<String, Object> accept(@PathVariable Long id, Authentication auth) {
        return gomokuService.accept(id, auth.getName());
    }

    @PostMapping("/{id}/decline")
    public Map<String, Object> decline(@PathVariable Long id, Authentication auth) {
        return gomokuService.decline(id, auth.getName());
    }

    @PostMapping("/{id}/move")
    public Map<String, Object> move(
            @PathVariable Long id,
            @RequestBody GomokuMoveRequest request,
            Authentication auth) {
        return gomokuService.move(id, auth.getName(), request.x(), request.y());
    }

    @PostMapping("/{id}/resign")
    public Map<String, Object> resign(@PathVariable Long id, Authentication auth) {
        return gomokuService.resign(id, auth.getName());
    }
}
