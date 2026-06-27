package com.forlove.repository;

import com.forlove.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {
    List<QuizQuestion> findByAuthorNotAndAnswerIndexIsNullOrderByCreatedAtAsc(String username);
    List<QuizQuestion> findByAuthorOrderByCreatedAtDesc(String author);
    List<QuizQuestion> findAllByOrderByCreatedAtDesc();
    List<QuizQuestion> findByAnswerIndexIsNotNull();
}
