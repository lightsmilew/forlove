package com.forlove.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@ConditionalOnProperty(name = "forlove.ssl.http-redirect-port")
public class HttpsRedirectFilter extends OncePerRequestFilter {

    @Value("${server.port}")
    private int httpsPort;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (!request.isSecure()) {
            String host = request.getServerName();
            String uri = request.getRequestURI();
            String query = request.getQueryString();
            String portPart = httpsPort == 443 ? "" : ":" + httpsPort;
            String location = "https://" + host + portPart + uri + (query != null ? "?" + query : "");
            response.setStatus(HttpServletResponse.SC_TEMPORARY_REDIRECT);
            response.setHeader("Location", location);
            return;
        }
        chain.doFilter(request, response);
    }
}
