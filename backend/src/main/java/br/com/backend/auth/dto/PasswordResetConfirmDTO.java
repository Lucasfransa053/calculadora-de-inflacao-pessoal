package br.com.backend.auth.dto;

public record PasswordResetConfirmDTO(String token, String novaSenha) {}
