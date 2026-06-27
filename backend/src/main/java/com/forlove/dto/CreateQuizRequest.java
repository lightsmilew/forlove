package com.forlove.dto;

import java.util.List;

public record CreateQuizRequest(String question, List<String> options, Integer correctIndex) {}
