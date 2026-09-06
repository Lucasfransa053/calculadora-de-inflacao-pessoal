package br.com.backend.inflacaopessoal.controller;

import br.com.backend.inflacaopessoal.client.IbgeClient;
import br.com.backend.inflacaopessoal.dto.IbgeGrupoDTO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/inflacao-pessoal")
public class InflacaoPessoalController {

    private final IbgeClient ibgeClient;

    public InflacaoPessoalController(IbgeClient ibgeClient) {
        this.ibgeClient = ibgeClient;
    }

    @GetMapping("/grupos")
    public List<IbgeGrupoDTO> getGrupos() {
        return ibgeClient.buscarGruposIpcaAtual();
    }
}