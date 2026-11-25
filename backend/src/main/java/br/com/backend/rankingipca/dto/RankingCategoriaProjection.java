package br.com.backend.rankingipca.dto;

import java.math.BigDecimal;

public interface RankingCategoriaProjection {
    String getCategoriaId();
    String getCategoriaNome();
    Long getQtdMeses();
    BigDecimal getVariacaoAcumuladaPct();
}