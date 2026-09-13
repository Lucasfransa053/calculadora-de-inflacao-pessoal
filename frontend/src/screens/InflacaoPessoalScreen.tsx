import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  buscarCategoriasIpca,
  calcularInflacaoPessoal,
  CategoriaIpca,
  CalculoInflacaoResponseDTO,
} from '../services/api';

const getIconeCategoria = (nome: string) => {
  const lower = nome.toLowerCase();
  if (lower.includes('alimentaç')) return '🍔';
  if (lower.includes('habitaç')) return '🏠';
  if (lower.includes('residência') || lower.includes('residencia')) return '🛋️';
  if (lower.includes('vestuário') || lower.includes('vestuario')) return '👕';
  if (lower.includes('transporte')) return '🚗';
  if (lower.includes('saúde') || lower.includes('saude')) return '🏥';
  if (lower.includes('despesas pessoais')) return '🪒';
  if (lower.includes('educaç')) return '🎓';
  if (lower.includes('comunicaç')) return '📱';
  return '📦';
};

export default function InflacaoPessoalScreen() {
  const [categorias, setCategorias] = useState<CategoriaIpca[]>([]);
  const [cestaGasto, setCestaGasto] = useState<{ categoriaId: string; nome: string; valor: string }[]>([]);
  
  // Controles do Form e Modal Select
  const [modalVisivel, setModalVisivel] = useState(false);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<CategoriaIpca | null>(null);
  const [valorInput, setValorInput] = useState('');

  // Períodos
  const [mesInicio, setMesInicio] = useState('01');
  const [anoInicio, setAnoInicio] = useState('2025');
  const [mesFim, setMesFim] = useState('07');
  const [anoFim, setAnoFim] = useState('2026');

  // Estados de Loading e Resultados
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
        // Exclui o índice geral ('7169') se vier na lista
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

  const handleAdicionarItemCesta = () => {
    setErro(null);
    if (!categoriaSelecionada) {
      setErro('Por favor, selecione uma categoria.');
      return;
    }
    const valorNumerico = parseFloat(valorInput.replace(',', '.'));
    if (!valorInput || isNaN(valorNumerico) || valorNumerico <= 0) {
      setErro('Informe um valor de gasto válido e maior que zero.');
      return;
    }

    if (cestaGasto.some(item => item.categoriaId === categoriaSelecionada.id)) {
      setErro('Categoria já adicionada na sua cesta.');
      return;
    }

    setCestaGasto([
      ...cestaGasto,
      { categoriaId: categoriaSelecionada.id, nome: categoriaSelecionada.nome, valor: valorInput }
    ]);
    
    // Reseta os campos após adicionar
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
      setErro('Adicione pelo menos uma categoria à sua cesta de consumo.');
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

      // Chamada para o backend via service api.ts
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
          Calcule o impacto real da inflação no seu bolso montando sua própria cesta de consumo.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#38BDF8" style={{ marginVertical: 40 }} />
        ) : (
          <View style={styles.cardPrincipal}>
            
            {/* Período */}
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

            {/* Inserção de Categoria (O "Select") */}
            <Text style={styles.cardTitulo}>Adicionar Gasto Mensal</Text>
            <View style={styles.formRow}>
              <TouchableOpacity style={styles.selectBtn} onPress={() => setModalVisivel(true)}>
                <Text style={categoriaSelecionada ? styles.selectBtnTextAtivo : styles.selectBtnTextPlaceholder} numberOfLines={1}>
                  {categoriaSelecionada ? `${getIconeCategoria(categoriaSelecionada.nome)} ${categoriaSelecionada.nome}` : 'Selecione uma categoria...'}
                </Text>
              </TouchableOpacity>

              <View style={styles.inputGastoWrapper}>
                <Text style={styles.prefixoMoeda}>R$</Text>
                <TextInput
                  style={styles.inputGasto}
                  keyboardType="numeric"
                  placeholder="0,00"
                  placeholderTextColor="#64748B"
                  value={valorInput}
                  onChangeText={setValorInput}
                />
              </View>
            </View>
            <TouchableOpacity style={styles.btnAdicionar} onPress={handleAdicionarItemCesta}>
              <Text style={styles.btnAdicionarTexto}>+ Adicionar à Cesta</Text>
            </TouchableOpacity>

            <View style={styles.divisor} />

            {/* Cesta de Consumo do Usuário */}
            <Text style={styles.cardTitulo}>Sua Cesta de Consumo</Text>
            {cestaGasto.length === 0 ? (
              <Text style={styles.cestaVaziaTexto}>Nenhum item adicionado ainda.</Text>
            ) : (
              <View style={styles.listaCesta}>
                {cestaGasto.map(item => (
                  <View key={item.categoriaId} style={styles.cestaItem}>
                    <Text style={styles.cestaItemNome}>{getIconeCategoria(item.nome)} {item.nome}</Text>
                    <Text style={styles.cestaItemValor}>R$ {item.valor}</Text>
                    <TouchableOpacity style={styles.btnRemover} onPress={() => handleRemoverItemCesta(item.categoriaId)}>
                      <Text style={styles.btnRemoverTexto}>X</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {erro && <Text style={styles.textoErro}>{erro}</Text>}

            <TouchableOpacity style={[styles.botaoAcao, cestaGasto.length === 0 && { opacity: 0.5 }]} onPress={handleCalcular} disabled={calculando || cestaGasto.length === 0}>
              {calculando ? (
                <ActivityIndicator color="#0F172A" />
              ) : (
                <Text style={styles.botaoTextoAcao}>Calcular Inflação Pessoal</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Dashboard de Resultados */}
        {resultado && (
          <View style={styles.cardResultado}>
            <Text style={styles.cardTituloResultado}>Resultado da Sua Inflação</Text>
            {resultado.mensagemAviso && (
              <Text style={styles.avisoTexto}>{resultado.mensagemAviso}</Text>
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
                  <View key={item.categoriaId} style={styles.linhaDetalhamento}>
                    <Text style={styles.nomeDetalhamento} numberOfLines={1}>
                      {getIconeCategoria(item.nomeCategoria)} {item.nomeCategoria}
                    </Text>
                    <Text style={styles.valorDetalhamento}>
                      {item.inflacaoAcumuladaCategoriaPercentual.toFixed(2)}%
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal / Select Customizado para Categorias */}
      <Modal visible={modalVisivel} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Selecione uma Categoria</Text>
            <ScrollView style={styles.modalList}>
              {categorias.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setCategoriaSelecionada(cat);
                    setModalVisivel(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{getIconeCategoria(cat.nome)} {cat.nome}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisivel(false)}>
              <Text style={styles.modalCloseText}>Cancelar</Text>
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
  
  // Select Customizado
  formRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  selectBtn: { flex: 1, backgroundColor: '#0F172A', paddingHorizontal: 12, justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  selectBtnTextPlaceholder: { color: '#64748B', fontSize: 13 },
  selectBtnTextAtivo: { color: '#F8FAFC', fontSize: 13, fontWeight: '500' },
  
  inputGastoWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  prefixoMoeda: { color: '#64748B', fontSize: 12, marginRight: 4 },
  inputGasto: { color: '#F8FAFC', fontSize: 14, fontWeight: '600', width: 75, paddingVertical: 10, textAlign: 'right' },
  
  btnAdicionar: { backgroundColor: '#334155', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnAdicionarTexto: { color: '#F8FAFC', fontSize: 13, fontWeight: '600' },
  
  // Lista de Itens (Cesta)
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
  
  // Dashboard de Resultados
  cardResultado: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20, marginTop: 20, borderWidth: 1, borderColor: '#38BDF8' },
  cardTituloResultado: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 12 },
  avisoTexto: { color: '#F59E0B', fontSize: 12, marginBottom: 12 },
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
  linhaDetalhamento: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  nomeDetalhamento: { color: '#94A3B8', fontSize: 12, flex: 1, marginRight: 8 },
  valorDetalhamento: { color: '#38BDF8', fontSize: 12, fontWeight: '600' },
  
  // Estilos do Modal (Select)
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.85)', justifyContent: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#1E293B', borderRadius: 12, padding: 20, maxHeight: '80%', borderWidth: 1, borderColor: '#334155' },
  modalTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  modalList: { marginBottom: 16 },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#334155' },
  modalItemText: { color: '#E2E8F0', fontSize: 15 },
  modalCloseBtn: { alignItems: 'center', paddingVertical: 12, backgroundColor: '#334155', borderRadius: 8 },
  modalCloseText: { color: '#F8FAFC', fontWeight: '600' },
});