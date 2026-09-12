package br.com.backend.ipca.controller;

import br.com.backend.ipca.dto.CorrecaoRequestDTO;
import br.com.backend.ipca.dto.CorrecaoResponseDTO;
import br.com.backend.ipca.dto.IpcaDTO;
import br.com.backend.ipca.entity.HistoricoIpcaEntity;
import br.com.backend.ipca.service.IpcaService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ipca")
@CrossOrigin(origins = "*")
public class IpcaController {

    private final IpcaService ipcaService;

    public IpcaController(IpcaService ipcaService) {
        this.ipcaService = ipcaService;
    }

    @GetMapping("/historico")
    public IpcaDTO[] getHistorico() {
        return ipcaService.buscarHistoricoIpca();
    }

    @GetMapping("/ultimo-registro")
    public HistoricoIpcaEntity getUltimoRegistro() {
        return ipcaService.buscarUltimoIpcaDisponivel();
    }

    @PostMapping("/correcao-monetaria")
    public CorrecaoResponseDTO calcularCorrecao(@RequestBody CorrecaoRequestDTO request) {
        return ipcaService.calcularCorrecao(request);
    }

    @PostMapping("/sincronizar")
    public String sincronizarBancocentral() {
        return ipcaService.sincronizarHistoricoComBancocentral();
    }
}