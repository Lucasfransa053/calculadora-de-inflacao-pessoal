package br.com.backend.auth.controller;

import br.com.backend.auth.dto.LoginRequestDTO;
import br.com.backend.auth.dto.RegistroRequestDTO;
import br.com.backend.auth.dto.UsuarioResponseDTO;
import br.com.backend.auth.service.AuthService;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/registro")
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponseDTO registrar(@RequestBody RegistroRequestDTO request) {
        return authService.registrar(request);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> entrar(@RequestBody LoginRequestDTO request) {
        String token = authService.entrar(request);
        return ResponseEntity.ok(Map.of("token", token));
    }
}
