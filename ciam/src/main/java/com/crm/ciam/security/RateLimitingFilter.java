package com.crm.ciam.security;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final ConcurrentHashMap<String, AttemptRecord> attempts = new ConcurrentHashMap<>();
    private final int maxAttempts;
    private final long windowMs;

    public RateLimitingFilter(
            @Value("${app.rate-limit.max-attempts:10}") int maxAttempts,
            @Value("${app.rate-limit.window-seconds:300}") int windowSeconds) {
        this.maxAttempts = maxAttempts;
        this.windowMs = windowSeconds * 1000L;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String ip = getClientIp(request);
        long now = System.currentTimeMillis();

        attempts.entrySet().removeIf(entry -> now - entry.getValue().windowStart > windowMs);

        AttemptRecord record = attempts.compute(ip, (key, existing) -> {
            if (existing == null || now - existing.windowStart > windowMs) {
                return new AttemptRecord(now, new AtomicInteger(1));
            }
            existing.count.incrementAndGet();
            return existing;
        });

        if (record.count.get() > maxAttempts) {
            response.setContentType("application/json");
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("{\"status\":429,\"message\":\"Zu viele Anfragen. Bitte warten Sie.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !("/api/auth/login".equals(request.getRequestURI()) && "POST".equalsIgnoreCase(request.getMethod()));
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static class AttemptRecord {
        final long windowStart;
        final AtomicInteger count;

        AttemptRecord(long windowStart, AtomicInteger count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}
