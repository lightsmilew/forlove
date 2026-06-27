package com.forlove.config;

import org.apache.catalina.connector.Connector;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "forlove.ssl.http-redirect-port")
public class HttpToHttpsRedirectConfig {

    @Bean
    WebServerFactoryCustomizer<TomcatServletWebServerFactory> httpToHttpsRedirect(
            @Value("${forlove.ssl.http-redirect-port}") int httpPort,
            @Value("${server.port}") int httpsPort) {
        return factory -> factory.addAdditionalTomcatConnectors(createRedirectConnector(httpPort, httpsPort));
    }

    private static Connector createRedirectConnector(int httpPort, int httpsPort) {
        Connector connector = new Connector(TomcatServletWebServerFactory.DEFAULT_PROTOCOL);
        connector.setScheme("http");
        connector.setPort(httpPort);
        connector.setSecure(false);
        connector.setRedirectPort(httpsPort);
        return connector;
    }
}
