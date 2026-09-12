import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { buscarUltimoIpca, calcularCorrecaoBackend, CorrecaoResponseDTO } from '../services/api';

export default function CalculadoraIpcaScreen() {
  const [valor, setValor] = useState('');
  const [mesInicio, setMesInicio] = useState('');
  const [anoInicio, setAnoInicio] = useState('');
  const [mesFim, setMesFim] = useState('');
  const [anoFim, setAnoFim] = useState('');
  
  const [usarDataAtual, setUsarDataAtual] = useState(false);
  const [ultimoIpcaData, setUltimoIpcaData] = useState<{ mes: string; ano: string } | null>(null);

  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<CorrecaoResponseDTO | null>(null);
  const [erroCalculo, setErroCalculo] = useState<string | null>(null);

  useEffect(() => {
    async function carregarUltimaData() {
      try {
        const dados = await buscarUltimoIpca();
        if (dados && dados.dataReferencia) {
          const parts = dados.dataReferencia.split('-');
          setUltimoIpcaData({
            ano: parts[0],
            mes: parts[1],
          });
        }
      } catch (error) {
        console.warn('Não foi possível carregar a última data do IPCA', error);
      }
    }
    carregarUltimaData();
  }, []);

  async function handleCalcular() {
    setErroCalculo(null);
    setResultado(null);

    const valorNumerico = Number(valor.replace(',', '.'));
    const mesInicioNum = Number(mesInicio);
    const anoInicioNum = Number(anoInicio);

    if (!valorNumerico || valorNumerico <= 0) {
      setErroCalculo('Informe um valor válido.');
      return;
    }

    if (!mesInicioNum || mesInicioNum < 1 || mesInicioNum > 12 || !anoInicioNum || anoInicioNum < 1994) {
      setErroCalculo('Informe um mês/ano inicial válido.');
      return;
    }

    let mesFimNum: number;
    let anoFimNum: number;

    if (usarDataAtual) {
      if (ultimoIpcaData) {
        mesFimNum = Number(ultimoIpcaData.mes);
        anoFimNum = Number(ultimoIpcaData.ano);
      } else {
        const dataAtual = new Date();
        mesFimNum = dataAtual.getMonth() + 1;
        anoFimNum = dataAtual.getFullYear();
      }
    } else {
      mesFimNum = Number(mesFim);
      anoFimNum = Number(anoFim);

      if (!mesFimNum || mesFimNum < 1 || mesFimNum > 12 || !anoFimNum || anoFimNum < 1994) {
        setErroCalculo('Informe um mês/ano final válido.');
        return;
      }

      // Validação rápida no front se tentar buscar uma data futura sem registro
      if (ultimoIpcaData) {
        const ultimoAno = Number(ultimoIpcaData.ano);
        const ultimoMes = Number(ultimoIpcaData.mes);

        if (anoFimNum > ultimoAno || (anoFimNum === ultimoAno && mesFimNum > ultimoMes)) {
          setErroCalculo(`Data final não pode ser superior a ${ultimoIpcaData.mes}/${ultimoIpcaData.ano} (último IPCA disponível).`);
          return;
        }
      }
    }

    const dataInicioFormatted = `${anoInicioNum}-${String(mesInicioNum).padStart(2, '0')}`;
    const dataFimFormatted = `${anoFimNum}-${String(mesFimNum).padStart(2, '0')}`;

    setCarregando(true);
    try {
      const res = await calcularCorrecaoBackend({
        valorInicial: valorNumerico,
        dataInicio: dataInicioFormatted,
        dataFim: dataFimFormatted,
      });
      setResultado(res);
    } catch (e) {
      setErroCalculo(e instanceof Error ? e.message : 'Erro ao conectar ao backend.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.titulo}>Calculadora IPCA Geral</Text>
          <Text style={styles.subtitulo}>
            Calcula a correção monetária oficial acumulada no período.
          </Text>

          {/* Texto discreto no topo (conforme layout original) */}
          {ultimoIpcaData && (
            <Text style={styles.textoUltimoIpca}>
              Base atualizada até: <Text style={styles.textoUltimoIpcaDestaque}>{ultimoIpcaData.mes}/{ultimoIpcaData.ano}</Text>
            </Text>
          )}

          <View style={styles.card}>
            <Text style={styles.label}>Valor Original (R$)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 1000,00"
              placeholderTextColor="#64748B"
              keyboardType="decimal-pad"
              value={valor}
              onChangeText={setValor}
            />

            <Text style={styles.label}>Data Inicial (MM/AAAA)</Text>
            <View style={styles.linhaInputs}>
              <TextInput
                style={[styles.input, styles.inputPequeno]}
                placeholder="MM"
                placeholderTextColor="#64748B"
                keyboardType="number-pad"
                maxLength={2}
                value={mesInicio}
                onChangeText={setMesInicio}
              />
              <TextInput
                style={[styles.input, styles.inputPequeno]}
                placeholder="AAAA"
                placeholderTextColor="#64748B"
                keyboardType="number-pad"
                maxLength={4}
                value={anoInicio}
                onChangeText={setAnoInicio}
              />
            </View>

            <View style={styles.headerDataFinal}>
              <Text style={styles.label}>Data Final (MM/AAAA)</Text>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setUsarDataAtual(!usarDataAtual)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, usarDataAtual && styles.checkboxChecado]}>
                  {usarDataAtual && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Usar IPCA mais recente</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.linhaInputs, usarDataAtual && styles.inputsDesabilitados]}>
              <TextInput
                style={[styles.input, styles.inputPequeno, usarDataAtual && styles.inputDisabledStyle]}
                placeholder="MM"
                placeholderTextColor="#64748B"
                keyboardType="number-pad"
                maxLength={2}
                value={mesFim}
                onChangeText={setMesFim}
                editable={!usarDataAtual}
              />
              <TextInput
                style={[styles.input, styles.inputPequeno, usarDataAtual && styles.inputDisabledStyle]}
                placeholder="AAAA"
                placeholderTextColor="#64748B"
                keyboardType="number-pad"
                maxLength={4}
                value={anoFim}
                onChangeText={setAnoFim}
                editable={!usarDataAtual}
              />
            </View>

            <TouchableOpacity style={styles.botao} onPress={handleCalcular} disabled={carregando}>
              {carregando ? (
                <ActivityIndicator color="#0F172A" />
              ) : (
                <Text style={styles.botaoTexto}>Calcular</Text>
              )}
            </TouchableOpacity>

            {erroCalculo && <Text style={styles.erroTexto}>{erroCalculo}</Text>}

            {resultado && (
              <View style={styles.resultadoBox}>
                <Text style={styles.resultadoLinha}>
                  Valor Corrigido:{' '}
                  <Text style={styles.resultadoDestaque}>
                    {resultado.valorCorrigido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </Text>
                </Text>
                <Text style={styles.resultadoLinha}>
                  Variação Acumulada:{' '}
                  <Text style={styles.resultadoDestaque}>
                    {resultado.variacaoPercentualAcumulada}%
                  </Text>
                </Text>
                <Text style={styles.resultadoLinhaSecundaria}>
                  Total de meses considerados pelo servidor: {resultado.totalMeses}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  container: { padding: 20 },
  titulo: { fontSize: 22, fontWeight: '700', color: '#F8FAFC' },
  subtitulo: { fontSize: 13, color: '#94A3B8', marginTop: 4, marginBottom: 4 },
  
  // Estilo sutil/discreto original
  textoUltimoIpca: {
    fontSize: 12,
    color: '#38BDF8',
    marginBottom: 16,
  },
  textoUltimoIpcaDestaque: {
    fontWeight: '700',
  },

  card: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16 },
  label: { color: '#CBD5E1', fontSize: 13, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  linhaInputs: { flexDirection: 'row', gap: 10 },
  inputPequeno: { flex: 1 },
  headerDataFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  checkboxChecado: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  checkmark: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  inputsDesabilitados: {
    opacity: 0.4,
  },
  inputDisabledStyle: {
    backgroundColor: '#1E293B',
  },
  botao: {
    backgroundColor: '#38BDF8',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  botaoTexto: { color: '#0F172A', fontWeight: '700', fontSize: 15 },
  erroTexto: { color: '#F87171', fontSize: 13, marginTop: 10, textAlign: 'center' },
  resultadoBox: { marginTop: 18, borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 14 },
  resultadoLinha: { color: '#E2E8F0', fontSize: 15, marginBottom: 4 },
  resultadoDestaque: { color: '#4ADE80', fontWeight: '700' },
  resultadoLinhaSecundaria: { color: '#64748B', fontSize: 12, marginTop: 4 },
});