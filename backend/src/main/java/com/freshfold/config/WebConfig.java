package com.freshfold.config;

import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;
import java.util.stream.Stream;

@Configuration
public class WebConfig {
    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    CorsFilter corsFilter() {
        var configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Stream.concat(
                        Stream.of(
                                "http://localhost:5173",
                                "https://freshfold-laundry-frontend.vercel.app",
                                "https://lavkush25031207-maker.github.io"),
                        Stream.of(allowedOrigins.split(",")))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .distinct()
                .toList());
        configuration.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return new CorsFilter(source);
    }
}
