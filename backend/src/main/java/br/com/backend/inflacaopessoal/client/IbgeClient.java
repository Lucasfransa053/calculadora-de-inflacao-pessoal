package br.com.backend.inflacaopessoal.client;

import br.com.backend.inflacaopessoal.dto.IbgeGrupoDTO;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class IbgeClient {

    private final RestTemplate restTemplate;

    public IbgeClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public List<IbgeGrupoDTO> buscarGruposIpcaPorPeriodo(String periodo) {
        return buscarGruposIpcaPorAgregadoEPeriodo("7060", periodo);
    }

    @SuppressWarnings("unchecked")
    public List<IbgeGrupoDTO> buscarGruposIpcaPorAgregadoEPeriodo(String agregado, String periodo) {
        List<IbgeGrupoDTO> grupos = new ArrayList<>();

        // Para as tabelas 7060 e 1419 do IPCA, a classificação de grupos de produtos é a '315'
        String classificacao = "315[all]";

        // Constrói a URL escapando caracteres especiais corretamente
        String url = UriComponentsBuilder.newInstance()
                .scheme("https")
                .host("servicodados.ibge.gov.br")
                .path("/api/v3/agregados/{agregado}/periodos/{periodo}/variaveis/63")
                .queryParam("localidades", "N1[all]")
                .queryParam("classificacao", classificacao)
                .buildAndExpand(agregado, periodo)
                .toUriString();

        try {
            List<Map<String, Object>> response = restTemplate.getForObject(url, List.class);

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
                                String categoriaId = categorias.keySet().iterator().next();
                                String categoriaNome = categorias.get(categoriaId);

                                valoresSerie.forEach((dataPeriodo, valor) -> {
                                    grupos.add(new IbgeGrupoDTO(
                                            categoriaId, 
                                            categoriaNome, 
                                            valor != null ? valor : "0.0", 
                                            dataPeriodo
                                    ));
                                });
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Erro ao buscar dados na API do IBGE (Agregado: " + agregado + ", Período: " + periodo + "): " + e.getMessage());
            e.printStackTrace();
        }

        return grupos;
    }
}