package br.com.backend.ipca.repository;

import br.com.backend.ipca.entity.HistoricoIpcaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HistoricoIpcaRepository extends JpaRepository<HistoricoIpcaEntity, Long> {
    List<HistoricoIpcaEntity> findByDataReferenciaBetweenOrderByDataReferenciaAsc(LocalDate inicio, LocalDate fim);
    
    // Método para checar duplicação antes de salvar na sincronização
    boolean existsByDataReferencia(LocalDate dataReferencia);

    // Busca o registro com a maior/última data de referência
    Optional<HistoricoIpcaEntity> findTopByOrderByDataReferenciaDesc();
}