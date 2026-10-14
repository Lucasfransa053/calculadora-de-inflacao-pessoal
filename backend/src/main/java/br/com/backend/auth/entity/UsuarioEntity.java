package br.com.backend.auth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
public class UsuarioEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String nome;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(name = "senha_hash", nullable = false, length = 100)
    private String senhaHash;

    @Column(name = "reset_senha_token_hash", length = 64)
    private String resetSenhaTokenHash;

    @Column(name = "reset_senha_expira_em")
    private LocalDateTime resetSenhaExpiraEm;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm = LocalDateTime.now();

    public UsuarioEntity() {}

    public UsuarioEntity(String nome, String email, String senhaHash) {
        this.nome = nome;
        this.email = email;
        this.senhaHash = senhaHash;
    }

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public String getEmail() { return email; }
    public String getSenhaHash() { return senhaHash; }
    public String getResetSenhaTokenHash() { return resetSenhaTokenHash; }
    public LocalDateTime getResetSenhaExpiraEm() { return resetSenhaExpiraEm; }
    public LocalDateTime getCriadoEm() { return criadoEm; }

    public void definirTokenRedefinicaoSenha(String tokenHash, LocalDateTime expiraEm) {
        this.resetSenhaTokenHash = tokenHash;
        this.resetSenhaExpiraEm = expiraEm;
    }

    public void limparTokenRedefinicaoSenha() {
        this.resetSenhaTokenHash = null;
        this.resetSenhaExpiraEm = null;
    }

    public void alterarSenhaHash(String senhaHash) {
        this.senhaHash = senhaHash;
    }
}
