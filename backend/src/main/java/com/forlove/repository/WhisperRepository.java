package com.forlove.repository;

import com.forlove.entity.Whisper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WhisperRepository extends JpaRepository<Whisper, Long> {
    Page<Whisper> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
