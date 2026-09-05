package br.com.backend.ipca.controller;

import br.com.backend.ipca.dto.IpcaDTO;
import br.com.backend.ipca.service.IpcaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ipca")
public class IpcaController {

    private final IpcaService ipcaService;

    public IpcaController(IpcaService ipcaService) {
        this.ipcaService = ipcaService;
    }

    @GetMapping("/historico")
    public IpcaDTO[] getHistorico() {
        return ipcaService.buscarHistoricoIpca();
    }
}