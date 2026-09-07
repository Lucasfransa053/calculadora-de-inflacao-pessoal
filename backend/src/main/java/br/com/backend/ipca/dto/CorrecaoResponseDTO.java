package br.com.backend.ipca.dto;

import java.math.BigDecimal;

public record CorrecaoResponseDTO(
    BigDecimal valorInicial,
    BigDecimal valorCorrigido,
    BigDecimal variacaoPercentualAcumulada,
    int totalMeses
) {}