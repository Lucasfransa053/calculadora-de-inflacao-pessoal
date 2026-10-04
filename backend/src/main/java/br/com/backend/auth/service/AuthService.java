package br.com.backend.auth.service;

import br.com.backend.auth.dto.LoginRequestDTO;
import br.com.backend.auth.dto.RegistroRequestDTO;
import br.com.backend.auth.dto.UsuarioResponseDTO;
import br.com.backend.auth.entity.UsuarioEntity;
import br.com.backend.auth.exception.AuthException;
import br.com.backend.auth.repository.UsuarioRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final Pattern PADRAO_EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$");
    private static final int EMAIL_MAX = 254;
    private static final int SENHA_MIN = 8;
    private static final int SENHA_MAX = 72; // limite do BCrypt
    private static final String MSG_EMAIL_EM_USO = "Este e-mail já está cadastrado.";
    private static final String MSG_CREDENCIAIS = "E-mail ou senha incorretos. Confira os dados e tente novamente.";

    private final UsuarioRepository repository;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;

    public AuthService(UsuarioRepository repository, PasswordEncoder encoder, JwtService jwtService) {
        this.repository = repository;
        this.encoder = encoder;
        this.jwtService = jwtService;
    }

    public UsuarioResponseDTO registrar(RegistroRequestDTO req) {
        String nome = req.nome() == null ? "" : req.nome().trim();
        String email = normalizar(req.email());
        String senha = req.senha() == null ? "" : req.senha();

        if (nome.length() < 2 || nome.length() > 80) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Informe seu nome (2 a 80 caracteres).");
        }
        if (email.length() > EMAIL_MAX || !PADRAO_EMAIL.matcher(email).matches()) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Informe um e-mail válido.");
        }
        if (senha.length() < SENHA_MIN || senha.length() > SENHA_MAX) {
            throw new AuthException(HttpStatus.BAD_REQUEST,
                    "A senha deve ter de " + SENHA_MIN + " a " + SENHA_MAX + " caracteres.");
        }
        if (repository.existsByEmail(email)) {
            throw new AuthException(HttpStatus.CONFLICT, MSG_EMAIL_EM_USO);
        }

        try {
            UsuarioEntity salvo = repository.save(new UsuarioEntity(nome, email, encoder.encode(senha)));
            return new UsuarioResponseDTO(salvo.getId(),salvo.getEmail(), salvo.getNome());
        } catch (DataIntegrityViolationException e) {
            // duas requisições simultâneas com o mesmo e-mail
            throw new AuthException(HttpStatus.CONFLICT, MSG_EMAIL_EM_USO);
        }
    }

    public String entrar(LoginRequestDTO req) {
        String email = normalizar(req.email());
        String senha = req.senha() == null ? "" : req.senha();

        UsuarioEntity encontrado = repository.findByEmail(email)
                .filter(u -> encoder.matches(senha, u.getSenhaHash()))
                .orElseThrow(() -> new AuthException(HttpStatus.UNAUTHORIZED, MSG_CREDENCIAIS));

        return jwtService.gerarToken(encontrado.getEmail());
    }

    private static String normalizar(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
