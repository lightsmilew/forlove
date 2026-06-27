package com.forlove.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final Map<String, String> users = new HashMap<>();
    private final Map<String, String> nicknames = new HashMap<>();

    public AuthService(
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            @Value("${forlove.couple.username1}") String u1,
            @Value("${forlove.couple.password1}") String p1,
            @Value("${forlove.couple.nickname1}") String n1,
            @Value("${forlove.couple.username2}") String u2,
            @Value("${forlove.couple.password2}") String p2,
            @Value("${forlove.couple.nickname2}") String n2) {
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        users.put(u1, passwordEncoder.encode(p1));
        nicknames.put(u1, n1);
        users.put(u2, passwordEncoder.encode(p2));
        nicknames.put(u2, n2);
    }

    public Map<String, String> login(String username, String password) {
        if (!users.containsKey(username)) {
            throw new RuntimeException("账号不存在");
        }
        if (!passwordEncoder.matches(password, users.get(username))) {
            throw new RuntimeException("密码错误");
        }
        String token = jwtService.generateToken(username, nicknames.get(username));
        return Map.of(
            "token", token,
            "username", username,
            "nickname", nicknames.get(username)
        );
    }
}
