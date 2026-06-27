package com.forlove.controller;

import com.forlove.dto.DrawGuessGuessRequest;
import com.forlove.dto.DrawGuessStrokeRequest;
import com.forlove.service.DrawGuessService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/games/drawguess")
public class DrawGuessController {

    private final DrawGuessService drawGuessService;

    public DrawGuessController(DrawGuessService drawGuessService) {
        this.drawGuessService = drawGuessService;
    }

    @PostMapping("/invite")
    public Map<String, Object> invite(Authentication auth) {
        return drawGuessService.invite(auth.getName());
    }

    @GetMapping("/pending")
    public List<Map<String, Object>> pending(Authentication auth) {
        return drawGuessService.pendingInvites(auth.getName());
    }

    @GetMapping("/current")
    public Map<String, Object> current(Authentication auth) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("game", drawGuessService.currentGame(auth.getName()));
        return result;
    }

    @GetMapping("/{id}")
    public Map<String, Object> get(@PathVariable Long id, Authentication auth) {
        return drawGuessService.getGame(id, auth.getName());
    }

    @PostMapping("/{id}/accept")
    public Map<String, Object> accept(@PathVariable Long id, Authentication auth) {
        return drawGuessService.accept(id, auth.getName());
    }

    @PostMapping("/{id}/decline")
    public Map<String, Object> decline(@PathVariable Long id, Authentication auth) {
        return drawGuessService.decline(id, auth.getName());
    }

    @PostMapping("/{id}/stroke")
    public Map<String, Object> stroke(
            @PathVariable Long id,
            @RequestBody DrawGuessStrokeRequest request,
            Authentication auth) {
        return drawGuessService.stroke(id, auth.getName(), request);
    }

    @PostMapping("/{id}/clear")
    public Map<String, Object> clear(@PathVariable Long id, Authentication auth) {
        return drawGuessService.clearCanvas(id, auth.getName());
    }

    @PostMapping("/{id}/guess")
    public Map<String, Object> guess(
            @PathVariable Long id,
            @RequestBody DrawGuessGuessRequest request,
            Authentication auth) {
        return drawGuessService.guess(id, auth.getName(), request.guess());
    }

    @PostMapping("/{id}/skip")
    public Map<String, Object> skip(@PathVariable Long id, Authentication auth) {
        return drawGuessService.skip(id, auth.getName());
    }

    @PostMapping("/{id}/forfeit")
    public Map<String, Object> forfeit(@PathVariable Long id, Authentication auth) {
        return drawGuessService.forfeit(id, auth.getName());
    }
}
