package br.com.backend.rankingipca.controller;

import br.com.backend.rankingipca.dto.RankingCategoriaDTO;
import br.com.backend.rankingipca.dto.TipoRanking;
import br.com.backend.rankingipca.service.RankingIpcaService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/ranking-ipca")
public class RankingIpcaController {

    private final RankingIpcaService rankingIpcaService;

    public RankingIpcaController(RankingIpcaService rankingIpcaService) {
        this.rankingIpcaService = rankingIpcaService;
    }

    @GetMapping
    public ResponseEntity<List<RankingCategoriaDTO>> consultarRanking(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @RequestParam(defaultValue = "ALTA") TipoRanking tipo,
            @RequestParam(defaultValue = "20") int limite
    ) {
        List<RankingCategoriaDTO> ranking = rankingIpcaService.buscarRanking(inicio, fim, tipo, limite);
        return ResponseEntity.ok(ranking);
    }
}