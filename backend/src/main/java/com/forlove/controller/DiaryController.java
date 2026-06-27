package com.forlove.controller;

import com.forlove.dto.DiaryRequest;
import com.forlove.entity.Diary;
import com.forlove.repository.DiaryRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/diaries")
public class DiaryController {

    private final DiaryRepository diaryRepository;

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    @Value("${forlove.couple.start-date}")
    private String startDate;

    public DiaryController(DiaryRepository diaryRepository) {
        this.diaryRepository = diaryRepository;
    }

    @GetMapping
    public Page<Diary> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return diaryRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    @PostMapping
    public Diary create(@RequestBody DiaryRequest request, Authentication auth) {
        Diary diary = new Diary();
        diary.setAuthor(auth.getName());
        diary.setContent(request.content());
        diary.setMood(request.mood() != null ? request.mood() : 5);
        return diaryRepository.save(diary);
    }

    @PostMapping("/{id}/photo")
    public Diary uploadPhoto(@PathVariable Long id, @RequestParam("file") MultipartFile file)
            throws IOException {
        Diary diary = diaryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("日记不存在"));
        String ext = getExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + ext;
        Path path = Paths.get(uploadDir, filename);
        Files.copy(file.getInputStream(), path);
        diary.setPhotoUrl("/uploads/" + filename);
        return diaryRepository.save(diary);
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        long count = diaryRepository.count();
        double avgMood = diaryRepository.findAll().stream()
            .mapToInt(d -> d.getMood() != null ? d.getMood() : 5)
            .average()
            .orElse(5.0);
        long daysTogether = ChronoUnit.DAYS.between(LocalDate.parse(startDate), LocalDate.now()) + 1;
        int sweetIndex = (int) Math.min(100, avgMood * 10 + count * 2);

        Map<String, Object> result = new HashMap<>();
        result.put("totalEntries", count);
        result.put("avgMood", Math.round(avgMood * 10) / 10.0);
        result.put("daysTogether", daysTogether);
        result.put("sweetIndex", sweetIndex);
        return result;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf("."));
    }
}
