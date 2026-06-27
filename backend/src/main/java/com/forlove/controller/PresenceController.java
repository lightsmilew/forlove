package com.forlove.controller;

import com.forlove.config.CoupleProperties;
import com.forlove.service.PresenceService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/presence")
public class PresenceController {

    private final PresenceService presenceService;
    private final CoupleProperties coupleProperties;
    private final SimpMessagingTemplate messagingTemplate;

    public PresenceController(
            PresenceService presenceService,
            CoupleProperties coupleProperties,
            SimpMessagingTemplate messagingTemplate) {
        this.presenceService = presenceService;
        this.coupleProperties = coupleProperties;
        this.messagingTemplate = messagingTemplate;
    }

    @GetMapping
    public Map<String, Object> getPresence(Authentication auth) {
        if (auth != null) {
            presenceService.heartbeat(auth.getName());
        }
        return buildPresencePayload();
    }

    @PostMapping("/heartbeat")
    public Map<String, Object> heartbeat(Authentication auth) {
        presenceService.heartbeat(auth.getName());
        Map<String, Object> payload = buildPresencePayload();
        messagingTemplate.convertAndSend("/topic/presence", payload);
        return payload;
    }

    private Map<String, Object> buildPresencePayload() {
        List<Map<String, Object>> users = List.of(
            presenceService.statusFor(coupleProperties.getUsername1(), coupleProperties.getNickname1()),
            presenceService.statusFor(coupleProperties.getUsername2(), coupleProperties.getNickname2())
        );
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("users", users);
        return payload;
    }
}
