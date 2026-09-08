package br.com.backend.inflacaopessoal.client;

import br.com.backend.inflacaopessoal.dto.IbgeGrupoDTO;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class IbgeClient {

    private final RestTemplate restTemplate;

    private static final String IBGE_API_URL = 
        "https://servicodados.ibge.gov.br/api/v3/agregados/7060/periodos/{periodo}/variaveis/63?localidades=N1[all]&classificacao=315[all]";

    public IbgeClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @SuppressWarnings("unchecked")
    public List<IbgeGrupoDTO> buscarGruposIpcaPorPeriodo(String periodo) {
        List<IbgeGrupoDTO> grupos = new ArrayList<>();

        try {
            List<Map<String, Object>> response = restTemplate.getForObject(IBGE_API_URL, List.class, periodo);

            if (response != null && !response.isEmpty()) {
                Map<String, Object> primeiroAgregado = response.get(0);
                List<Map<String, Object>> resultados = (List<Map<String, Object>>) primeiroAgregado.get("resultados");

                if (resultados != null && !resultados.isEmpty()) {
                    for (Map<String, Object> resultado : resultados) {
                        
                        List<Map<String, Object>> classificacoes = (List<Map<String, Object>>) resultado.get("classificacoes");
                        Map<String, String> categorias = null;
                        if (classificacoes != null && !classificacoes.isEmpty()) {
                            categorias = (Map<String, String>) classificacoes.get(0).get("categoria");
                        }

                        List<Map<String, Object>> series = (List<Map<String, Object>>) resultado.get("series");
                        
                        if (categorias != null && series != null && !series.isEmpty()) {
                            Map<String, String> valoresSerie = (Map<String, String>) series.get(0).get("serie");

                            if (valoresSerie != null) {
                                // Itera por TODOS os meses retornados na série temporal
                                String categoriaId = categorias.keySet().iterator().next();
                                String categoriaNome = categorias.get(categoriaId);

                                valoresSerie.forEach((dataPeriodo, valor) -> {
                                    grupos.add(new IbgeGrupoDTO(categoriaId, categoriaNome, valor != null ? valor : "0.0", dataPeriodo));
                                });
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return grupos;
    }
}