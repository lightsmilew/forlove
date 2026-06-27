package com.forlove.controller;

import com.forlove.config.CoupleProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

    private final CoupleProperties coupleProperties;

    @Value("${forlove.couple.start-date}")
    private String startDate;

    @Value("${forlove.couple.nickname1}")
    private String nickname1;

    @Value("${forlove.couple.username1}")
    private String username1;

    @Value("${forlove.couple.username2}")
    private String username2;

    @Value("${forlove.couple.nickname2}")
    private String nickname2;

    public ConfigController(CoupleProperties coupleProperties) {
        this.coupleProperties = coupleProperties;
    }

    @GetMapping("/couple")
    public Map<String, Object> coupleConfig() {
        long daysTogether = ChronoUnit.DAYS.between(LocalDate.parse(startDate), LocalDate.now()) + 1;
        List<Map<String, Object>> meetPlaces = coupleProperties.getMeetPlaces().stream()
            .map(p -> {
                Map<String, Object> m = new HashMap<>();
                m.put("name", p.getName());
                m.put("lat", p.getLat());
                m.put("lng", p.getLng());
                return m;
            })
            .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("startDate", startDate);
        result.put("daysTogether", daysTogether);
        result.put("meetPlaces", meetPlaces);
        result.put("username1", username1);
        result.put("username2", username2);
        result.put("nickname1", nickname1);
        result.put("nickname2", nickname2);
        result.put("loveQuotes", List.of(
            "遇见你，是我这辈子最美的意外。",
            "愿得一心人，白首不相离。",
            "你在的地方，就是我心安之处。",
            "樱花落下的速度是每秒五厘米，而我走向你的速度，是心跳的频率。",
            "武大樱花再美，也不及你笑起来的样子。",
            "想和你一起看遍世间所有的樱花。",
            "我的宇宙里，只有你一颗恒星。",
            "每一天醒来，第一个想到的就是你。"
        ));
        result.put("anniversaries", List.of(
            Map.of("name", "在一起", "date", startDate),
            Map.of("name", "第一次牵手", "date", "2024-02-14"),
            Map.of("name", "武大樱花之约", "date", "2024-03-20")
        ));
        return result;
    }
}
