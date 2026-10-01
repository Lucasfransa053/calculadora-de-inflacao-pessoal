package br.com.backend.auth.dto;

/** Nunca inclui a senha nem o hash. */
public record UsuarioResponseDTO(String email, String nome) {}
