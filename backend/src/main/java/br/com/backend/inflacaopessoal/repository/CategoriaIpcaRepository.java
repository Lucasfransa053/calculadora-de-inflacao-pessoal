package br.com.backend.inflacaopessoal.repository;

import br.com.backend.inflacaopessoal.entity.CategoriaIpcaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoriaIpcaRepository extends JpaRepository<CategoriaIpcaEntity, String> {
}