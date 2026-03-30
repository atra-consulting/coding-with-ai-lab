package com.crm.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${spring.h2.console.enabled:false}")
    private boolean h2ConsoleEnabled;

    @Value("${app.cors.allowed-origins:http://localhost:4200}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder encoder) {
        // All 11 permissions
        String[] allPermissions = {
            "DASHBOARD", "FIRMEN", "PERSONEN", "ABTEILUNGEN", "ADRESSEN",
            "AKTIVITAETEN", "GEHAELTER", "VERTRAEGE", "CHANCEN", "AUSWERTUNGEN", "BENUTZERVERWALTUNG"
        };
        String[] vertriebPermissions = {
            "DASHBOARD", "FIRMEN", "PERSONEN", "ABTEILUNGEN", "ADRESSEN",
            "AKTIVITAETEN", "VERTRAEGE", "CHANCEN", "AUSWERTUNGEN"
        };
        String[] personalPermissions = {
            "DASHBOARD", "FIRMEN", "PERSONEN", "ABTEILUNGEN", "ADRESSEN",
            "AKTIVITAETEN", "GEHAELTER", "AUSWERTUNGEN"
        };
        // allrounder = union of vertrieb + personal
        String[] allrounderPermissions = {
            "DASHBOARD", "FIRMEN", "PERSONEN", "ABTEILUNGEN", "ADRESSEN",
            "AKTIVITAETEN", "GEHAELTER", "VERTRAEGE", "CHANCEN", "AUSWERTUNGEN"
        };

        var admin = User.builder()
                .username("admin")
                .password(encoder.encode("admin123"))
                .roles("ADMIN")
                .authorities(buildAuthorities("ROLE_ADMIN", allPermissions))
                .build();

        var vertrieb = User.builder()
                .username("vertrieb")
                .password(encoder.encode("test123"))
                .roles("VERTRIEB")
                .authorities(buildAuthorities("ROLE_VERTRIEB", vertriebPermissions))
                .build();

        var personal = User.builder()
                .username("personal")
                .password(encoder.encode("test123"))
                .roles("PERSONAL")
                .authorities(buildAuthorities("ROLE_PERSONAL", personalPermissions))
                .build();

        var allrounder = User.builder()
                .username("allrounder")
                .password(encoder.encode("test123"))
                .roles("VERTRIEB", "PERSONAL")
                .authorities(buildAuthorities(new String[]{"ROLE_VERTRIEB", "ROLE_PERSONAL"}, allrounderPermissions))
                .build();

        var demo = User.builder()
                .username("demo")
                .password(encoder.encode("demo1234"))
                .roles("ADMIN")
                .authorities(buildAuthorities("ROLE_ADMIN", allPermissions))
                .build();

        return new InMemoryUserDetailsManager(admin, vertrieb, personal, allrounder, demo);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .headers(headers -> {
                    if (h2ConsoleEnabled) {
                        headers.frameOptions(frame -> frame.disable());
                    } else {
                        headers.frameOptions(frame -> frame.deny());
                    }
                    headers.contentTypeOptions(cto -> {});
                    headers.httpStrictTransportSecurity(hsts -> hsts
                            .includeSubDomains(true)
                            .maxAgeInSeconds(31536000));
                })
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setContentType("application/json");
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.getWriter().write("{\"status\":401,\"message\":\"Nicht authentifiziert\"}");
                        })
                )
                .authorizeHttpRequests(auth -> {
                    if (h2ConsoleEnabled) {
                        auth.requestMatchers("/h2-console/**").permitAll();
                    }
                    auth.requestMatchers("/api/auth/login", "/api/auth/logout").permitAll();
                    auth.requestMatchers("/api/**").authenticated();
                    auth.anyRequest().permitAll();
                });
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Content-Type", "Accept", "X-Requested-With"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    private org.springframework.security.core.GrantedAuthority[] buildAuthorities(String role, String[] permissions) {
        return buildAuthorities(new String[]{role}, permissions);
    }

    private org.springframework.security.core.GrantedAuthority[] buildAuthorities(String[] roles, String[] permissions) {
        List<org.springframework.security.core.GrantedAuthority> authorities = new java.util.ArrayList<>();
        for (String role : roles) {
            authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority(role));
        }
        for (String permission : permissions) {
            authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority(permission));
        }
        return authorities.toArray(new org.springframework.security.core.GrantedAuthority[0]);
    }
}
