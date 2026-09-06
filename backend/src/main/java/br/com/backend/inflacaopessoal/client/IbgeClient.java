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

    // Tabela 7060: IPCA - Variação mensal (variável 63) do último mês (-1)
    private static final String IBGE_API_URL = 
        "https://servicodados.ibge.gov.br/api/v3/agregados/7060/periodos/-1/variaveis/63?localidades=N1[all]&classificacao=315[all]";

    public IbgeClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @SuppressWarnings("unchecked")
    public List<IbgeGrupoDTO> buscarGruposIpcaAtual() {
        List<IbgeGrupoDTO> grupos = new ArrayList<>();

        try {
            List<Map<String, Object>> response = restTemplate.getForObject(IBGE_API_URL, List.class);

            if (response != null && !response.isEmpty()) {
                Map<String, Object> primeiroAgregado = response.get(0);
                List<Map<String, Object>> resultados = (List<Map<String, Object>>) primeiroAgregado.get("resultados");

                if (resultados != null && !resultados.isEmpty()) {
                    for (Map<String, Object> resultado : resultados) {
                        // Extrai o mapa de categorias (ID -> Nome do Grupo)
                        List<Map<String, Object>> classificacoes = (List<Map<String, Object>>) resultado.get("classificacoes");
                        Map<String, String> categorias = null;
                        if (classificacoes != null && !classificacoes.isEmpty()) {
                            categorias = (Map<String, String>) classificacoes.get(0).get("categoria");
                        }

                        // Extrai os valores das variações percentuais na série
                        List<Map<String, Object>> series = (List<Map<String, Object>>) resultado.get("series");
                        Map<String, String> valoresSerie = null;
                        if (series != null && !series.isEmpty()) {
                            valoresSerie = (Map<String, String>) series.get(0).get("serie");
                        }

                        if (categorias != null) {
                            Map<String, String> finalValoresSerie = valoresSerie;
                            categorias.forEach((id, nome) -> {
                                // Pega o valor da variação percentual do período ou 0.0 se nulo
                                String valor = "0.0";
                                if (finalValoresSerie != null && !finalValoresSerie.isEmpty()) {
                                    valor = finalValoresSerie.values().iterator().next();
                                }
                                grupos.add(new IbgeGrupoDTO(id, nome, valor));
                            });
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