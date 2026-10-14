package br.com.backend.auth.repository;

import br.com.backend.auth.entity.UsuarioEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<UsuarioEntity, Long> {
    Optional<UsuarioEntity> findByEmail(String email);
    Optional<UsuarioEntity> findByResetSenhaTokenHash(String resetSenhaTokenHash);
    boolean existsByEmail(String email);
}
