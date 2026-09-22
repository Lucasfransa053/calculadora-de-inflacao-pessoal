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
import java.util.Comparator;
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

    public String sincronizarUltimoMesIbge() {
        return sincronizarPeriodo("-1");
    }

    // Removido o @Transactional geral do método para evitar prender a conexão do banco
    // durante as chamadas de rede da API do IBGE
    public String sincronizarPeriodo(String periodo) {
        int totalNovasCategorias = 0;
        int totalNovosHistoricos = 0;

        if ("-1".equals(periodo)) {
            List<IbgeGrupoDTO> grupos = ibgeClient.buscarGruposIpcaPorAgregadoEPeriodo("7060", "-1");
            int[] resultado = salvarDadosSincronizados(grupos);
            totalNovasCategorias += resultado[0];
            totalNovosHistoricos += resultado[1];
        } else if (periodo.contains("-")) {
            String[] partes = periodo.split("-");
            int anoInicio = Integer.parseInt(partes[0].substring(0, 4));
            int mesInicio = Integer.parseInt(partes[0].substring(4, 6));
            int anoFim = Integer.parseInt(partes[1].substring(0, 4));
            int mesFim = Integer.parseInt(partes[1].substring(4, 6));

            for (int ano = anoInicio; ano <= anoFim; ano++) {
                String mStart = (ano == anoInicio) ? String.format("%02d", mesInicio) : "01";
                String mEnd = (ano == anoFim) ? String.format("%02d", mesFim) : "12";
                
                String subPeriodo = String.format("%d%s-%d%s", ano, mStart, ano, mEnd);
                String agregado = (ano <= 2019) ? "1419" : "7060";

                List<IbgeGrupoDTO> gruposAno = ibgeClient.buscarGruposIpcaPorAgregadoEPeriodo(agregado, subPeriodo);
                int[] resultado = salvarDadosSincronizados(gruposAno);
                totalNovasCategorias += resultado[0];
                totalNovosHistoricos += resultado[1];
            }
        } else {
            int ano = Integer.parseInt(periodo.substring(0, 4));
            String agregado = (ano <= 2019) ? "1419" : "7060";
            List<IbgeGrupoDTO> grupos = ibgeClient.buscarGruposIpcaPorAgregadoEPeriodo(agregado, periodo);
            int[] resultado = salvarDadosSincronizados(grupos);
            totalNovasCategorias += resultado[0];
            totalNovosHistoricos += resultado[1];
        }

        return String.format("Sincronização concluída! %d novas categorias e %d taxas mensais persistidas.", 
                totalNovasCategorias, totalNovosHistoricos);
    }

    // A transação agora é isolada apenas no momento da gravação dos dados no banco
    @Transactional
    public int[] salvarDadosSincronizados(List<IbgeGrupoDTO> grupos) {
        if (grupos == null || grupos.isEmpty()) {
            return new int[]{0, 0};
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
                    // Ignora valores não numéricos retornados pelo IBGE (ex: "...", "-")
                }
            }
        }

        if (!novasCategoriasEntities.isEmpty()) {
            categoriaRepository.saveAll(novasCategoriasEntities);
        }

        if (!novosHistoricosEntities.isEmpty()) {
            historicoRepository.saveAll(novosHistoricosEntities);
        }

        return new int[]{novasCategoriasEntities.size(), novosHistoricosEntities.size()};
    }

    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public CalculoInflacaoResponseDTO calcularInflacaoPessoal(CalculoInflacaoRequestDTO request) {
        LocalDate inicio = request.dataInicio().withDayOfMonth(1);
        LocalDate fim = request.dataFim().withDayOfMonth(1);

        garantirSincronizacaoDoPeriodo(inicio, fim);

        List<HistoricoCategoriaIpcaEntity> historicos = historicoRepository.findByDataReferenciaBetween(inicio, fim);

        if (historicos.isEmpty()) {
            throw new IllegalArgumentException("Não há dados de IPCA disponíveis para o período solicitado.");
        }

        LocalDate menorDataEncontrada = historicos.stream().map(HistoricoCategoriaIpcaEntity::getDataReferencia).min(LocalDate::compareTo).orElse(inicio);
        LocalDate maiorDataEncontrada = historicos.stream().map(HistoricoCategoriaIpcaEntity::getDataReferencia).max(LocalDate::compareTo).orElse(fim);

        DateTimeFormatter fmtData = DateTimeFormatter.ofPattern("MM/yyyy");

        LocalDate dataFimEfetiva = maiorDataEncontrada.isBefore(fim) ? maiorDataEncontrada : fim;
        long mesesEsperados = ChronoUnit.MONTHS.between(inicio, dataFimEfetiva) + 1;

        // 1. FILTRAGEM: Coleta itens válidos e guarda apenas os NOMES dos itens sem histórico completo
        List<CalculoInflacaoRequestDTO.ItemGastoDTO> itensValidos = new ArrayList<>();
        List<String> nomesItensIgnorados = new ArrayList<>();

        for (CalculoInflacaoRequestDTO.ItemGastoDTO item : request.itensGasto()) {
            List<HistoricoCategoriaIpcaEntity> historicosCategoria = historicos.stream()
                    .filter(h -> h.getCategoria().getId().equals(item.categoriaId()))
                    .sorted(Comparator.comparing(HistoricoCategoriaIpcaEntity::getDataReferencia))
                    .toList();

            if (historicosCategoria.size() < mesesEsperados) {
                String nomeBruto = historicosCategoria.isEmpty()
                        ? categoriaRepository.findById(item.categoriaId()).map(CategoriaIpcaEntity::getNome).orElse("ID " + item.categoriaId())
                        : historicosCategoria.get(0).getCategoria().getNome();

                // Limpa o prefixo numérico (ex: "7101009.Cabeleireiro" -> "Cabeleireiro")
                String nomeLimpo = nomeBruto.replaceFirst("^[0-9]+\\.\\s*", "");
                nomesItensIgnorados.add(nomeLimpo);
            } else {
                itensValidos.add(item);
            }
        }

        if (itensValidos.isEmpty()) {
            throw new IllegalArgumentException("Nenhum dos itens selecionados possui dados válidos de IPCA para o período informado.");
        }

        BigDecimal gastoTotalInicial = itensValidos.stream()
                .map(CalculoInflacaoRequestDTO.ItemGastoDTO::valorGasto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (gastoTotalInicial.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("O valor total de gastos dos itens válidos deve ser maior que zero.");
        }

        List<CalculoInflacaoResponseDTO.DetalhamentoCategoriaDTO> detalhamento = new ArrayList<>();
        BigDecimal inflacaoPessoalPonderadaSum = BigDecimal.ZERO;
        BigDecimal gastoTotalRecompostoSum = BigDecimal.ZERO;

        for (CalculoInflacaoRequestDTO.ItemGastoDTO item : itensValidos) {
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

        BigDecimal ipcaGeralAcumulado = calcularIpcaAcumuladoCategoria("7169", historicos);
        BigDecimal inflacaoPessoalFinal = inflacaoPessoalPonderadaSum.setScale(2, RoundingMode.HALF_UP);
        BigDecimal diferencaIpca = inflacaoPessoalFinal.subtract(ipcaGeralAcumulado);
        BigDecimal perdaPoderCompraReais = gastoTotalRecompostoSum.subtract(gastoTotalInicial);

        // 2. MONTAGEM AGRUPADA DA MENSAGEM DE AVISO
        List<String> frasesAviso = new ArrayList<>();

        if (!nomesItensIgnorados.isEmpty()) {
            String itensFormatados = String.join(", ", nomesItensIgnorados);
            frasesAviso.add(String.format("Os seguintes itens foram desconsiderados por falta de dados no período: %s.", itensFormatados));
        }

        if (maiorDataEncontrada.isBefore(fim)) {
            frasesAviso.add(String.format("O IPCA para datas após %s ainda não foi publicado pelo IBGE.", maiorDataEncontrada.format(fmtData)));
        }

        String mensagemAvisoFinal = frasesAviso.isEmpty() ? null : String.join(" ", frasesAviso);

        return new CalculoInflacaoResponseDTO(
                inflacaoPessoalFinal,
                ipcaGeralAcumulado,
                diferencaIpca,
                gastoTotalInicial.setScale(2, RoundingMode.HALF_UP),
                gastoTotalRecompostoSum.setScale(2, RoundingMode.HALF_UP),
                perdaPoderCompraReais.setScale(2, RoundingMode.HALF_UP),
                menorDataEncontrada,
                maiorDataEncontrada,
                mensagemAvisoFinal,
                detalhamento
        );
    }

    public List<CategoriaDTO> listarCategoriasValidasParaPeriodo(LocalDate inicio, LocalDate fim) {
        garantirSincronizacaoDoPeriodo(inicio, fim);

        long mesesEsperados = ChronoUnit.MONTHS.between(inicio, fim) + 1;

        return historicoRepository.findCategoriasValidasNoPeriodo(inicio, fim, mesesEsperados)
                .stream()
                .map(c -> new CategoriaDTO(c.getId(), c.getNome()))
                .toList();
    }

    private void garantirSincronizacaoDoPeriodo(LocalDate inicio, LocalDate fim) {
        long mesesEsperados = ChronoUnit.MONTHS.between(inicio, fim) + 1;
        
        List<HistoricoCategoriaIpcaEntity> historicos7169 = historicoRepository.findByDataReferenciaBetween(inicio, fim)
                .stream()
                .filter(h -> h.getCategoria().getId().equals("7169"))
                .toList();

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