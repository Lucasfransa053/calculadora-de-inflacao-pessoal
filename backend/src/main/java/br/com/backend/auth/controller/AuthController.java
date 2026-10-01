package br.com.backend.auth.controller;

import br.com.backend.auth.dto.LoginRequestDTO;
import br.com.backend.auth.dto.RegistroRequestDTO;
import br.com.backend.auth.dto.UsuarioResponseDTO;
import br.com.backend.auth.service.AuthService;
import org.springframework.http.HttpStatus;
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
    public UsuarioResponseDTO entrar(@RequestBody LoginRequestDTO request) {
        return authService.entrar(request);
    }
}
