package com.forlove.entity;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "diaries")
public class Diary {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String author;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private Integer mood = 5;

    private String photoUrl;

    @Column(columnDefinition = "TEXT")
    private String photoUrls;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Integer getMood() { return mood; }
    public void setMood(Integer mood) { this.mood = mood; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public String getPhotoUrls() { return photoUrls; }
    public void setPhotoUrls(String photoUrls) { this.photoUrls = photoUrls; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<String> getPhotoList() {
        List<String> list = new ArrayList<>();
        if (photoUrls != null && !photoUrls.isBlank()) {
            try {
                list.addAll(MAPPER.readValue(photoUrls, new TypeReference<List<String>>() {}));
            } catch (Exception ignored) {}
        }
        if (list.isEmpty() && photoUrl != null && !photoUrl.isBlank()) {
            list.add(photoUrl);
        }
        return list;
    }

    public void setPhotoList(List<String> urls) {
        try {
            this.photoUrls = MAPPER.writeValueAsString(urls);
            this.photoUrl = urls.isEmpty() ? null : urls.get(0);
        } catch (Exception e) {
            throw new RuntimeException("照片数据保存失败");
        }
    }
}
