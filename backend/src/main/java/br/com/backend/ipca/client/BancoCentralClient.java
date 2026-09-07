package br.com.backend.ipca.client;

import br.com.backend.ipca.dto.IpcaDTO;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;

@Component
public class BancoCentralClient {

    private final RestTemplate restTemplate;
    private static final String URL_BACEN_IPCA = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json";

    public BancoCentralClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public IpcaDTO[] buscarHistoricoIpca() {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        headers.add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<IpcaDTO[]> response = restTemplate.exchange(
                URL_BACEN_IPCA,
                HttpMethod.GET,
                entity,
                IpcaDTO[].class
        );

        return response.getBody();
    }
}