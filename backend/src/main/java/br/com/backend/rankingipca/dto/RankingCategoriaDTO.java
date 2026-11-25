package br.com.backend.rankingipca.dto;

import java.math.BigDecimal;

public record RankingCategoriaDTO(
        String categoriaId,
        String categoriaNome,
        Long qtdMeses,
        BigDecimal variacaoAcumuladaPct
) {
    public static RankingCategoriaDTO fromProjection(RankingCategoriaProjection p) {
        return new RankingCategoriaDTO(
                p.getCategoriaId(),
                p.getCategoriaNome(),
                p.getQtdMeses(),
                p.getVariacaoAcumuladaPct()
        );
    }
}