package com.forlove.controller;

import com.forlove.config.CoupleProperties;
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
import java.util.*;

@RestController
@RequestMapping("/api/diaries")
public class DiaryController {

    private final DiaryRepository diaryRepository;
    private final CoupleProperties coupleProperties;

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    public DiaryController(DiaryRepository diaryRepository, CoupleProperties coupleProperties) {
        this.diaryRepository = diaryRepository;
        this.coupleProperties = coupleProperties;
    }

    @GetMapping
    public Page<Map<String, Object>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return diaryRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size))
            .map(this::toView);
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody DiaryRequest request, Authentication auth) {
        Diary diary = new Diary();
        diary.setAuthor(auth.getName());
        diary.setContent(request.content());
        diary.setMood(request.mood() != null ? request.mood() : 5);
        return toView(diaryRepository.save(diary));
    }

    @PostMapping("/{id}/photos")
    public Map<String, Object> uploadPhotos(
            @PathVariable Long id,
            @RequestParam("files") MultipartFile[] files) throws IOException {
        Diary diary = diaryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("日记不存在"));
        List<String> urls = new ArrayList<>(diary.getPhotoList());
        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;
            String ext = getExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID() + ext;
            Path path = Paths.get(uploadDir, filename);
            Files.copy(file.getInputStream(), path);
            urls.add("/uploads/" + filename);
        }
        diary.setPhotoList(urls);
        return toView(diaryRepository.save(diary));
    }

    @PostMapping("/{id}/photo")
    public Map<String, Object> uploadPhoto(@PathVariable Long id, @RequestParam("file") MultipartFile file)
            throws IOException {
        return uploadPhotos(id, new MultipartFile[] { file });
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        long count = diaryRepository.count();
        double avgMood = diaryRepository.findAll().stream()
            .mapToInt(d -> d.getMood() != null ? d.getMood() : 5)
            .average()
            .orElse(5.0);
        long daysTogether = coupleProperties.getDaysTogether();
        int sweetIndex = (int) Math.min(100, avgMood * 10 + count * 2);

        Map<String, Object> result = new HashMap<>();
        result.put("totalEntries", count);
        result.put("avgMood", Math.round(avgMood * 10) / 10.0);
        result.put("daysTogether", daysTogether);
        result.put("sweetIndex", sweetIndex);
        return result;
    }

    private Map<String, Object> toView(Diary diary) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", diary.getId());
        map.put("author", diary.getAuthor());
        map.put("content", diary.getContent());
        map.put("mood", diary.getMood());
        map.put("photoUrls", diary.getPhotoList());
        map.put("photoUrl", diary.getPhotoList().isEmpty() ? null : diary.getPhotoList().get(0));
        map.put("createdAt", diary.getCreatedAt());
        return map;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf("."));
    }
}
