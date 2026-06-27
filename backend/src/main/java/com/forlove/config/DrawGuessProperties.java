package com.forlove.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@ConfigurationProperties(prefix = "forlove.draw-guess")
public class DrawGuessProperties {

    private int maxRounds = 6;
    private List<String> words = new ArrayList<>();

    public int getMaxRounds() { return maxRounds; }
    public void setMaxRounds(int maxRounds) { this.maxRounds = maxRounds; }
    public List<String> getWords() { return words; }
    public void setWords(List<String> words) { this.words = words; }
}
