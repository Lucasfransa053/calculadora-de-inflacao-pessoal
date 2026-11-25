package br.com.backend.inflacaopessoal.repository;

import br.com.backend.inflacaopessoal.entity.CategoriaIpcaEntity;
import br.com.backend.inflacaopessoal.entity.HistoricoCategoriaIpcaEntity;
import br.com.backend.rankingipca.dto.RankingCategoriaProjection;

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

    @Query(value = """
        SELECT
            c.id AS categoriaId,
            c.nome AS categoriaNome,
            COUNT(h.id) AS qtdMeses,
            ROUND(((EXP(SUM(LN(1.0 + (h.valor_percentual / 100.0)))) - 1.0) * 100.0)::numeric, 2) AS variacaoAcumuladaPct
        FROM historico_categoria_ipca h
        JOIN categoria_ipca c ON c.id = h.categoria_id
        WHERE h.data_referencia BETWEEN :dataInicio AND :dataFim
          AND (1.0 + (h.valor_percentual / 100.0)) > 0
        GROUP BY c.id, c.nome
        ORDER BY variacaoAcumuladaPct DESC
        LIMIT :limite
        """, nativeQuery = true)
    List<RankingCategoriaProjection> buscarMaioresAltas(
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim,
            @Param("limite") int limite
    );

    @Query(value = """
        SELECT
            c.id AS categoriaId,
            c.nome AS categoriaNome,
            COUNT(h.id) AS qtdMeses,
            ROUND(((EXP(SUM(LN(1.0 + (h.valor_percentual / 100.0)))) - 1.0) * 100.0)::numeric, 2) AS variacaoAcumuladaPct
        FROM historico_categoria_ipca h
        JOIN categoria_ipca c ON c.id = h.categoria_id
        WHERE h.data_referencia BETWEEN :dataInicio AND :dataFim
          AND (1.0 + (h.valor_percentual / 100.0)) > 0
        GROUP BY c.id, c.nome
        ORDER BY variacaoAcumuladaPct ASC
        LIMIT :limite
        """, nativeQuery = true)
    List<RankingCategoriaProjection> buscarMaioresQuedas(
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim,
            @Param("limite") int limite
    );
}