package com.forlove.service;

import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceService {

    private static final long ONLINE_THRESHOLD_MS = 45_000;

    private final Map<String, Long> lastSeen = new ConcurrentHashMap<>();
    private final Set<String> connected = ConcurrentHashMap.newKeySet();

    public void markConnected(String username) {
        if (username == null) return;
        connected.add(username);
        lastSeen.put(username, System.currentTimeMillis());
    }

    public void markDisconnected(String username) {
        if (username == null) return;
        connected.remove(username);
    }

    public void heartbeat(String username) {
        if (username == null) return;
        lastSeen.put(username, System.currentTimeMillis());
        connected.add(username);
    }

    public boolean isOnline(String username) {
        if (username == null) return false;
        if (connected.contains(username)) return true;
        Long seen = lastSeen.get(username);
        return seen != null && System.currentTimeMillis() - seen < ONLINE_THRESHOLD_MS;
    }

    public Map<String, Object> statusFor(String username, String nickname) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("username", username);
        map.put("nickname", nickname);
        map.put("online", isOnline(username));
        return map;
    }
}
