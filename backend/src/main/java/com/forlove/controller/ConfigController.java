package com.forlove.controller;

import com.forlove.config.CoupleProperties;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

    private final CoupleProperties coupleProperties;

    public ConfigController(CoupleProperties coupleProperties) {
        this.coupleProperties = coupleProperties;
    }

    @GetMapping("/couple")
    public Map<String, Object> coupleConfig() {
        String togetherDate = coupleProperties.getTogetherDate();
        long daysTogether = coupleProperties.getDaysTogether();
        List<Map<String, Object>> meetPlaces = coupleProperties.getMeetPlaces().stream()
            .map(p -> {
                Map<String, Object> m = new HashMap<>();
                m.put("name", p.getName());
                m.put("lat", p.getLat());
                m.put("lng", p.getLng());
                return m;
            })
            .collect(Collectors.toList());
        List<Map<String, Object>> anniversaries = coupleProperties.getAnniversaries().stream()
            .map(a -> {
                Map<String, Object> m = new HashMap<>();
                m.put("name", a.getName());
                m.put("date", a.getDate());
                return m;
            })
            .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("togetherDate", togetherDate);
        result.put("daysTogether", daysTogether);
        result.put("meetPlaces", meetPlaces);
        result.put("username1", coupleProperties.getUsername1());
        result.put("username2", coupleProperties.getUsername2());
        result.put("nickname1", coupleProperties.getNickname1());
        result.put("nickname2", coupleProperties.getNickname2());
        result.put("loveQuotes", coupleProperties.getLoveQuotes());
        result.put("anniversaries", anniversaries);
        return result;
    }
}
