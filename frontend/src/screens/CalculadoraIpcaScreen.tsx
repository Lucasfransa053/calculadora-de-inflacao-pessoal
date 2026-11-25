import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, useTheme } from '../theme';
import { PageHeader } from '../components/PageHeader';
import { SeletorMesAno } from '../components/SeletorMesAno';
import { useIsDesktop } from '../hooks/useLayout';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import { buscarUltimoIpca, calcularCorrecaoBackend, CorrecaoResponseDTO } from '../services/api';

// IPCA geral (BCB/SGS 433) começa em jan/1980
const ANO_MIN_IPCA = 1980;

// porReal = quantas unidades da moeda valem 1 real (conversões oficiais acumuladas)
type Moeda = { simbolo: string; nome: string; porReal: number };

const MOEDA_REAL: Moeda = { simbolo: 'R$', nome: 'Real', porReal: 1 };

// Moeda vigente em cada época. A troca é considerada no mês em que a moeda nova entrou em vigor.
function moedaDaEpoca(ano: number, mes: number): Moeda {
  const aaaamm = ano * 100 + mes;
  if (aaaamm >= 199407) return MOEDA_REAL;
  if (aaaamm >= 199308) return { simbolo: 'CR$', nome: 'Cruzeiro Real', porReal: 2750 };
  if (aaaamm >= 199003) return { simbolo: 'Cr$', nome: 'Cruzeiro', porReal: 2750 * 1000 };
  if (aaaamm >= 198901) return { simbolo: 'NCz$', nome: 'Cruzado Novo', porReal: 2750 * 1000 };
  if (aaaamm >= 198603) return { simbolo: 'Cz$', nome: 'Cruzado', porReal: 2750 * 1000 * 1000 };
  return { simbolo: 'Cr$', nome: 'Cruzeiro', porReal: 2750 * 1000 * 1000 * 1000 };
}

export default function CalculadoraIpcaScreen() {
  const { colors } = useTheme();
  const desktop = useIsDesktop();
  const tecladoAltura = useKeyboardHeight();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [valor, setValor] = useState('');
  const [mesInicio, setMesInicio] = useState('');
  const [anoInicio, setAnoInicio] = useState('');
  const [mesFim, setMesFim] = useState('');
  const [anoFim, setAnoFim] = useState('');
  
  const [usarDataAtual, setUsarDataAtual] = useState(false);
  const [ultimoIpcaData, setUltimoIpcaData] = useState<{ mes: string; ano: string } | null>(null);

  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<CorrecaoResponseDTO | null>(null);
  const [moedas, setMoedas] = useState<{ inicial: Moeda; final: Moeda }>({ inicial: MOEDA_REAL, final: MOEDA_REAL });
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

    if (!mesInicioNum || mesInicioNum < 1 || mesInicioNum > 12 || !anoInicioNum || anoInicioNum < ANO_MIN_IPCA) {
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

      if (!mesFimNum || mesFimNum < 1 || mesFimNum > 12 || !anoFimNum || anoFimNum < ANO_MIN_IPCA) {
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
      setMoedas({ inicial: moedaDaEpoca(anoInicioNum, mesInicioNum), final: moedaDaEpoca(anoFimNum, mesFimNum) });
    } catch (e) {
      setErroCalculo(e instanceof Error ? e.message : 'Erro ao conectar ao backend.');
    } finally {
      setCarregando(false);
    }
  }

  // Limite do seletor: último IPCA publicado (ou o mês atual, se ainda não carregou)
  const hoje = new Date();
  const limiteAno = ultimoIpcaData ? Number(ultimoIpcaData.ano) : hoje.getFullYear();
  const limiteMes = ultimoIpcaData ? Number(ultimoIpcaData.mes) : hoje.getMonth() + 1;

  const formatar = (v: number, m: Moeda) =>
    `${m.simbolo}\u00A0${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // O IPCA mede só a variação de preços, então o backend devolve o valor na moeda da data inicial.
  // Aqui ele é convertido para a moeda da data final (o real, na maioria dos casos).
  const valorConvertido = resultado
    ? (resultado.valorCorrigido * moedas.final.porReal) / moedas.inicial.porReal
    : 0;

  const moedaSelecionada = Number(anoInicio) > 0 && Number(mesInicio) > 0
    ? moedaDaEpoca(Number(anoInicio), Number(mesInicio))
    : MOEDA_REAL;
  const notaMoeda = moedas.inicial.porReal !== moedas.final.porReal
    ? `Valor original em ${moedas.inicial.nome} (${moedas.inicial.simbolo}), convertido para ${moedas.final.nome} (${moedas.final.simbolo}).`
    : null;

  const formulario = (
    <View style={[styles.card, desktop && styles.cardDesktop]}>
      <Text style={styles.label}>Valor Original ({moedaSelecionada.simbolo})</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: 1000,00"
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        value={valor}
        onChangeText={setValor}
      />

      <Text style={styles.label}>Data Inicial</Text>
      <SeletorMesAno
        titulo="Data inicial"
        mes={mesInicio}
        ano={anoInicio}
        onChange={(m, a) => { setMesInicio(m); setAnoInicio(a); }}
        anoMin={ANO_MIN_IPCA}
        anoMax={limiteAno}
        mesMax={limiteMes}
      />

      <View style={styles.headerDataFinal}>
        <Text style={[styles.label, styles.labelSemMargem]}>Data Final</Text>

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

      <View style={usarDataAtual && styles.inputsDesabilitados}>
        <SeletorMesAno
          titulo="Data final"
          mes={mesFim}
          ano={anoFim}
          onChange={(m, a) => { setMesFim(m); setAnoFim(a); }}
          anoMin={ANO_MIN_IPCA}
          anoMax={limiteAno}
          mesMax={limiteMes}
          desabilitado={usarDataAtual}
        />
      </View>

      <TouchableOpacity style={styles.botao} onPress={handleCalcular} disabled={carregando} activeOpacity={0.85}>
        {carregando ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.botaoTexto}>Calcular</Text>
        )}
      </TouchableOpacity>

      {erroCalculo && <Text style={styles.erroTexto}>{erroCalculo}</Text>}

      {/* No celular o resultado aparece dentro do próprio cartão */}
      {!desktop && resultado && (
        <View style={styles.resultadoBox}>
          <Text style={styles.resultadoRotulo}>Valor Corrigido</Text>
          <Text style={styles.resultadoGrande}>{formatar(valorConvertido, moedas.final)}</Text>
          {notaMoeda && <Text style={styles.resultadoLegenda}>{notaMoeda}</Text>}
          <View style={styles.resultadoDivisor} />
          <View style={styles.resultadoLinhaDupla}>
            <Text style={styles.resultadoLinha}>Variação Acumulada</Text>
            <Text style={styles.resultadoDestaque}>{resultado.variacaoPercentualAcumulada}%</Text>
          </View>
          <View style={styles.resultadoLinhaDupla}>
            <Text style={styles.resultadoLinha}>Meses considerados</Text>
            <Text style={styles.resultadoDestaque}>{resultado.totalMeses}</Text>
          </View>
        </View>
      )}
    </View>
  );

  // No computador o resultado ganha um painel ao lado do formulário
  const painelResultado = (
    <View style={styles.painelResultado}>
      <Text style={styles.overline}>RESULTADO</Text>
      {resultado ? (
        <>
          <Text style={styles.resultadoEnorme}>{formatar(valorConvertido, moedas.final)}</Text>
          <Text style={styles.resultadoLegenda}>
            Valor corrigido a partir de {formatar(resultado.valorInicial, moedas.inicial)} pelo IPCA acumulado no período.
          </Text>
          {notaMoeda && <Text style={styles.resultadoLegenda}>{notaMoeda}</Text>}
          <View style={styles.metricas}>
            <View style={styles.metrica}>
              <Text style={styles.metricaRotulo}>Variação acumulada</Text>
              <Text style={styles.metricaValor}>{resultado.variacaoPercentualAcumulada}%</Text>
            </View>
            <View style={styles.metrica}>
              <Text style={styles.metricaRotulo}>Meses considerados</Text>
              <Text style={styles.metricaValor}>{resultado.totalMeses}</Text>
            </View>
          </View>
        </>
      ) : (
        <Text style={styles.resultadoVazio}>
          Preencha os dados ao lado e toque em Calcular para ver o valor corrigido pelo IPCA.
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'web' ? undefined : 'padding'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.container, desktop && styles.containerDesktop, tecladoAltura > 0 && { paddingBottom: 24 + tecladoAltura }]}
          keyboardShouldPersistTaps="handled"
        >
          <PageHeader
            titulo="Calculadora IPCA Geral"
            subtitulo="Calcula a correção monetária oficial acumulada no período."
          >
            {ultimoIpcaData && (
              <Text style={styles.textoUltimoIpca}>
                Base atualizada até{' '}
                <Text style={styles.textoUltimoIpcaDestaque}>
                  {ultimoIpcaData.mes}/{ultimoIpcaData.ano}
                </Text>
              </Text>
            )}
          </PageHeader>

          {desktop ? (
            <View style={styles.colunas}>
              {formulario}
              {painelResultado}
            </View>
          ) : (
            formulario
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (c: Colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.bg },
    container: { padding: 20, width: '100%', maxWidth: 720, alignSelf: 'center' },
    containerDesktop: { maxWidth: 1200, paddingHorizontal: 48, paddingVertical: 40 },
    colunas: { flexDirection: 'row', alignItems: 'flex-start', gap: 24 },

    textoUltimoIpca: {
      alignSelf: 'flex-start',
      fontSize: 12,
      color: c.textSecondary,
      backgroundColor: c.primarySoft,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      overflow: 'hidden',
      marginTop: 14,
    },
    textoUltimoIpcaDestaque: { fontWeight: '800', color: c.accent },

    card: {
      backgroundColor: c.surface,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: c.border,
      boxShadow: c.cardShadow,
    },
    cardDesktop: { width: 520, padding: 28 },
    label: { color: c.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 16 },
    labelSemMargem: { marginTop: 0, marginBottom: 0 },
    input: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: c.text,
      fontSize: 15,
      borderWidth: 1,
      borderColor: c.border,
    },
    linhaInputs: { flexDirection: 'row', gap: 12 },
    inputPequeno: { flex: 1, minWidth: 0 },
    headerDataFinal: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 16,
      marginBottom: 8,
    },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: c.textMuted,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceAlt,
    },
    checkboxChecado: { backgroundColor: c.primary, borderColor: c.primary },
    checkmark: { color: c.onPrimary, fontSize: 12, fontWeight: 'bold' },
    checkboxLabel: { color: c.textSecondary, fontSize: 12, fontWeight: '600' },
    inputsDesabilitados: { opacity: 0.45 },
    inputDisabledStyle: { backgroundColor: c.border },
    botao: {
      backgroundColor: c.primary,
      borderRadius: 16,
      paddingVertical: 17,
      alignItems: 'center',
      marginTop: 24,
      boxShadow: c.buttonShadow,
    },
    botaoTexto: { color: c.onPrimary, fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },
    erroTexto: { color: c.danger, fontSize: 13, marginTop: 14, textAlign: 'center' },

    // resultado dentro do cartão (celular)
    resultadoBox: {
      marginTop: 20,
      backgroundColor: c.surfaceAlt,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      padding: 18,
    },
    resultadoRotulo: { color: c.textSecondary, fontSize: 13, fontWeight: '600' },
    resultadoGrande: { color: c.success, fontSize: 32, fontWeight: '800', letterSpacing: -0.8, marginTop: 4 },
    resultadoDivisor: { height: 1, backgroundColor: c.border, marginVertical: 14 },
    resultadoLinhaDupla: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    resultadoLinha: { color: c.textSecondary, fontSize: 14 },
    resultadoDestaque: { color: c.text, fontWeight: '800', fontSize: 15 },

    // painel de resultado (computador)
    painelResultado: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 24,
      padding: 32,
      borderWidth: 1,
      borderColor: c.border,
      boxShadow: c.cardShadow,
    },
    overline: { color: c.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
    resultadoEnorme: { color: c.success, fontSize: 52, fontWeight: '800', letterSpacing: -1.6, marginTop: 16 },
    resultadoLegenda: { color: c.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 8 },
    metricas: { flexDirection: 'row', gap: 12, marginTop: 24 },
    metrica: {
      flex: 1,
      backgroundColor: c.surfaceAlt,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      padding: 18,
    },
    metricaRotulo: { color: c.textSecondary, fontSize: 13, fontWeight: '600' },
    metricaValor: { color: c.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.6, marginTop: 6 },
    resultadoVazio: { color: c.textSecondary, fontSize: 15, lineHeight: 23, marginTop: 16 },
  });

