package com.crm.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.crm.security.CrmPrincipal;
import com.crm.security.UserIdentityService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserIdentityService userIdentityService;
    private final HttpSessionSecurityContextRepository securityContextRepository =
            new HttpSessionSecurityContextRepository();

    public AuthController(AuthenticationManager authenticationManager,
                          UserIdentityService userIdentityService) {
        this.authenticationManager = authenticationManager;
        this.userIdentityService = userIdentityService;
    }

    public record LoginRequest(String benutzername, String passwort) {}

    public record LoginResponse(String benutzername, String vorname, String nachname, List<String> rollen) {}

    public record MeResponse(Long id, String benutzername, String vorname, String nachname,
                              String email, List<String> rollen, List<String> permissions) {}

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request,
                                                HttpServletRequest httpRequest,
                                                HttpServletResponse httpResponse) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.benutzername(), request.passwort())
        );

        CrmPrincipal principal = userIdentityService.buildPrincipal(authentication.getName());

        UsernamePasswordAuthenticationToken authWithPrincipal = new UsernamePasswordAuthenticationToken(
                principal, null, authentication.getAuthorities()
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authWithPrincipal);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        List<String> rollen = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .toList();

        return ResponseEntity.ok(new LoginResponse(
                principal.benutzername(),
                principal.vorname(),
                principal.nachname(),
                rollen
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MeResponse> me(Authentication authentication) {
        CrmPrincipal principal = (CrmPrincipal) authentication.getPrincipal();

        List<String> rollen = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .toList();

        List<String> permissions = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> !a.startsWith("ROLE_"))
                .toList();

        String email = principal.benutzername() + "@crm.local";

        return ResponseEntity.ok(new MeResponse(
                principal.benutzerId(),
                principal.benutzername(),
                principal.vorname(),
                principal.nachname(),
                email,
                rollen,
                permissions
        ));
    }
}
