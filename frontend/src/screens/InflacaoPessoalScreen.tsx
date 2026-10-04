import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, useTheme } from '../theme';
import { PageHeader } from '../components/PageHeader';
import { useIsDesktop } from '../hooks/useLayout';
import {
  buscarCategoriasIpca,
  calcularInflacaoPessoal,
  buscarHistoricoCalculos,
  CategoriaIpca,
  CalculoInflacaoResponseDTO,
  HistoricoCalculoDTO,
} from '../services/api';

interface GrupoUI {
  id: string;
  nome: string;
  icone: string;
  match: (nomeLimpo: string, id: string) => boolean;
}

const removerAcentos = (texto: string) => {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};

const formatarNomeCategoria = (nome: string) => {
  return nome.replace(/^[0-9]+\.\s*/, '');
};

const GRUPOS_PRINCIPAIS: GrupoUI[] = [
  {
    id: '1',
    nome: 'Alimentação e Bebidas',
    icone: '🍔',
    match: (n) =>
      (n.includes('alimentac') || n.includes('arroz') || n.includes('feijao') || n.includes('carne') ||
       n.includes('picanha') || n.includes('leite') || n.includes('biscoito') || n.includes('fruta') ||
       n.includes('maca') || n.includes('banana') || n.includes('morango') || n.includes('peixe') ||
       n.includes('acucar') || n.includes('refrigerante') || n.includes('suco') || n.includes('macarrao') ||
       n.includes('pao') || n.includes('cerveja') || n.includes('queijo') || n.includes('oleo') || n.includes('cafe')) &&
      !n.includes('combustivel'),
  },
  {
    id: '2',
    nome: 'Habitação & Limpeza',
    icone: '🏠',
    match: (n) =>
      (n.includes('habitac') || n.includes('aluguel') || n.includes('energia eletrica') ||
       n.includes('taxa de agua') || n.includes('gas encanado') || n.includes('gas de botijao') ||
       n.includes('detergente') || n.includes('limpeza') || n.includes('sabao') || n.includes('condominio')) &&
      !n.includes('gasolina'),
  },
  {
    id: '3',
    nome: 'Artigos de Residência',
    icone: '🛋',
    match: (n) =>
      n.includes('residencia') || n.includes('eletrodomestico') || n.includes('movel') ||
      n.includes('tv') || n.includes('cama') || n.includes('utensilio') || n.includes('colchao') || n.includes('geladeira'),
  },
  {
    id: '4',
    nome: 'Vestuário',
    icone: '👕',
    match: (n) =>
      n.includes('vestuario') || n.includes('roupa') || n.includes('calca') || n.includes('camisa') ||
      n.includes('sapato') || n.includes('tenis') || n.includes('calcado') || n.includes('saia') || n.includes('cinto'),
  },
  {
    id: '5',
    nome: 'Transportes',
    icone: '🚗',
    match: (n) =>
      n.includes('transporte') || n.includes('gasolina') || n.includes('etanol') || n.includes('combustivel') ||
      n.includes('passagem') || n.includes('onibus') || n.includes('metro') || n.includes('uber') ||
      n.includes('veiculo') || n.includes('pneu') || n.includes('estacionamento') || n.includes('pedagio'),
  },
  {
    id: '6',
    nome: 'Saúde & Cuidados',
    icone: '🏥',
    match: (n) =>
      n.includes('saude') || n.includes('remedio') || n.includes('medicamento') || n.includes('medico') ||
      n.includes('plano de saude') || n.includes('hospital') || n.includes('farmacia') || n.includes('higiene') ||
      n.includes('perfume') || n.includes('shampoo') || n.includes('dentista') || n.includes('oculos'),
  },
  {
    id: '7',
    nome: 'Despesas Pessoais',
    icone: '🪒',
    match: (n) =>
      n.includes('despesas pessoais') || n.includes('barbeiro') || n.includes('cabeleireiro') ||
      n.includes('recreacao') || n.includes('cinema') || n.includes('viagem') || n.includes('hotel') ||
      n.includes('cigarro') || n.includes('pet') || n.includes('veterinario'),
  },
  {
    id: '8',
    nome: 'Educação',
    icone: '🎓',
    match: (n) =>
      n.includes('educac') || n.includes('escola') || n.includes('faculdade') || n.includes('curso') ||
      n.includes('mensalidade') || n.includes('livro') || n.includes('material escolar') || n.includes('idiomas'),
  },
  {
    id: '9',
    nome: 'Comunicação',
    icone: '📱',
    match: (n) =>
      n.includes('comunicac') || n.includes('internet') || n.includes('telefone') || n.includes('celular') ||
      n.includes('tv por assinatura') || n.includes('streaming') || n.includes('correio'),
  },
];

export default function InflacaoPessoalScreen() {
  const { colors } = useTheme();
  const desktop = useIsDesktop();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [categorias, setCategorias] = useState<CategoriaIpca[]>([]);
  const [cestaGasto, setCestaGasto] = useState<{ categoriaId: string; nome: string; valor: string }[]>([]);

  const [grupoAtivoModal, setGrupoAtivoModal] = useState<GrupoUI | null>(null);
  const [buscaCategoria, setBuscaCategoria] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<CategoriaIpca | null>(null);
  const [valorInput, setValorInput] = useState('');

  const [mesInicio, setMesInicio] = useState('01');
  const [anoInicio, setAnoInicio] = useState('2025');
  const [mesFim, setMesFim] = useState('07');
  const [anoFim, setAnoFim] = useState('2026');

  const [loading, setLoading] = useState(true);
  const [calculando, setCalculando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<CalculoInflacaoResponseDTO | null>(null);

  // Estados do Histórico
  const [historico, setHistorico] = useState<HistoricoCalculoDTO[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  useEffect(() => {
    carregarCategoriasEHistorico();
  }, []);

  const carregarCategoriasEHistorico = async () => {
    setLoading(true);
    setErro(null);
    try {
      const [listaCats, historicoRes] = await Promise.allSettled([
        buscarCategoriasIpca(),
        buscarHistoricoCalculos(),
      ]);

      if (listaCats.status === 'fulfilled' && listaCats.value?.length > 0) {
        setCategorias(listaCats.value.filter((c) => c.id !== '7169'));
      }

      if (historicoRes.status === 'fulfilled' && Array.isArray(historicoRes.value)) {
        setHistorico(historicoRes.value);
      }
    } catch (e: any) {
      console.warn('Erro ao buscar dados do backend:', e);
    } finally {
      setLoading(false);
    }
  };

  const carregarHistorico = async () => {
    setCarregandoHistorico(true);
    try {
      const dados = await buscarHistoricoCalculos();
      if (Array.isArray(dados)) {
        setHistorico(dados);
      }
    } catch (e) {
      console.warn('Erro ao carregar histórico:', e);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const totalCesta = useMemo(() => {
    return cestaGasto.reduce((acc, item) => {
      const val = parseFloat(item.valor.replace(',', '.')) || 0;
      return acc + val;
    }, 0);
  }, [cestaGasto]);

  const categoriasDoGrupoFiltradas = useMemo(() => {
    if (!grupoAtivoModal) return [];
    const termoBusca = removerAcentos(buscaCategoria);

    return categorias.filter((cat) => {
      const nomeLimpo = removerAcentos(formatarNomeCategoria(cat.nome));
      const pertenceAoGrupo = grupoAtivoModal.match(nomeLimpo, cat.id);
      const bateuBusca = !termoBusca || nomeLimpo.includes(termoBusca);
      return pertenceAoGrupo && bateuBusca;
    });
  }, [buscaCategoria, grupoAtivoModal, categorias]);

  const handleAdicionarItemCesta = () => {
    setErro(null);
    if (!categoriaSelecionada) return;

    const valorNumerico = parseFloat(valorInput.replace(',', '.'));
    if (!valorInput || isNaN(valorNumerico) || valorNumerico <= 0) {
      setErro('Informe um valor de gasto válido.');
      return;
    }

    if (cestaGasto.some((item) => item.categoriaId === categoriaSelecionada.id)) {
      setErro('Item já adicionado na sua cesta.');
      return;
    }

    setCestaGasto([
      ...cestaGasto,
      {
        categoriaId: categoriaSelecionada.id,
        nome: formatarNomeCategoria(categoriaSelecionada.nome),
        valor: valorInput,
      },
    ]);

    setCategoriaSelecionada(null);
    setValorInput('');
  };

  const handleRemoverItemCesta = (id: string) => {
    setCestaGasto(cestaGasto.filter((item) => item.categoriaId !== id));
  };

  const handleCalcular = async () => {
    setErro(null);
    setResultado(null);

    if (cestaGasto.length === 0) {
      setErro('Adicione pelo menos um item à sua cesta de consumo.');
      return;
    }

    setCalculando(true);

    try {
      const dataInicioFormatted = `${anoInicio}-${mesInicio.padStart(2, '0')}-01`;
      const dataFimFormatted = `${anoFim}-${mesFim.padStart(2, '0')}-01`;

      const itensGasto = cestaGasto.map((item) => ({
        categoriaId: item.categoriaId,
        valorGasto: parseFloat(item.valor.replace(',', '.')) || 0,
      }));

      const res = await calcularInflacaoPessoal({
        dataInicio: dataInicioFormatted,
        dataFim: dataFimFormatted,
        itensGasto,
      });

      setResultado(res);
      carregarHistorico();
    } catch (e: any) {
      setErro(e.message || 'Erro ao calcular inflação pessoal.');
    } finally {
      setCalculando(false);
    }
  };

  const handleRestaurarConsulta = (itemHistorico: HistoricoCalculoDTO) => {
    if (itemHistorico.dataInicio) {
      const partes = itemHistorico.dataInicio.split('-');
      if (partes.length >= 2) {
        setAnoInicio(partes[0]);
        setMesInicio(partes[1]);
      }
    }

    if (itemHistorico.dataFim) {
      const partes = itemHistorico.dataFim.split('-');
      if (partes.length >= 2) {
        setAnoFim(partes[0]);
        setMesFim(partes[1]);
      }
    }

    if (itemHistorico.itens && itemHistorico.itens.length > 0) {
      const novaCesta = itemHistorico.itens.map((i) => {
        const catEncontrada = categorias.find((c) => c.id === i.categoriaId);
        const nomeFinal = i.nomeCategoria
          ? formatarNomeCategoria(i.nomeCategoria)
          : catEncontrada
          ? formatarNomeCategoria(catEncontrada.nome)
          : `Categoria ${i.categoriaId}`;

        return {
          categoriaId: i.categoriaId,
          nome: nomeFinal,
          valor: i.valorGasto.toString().replace('.', ','),
        };
      });
      setCestaGasto(novaCesta);
    }

    setResultado(null);
    setErro(null);
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const montagem = (
    <View style={[styles.card, desktop && styles.cardMontagem]}>
      <View style={styles.periodoContainer}>
        <Text style={styles.labelPeriodo}>Período de Análise</Text>
        <View style={styles.datasRow}>
          <View style={styles.dataInputGroup}>
            <TextInput
              style={styles.inputData}
              value={mesInicio}
              onChangeText={setMesInicio}
              keyboardType="numeric"
              maxLength={2}
            />
            <Text style={styles.barraData}>/</Text>
            <TextInput
              style={styles.inputDataAno}
              value={anoInicio}
              onChangeText={setAnoInicio}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>
          <Text style={styles.ateTexto}>até</Text>
          <View style={styles.dataInputGroup}>
            <TextInput
              style={styles.inputData}
              value={mesFim}
              onChangeText={setMesFim}
              keyboardType="numeric"
              maxLength={2}
            />
            <Text style={styles.barraData}>/</Text>
            <TextInput
              style={styles.inputDataAno}
              value={anoFim}
              onChangeText={setAnoFim}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>
        </View>
      </View>

      <View style={styles.divisor} />

      <Text style={styles.cardTitulo}>1. Escolha um Grupo de Gastos</Text>
      <View style={styles.gridGrupos}>
        {GRUPOS_PRINCIPAIS.map((grupo) => (
          <TouchableOpacity
            key={grupo.id}
            style={styles.botaoGrupoGrid}
            activeOpacity={0.8}
            onPress={() => {
              setGrupoAtivoModal(grupo);
              setBuscaCategoria('');
            }}
          >
            <Text style={styles.iconeGrupoGrid}>{grupo.icone}</Text>
            <Text style={styles.nomeGrupoGrid} numberOfLines={2}>
              {grupo.nome}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {categoriaSelecionada && (
        <View style={styles.boxInsercaoValor}>
          <Text style={styles.itemSelecionadoLabel}>Item Escolhido:</Text>
          <Text style={styles.itemSelecionadoNome}>
            {formatarNomeCategoria(categoriaSelecionada.nome)}
          </Text>

          <View style={styles.rowAdicionarValor}>
            <View style={styles.inputGastoWrapper}>
              <Text style={styles.prefixoMoeda}>R$</Text>
              <TextInput
                style={styles.inputGasto}
                keyboardType="numeric"
                placeholder="0,00"
                placeholderTextColor={colors.textMuted}
                value={valorInput}
                onChangeText={setValorInput}
                autoFocus
              />
            </View>
            <TouchableOpacity style={styles.btnAdicionar} onPress={handleAdicionarItemCesta}>
              <Text style={styles.btnAdicionarTexto}>+ Confirmar Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const cesta = (
    <View style={styles.card}>
      <View style={styles.headerCestaRow}>
        <Text style={[styles.cardTitulo, styles.semMargemInferior]}>2. Sua Cesta de Consumo</Text>
        <View style={styles.badgeTotalCesta}>
          <Text style={styles.badgeTotalLabel}>Total na Cesta:</Text>
          <Text style={styles.badgeTotalValor}>R$ {fmt(totalCesta)}</Text>
        </View>
      </View>

      {cestaGasto.length === 0 ? (
        <Text style={styles.cestaVaziaTexto}>
          Nenhum item adicionado ainda. Escolha um grupo acima.
        </Text>
      ) : (
        <View style={styles.listaCesta}>
          {cestaGasto.map((item) => (
            <View key={item.categoriaId} style={styles.cestaItem}>
              <Text style={styles.cestaItemNome}>📦 {item.nome}</Text>
              <Text style={styles.cestaItemValor}>
                R$ {fmt(parseFloat(item.valor.replace(',', '.')))}
              </Text>
              <TouchableOpacity
                style={styles.btnRemover}
                onPress={() => handleRemoverItemCesta(item.categoriaId)}
              >
                <Text style={styles.btnRemoverTexto}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {erro && <Text style={styles.textoErro}>{erro}</Text>}

      <TouchableOpacity
        style={[styles.botaoAcao, cestaGasto.length === 0 && { opacity: 0.5 }]}
        onPress={handleCalcular}
        disabled={calculando || cestaGasto.length === 0}
      >
        {calculando ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.botaoTextoAcao}>Calcular Inflação Pessoal</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // Bloco 3: resultado
  const blocoResultado = resultado ? (
    <View style={styles.cardResultado}>
      <Text style={styles.cardTituloResultado}>Resultado da Sua Inflação</Text>

      {resultado.mensagemAviso && (
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTextPrefix}>
              {resultado.itensAvisoDesconsiderados?.textoPrefixo || 'Alguns itens foram desconsiderados:'}
            </Text>
            {resultado.itensAvisoDesconsiderados?.itens && resultado.itensAvisoDesconsiderados.itens.length > 0 && (
              <View style={styles.warningBadgesRow}>
                {resultado.itensAvisoDesconsiderados.itens.map((item: string, idx: number) => (
                  <View key={idx} style={styles.warningBadgeItem}>
                    <Text style={styles.warningBadgeText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.metricasGrid}>
        <View style={styles.metricaBox}>
          <Text style={styles.metricaLabel}>Sua Inflação</Text>
          <Text style={[styles.metricaValor, { color: colors.accent }]}>
            {resultado.inflacaoPessoalPercentual.toFixed(2)}%
          </Text>
        </View>
        <View style={styles.metricaBox}>
          <Text style={styles.metricaLabel}>IPCA Oficial</Text>
          <Text style={[styles.metricaValor, { color: colors.textSecondary }]}>
            {resultado.inflacaoOficialIpcaPercentual.toFixed(2)}%
          </Text>
        </View>
        <View style={styles.metricaBox}>
          <Text style={styles.metricaLabel}>Diferença</Text>
          <Text
            style={[
              styles.metricaValor,
              { color: resultado.diferencaParaIpcaOficialPercentual > 0 ? colors.danger : colors.success },
            ]}
          >
            {resultado.diferencaParaIpcaOficialPercentual > 0 ? '+' : ''}
            {resultado.diferencaParaIpcaOficialPercentual.toFixed(2)}%
          </Text>
        </View>
      </View>

      <View style={styles.divisorResumo} />

      <View style={styles.linhaResumo}>
        <Text style={styles.textoResumoLabel}>Custo Inicial Total:</Text>
        <Text style={styles.textoResumoValor}>
          R$ {resultado.custoTotalInicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </Text>
      </View>
      <View style={styles.linhaResumo}>
        <Text style={styles.textoResumoLabel}>Custo Recomposto:</Text>
        <Text style={styles.textoResumoValorDestaque}>
          R$ {resultado.custoTotalRecomposto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </Text>
      </View>
      <View style={styles.linhaResumo}>
        <Text style={styles.textoResumoLabel}>Aumento Real de Custo:</Text>
        <Text style={[styles.textoResumoValorDestaque, { color: colors.danger }]}>
          + R$ {resultado.perdaPoderCompraReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </Text>
      </View>

      {resultado.detalhamento && resultado.detalhamento.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.subtituloDetalhamento}>Detalhamento da Cesta:</Text>
          {resultado.detalhamento.map((item) => (
            <Pressable
              key={item.categoriaId}
              style={(state) => [
                styles.linhaDetalhamento,
                (state as { hovered?: boolean }).hovered && styles.linhaDetalhamentoHover,
              ]}
            >
              <Text style={styles.nomeDetalhamento} numberOfLines={1}>
                📦 {formatarNomeCategoria(item.nomeCategoria)}
              </Text>
              <Text style={styles.valorDetalhamento}>
                {item.inflacaoAcumuladaCategoriaPercentual.toFixed(2)}%
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  ) : null;

  const blocoHistorico = (
    <View style={styles.card}>
      <View style={styles.headerCestaRow}>
        <Text style={[styles.cardTitulo, styles.semMargemInferior]}>📜 Consultas Anteriores</Text>
        {carregandoHistorico && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      {historico.length === 0 ? (
        <Text style={styles.cestaVaziaTexto}>Nenhuma consulta salva anteriormente.</Text>
      ) : (
        <View style={styles.listaCesta}>
          {historico.map((item) => (
            <TouchableOpacity
              key={item.id.toString()}
              style={styles.historicoCardItem}
              activeOpacity={0.7}
              onPress={() => handleRestaurarConsulta(item)}
            >
              <View style={styles.historicoInfoLeft}>
                <Text style={styles.historicoPeriodoText}>
                  📅 {item.dataInicio} até {item.dataFim}
                </Text>
                <Text style={styles.historicoDetalhesText}>
                  {item.itens?.length || 0} itens na cesta
                </Text>
              </View>

              <View style={styles.historicoBadgeResultado}>
                <Text style={styles.historicoBadgeText}>
                  {item.inflacaoPessoalPercentual?.toFixed(2) ?? '0.00'}%
                </Text>
              </View>
              <Text style={styles.historicoSetaText}>➡️</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.container, desktop && styles.containerDesktop]}>
        <PageHeader
          titulo="Minha Inflação Pessoal"
          subtitulo="Monte sua cesta de consumo navegando pelos grupos abaixo e acompanhe o total acumulado."
        />

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
        ) : desktop ? (
          <View style={styles.colunas}>
            {montagem}
            <View style={styles.colunaDireita}>
              {cesta}
              {blocoResultado}
              {blocoHistorico}
            </View>
          </View>
        ) : (
          <View style={styles.pilha}>
            {montagem}
            {cesta}
            {blocoResultado}
            {blocoHistorico}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!grupoAtivoModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {grupoAtivoModal?.icone} {grupoAtivoModal?.nome}
            </Text>

            <TextInput
              style={styles.inputBuscaModal}
              placeholder={`Buscar em ${grupoAtivoModal?.nome}...`}
              placeholderTextColor={colors.textMuted}
              value={buscaCategoria}
              onChangeText={setBuscaCategoria}
            />

            <FlatList
              data={categoriasDoGrupoFiltradas}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setCategoriaSelecionada(item);
                    setGrupoAtivoModal(null);
                    setBuscaCategoria('');
                  }}
                >
                  <Text style={styles.modalItemText}>{formatarNomeCategoria(item.nome)}</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => {
                setGrupoAtivoModal(null);
                setBuscaCategoria('');
              }}
            >
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (c: Colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.bg, paddingTop: 10 },
    container: { padding: 20, width: '100%', maxWidth: 720, alignSelf: 'center' },
    containerDesktop: { maxWidth: 1200, paddingHorizontal: 48, paddingVertical: 40 },
    colunas: { flexDirection: 'row', alignItems: 'flex-start', gap: 24 },
    colunaDireita: { flex: 1, gap: 20 },
    pilha: { gap: 20 },

    card: {
      backgroundColor: c.surface,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardMontagem: { width: 600, padding: 28 },
    cardTitulo: { fontSize: 17, fontWeight: '800', color: c.text, marginBottom: 14 },
    semMargemInferior: { marginBottom: 0 },

    periodoContainer: { marginBottom: 4 },
    labelPeriodo: { color: c.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
    datasRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    dataInputGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surfaceAlt,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    inputData: { color: c.text, paddingVertical: 12, width: 32, textAlign: 'center', fontWeight: '700' },
    inputDataAno: { color: c.text, paddingVertical: 12, width: 52, textAlign: 'center', fontWeight: '700' },
    barraData: { color: c.textMuted },
    ateTexto: { color: c.textMuted, fontSize: 13 },
    divisor: { height: 1, backgroundColor: c.border, marginVertical: 20 },

    gridGrupos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    botaoGrupoGrid: {
      flexGrow: 1,
      flexBasis: '30%',
      backgroundColor: c.surfaceAlt,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    iconeGrupoGrid: { fontSize: 26, marginBottom: 8 },
    nomeGrupoGrid: { color: c.text, fontSize: 12, textAlign: 'center', fontWeight: '600' },

    boxInsercaoValor: {
      backgroundColor: c.primarySoft,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: c.primary,
      marginTop: 16,
    },
    itemSelecionadoLabel: { color: c.textSecondary, fontSize: 12 },
    itemSelecionadoNome: { color: c.accent, fontSize: 15, fontWeight: '800', marginTop: 2, marginBottom: 12 },
    rowAdicionarValor: { flexDirection: 'row', gap: 12 },
    inputGastoWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    prefixoMoeda: { color: c.textMuted, marginRight: 6 },
    inputGasto: { flex: 1, color: c.text, fontSize: 15, fontWeight: '700', paddingVertical: 13 },
    btnAdicionar: {
      backgroundColor: c.primary,
      paddingHorizontal: 18,
      paddingVertical: 13,
      justifyContent: 'center',
      borderRadius: 14,
    },
    btnAdicionarTexto: { color: c.onPrimary, fontSize: 14, fontWeight: '800' },

    headerCestaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    badgeTotalCesta: {
      backgroundColor: c.primarySoft,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 6,
    },
    badgeTotalLabel: { color: c.textSecondary, fontSize: 12 },
    badgeTotalValor: { color: c.accent, fontSize: 13, fontWeight: '800' },
    cestaVaziaTexto: { color: c.textMuted, fontSize: 13, fontStyle: 'italic', marginBottom: 16 },
    listaCesta: { gap: 10, marginBottom: 16 },
    cestaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surfaceAlt,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    cestaItemNome: { flex: 1, color: c.text, fontSize: 14, fontWeight: '600' },
    cestaItemValor: { color: c.text, fontSize: 14, fontWeight: '800', marginHorizontal: 12 },
    btnRemover: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.dangerSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnRemoverTexto: { color: c.danger, fontWeight: 'bold' },
    textoErro: { color: c.danger, fontSize: 13, marginBottom: 12, textAlign: 'center' },
    botaoAcao: {
      backgroundColor: c.primary,
      borderRadius: 16,
      paddingVertical: 17,
      alignItems: 'center',
    },
    botaoTextoAcao: { color: c.onPrimary, fontWeight: '800', fontSize: 16 },

    cardResultado: {
      backgroundColor: c.surface,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardTituloResultado: { fontSize: 18, fontWeight: '800', color: c.text, marginBottom: 16 },
    warningCard: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255, 193, 7, 0.1)',
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 193, 7, 0.3)',
    },
    warningIcon: { fontSize: 18, marginRight: 8 },
    warningContent: { flex: 1 },
    warningTextPrefix: { color: '#FFC107', fontSize: 12, fontWeight: '600' },
    warningBadgesRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 6 },
    warningBadgeItem: {
      backgroundColor: 'rgba(255, 193, 7, 0.2)',
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    warningBadgeText: { color: '#FFC107', fontSize: 11, fontWeight: '700' },

    metricasGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    metricaBox: {
      flex: 1,
      backgroundColor: c.surfaceAlt,
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    metricaLabel: { color: c.textSecondary, fontSize: 12, marginBottom: 4 },
    metricaValor: { fontSize: 20, fontWeight: '800' },

    divisorResumo: { height: 1, backgroundColor: c.border, marginVertical: 16 },
    linhaResumo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    textoResumoLabel: { color: c.textSecondary, fontSize: 14 },
    textoResumoValor: { color: c.text, fontSize: 15, fontWeight: '800' },
    textoResumoValorDestaque: { color: c.accent, fontSize: 15, fontWeight: '800' },

    subtituloDetalhamento: {
      fontSize: 15,
      fontWeight: '800',
      color: c.text,
      marginBottom: 12,
    },
    linhaDetalhamento: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 6,
      borderRadius: 8,
    },
    linhaDetalhamentoHover: {
      backgroundColor: c.surfaceAlt,
    },
    nomeDetalhamento: {
      color: c.textSecondary,
      fontSize: 14,
      flex: 1,
      marginRight: 12,
    },
    valorDetalhamento: {
      color: c.accent,
      fontSize: 14,
      fontWeight: '800',
    },

    historicoCardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surfaceAlt,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      gap: 10,
    },
    historicoInfoLeft: { flex: 1 },
    historicoPeriodoText: { color: c.text, fontSize: 14, fontWeight: '700' },
    historicoDetalhesText: { color: c.textMuted, fontSize: 12, marginTop: 2 },
    historicoBadgeResultado: {
      backgroundColor: c.primarySoft,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    historicoBadgeText: { color: c.accent, fontWeight: '800', fontSize: 13 },
    historicoSetaText: { fontSize: 12 },

    modalBackdrop: { flex: 1, backgroundColor: c.overlay, justifyContent: 'center', padding: 20 },
    modalContainer: {
      backgroundColor: c.surface,
      borderRadius: 24,
      padding: 24,
      maxHeight: '80%',
      maxWidth: 560,
      alignSelf: 'center',
      width: '100%',
    },
    modalTitle: { color: c.text, fontSize: 19, fontWeight: '800', marginBottom: 14, textAlign: 'center' },
    inputBuscaModal: {
      backgroundColor: c.surfaceAlt,
      color: c.text,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 13,
      borderWidth: 1,
      borderColor: c.primary,
      marginBottom: 12,
    },
    modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border },
    modalItemText: { color: c.text, fontSize: 14 },
    modalCloseBtn: {
      marginTop: 16,
      backgroundColor: c.surfaceAlt,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    modalCloseText: { color: c.text, fontWeight: '700', fontSize: 14 },
  });