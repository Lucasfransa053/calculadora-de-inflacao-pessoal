package br.com.backend.inflacaopessoal.repository;

import br.com.backend.inflacaopessoal.entity.CategoriaIpcaEntity;
import br.com.backend.inflacaopessoal.entity.HistoricoCategoriaIpcaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface HistoricoCategoriaIpcaRepository extends JpaRepository<HistoricoCategoriaIpcaEntity, Long> {

    List<HistoricoCategoriaIpcaEntity> findByDataReferenciaBetween(LocalDate inicio, LocalDate fim);

    boolean existsByCategoria_IdAndDataReferencia(String categoriaId, LocalDate dataReferencia);

    @Query("""
        SELECT DISTINCT h.categoria 
        FROM HistoricoCategoriaIpcaEntity h 
        WHERE h.dataReferencia BETWEEN :inicio AND :fim 
        GROUP BY h.categoria 
        HAVING COUNT(DISTINCT h.dataReferencia) = :mesesEsperados
        ORDER BY h.categoria.nome ASC
    """)
    List<CategoriaIpcaEntity> findCategoriasValidasNoPeriodo(
            @Param("inicio") LocalDate inicio, 
            @Param("fim") LocalDate fim, 
            @Param("mesesEsperados") long mesesEsperados
    );
}