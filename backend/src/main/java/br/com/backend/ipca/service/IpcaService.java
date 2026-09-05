package br.com.backend.ipca.service;

import br.com.backend.ipca.client.BancoCentralClient;
import br.com.backend.ipca.dto.IpcaDTO;
import org.springframework.stereotype.Service;

@Service
public class IpcaService {

    private final BancoCentralClient bancoCentralClient;

    public IpcaService(BancoCentralClient bancoCentralClient) {
        this.bancoCentralClient = bancoCentralClient;
    }

    public IpcaDTO[] buscarHistoricoIpca() {
        return bancoCentralClient.buscarHistoricoIpca();
    }
}