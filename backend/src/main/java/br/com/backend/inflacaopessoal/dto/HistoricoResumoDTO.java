package br.com.backend.inflacaopessoal.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record HistoricoResumoDTO(
    Long id,
    LocalDateTime dataConsulta,
    LocalDate dataInicio,
    LocalDate dataFim,
    BigDecimal inflacaoPessoalPercentual,
    BigDecimal inflacaoOficialIpcaPercentual,
    BigDecimal custoTotalInicial,
    BigDecimal custoTotalRecomposto,
    List<ItemHistoricoDTO> itens
) {}