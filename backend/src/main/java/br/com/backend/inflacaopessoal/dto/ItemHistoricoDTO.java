package br.com.backend.inflacaopessoal.dto;

import java.math.BigDecimal;

public record ItemHistoricoDTO(
    String categoriaId,
    String nomeCategoria,
    BigDecimal valorGasto
) {}