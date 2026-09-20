package br.com.backend.inflacaopessoal.controller;

import br.com.backend.inflacaopessoal.dto.CalculoInflacaoRequestDTO;
import br.com.backend.inflacaopessoal.dto.CalculoInflacaoResponseDTO;
import br.com.backend.inflacaopessoal.dto.CategoriaDTO;
import br.com.backend.inflacaopessoal.service.InflacaoPessoalService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/inflacao-pessoal")
public class InflacaoPessoalController {

    private final InflacaoPessoalService inflacaoPessoalService;

    public InflacaoPessoalController(InflacaoPessoalService inflacaoPessoalService) {
        this.inflacaoPessoalService = inflacaoPessoalService;
    }

    @PostMapping("/sincronizar")
    public String sincronizarUltimoMes() {
        return inflacaoPessoalService.sincronizarUltimoMesIbge();
    }

    @PostMapping("/sincronizar-periodo")
    public String sincronizarPeriodo(@RequestParam String periodo) {
        return inflacaoPessoalService.sincronizarPeriodo(periodo);
    }

    @GetMapping("/categorias")
    public ResponseEntity<List<CategoriaDTO>> getCategorias() {
        List<CategoriaDTO> categorias = inflacaoPessoalService.listarCategorias();
        return ResponseEntity.ok(categorias);
    }

    // Retorna apenas categorias que possuem dados em TODOS os meses do período informado
    // Exemplo de chamada: GET /api/inflacao-pessoal/categorias/validas?inicio=2015-01-01&fim=2024-12-01
    @GetMapping("/categorias/validas")
    public ResponseEntity<List<CategoriaDTO>> getCategoriasValidas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {

        LocalDate inicioAjustado = inicio.withDayOfMonth(1);
        LocalDate fimAjustado = fim.withDayOfMonth(1);

        List<CategoriaDTO> categorias = inflacaoPessoalService.listarCategoriasValidasParaPeriodo(inicioAjustado, fimAjustado);
        return ResponseEntity.ok(categorias);
    }

    @PostMapping("/calcular")
    public ResponseEntity<CalculoInflacaoResponseDTO> calcular(@RequestBody CalculoInflacaoRequestDTO request) {
        CalculoInflacaoResponseDTO resultado = inflacaoPessoalService.calcularInflacaoPessoal(request);
        return ResponseEntity.ok(resultado);
    }
}