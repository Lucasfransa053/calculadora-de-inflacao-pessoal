package br.com.backend.inflacaopessoal.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CalculoInflacaoRequestDTO(
    LocalDate dataInicio,
    LocalDate dataFim,
    List<ItemGastoDTO> itensGasto
) {
    public record ItemGastoDTO(
        String categoriaId,
        BigDecimal valorGasto
    ) {}
}