package br.com.backend.inflacaopessoal.service;

import br.com.backend.inflacaopessoal.client.IbgeClient;
import br.com.backend.inflacaopessoal.dto.CalculoInflacaoRequestDTO;
import br.com.backend.inflacaopessoal.dto.CalculoInflacaoResponseDTO;
import br.com.backend.inflacaopessoal.dto.IbgeGrupoDTO;
import br.com.backend.inflacaopessoal.entity.CategoriaIpcaEntity;
import br.com.backend.inflacaopessoal.entity.HistoricoCategoriaIpcaEntity;
import br.com.backend.inflacaopessoal.repository.CategoriaIpcaRepository;
import br.com.backend.inflacaopessoal.repository.HistoricoCategoriaIpcaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set; // <--- IMPORT ADICIONADO AQUI
import java.util.stream.Collectors;

@Service
public class InflacaoPessoalService {

    private final IbgeClient ibgeClient;
    private final CategoriaIpcaRepository categoriaRepository;
    private final HistoricoCategoriaIpcaRepository historicoRepository;

    public InflacaoPessoalService(IbgeClient ibgeClient, 
                                 CategoriaIpcaRepository categoriaRepository, 
                                 HistoricoCategoriaIpcaRepository historicoRepository) {
        this.ibgeClient = ibgeClient;
        this.categoriaRepository = categoriaRepository;
        this.historicoRepository = historicoRepository;
    }

    @Transactional
    public String sincronizarUltimoMesIbge() {
        // Reutiliza o metodo generico passando "-1"
        return sincronizarPeriodo("-1");
    }

    @Transactional
    public String sincronizarPeriodo(String periodo) {
        List<IbgeGrupoDTO> grupos = ibgeClient.buscarGruposIpcaPorPeriodo(periodo);

        if (grupos.isEmpty()) {
            return "Nenhum dado retornado da API do IBGE para o período informado.";
        }

        // 1. Carrega todas as categorias e históricos existentes na memória de uma vez só (evita queries N+1)
        Set<String> categoriasExistentes = categoriaRepository.findAll()
                .stream()
                .map(CategoriaIpcaEntity::getId)
                .collect(Collectors.toSet());

        Set<String> historicosExistentes = historicoRepository.findAll()
                .stream()
                .map(h -> h.getCategoria().getId() + "_" + h.getDataReferencia())
                .collect(Collectors.toSet());

        List<CategoriaIpcaEntity> novasCategoriasEntities = new ArrayList<>();
        List<HistoricoCategoriaIpcaEntity> novosHistoricosEntities = new ArrayList<>();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");

        for (IbgeGrupoDTO dto : grupos) {
            // Valida se a categoria já está no banco ou se foi adicionada nesta mesma execução
            if (!categoriasExistentes.contains(dto.id())) {
                CategoriaIpcaEntity novaCategoria = new CategoriaIpcaEntity(dto.id(), dto.nome());
                novasCategoriasEntities.add(novaCategoria);
                categoriasExistentes.add(dto.id()); // Marca na memória
            }

            LocalDate dataReferencia = LocalDate.parse(dto.periodo() + "01", formatter);
            String chaveHistorico = dto.id() + "_" + dataReferencia;

            // Valida histórico na memória
            if (!historicosExistentes.contains(chaveHistorico)) {
                try {
                    BigDecimal valor = new BigDecimal(dto.valor().replace(",", "."));
                    
                    // Instancia o objeto categoria temporário sem precisar fazer query no banco
                    CategoriaIpcaEntity categoriaRef = new CategoriaIpcaEntity();
                    categoriaRef.setId(dto.id());

                    novosHistoricosEntities.add(new HistoricoCategoriaIpcaEntity(categoriaRef, dataReferencia, valor));
                    historicosExistentes.add(chaveHistorico); // Marca na memória
                } catch (NumberFormatException e) {
                    // Trata caracteres como "..." da API
                }
            }
        }

        // 2. Persiste tudo em pouquíssimos lotes com saveAll
        if (!novasCategoriasEntities.isEmpty()) {
            categoriaRepository.saveAll(novasCategoriasEntities);
        }

        if (!novosHistoricosEntities.isEmpty()) {
            historicoRepository.saveAll(novosHistoricosEntities);
        }

        return String.format("Sincronização concluída! %d novas categorias e %d taxas mensais persistidas.", 
                novasCategoriasEntities.size(), novosHistoricosEntities.size());
    }

    public CalculoInflacaoResponseDTO calcularInflacaoPessoal(CalculoInflacaoRequestDTO request) {
        LocalDate inicio = request.dataInicio().withDayOfMonth(1);
        LocalDate fim = request.dataFim().withDayOfMonth(1);

        // 1. Busca histórico do período selecionado
        List<HistoricoCategoriaIpcaEntity> historicos = historicoRepository.findByDataReferenciaBetween(inicio, fim);

        if (historicos.isEmpty()) {
            throw new IllegalArgumentException("Não há dados de IPCA persistidos para o período solicitado.");
        }

        // Identifica as datas reais encontradas na base
        LocalDate menorDataEncontrada = historicos.stream().map(HistoricoCategoriaIpcaEntity::getDataReferencia).min(LocalDate::compareTo).orElse(inicio);
        LocalDate maiorDataEncontrada = historicos.stream().map(HistoricoCategoriaIpcaEntity::getDataReferencia).max(LocalDate::compareTo).orElse(fim);

        String aviso = null;
        if (maiorDataEncontrada.isBefore(fim)) {
            aviso = String.format("O IPCA para datas após %s ainda não foi publicado pelo IBGE. O cálculo considerou de %s até %s.",
                    maiorDataEncontrada, menorDataEncontrada, maiorDataEncontrada);
        }

        // 2. Total do orçamento do usuário
        BigDecimal gastoTotal = request.itensGasto().stream()
                .map(CalculoInflacaoRequestDTO.ItemGastoDTO::valorGasto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (gastoTotal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("O valor total de gastos deve ser maior que zero.");
        }

        List<CalculoInflacaoResponseDTO.DetalhamentoCategoriaDTO> detalhamento = new ArrayList<>();
        BigDecimal inflacaoPessoalPonderadaSum = BigDecimal.ZERO;

        // 3. Calcula a inflação acumulada por categoria
        for (CalculoInflacaoRequestDTO.ItemGastoDTO item : request.itensGasto()) {
            List<HistoricoCategoriaIpcaEntity> historicosCategoria = historicos.stream()
                    .filter(h -> h.getCategoria().getId().equals(item.categoriaId()))
                    .toList();

            // Fator acumulado via juros compostos: (1 + i1) * (1 + i2) * ...
            double fatorAcumulado = 1.0;
            for (HistoricoCategoriaIpcaEntity h : historicosCategoria) {
                double taxaDecimal = h.getValorPercentual().doubleValue() / 100.0;
                fatorAcumulado *= (1.0 + taxaDecimal);
            }

            BigDecimal inflacaoAcumuladaCategoria = BigDecimal.valueOf((fatorAcumulado - 1.0) * 100.0)
                    .setScale(4, RoundingMode.HALF_UP);

            BigDecimal pesoPercentual = item.valorGasto()
                    .divide(gastoTotal, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));

            // Ponderação no total
            BigDecimal contribuiçãoInflacao = inflacaoAcumuladaCategoria
                    .multiply(item.valorGasto().divide(gastoTotal, 6, RoundingMode.HALF_UP));
            
            inflacaoPessoalPonderadaSum = inflacaoPessoalPonderadaSum.add(contribuiçãoInflacao);

            // Busca o nome a partir da lista já carregada no relacionamento do histórico
            String nomeCategoria = historicosCategoria.stream()
                    .map(h -> h.getCategoria().getNome())
                    .findFirst()
                    .orElse("Categoria " + item.categoriaId());

            detalhamento.add(new CalculoInflacaoResponseDTO.DetalhamentoCategoriaDTO(
                    item.categoriaId(),
                    nomeCategoria,
                    item.valorGasto(),
                    pesoPercentual.setScale(2, RoundingMode.HALF_UP),
                    inflacaoAcumuladaCategoria.setScale(2, RoundingMode.HALF_UP)
            ));
        }

        // 4. Calcula também o IPCA Geral do período para efeito de comparação (Categoria ID "7169" = Índice geral)
        BigDecimal ipcaGeralAcumulado = calcularIpcaAcumuladoCategoria("7169", historicos);

        return new CalculoInflacaoResponseDTO(
                inflacaoPessoalPonderadaSum.setScale(2, RoundingMode.HALF_UP),
                ipcaGeralAcumulado,
                menorDataEncontrada,
                maiorDataEncontrada,
                aviso,
                detalhamento
        );
    }

    private BigDecimal calcularIpcaAcumuladoCategoria(String categoriaId, List<HistoricoCategoriaIpcaEntity> historicos) {
        double fator = 1.0;
        List<HistoricoCategoriaIpcaEntity> filtrados = historicos.stream()
                .filter(h -> h.getCategoria().getId().equals(categoriaId))
                .toList();

        for (HistoricoCategoriaIpcaEntity h : filtrados) {
            fator *= (1.0 + (h.getValorPercentual().doubleValue() / 100.0));
        }
        return BigDecimal.valueOf((fator - 1.0) * 100.0).setScale(2, RoundingMode.HALF_UP);
    }

    public List<CategoriaIpcaEntity> listarCategorias() {
        return categoriaRepository.findAll();
    }
}