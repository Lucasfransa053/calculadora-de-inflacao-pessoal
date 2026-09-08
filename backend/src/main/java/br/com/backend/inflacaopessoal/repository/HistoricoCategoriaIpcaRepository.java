package br.com.backend.inflacaopessoal.repository;

import br.com.backend.inflacaopessoal.entity.HistoricoCategoriaIpcaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface HistoricoCategoriaIpcaRepository extends JpaRepository<HistoricoCategoriaIpcaEntity, Long> {
    
    boolean existsByCategoriaIdAndDataReferencia(String categoriaId, LocalDate dataReferencia);

    List<HistoricoCategoriaIpcaEntity> findByDataReferenciaBetween(LocalDate inicio, LocalDate fim);
}