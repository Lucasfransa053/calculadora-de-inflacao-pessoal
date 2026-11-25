package br.com.backend.rankingipca.service;

import br.com.backend.inflacaopessoal.repository.HistoricoCategoriaIpcaRepository;
import br.com.backend.rankingipca.dto.RankingCategoriaDTO;
import br.com.backend.rankingipca.dto.RankingCategoriaProjection;
import br.com.backend.rankingipca.dto.TipoRanking;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class RankingIpcaService {

    private final HistoricoCategoriaIpcaRepository historicoRepository;

    public RankingIpcaService(HistoricoCategoriaIpcaRepository historicoRepository) {
        this.historicoRepository = historicoRepository;
    }

    public List<RankingCategoriaDTO> buscarRanking(
            LocalDate dataInicio,
            LocalDate dataFim,
            TipoRanking tipo,
            int limite
    ) {
        if (dataInicio == null || dataFim == null) {
            throw new IllegalArgumentException("As datas de início e fim são obrigatórias.");
        }
        if (dataInicio.isAfter(dataFim)) {
            throw new IllegalArgumentException("A data inicial não pode ser maior que a data final.");
        }

        // Garante um limite seguro (ex.: entre 1 e 100)
        int limiteSeguro = Math.max(1, Math.min(limite, 100));

        List<RankingCategoriaProjection> resultados = (tipo == TipoRanking.QUEDA)
                ? historicoRepository.buscarMaioresQuedas(dataInicio, dataFim, limiteSeguro)
                : historicoRepository.buscarMaioresAltas(dataInicio, dataFim, limiteSeguro);

        return resultados.stream()
                .map(RankingCategoriaDTO::fromProjection)
                .toList();
    }
}