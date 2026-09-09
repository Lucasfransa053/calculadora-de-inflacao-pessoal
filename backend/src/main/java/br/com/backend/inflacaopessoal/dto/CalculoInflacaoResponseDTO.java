package br.com.backend.inflacaopessoal.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CalculoInflacaoResponseDTO(
    BigDecimal inflacaoPessoalPercentual,
    BigDecimal inflacaoOficialIpcaPercentual,
    BigDecimal diferencaParaIpcaOficialPercentual, // Ex: +0.16%
    BigDecimal custoTotalInicial,                  // Ex: R$ 1950.50
    BigDecimal custoTotalRecomposto,               // Ex: R$ 1968.05
    BigDecimal perdaPoderCompraReais,              // Ex: R$ 17.55
    LocalDate dataInicioCalculada,
    LocalDate dataFimCalculada,
    String mensagemAviso,
    List<DetalhamentoCategoriaDTO> detalhamento
) {
    public record DetalhamentoCategoriaDTO(
        String categoriaId,
        String nomeCategoria,
        BigDecimal valorGastoInicial,
        BigDecimal valorGastoRecomposto,               // Quanto essa categoria custa no fim do periodo
        BigDecimal impactoFinanceiroReais,             // Dó de aumento em R$ da categoria
        BigDecimal pesoPercentual,
        BigDecimal inflacaoAcumuladaCategoriaPercentual
    ) {}
}