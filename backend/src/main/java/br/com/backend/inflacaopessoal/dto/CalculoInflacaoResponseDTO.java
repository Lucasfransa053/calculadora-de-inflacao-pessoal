package br.com.backend.inflacaopessoal.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CalculoInflacaoResponseDTO(
    BigDecimal inflacaoPessoalPercentual,
    BigDecimal inflacaoOficialIpcaPercentual, // Para comparar a dele com o IPCA geral!
    LocalDate dataInicioCalculada,
    LocalDate dataFimCalculada,
    String mensagemAviso,
    List<DetalhamentoCategoriaDTO> detalhamento
) {
    public record DetalhamentoCategoriaDTO(
        String categoriaId,
        String nomeCategoria,
        BigDecimal valorGasto,
        BigDecimal pesoPercentual,
        BigDecimal inflacaoAcumuladaCategoriaPercentual
    ) {}
}