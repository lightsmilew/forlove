package com.forlove.controller;

import com.forlove.dto.WhisperRequest;
import com.forlove.entity.Whisper;
import com.forlove.repository.WhisperRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/whispers")
public class WhisperController {

    private final WhisperRepository whisperRepository;

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
        Whisper whisper = new Whisper();
        whisper.setAuthor(auth.getName());
        whisper.setContent(request.content());
        return whisperRepository.save(whisper);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        whisperRepository.deleteById(id);
    }
}
