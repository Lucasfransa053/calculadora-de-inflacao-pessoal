package br.com.backend.ipca.dto;

import java.math.BigDecimal;
import java.time.YearMonth;

public record CorrecaoRequestDTO(
    BigDecimal valorInicial,
    YearMonth dataInicio, // Ex: 2020-01
    YearMonth dataFim    // Ex: 2025-01
) {}