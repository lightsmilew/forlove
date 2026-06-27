package com.forlove.repository;

import com.forlove.entity.Diary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiaryRepository extends JpaRepository<Diary, Long> {
    Page<Diary> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
