package com.crm.security;

public record CrmPrincipal(Long benutzerId, String benutzername, String vorname, String nachname) {}
