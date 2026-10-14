package br.com.backend.auth.controller;

import br.com.backend.auth.dto.LoginRequestDTO;
import br.com.backend.auth.dto.LoginResponseDTO;
import br.com.backend.auth.dto.RegistroRequestDTO;
import br.com.backend.auth.dto.UsuarioResponseDTO;
import br.com.backend.auth.service.AuthService;
import br.com.backend.auth.service.PasswordResetService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    public AuthController(AuthService authService, PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/registro")
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponseDTO registrar(@RequestBody RegistroRequestDTO request) {
        return authService.registrar(request);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> entrar(@RequestBody LoginRequestDTO request) {
        return ResponseEntity.ok(authService.entrar(request));
    }

    @PostMapping("/password-reset/request")
    public ResponseEntity<MessageResponseDTO> solicitarRedefinicao(@RequestBody PasswordResetRequestDTO request) {
        passwordResetService.solicitar(request.email());
        return ResponseEntity.ok(new MessageResponseDTO(
                "Se o e-mail estiver cadastrado, você receberá as instruções para redefinir a senha."));
    }

    @PostMapping("/password-reset/confirm")
    public ResponseEntity<MessageResponseDTO> confirmarRedefinicao(@RequestBody PasswordResetConfirmDTO request) {
        passwordResetService.confirmar(request.token(), request.novaSenha());
        return ResponseEntity.ok(new MessageResponseDTO("Senha alterada com sucesso. Você já pode entrar."));
    }
}
