import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
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
import {
  buscarCategoriasIpca,
  calcularInflacaoPessoal,
  CategoriaIpca,
  CalculoInflacaoResponseDTO,
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
      !n.includes('combustivel')
  },
  {
    id: '2',
    nome: 'Habitação & Limpeza',
    icone: '🏠',
    match: (n) => 
      (n.includes('habitac') || n.includes('aluguel') || n.includes('energia eletrica') || 
       n.includes('taxa de agua') || n.includes('gas encanado') || n.includes('gas de botijao') || 
       n.includes('detergente') || n.includes('limpeza') || n.includes('sabao') || n.includes('condominio')) &&
      !n.includes('gasolina')
  },
  {
    id: '3',
    nome: 'Artigos de Residência',
    icone: '🛋️',
    match: (n) => 
      n.includes('residencia') || n.includes('eletrodomestico') || n.includes('movel') || 
      n.includes('tv') || n.includes('cama') || n.includes('utensilio') || n.includes('colchao') || n.includes('geladeira')
  },
  {
    id: '4',
    nome: 'Vestuário',
    icone: '👕',
    match: (n) => 
      n.includes('vestuario') || n.includes('roupa') || n.includes('calca') || n.includes('camisa') || 
      n.includes('sapato') || n.includes('tenis') || n.includes('calcado') || n.includes('saia') || n.includes('cinto')
  },
  {
    id: '5',
    nome: 'Transportes',
    icone: '🚗',
    match: (n) => 
      n.includes('transporte') || n.includes('gasolina') || n.includes('etanol') || n.includes('combustivel') || 
      n.includes('passagem') || n.includes('onibus') || n.includes('metro') || n.includes('uber') || 
      n.includes('veiculo') || n.includes('pneu') || n.includes('estacionamento') || n.includes('pedagio')
  },
  {
    id: '6',
    nome: 'Saúde & Cuidados',
    icone: '🏥',
    match: (n) => 
      n.includes('saude') || n.includes('remedio') || n.includes('medicamento') || n.includes('medico') || 
      n.includes('plano de saude') || n.includes('hospital') || n.includes('farmacia') || n.includes('higiene') || 
      n.includes('perfume') || n.includes('shampoo') || n.includes('dentista') || n.includes('oculos')
  },
  {
    id: '7',
    nome: 'Despesas Pessoais',
    icone: '🪒',
    match: (n) => 
      n.includes('despesas pessoais') || n.includes('barbeiro') || n.includes('cabeleireiro') || 
      n.includes('recreacao') || n.includes('cinema') || n.includes('viagem') || n.includes('hotel') || 
      n.includes('cigarro') || n.includes('pet') || n.includes('veterinario')
  },
  {
    id: '8',
    nome: 'Educação',
    icone: '🎓',
    match: (n) => 
      n.includes('educac') || n.includes('escola') || n.includes('faculdade') || n.includes('curso') || 
      n.includes('mensalidade') || n.includes('livro') || n.includes('material escolar') || n.includes('idiomas')
  },
  {
    id: '9',
    nome: 'Comunicação',
    icone: '📱',
    match: (n) => 
      n.includes('comunicac') || n.includes('internet') || n.includes('telefone') || n.includes('celular') || 
      n.includes('tv por assinatura') || n.includes('streaming') || n.includes('correio')
  },
];

export default function InflacaoPessoalScreen() {
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

  useEffect(() => {
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    setLoading(true);
    setErro(null);
    try {
      const lista = await buscarCategoriasIpca();
      if (lista && lista.length > 0) {
        setCategorias(lista.filter(c => c.id !== '7169'));
      } else {
        setCategorias([]);
      }
    } catch (e: any) {
      console.warn("Erro ao buscar categorias do backend:", e);
      setErro('Não foi possível carregar as categorias do servidor.');
      setCategorias([]);
    } finally {
      setLoading(false);
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

    return categorias.filter(cat => {
      const nomeLimpo = removerAcentos(formatarNomeCategoria(cat.nome));
      const pertenceAoGrupo = grupoAtivoModal.match(nomeLimpo, cat.id);
      const bateuBusca = !termoBusca || nomeLimpo.includes(termoBusca);

      return pertenceAoGrupo && bateuBusca;
    });
  }, [buscaCategoria, grupoAtivoModal, categorias]);

  const itensAvisoDesconsiderados = useMemo(() => {
    if (!resultado?.mensagemAviso) return { textoPrefixo: '', itens: [] };

    const partes = resultado.mensagemAviso.split(':');
    if (partes.length > 1) {
      const prefixo = partes[0] + ':';
      const listaItens = partes[1]
        .split(',')
        .map(i => i.trim().replace(/\.$/, ''))
        .filter(Boolean);

      return { textoPrefixo: prefixo, itens: listaItens };
    }

    return { textoPrefixo: resultado.mensagemAviso, itens: [] };
  }, [resultado?.mensagemAviso]);

  const handleAdicionarItemCesta = () => {
    setErro(null);
    if (!categoriaSelecionada) {
      setErro('Por favor, selecione um item no grupo.');
      return;
    }
    const valorNumerico = parseFloat(valorInput.replace(',', '.'));
    if (!valorInput || isNaN(valorNumerico) || valorNumerico <= 0) {
      setErro('Informe um valor de gasto válido e maior que zero.');
      return;
    }

    if (cestaGasto.some(item => item.categoriaId === categoriaSelecionada.id)) {
      setErro('Item já adicionado na sua cesta.');
      return;
    }

    setCestaGasto([
      ...cestaGasto,
      { 
        categoriaId: categoriaSelecionada.id, 
        nome: formatarNomeCategoria(categoriaSelecionada.nome), 
        valor: valorInput 
      }
    ]);
    
    setCategoriaSelecionada(null);
    setValorInput('');
  };

  const handleRemoverItemCesta = (id: string) => {
    setCestaGasto(cestaGasto.filter(item => item.categoriaId !== id));
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
      const dataInicio = `${anoInicio}-${mesInicio.padStart(2, '0')}-01`;
      const dataFim = `${anoFim}-${mesFim.padStart(2, '0')}-01`;

      const itensGasto = cestaGasto.map(item => ({
        categoriaId: item.categoriaId,
        valorGasto: parseFloat(item.valor.replace(',', '.')) || 0,
      }));

      const res = await calcularInflacaoPessoal({
        dataInicio,
        dataFim,
        itensGasto,
      });

      setResultado(res);
    } catch (e: any) {
      setErro(e.message || 'Erro de comunicação com o servidor ao calcular.');
    } finally {
      setCalculando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>Minha Inflação Pessoal</Text>
        <Text style={styles.subtitulo}>
          Monte sua cesta de consumo navegando pelos grupos abaixo e acompanhe o total acumulado.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#38BDF8" style={{ marginVertical: 40 }} />
        ) : (
          <View style={styles.cardPrincipal}>
            
            <View style={styles.periodoContainer}>
              <Text style={styles.labelPeriodo}>Período de Análise:</Text>
              <View style={styles.datasRow}>
                <View style={styles.dataInputGroup}>
                  <TextInput style={styles.inputData} value={mesInicio} onChangeText={setMesInicio} keyboardType="numeric" maxLength={2} placeholder="MM" placeholderTextColor="#64748B" />
                  <Text style={styles.barraData}>/</Text>
                  <TextInput style={styles.inputDataAno} value={anoInicio} onChangeText={setAnoInicio} keyboardType="numeric" maxLength={4} placeholder="AAAA" placeholderTextColor="#64748B" />
                </View>
                <Text style={styles.ateTexto}>até</Text>
                <View style={styles.dataInputGroup}>
                  <TextInput style={styles.inputData} value={mesFim} onChangeText={setMesFim} keyboardType="numeric" maxLength={2} placeholder="MM" placeholderTextColor="#64748B" />
                  <Text style={styles.barraData}>/</Text>
                  <TextInput style={styles.inputDataAno} value={anoFim} onChangeText={setAnoFim} keyboardType="numeric" maxLength={4} placeholder="AAAA" placeholderTextColor="#64748B" />
                </View>
              </View>
            </View>

            <View style={styles.divisor} />

            <Text style={styles.cardTitulo}>1. Escolha um Grupo de Gastos</Text>
            <View style={styles.gridGrupos}>
              {GRUPOS_PRINCIPAIS.map(grupo => (
                <TouchableOpacity
                  key={grupo.id}
                  style={styles.botaoGrupoGrid}
                  onPress={() => {
                    setGrupoAtivoModal(grupo);
                    setBuscaCategoria('');
                  }}
                >
                  <Text style={styles.iconeGrupoGrid}>{grupo.icone}</Text>
                  <Text style={styles.nomeGrupoGrid} numberOfLines={2}>{grupo.nome}</Text>
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
                      placeholderTextColor="#64748B"
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

            <View style={styles.divisor} />

            <View style={styles.headerCestaRow}>
              <Text style={styles.cardTitulo}>2. Sua Cesta de Consumo</Text>
              
              <View style={styles.badgeTotalCesta}>
                <Text style={styles.badgeTotalLabel}>Total na Cesta:</Text>
                <Text style={styles.badgeTotalValor}>
                  R$ {totalCesta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            {cestaGasto.length === 0 ? (
              <Text style={styles.cestaVaziaTexto}>Nenhum item adicionado ainda. Escolha um grupo acima.</Text>
            ) : (
              <View style={styles.listaCesta}>
                {cestaGasto.map(item => (
                  <View key={item.categoriaId} style={styles.cestaItem}>
                    <Text style={styles.cestaItemNome}>📦 {item.nome}</Text>
                    <Text style={styles.cestaItemValor}>
                      R$ {parseFloat(item.valor.replace(',', '.')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                    <TouchableOpacity style={styles.btnRemover} onPress={() => handleRemoverItemCesta(item.categoriaId)}>
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
                <ActivityIndicator color="#0F172A" />
              ) : (
                <Text style={styles.botaoTextoAcao}>Calcular Inflação Pessoal</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {resultado && (
          <View style={styles.cardResultado}>
            <Text style={styles.cardTituloResultado}>Resultado da Sua Inflação</Text>
            
            {resultado?.mensagemAviso && (
              <View style={styles.warningCard}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <View style={styles.warningContent}>
                  <Text style={styles.warningTextPrefix}>
                    {itensAvisoDesconsiderados.textoPrefixo}
                  </Text>
                  {itensAvisoDesconsiderados.itens.length > 0 && (
                    <View style={styles.warningBadgesRow}>
                      {itensAvisoDesconsiderados.itens.map((item, idx) => (
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
                <Text style={[styles.metricaValor, { color: '#38BDF8' }]}>
                  {resultado.inflacaoPessoalPercentual.toFixed(2)}%
                </Text>
              </View>
              <View style={styles.metricaBox}>
                <Text style={styles.metricaLabel}>IPCA Oficial</Text>
                <Text style={[styles.metricaValor, { color: '#94A3B8' }]}>
                  {resultado.inflacaoOficialIpcaPercentual.toFixed(2)}%
                </Text>
              </View>
              <View style={styles.metricaBox}>
                <Text style={styles.metricaLabel}>Diferença</Text>
                <Text
                  style={[
                    styles.metricaValor,
                    { color: resultado.diferencaParaIpcaOficialPercentual > 0 ? '#EF4444' : '#22C55E' },
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
              <Text style={styles.textoResumoValor}>R$ {resultado.custoTotalInicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.linhaResumo}>
              <Text style={styles.textoResumoLabel}>Custo Recomposto:</Text>
              <Text style={styles.textoResumoValorDestaque}>R$ {resultado.custoTotalRecomposto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.linhaResumo}>
              <Text style={styles.textoResumoLabel}>Aumento Real de Custo:</Text>
              <Text style={[styles.textoResumoValorDestaque, { color: '#EF4444' }]}>
                + R$ {resultado.perdaPoderCompraReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>

            {resultado.detalhamento && resultado.detalhamento.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.subtituloDetalhamento}>Detalhamento da Cesta:</Text>
                {resultado.detalhamento.map(item => (
                  <Pressable
                    key={item.categoriaId}
                    style={({ hovered }: { hovered?: boolean }) => [
                      styles.linhaDetalhamento,
                      hovered && styles.linhaDetalhamentoHover,
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
              placeholderTextColor="#64748B"
              value={buscaCategoria}
              onChangeText={setBuscaCategoria}
              autoFocus
            />

            <FlatList
              data={categoriasDoGrupoFiltradas}
              keyExtractor={(item) => item.id}
              initialNumToRender={15}
              maxToRenderPerBatch={20}
              windowSize={10}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setCategoriaSelecionada(item);
                    setGrupoAtivoModal(null);
                    setBuscaCategoria('');
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {formatarNomeCategoria(item.nome)}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.textoVazioModal}>Nenhum item encontrado neste grupo.</Text>
              }
              style={styles.modalList}
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  container: { padding: 20 },
  titulo: { fontSize: 22, fontWeight: '700', color: '#F8FAFC' },
  subtitulo: { fontSize: 13, color: '#94A3B8', marginTop: 4, marginBottom: 16 },
  cardPrincipal: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#334155' },
  cardTitulo: { fontSize: 15, fontWeight: '600', color: '#F8FAFC', marginBottom: 12 },
  periodoContainer: { marginBottom: 8 },
  labelPeriodo: { color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  datasRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dataInputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#334155' },
  inputData: { color: '#F8FAFC', paddingVertical: 6, width: 28, textAlign: 'center', fontWeight: '600' },
  inputDataAno: { color: '#F8FAFC', paddingVertical: 6, width: 44, textAlign: 'center', fontWeight: '600' },
  barraData: { color: '#64748B', marginHorizontal: 2 },
  ateTexto: { color: '#64748B', fontSize: 12 },
  divisor: { height: 1, backgroundColor: '#334155', marginVertical: 16 },
  gridGrupos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  botaoGrupoGrid: { width: '31%', backgroundColor: '#0F172A', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  iconeGrupoGrid: { fontSize: 22, marginBottom: 4 },
  nomeGrupoGrid: { color: '#E2E8F0', fontSize: 11, textAlign: 'center', fontWeight: '500' },
  boxInsercaoValor: { backgroundColor: '#0F172A', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#38BDF8', marginTop: 8 },
  itemSelecionadoLabel: { color: '#38BDF8', fontSize: 11, fontWeight: '600' },
  itemSelecionadoNome: { color: '#F8FAFC', fontSize: 14, fontWeight: '700', marginBottom: 10 },
  rowAdicionarValor: { flexDirection: 'row', gap: 10 },
  inputGastoWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  prefixoMoeda: { color: '#64748B', fontSize: 12, marginRight: 4 },
  inputGasto: { flex: 1, color: '#F8FAFC', fontSize: 14, fontWeight: '600', paddingVertical: 8 },
  btnAdicionar: { backgroundColor: '#38BDF8', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 },
  btnAdicionarTexto: { color: '#0F172A', fontSize: 13, fontWeight: '700' },
  headerCestaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badgeTotalCesta: { backgroundColor: '#0F172A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#38BDF8', flexDirection: 'row', gap: 6, alignItems: 'center' },
  badgeTotalLabel: { color: '#94A3B8', fontSize: 11 },
  badgeTotalValor: { color: '#38BDF8', fontSize: 13, fontWeight: '800' },
  cestaVaziaTexto: { color: '#64748B', fontSize: 13, fontStyle: 'italic', marginBottom: 16 },
  listaCesta: { gap: 8, marginBottom: 16 },
  cestaItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  cestaItemNome: { flex: 1, color: '#E2E8F0', fontSize: 13 },
  cestaItemValor: { color: '#38BDF8', fontSize: 14, fontWeight: '600', marginRight: 12 },
  btnRemover: { backgroundColor: '#EF444420', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  btnRemoverTexto: { color: '#EF4444', fontWeight: 'bold' },
  textoErro: { color: '#EF4444', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  botaoAcao: { backgroundColor: '#38BDF8', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  botaoTextoAcao: { color: '#0F172A', fontWeight: '700', fontSize: 15 },
  cardResultado: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20, marginTop: 20, borderWidth: 1, borderColor: '#38BDF8' },
  cardTituloResultado: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 12 },
  warningCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#2A1F0D', borderColor: '#F59E0B', borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 16 },
  warningIcon: { marginRight: 10, fontSize: 18, marginTop: 2 },
  warningContent: { flex: 1 },
  warningTextPrefix: { color: '#FDE68A', fontSize: 13, fontWeight: '600', marginBottom: 8, lineHeight: 18 },
  warningBadgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  warningBadgeItem: { backgroundColor: '#854D0E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#F59E0B' },
  warningBadgeText: { color: '#FEF08A', fontSize: 12, fontWeight: '700' },
  metricasGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 16 },
  metricaBox: { flex: 1, backgroundColor: '#0F172A', padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  metricaLabel: { color: '#64748B', fontSize: 11, fontWeight: '600', marginBottom: 4, textAlign: 'center' },
  metricaValor: { fontSize: 15, fontWeight: '800' },
  divisorResumo: { height: 1, backgroundColor: '#334155', marginVertical: 12 },
  linhaResumo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  textoResumoLabel: { color: '#94A3B8', fontSize: 13 },
  textoResumoValor: { color: '#F8FAFC', fontSize: 13, fontWeight: '600' },
  textoResumoValorDestaque: { color: '#38BDF8', fontSize: 14, fontWeight: '700' },
  subtituloDetalhamento: { color: '#F8FAFC', fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  linhaDetalhamento: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6 },
  linhaDetalhamentoHover: { backgroundColor: '#0F172A' },
  nomeDetalhamento: { color: '#94A3B8', fontSize: 12, flex: 1, marginRight: 8 },
  valorDetalhamento: { color: '#38BDF8', fontSize: 12, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.85)', justifyContent: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#1E293B', borderRadius: 12, padding: 20, maxHeight: '80%', borderWidth: 1, borderColor: '#334155' },
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  inputBuscaModal: { backgroundColor: '#0F172A', color: '#F8FAFC', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#38BDF8', marginBottom: 12, fontSize: 14 },
  modalList: { marginBottom: 12 },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  modalItemText: { color: '#E2E8F0', fontSize: 14 },
  textoVazioModal: { color: '#64748B', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  modalCloseBtn: { alignItems: 'center', paddingVertical: 12, backgroundColor: '#334155', borderRadius: 8 },
  modalCloseText: { color: '#F8FAFC', fontWeight: '600' },
});