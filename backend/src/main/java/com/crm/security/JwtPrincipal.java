package com.crm.security;

public record JwtPrincipal(Long benutzerId, String benutzername, String vorname, String nachname) {}
