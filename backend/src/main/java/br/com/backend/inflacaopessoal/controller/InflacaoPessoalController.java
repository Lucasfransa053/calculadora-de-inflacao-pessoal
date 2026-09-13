package br.com.backend.inflacaopessoal.controller;

import br.com.backend.inflacaopessoal.dto.CalculoInflacaoRequestDTO;
import br.com.backend.inflacaopessoal.dto.CalculoInflacaoResponseDTO;
import br.com.backend.inflacaopessoal.dto.CategoriaDTO;
import br.com.backend.inflacaopessoal.entity.CategoriaIpcaEntity;
import br.com.backend.inflacaopessoal.service.InflacaoPessoalService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/inflacao-pessoal")
public class InflacaoPessoalController {

    private final InflacaoPessoalService inflacaoPessoalService;

    public InflacaoPessoalController(InflacaoPessoalService inflacaoPessoalService) {
        this.inflacaoPessoalService = inflacaoPessoalService;
    }

    // Chamada sem parametro: atualiza o ultimo mes disponivel (-1)
    @PostMapping("/sincronizar")
    public String sincronizarUltimoMes() {
        return inflacaoPessoalService.sincronizarUltimoMesIbge();
    }

    // Chamada flexivel: ex /sincronizar-periodo?periodo=202501-202607
    @PostMapping("/sincronizar-periodo")
    public String sincronizarPeriodo(@RequestParam String periodo) {
        return inflacaoPessoalService.sincronizarPeriodo(periodo);
    }

    @GetMapping("/categorias")
    public ResponseEntity<List<CategoriaDTO>> getCategorias() {
        List<CategoriaDTO> categorias = inflacaoPessoalService.listarCategorias();
        return ResponseEntity.ok(categorias);
    }

    @PostMapping("/calcular")
    public ResponseEntity<CalculoInflacaoResponseDTO> calcular(@RequestBody CalculoInflacaoRequestDTO request) {
        CalculoInflacaoResponseDTO resultado = inflacaoPessoalService.calcularInflacaoPessoal(request);
        return ResponseEntity.ok(resultado);
    }
}