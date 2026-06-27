package com.forlove.config;

import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TomcatMimeConfig {

    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> uploadAudioMimeTypes() {
        return factory -> factory.addContextCustomizers(context -> {
            context.addMimeMapping("m4a", "audio/mp4");
            context.addMimeMapping("mp4", "audio/mp4");
            context.addMimeMapping("webm", "audio/webm");
            context.addMimeMapping("ogg", "audio/ogg");
            context.addMimeMapping("mp3", "audio/mpeg");
            context.addMimeMapping("wav", "audio/wav");
            context.addMimeMapping("aac", "audio/aac");
        });
    }
}
