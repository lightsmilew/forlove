package com.forlove.dto;

import java.util.List;

public record DrawGuessStrokeRequest(
    List<List<Double>> points,
    String color,
    Double width,
    Boolean eraser,
    String mode
) {}
