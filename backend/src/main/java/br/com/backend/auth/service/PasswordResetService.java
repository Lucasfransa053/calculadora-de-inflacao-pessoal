package br.com.backend.auth.service;

import br.com.backend.auth.entity.UsuarioEntity;
import br.com.backend.auth.exception.AuthException;
import br.com.backend.auth.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;

@Service
public class PasswordResetService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PasswordResetService.class);
    private static final String EMAILJS_URL = "https://api.emailjs.com/api/v1.0/email/send";
    private static final int TOKEN_BYTES = 32;
    private static final int TOKEN_TTL_MINUTES = 60;
    private static final int SENHA_MIN = 8;
    private static final int SENHA_MAX = 72;

    private final UsuarioRepository repository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final RestClient restClient;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${emailjs.service-id}")
    private String serviceId;

    @Value("${emailjs.template-id}")
    private String templateId;

    @Value("${emailjs.public-key:}")
    private String publicKey;

    @Value("${emailjs.private-key:}")
    private String privateKey;

    @Value("${app.password-reset-url:}")
    private String passwordResetUrl;

    public PasswordResetService(
            UsuarioRepository repository,
            org.springframework.security.crypto.password.PasswordEncoder passwordEncoder
    ) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.restClient = RestClient.create();
    }

    @Transactional
    public void solicitar(String emailInformado) {
        String email = emailInformado == null ? "" : emailInformado.trim().toLowerCase(Locale.ROOT);
        if (email.isBlank() || email.length() > 254) return;

        repository.findByEmail(email).ifPresent(usuario -> {
            String token = novoToken();
            usuario.definirTokenRedefinicaoSenha(sha256(token), LocalDateTime.now().plusMinutes(TOKEN_TTL_MINUTES));
            repository.save(usuario);

            try {
                enviarEmail(usuario.getEmail(), criarLink(token));
            } catch (Exception e) {
                // A resposta pública continua genérica para não revelar se o e-mail existe.
                LOGGER.error("Falha ao enviar e-mail de redefinição de senha via EmailJS", e);
            }
        });
    }

    @Transactional
    public void confirmar(String token, String novaSenha) {
        String senha = novaSenha == null ? "" : novaSenha;
        if (senha.length() < SENHA_MIN || senha.length() > SENHA_MAX) {
            throw new AuthException(HttpStatus.BAD_REQUEST,
                    "A nova senha deve ter de " + SENHA_MIN + " a " + SENHA_MAX + " caracteres.");
        }
        if (token == null || token.isBlank()) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "O link de redefinição é inválido ou expirou.");
        }

        UsuarioEntity usuario = repository.findByResetSenhaTokenHash(sha256(token))
                .orElseThrow(() -> new AuthException(HttpStatus.BAD_REQUEST,
                        "O link de redefinição é inválido ou expirou."));

        if (usuario.getResetSenhaExpiraEm() == null || usuario.getResetSenhaExpiraEm().isBefore(LocalDateTime.now())) {
            usuario.limparTokenRedefinicaoSenha();
            repository.save(usuario);
            throw new AuthException(HttpStatus.BAD_REQUEST, "O link de redefinição é inválido ou expirou.");
        }

        usuario.alterarSenhaHash(passwordEncoder.encode(senha));
        usuario.limparTokenRedefinicaoSenha();
        repository.save(usuario);
    }

    private String novoToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sha256(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new IllegalStateException("Não foi possível proteger o token de redefinição.", e);
        }
    }

    private String criarLink(String token) {
        if (passwordResetUrl == null || passwordResetUrl.isBlank()) {
            throw new IllegalStateException("A variável APP_PASSWORD_RESET_URL não está configurada.");
        }
        return UriComponentsBuilder.fromUriString(passwordResetUrl.trim())
                .queryParam("token", token)
                .build()
                .encode()
                .toUriString();
    }

    private void enviarEmail(String email, String link) {
        if (publicKey == null || publicKey.isBlank()) {
            throw new IllegalStateException("A variável EMAILJS_PUBLIC_KEY não está configurada.");
        }

        Map<String, Object> body = new HashMap<>();
        body.put("service_id", serviceId);
        body.put("template_id", templateId);
        body.put("user_id", publicKey);
        if (privateKey != null && !privateKey.isBlank()) body.put("accessToken", privateKey);
        body.put("template_params", Map.of("email", email, "link", link));

        String response = restClient.post()
                .uri(EMAILJS_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        LOGGER.info("Email de redefinição enviado via EmailJS; resposta: {}", response);
    }
}
