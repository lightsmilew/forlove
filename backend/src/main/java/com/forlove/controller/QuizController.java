package com.forlove.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.forlove.config.CoupleProperties;
import com.forlove.dto.AnswerQuizRequest;
import com.forlove.dto.CreateQuizRequest;
import com.forlove.entity.QuizQuestion;
import com.forlove.repository.QuizQuestionRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/games/quiz")
public class QuizController {

    private final QuizQuestionRepository quizRepository;
    private final CoupleProperties coupleProperties;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public QuizController(QuizQuestionRepository quizRepository, CoupleProperties coupleProperties) {
        this.quizRepository = quizRepository;
        this.coupleProperties = coupleProperties;
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody CreateQuizRequest request, Authentication auth) {
        if (request.question() == null || request.question().isBlank()) {
            throw new RuntimeException("题目不能为空");
        }
        List<String> options = request.options();
        if (options == null || options.size() < 2 || options.size() > 4) {
            throw new RuntimeException("请提供 2-4 个选项");
        }
        if (request.correctIndex() == null
            || request.correctIndex() < 0
            || request.correctIndex() >= options.size()) {
            throw new RuntimeException("请选择正确答案");
        }

        QuizQuestion q = new QuizQuestion();
        q.setAuthor(auth.getName());
        q.setQuestion(request.question().trim());
        q.setOptionsJson(toJson(options.stream().map(String::trim).toList()));
        q.setCorrectIndex(request.correctIndex());
        quizRepository.save(q);

        String partner = coupleProperties.getPartnerUsername(auth.getName());
        return Map.of(
            "id", q.getId(),
            "message", "题目已发给" + coupleProperties.getNickname(partner)
        );
    }

    @GetMapping("/pending")
    public List<Map<String, Object>> pending(Authentication auth) {
        return quizRepository.findByAuthorNotAndAnswerIndexIsNullOrderByCreatedAtAsc(auth.getName())
            .stream()
            .map(q -> toView(q, true))
            .toList();
    }

    @GetMapping("/mine")
    public List<Map<String, Object>> mine(Authentication auth) {
        return quizRepository.findByAuthorOrderByCreatedAtDesc(auth.getName())
            .stream()
            .map(q -> toView(q, false))
            .toList();
    }

    @GetMapping("/report")
    public Map<String, Object> report() {
        List<QuizQuestion> answered = quizRepository.findByAnswerIndexIsNotNull();
        int match = 0;
        List<Map<String, Object>> details = new ArrayList<>();

        for (QuizQuestion q : answered) {
            boolean isMatch = Objects.equals(q.getAnswerIndex(), q.getCorrectIndex());
            if (isMatch) match++;
            Map<String, Object> item = toView(q, false);
            item.put("matched", isMatch);
            details.add(item);
        }

        int total = answered.size();
        int compatibility = total > 0 ? Math.round(match * 100f / total) : 0;
        String message = total == 0 ? "还没有完成的问答，快去给 TA 出题吧~"
            : compatibility >= 80 ? "心有灵犀，天生一对！"
            : compatibility >= 60 ? "默契不错，继续了解彼此~"
            : "多玩几局，默契会越来越高！";

        Map<String, Object> result = new HashMap<>();
        result.put("compatibility", compatibility);
        result.put("total", total);
        result.put("matched", match);
        result.put("message", message);
        result.put("details", details);
        return result;
    }

    @PostMapping("/{id}/answer")
    public Map<String, Object> answer(@PathVariable Long id, @RequestBody AnswerQuizRequest request,
                                        Authentication auth) {
        QuizQuestion q = quizRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("题目不存在"));
        if (q.getAuthor().equals(auth.getName())) {
            throw new RuntimeException("不能回答自己出的题");
        }
        if (q.getAnswerIndex() != null) {
            throw new RuntimeException("这道题已经回答过了");
        }
        if (request.answerIndex() == null) {
            throw new RuntimeException("请选择答案");
        }

        List<String> options = parseOptions(q.getOptionsJson());
        if (request.answerIndex() < 0 || request.answerIndex() >= options.size()) {
            throw new RuntimeException("答案无效");
        }

        q.setAnswerIndex(request.answerIndex());
        q.setAnsweredAt(LocalDateTime.now());
        quizRepository.save(q);

        boolean matched = Objects.equals(q.getAnswerIndex(), q.getCorrectIndex());
        Map<String, Object> result = toView(q, false);
        result.put("matched", matched);
        result.put("message", matched ? "答对了！心有灵犀~" : "答错了，再多了解 TA 一点吧~");
        return result;
    }

    private Map<String, Object> toView(QuizQuestion q, boolean hideAnswer) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", q.getId());
        map.put("author", q.getAuthor());
        map.put("authorNickname", coupleProperties.getNickname(q.getAuthor()));
        map.put("question", q.getQuestion());
        map.put("options", parseOptions(q.getOptionsJson()));
        map.put("createdAt", q.getCreatedAt());
        map.put("answered", q.getAnswerIndex() != null);
        if (!hideAnswer && q.getAnswerIndex() != null) {
            map.put("answerIndex", q.getAnswerIndex());
            map.put("correctIndex", q.getCorrectIndex());
            map.put("answeredAt", q.getAnsweredAt());
        }
        return map;
    }

    private List<String> parseOptions(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            throw new RuntimeException("题目数据解析失败", e);
        }
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new RuntimeException("题目数据保存失败", e);
        }
    }
}
