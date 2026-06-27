package com.forlove.controller;

import com.forlove.dto.WhisperRequest;
import com.forlove.entity.Whisper;
import com.forlove.repository.WhisperRepository;
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
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/whispers")
public class WhisperController {

    private static final Set<String> ALLOWED_AUDIO_EXT = Set.of(
        ".webm", ".ogg", ".mp3", ".mp4", ".m4a", ".wav", ".aac"
    );

    private final WhisperRepository whisperRepository;

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    public WhisperController(WhisperRepository whisperRepository) {
        this.whisperRepository = whisperRepository;
    }

    @GetMapping
    public Page<Whisper> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size) {
        return whisperRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    @PostMapping
    public Whisper create(@RequestBody WhisperRequest request, Authentication auth) {
        String content = request.content() != null ? request.content().trim() : "";
        Whisper whisper = new Whisper();
        whisper.setAuthor(auth.getName());
        whisper.setContent(content);
        return whisperRepository.save(whisper);
    }

    @PostMapping("/{id}/voice")
    public Whisper uploadVoice(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "duration", required = false) Integer duration,
            Authentication auth) throws IOException {
        Whisper whisper = whisperRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("悄悄话不存在"));
        if (!whisper.getAuthor().equals(auth.getName())) {
            throw new RuntimeException("只能为自己的悄悄话上传语音");
        }
        if (file.isEmpty()) {
            throw new RuntimeException("语音文件为空");
        }
        String ext = getAudioExtension(file.getOriginalFilename(), file.getContentType());
        String filename = UUID.randomUUID() + ext;
        Path dir = Paths.get(uploadDir);
        Files.createDirectories(dir);
        Path path = dir.resolve(filename);
        Files.copy(file.getInputStream(), path);
        whisper.setVoiceUrl("/uploads/" + filename);
        if (duration != null && duration > 0) {
            whisper.setVoiceDuration(duration);
        }
        return whisperRepository.save(whisper);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        whisperRepository.deleteById(id);
    }

    private String getAudioExtension(String filename, String contentType) {
        if (filename != null && filename.contains(".")) {
            String ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
            if (ALLOWED_AUDIO_EXT.contains(ext)) {
                return ext;
            }
        }
        if (contentType != null) {
            String ct = contentType.toLowerCase();
            if (ct.contains("webm")) return ".webm";
            if (ct.contains("ogg")) return ".ogg";
            if (ct.contains("mpeg") || ct.contains("mp3")) return ".mp3";
            if (ct.contains("mp4") || ct.contains("m4a")) return ".m4a";
            if (ct.contains("wav")) return ".wav";
            if (ct.contains("aac")) return ".aac";
        }
        return ".webm";
    }
}
