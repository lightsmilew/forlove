package com.forlove;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

@SpringBootApplication
public class ForLoveApplication {
    public static void main(String[] args) throws IOException {
        Files.createDirectories(Paths.get("./data"));
        Files.createDirectories(Paths.get("./uploads"));
        SpringApplication.run(ForLoveApplication.class, args);
    }
}