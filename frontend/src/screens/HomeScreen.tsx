import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { IpcaPonto } from '../types/ipca';
import { buscarHistoricoIpca } from '../services/api';
import { calcularValorCorrigido, ResultadoCalculo } from '../services/calculoInflacao';

export default function HomeScreen() {
  const [historico, setHistorico] = useState<IpcaPonto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [valor, setValor] = useState('');
  const [mes, setMes] = useState('');
  const [ano, setAno] = useState('');
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const [erroCalculo, setErroCalculo] = useState<string | null>(null);

  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  useEffect(() => {
    carregarHistorico();
  }, []);

  async function carregarHistorico() {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await buscarHistoricoIpca();
      setHistorico(dados);
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Não foi possível conectar ao backend. Verifique se ele está rodando.'
      );
    } finally {
      setCarregando(false);
    }
  }

  const ultimoDado = useMemo(
    () => (historico.length > 0 ? historico[historico.length - 1] : null),
    [historico]
  );

  function handleCalcular() {
    setErroCalculo(null);
    setResultado(null);

    const valorNumerico = Number(valor.replace(',', '.'));
    const mesNumerico = Number(mes);
    const anoNumerico = Number(ano);

    if (!valorNumerico || valorNumerico <= 0) {
      setErroCalculo('Informe um valor válido.');
      return;
    }
    if (!mesNumerico || mesNumerico < 1 || mesNumerico > 12) {
      setErroCalculo('Informe um mês entre 1 e 12.');
      return;
    }
    if (!anoNumerico || anoNumerico < 1994 || anoNumerico > new Date().getFullYear()) {
      setErroCalculo('Informe um ano válido (a partir de 1994).');
      return;
    }
    if (historico.length === 0) {
      setErroCalculo('Histórico do IPCA ainda não foi carregado.');
      return;
    }

    try {
      const dataInicial = new Date(anoNumerico, mesNumerico - 1, 1);
      const resultadoCalculo = calcularValorCorrigido(historico, valorNumerico, dataInicial);
      setResultado(resultadoCalculo);
    } catch (e) {
      setErroCalculo(e instanceof Error ? e.message : 'Erro ao calcular.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={mostrarHistorico ? historico.slice().reverse() : []}
          keyExtractor={(item) => item.data}
          ListHeaderComponent={
            <View style={styles.container}>
              <Text style={styles.titulo}>Calculadora de Inflação Pessoal</Text>
              <Text style={styles.subtitulo}>
                Corrija valores com base no IPCA (Banco Central)
              </Text>

              {carregando && (
                <View style={styles.statusBox}>
                  <ActivityIndicator color="#38BDF8" />
                  <Text style={styles.statusTexto}>Carregando histórico do IPCA...</Text>
                </View>
              )}

              {erro && !carregando && (
                <View style={styles.statusBox}>
                  <Text style={styles.erroTexto}>{erro}</Text>
                  <TouchableOpacity style={styles.botaoSecundario} onPress={carregarHistorico}>
                    <Text style={styles.botaoSecundarioTexto}>Tentar novamente</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!carregando && !erro && ultimoDado && (
                <Text style={styles.infoAtualizacao}>
                  Último dado disponível: {ultimoDado.data} ({ultimoDado.valorPercentual}%)
                </Text>
              )}

              <View style={styles.card}>
                <Text style={styles.cardTitulo}>Corrigir um valor</Text>

                <Text style={styles.label}>Valor (R$)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 1000"
                  placeholderTextColor="#64748B"
                  keyboardType="decimal-pad"
                  value={valor}
                  onChangeText={setValor}
                />

                <Text style={styles.label}>A partir de qual mês/ano?</Text>
                <View style={styles.linhaInputs}>
                  <TextInput
                    style={[styles.input, styles.inputPequeno]}
                    placeholder="MM"
                    placeholderTextColor="#64748B"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={mes}
                    onChangeText={setMes}
                  />
                  <TextInput
                    style={[styles.input, styles.inputPequeno]}
                    placeholder="AAAA"
                    placeholderTextColor="#64748B"
                    keyboardType="number-pad"
                    maxLength={4}
                    value={ano}
                    onChangeText={setAno}
                  />
                </View>

                <TouchableOpacity style={styles.botao} onPress={handleCalcular}>
                  <Text style={styles.botaoTexto}>Calcular</Text>
                </TouchableOpacity>

                {erroCalculo && <Text style={styles.erroTexto}>{erroCalculo}</Text>}

                {resultado && (
                  <View style={styles.resultadoBox}>
                    <Text style={styles.resultadoLinha}>
                      Valor corrigido:{' '}
                      <Text style={styles.resultadoDestaque}>
                        {formatarMoeda(resultado.valorCorrigido)}
                      </Text>
                    </Text>
                    <Text style={styles.resultadoLinha}>
                      Inflação acumulada:{' '}
                      <Text style={styles.resultadoDestaque}>
                        {resultado.inflacaoAcumuladaPercentual.toFixed(2)}%
                      </Text>
                    </Text>
                    <Text style={styles.resultadoLinhaSecundaria}>
                      ({resultado.mesesConsiderados} meses considerados)
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.linkHistorico}
                onPress={() => setMostrarHistorico((prev) => !prev)}
              >
                <Text style={styles.linkHistoricoTexto}>
                  {mostrarHistorico ? 'Ocultar' : 'Ver'} histórico completo do IPCA
                </Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.itemHistorico}>
              <Text style={styles.itemHistoricoData}>{item.data}</Text>
              <Text style={styles.itemHistoricoValor}>{item.valorPercentual}%</Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    padding: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  subtitulo: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 16,
  },
  statusBox: {
    marginBottom: 16,
    alignItems: 'center',
  },
  statusTexto: {
    color: '#94A3B8',
    marginTop: 8,
  },
  infoAtualizacao: {
    color: '#38BDF8',
    fontSize: 12,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
  },
  cardTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 10,
  },
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
  linhaInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  inputPequeno: {
    flex: 1,
  },
  botao: {
    backgroundColor: '#38BDF8',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  botaoTexto: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 15,
  },
  botaoSecundario: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  botaoSecundarioTexto: {
    color: '#38BDF8',
  },
  erroTexto: {
    color: '#F87171',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },
  resultadoBox: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 14,
  },
  resultadoLinha: {
    color: '#E2E8F0',
    fontSize: 15,
    marginBottom: 4,
  },
  resultadoDestaque: {
    color: '#4ADE80',
    fontWeight: '700',
  },
  resultadoLinhaSecundaria: {
    color: '#64748B',
    fontSize: 12,
  },
  linkHistorico: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkHistoricoTexto: {
    color: '#38BDF8',
    fontSize: 13,
  },
  itemHistorico: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  itemHistoricoData: {
    color: '#CBD5E1',
    fontSize: 13,
  },
  itemHistoricoValor: {
    color: '#94A3B8',
    fontSize: 13,
  },
});
