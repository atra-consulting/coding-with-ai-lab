package com.crm.security;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.Claims;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        if (jwtService.validateToken(token)) {
            Claims claims = jwtService.extractAllClaims(token);

            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                String username = claims.getSubject();
                Long benutzerId = ((Number) claims.get("benutzerId")).longValue();
                String vorname = claims.get("vorname", String.class);
                String nachname = claims.get("nachname", String.class);

                JwtPrincipal principal = new JwtPrincipal(benutzerId, username, vorname, nachname);

                @SuppressWarnings("unchecked")
                List<String> rollen = claims.get("rollen", List.class);

                List<GrantedAuthority> authorities = new ArrayList<>();
                if (rollen != null) {
                    for (String rolle : rollen) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + rolle));
                    }
                }

                @SuppressWarnings("unchecked")
                List<String> permissions = claims.get("permissions", List.class);
                if (permissions != null) {
                    for (String permission : permissions) {
                        authorities.add(new SimpleGrantedAuthority(permission));
                    }
                }

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(principal, null, authorities);
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}
