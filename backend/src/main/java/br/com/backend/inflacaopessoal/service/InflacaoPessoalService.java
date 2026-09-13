package br.com.backend.inflacaopessoal.service;

import br.com.backend.inflacaopessoal.client.IbgeClient;
import br.com.backend.inflacaopessoal.dto.CalculoInflacaoRequestDTO;
import br.com.backend.inflacaopessoal.dto.CalculoInflacaoResponseDTO;
import br.com.backend.inflacaopessoal.dto.CategoriaDTO;
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
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
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
        return sincronizarPeriodo("-1");
    }

    @Transactional
    public String sincronizarPeriodo(String periodo) {
        List<IbgeGrupoDTO> grupos = ibgeClient.buscarGruposIpcaPorPeriodo(periodo);

        if (grupos.isEmpty()) {
            return "Nenhum dado retornado da API do IBGE para o período informado.";
        }

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
            if (!categoriasExistentes.contains(dto.id())) {
                CategoriaIpcaEntity novaCategoria = new CategoriaIpcaEntity(dto.id(), dto.nome());
                novasCategoriasEntities.add(novaCategoria);
                categoriasExistentes.add(dto.id());
            }

            LocalDate dataReferencia = LocalDate.parse(dto.periodo() + "01", formatter);
            String chaveHistorico = dto.id() + "_" + dataReferencia;

            if (!historicosExistentes.contains(chaveHistorico)) {
                try {
                    BigDecimal valor = new BigDecimal(dto.valor().replace(",", "."));
                    
                    CategoriaIpcaEntity categoriaRef = new CategoriaIpcaEntity();
                    categoriaRef.setId(dto.id());

                    novosHistoricosEntities.add(new HistoricoCategoriaIpcaEntity(categoriaRef, dataReferencia, valor));
                    historicosExistentes.add(chaveHistorico);
                } catch (NumberFormatException e) {
                    // Trata valores não numéricos ("...")
                }
            }
        }

        if (!novasCategoriasEntities.isEmpty()) {
            categoriaRepository.saveAll(novasCategoriasEntities);
        }

        if (!novosHistoricosEntities.isEmpty()) {
            historicoRepository.saveAll(novosHistoricosEntities);
        }

        return String.format("Sincronização concluída! %d novas categorias e %d taxas mensais persistidas.", 
                novasCategoriasEntities.size(), novosHistoricosEntities.size());
    }

    @Transactional
    public CalculoInflacaoResponseDTO calcularInflacaoPessoal(CalculoInflacaoRequestDTO request) {
        LocalDate inicio = request.dataInicio().withDayOfMonth(1);
        LocalDate fim = request.dataFim().withDayOfMonth(1);

        // 1. Verifica no banco se o período completo está disponível. Se faltar mês, sincroniza na hora.
        garantirSincronizacaoDoPeriodo(inicio, fim);

        // 2. Busca histórico do período
        List<HistoricoCategoriaIpcaEntity> historicos = historicoRepository.findByDataReferenciaBetween(inicio, fim);

        if (historicos.isEmpty()) {
            throw new IllegalArgumentException("Não há dados de IPCA disponíveis para o período solicitado, mesmo após sincronização.");
        }

        LocalDate menorDataEncontrada = historicos.stream().map(HistoricoCategoriaIpcaEntity::getDataReferencia).min(LocalDate::compareTo).orElse(inicio);
        LocalDate maiorDataEncontrada = historicos.stream().map(HistoricoCategoriaIpcaEntity::getDataReferencia).max(LocalDate::compareTo).orElse(fim);

        String aviso = null;
        if (maiorDataEncontrada.isBefore(fim)) {
            DateTimeFormatter fmtAnos = DateTimeFormatter.ofPattern("MM/yyyy");
            aviso = String.format("O IPCA para datas após %s ainda não foi publicado pelo IBGE. O cálculo considerou o intervalo publicado de %s a %s.",
                    maiorDataEncontrada.format(fmtAnos), menorDataEncontrada.format(fmtAnos), maiorDataEncontrada.format(fmtAnos));
        }

        // 3. Total gasto
        BigDecimal gastoTotalInicial = request.itensGasto().stream()
                .map(CalculoInflacaoRequestDTO.ItemGastoDTO::valorGasto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (gastoTotalInicial.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("O valor total de gastos deve ser maior que zero.");
        }

        List<CalculoInflacaoResponseDTO.DetalhamentoCategoriaDTO> detalhamento = new ArrayList<>();
        BigDecimal inflacaoPessoalPonderadaSum = BigDecimal.ZERO;
        BigDecimal gastoTotalRecompostoSum = BigDecimal.ZERO;

        // 4. Cálculo por categoria
        for (CalculoInflacaoRequestDTO.ItemGastoDTO item : request.itensGasto()) {
            List<HistoricoCategoriaIpcaEntity> historicosCategoria = historicos.stream()
                    .filter(h -> h.getCategoria().getId().equals(item.categoriaId()))
                    .toList();

            double fatorAcumulado = 1.0;
            for (HistoricoCategoriaIpcaEntity h : historicosCategoria) {
                double taxaDecimal = h.getValorPercentual().doubleValue() / 100.0;
                fatorAcumulado *= (1.0 + taxaDecimal);
            }

            BigDecimal inflacaoAcumuladaCategoria = BigDecimal.valueOf((fatorAcumulado - 1.0) * 100.0)
                    .setScale(4, RoundingMode.HALF_UP);

            BigDecimal pesoPercentual = item.valorGasto()
                    .divide(gastoTotalInicial, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));

            BigDecimal contribuicaoInflacao = inflacaoAcumuladaCategoria
                    .multiply(item.valorGasto().divide(gastoTotalInicial, 6, RoundingMode.HALF_UP));
            
            inflacaoPessoalPonderadaSum = inflacaoPessoalPonderadaSum.add(contribuicaoInflacao);

            // Recomposição do valor gasto dessa categoria específica
            BigDecimal valorRecompostoCategoria = item.valorGasto()
                    .multiply(BigDecimal.valueOf(fatorAcumulado))
                    .setScale(2, RoundingMode.HALF_UP);

            BigDecimal impactoFinanceiroCategoria = valorRecompostoCategoria.subtract(item.valorGasto());
            gastoTotalRecompostoSum = gastoTotalRecompostoSum.add(valorRecompostoCategoria);

            String nomeCategoria = historicosCategoria.stream()
                    .map(h -> h.getCategoria().getNome())
                    .findFirst()
                    .orElse("Categoria " + item.categoriaId());

            detalhamento.add(new CalculoInflacaoResponseDTO.DetalhamentoCategoriaDTO(
                    item.categoriaId(),
                    nomeCategoria,
                    item.valorGasto(),
                    valorRecompostoCategoria,
                    impactoFinanceiroCategoria,
                    pesoPercentual.setScale(2, RoundingMode.HALF_UP),
                    inflacaoAcumuladaCategoria.setScale(2, RoundingMode.HALF_UP)
            ));
        }

        // 5. Métricas Gerais
        BigDecimal ipcaGeralAcumulado = calcularIpcaAcumuladoCategoria("7169", historicos);
        BigDecimal inflacaoPessoalFinal = inflacaoPessoalPonderadaSum.setScale(2, RoundingMode.HALF_UP);
        BigDecimal diferencaIpca = inflacaoPessoalFinal.subtract(ipcaGeralAcumulado);
        BigDecimal perdaPoderCompraReais = gastoTotalRecompostoSum.subtract(gastoTotalInicial);

        return new CalculoInflacaoResponseDTO(
                inflacaoPessoalFinal,
                ipcaGeralAcumulado,
                diferencaIpca,
                gastoTotalInicial.setScale(2, RoundingMode.HALF_UP),
                gastoTotalRecompostoSum.setScale(2, RoundingMode.HALF_UP),
                perdaPoderCompraReais.setScale(2, RoundingMode.HALF_UP),
                menorDataEncontrada,
                maiorDataEncontrada,
                aviso,
                detalhamento
        );
    }

    private void garantirSincronizacaoDoPeriodo(LocalDate inicio, LocalDate fim) {
        // Conta quantos meses deveriam existir no intervalo
        long mesesEsperados = ChronoUnit.MONTHS.between(inicio, fim) + 1;
        
        // Categoria 7169 (Índice Geral) como referência
        List<HistoricoCategoriaIpcaEntity> historicos7169 = historicoRepository.findByDataReferenciaBetween(inicio, fim)
                .stream()
                .filter(h -> h.getCategoria().getId().equals("7169"))
                .toList();

        // Se o número de meses no banco for menor do que o esperado para o intervalo, força a sincronização
        if (historicos7169.size() < mesesEsperados) {
            DateTimeFormatter fmtIbge = DateTimeFormatter.ofPattern("yyyyMM");
            String periodoParam = inicio.format(fmtIbge) + "-" + fim.format(fmtIbge);
            sincronizarPeriodo(periodoParam);
        }
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

    public List<CategoriaDTO> listarCategorias() {
        return categoriaRepository.findAll().stream()
                .map(c -> new CategoriaDTO(c.getId(), c.getNome()))
                .toList();
    }
}