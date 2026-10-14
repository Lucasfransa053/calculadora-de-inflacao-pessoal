import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useIsDesktop } from '../hooks/useLayout';
import { buscarHistoricoCalculos, HistoricoCalculoDTO } from '../services/api';

interface Props {
  onSelecionar: (tela: 'oficial' | 'pessoal') => void;
}

export default function HomeScreen({ onSelecionar }: Props) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { usuario } = useAuth();
  const primeiroNome = usuario?.nome?.trim().split(/\s+/)[0] ?? '';
  const desktop = useIsDesktop();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [historico, setHistorico] = useState<HistoricoCalculoDTO[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(true);

  useEffect(() => {
    buscarHistoricoCalculos()
      .then((itens) => setHistorico(Array.isArray(itens) ? itens.slice(0, 3) : []))
      .catch(() => setHistorico([]))
      .finally(() => setCarregandoHistorico(false));
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={[styles.conteudo, desktop && styles.conteudoDesktop]}>
        <View style={styles.cabecalhoLinha}>
          <View style={styles.intro}>
            <Text style={styles.etiqueta}>
              {primeiroNome ? `Olá, ${primeiroNome}!` : 'Olá!'}
            </Text>
            <Text style={[styles.titulo, desktop && styles.tituloDesktop]}>O que você quer calcular?</Text>
            <Text style={styles.subtitulo}>
              Compare o índice oficial com o impacto real dos preços no seu dia a dia.
            </Text>
          </View>
          <View style={styles.acoesCabecalho}>
            <View style={styles.seloCabecalho}><Text style={styles.seloTexto}>IPCA + SUA CESTA</Text></View>
            {desktop && (
              <TouchableOpacity
                style={styles.botaoModo}
                onPress={toggleTheme}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
              >
                <Text style={styles.iconeModo}>{isDark ? '☀️' : '🌙'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.destaque}>
          <View style={styles.destaqueTexto}>
            <Text style={styles.destaqueEtiqueta}>INFLAÇÃO NÃO É IGUAL PARA TODO MUNDO</Text>
            <Text style={styles.destaqueTitulo}>Seu orçamento merece uma medida própria.</Text>
            <Text style={styles.destaqueSubtitulo}>
              Use o IPCA como referência ou descubra como os preços pesam na sua cesta de gastos.
            </Text>
          </View>
          <View style={styles.ilustracao}>
            <View style={styles.barraGraficoLinha}><Text style={styles.graficoLabel}>IPCA</Text><View style={[styles.barraGrafico, styles.barraIpca]} /></View>
            <View style={styles.barraGraficoLinha}><Text style={styles.graficoLabel}>VOCÊ</Text><View style={[styles.barraGrafico, styles.barraVoce]} /></View>
            <Text style={styles.graficoLegenda}>Duas perspectivas. Uma escolha sua.</Text>
          </View>
        </View>

        <View style={styles.secaoTopo}>
          <View>
            <Text style={styles.secaoTitulo}>Escolha sua calculadora</Text>
            <Text style={styles.secaoSubtitulo}>Comece em poucos passos.</Text>
          </View>
          <Text style={styles.passo}>02 FERRAMENTAS</Text>
        </View>

        <View style={[styles.cartoes, desktop && styles.cartoesDesktop]}>
          <TouchableOpacity style={styles.cartao} onPress={() => onSelecionar('oficial')} activeOpacity={0.82} accessibilityRole="button">
            <View style={styles.cartaoTopo}>
              <View style={styles.iconeIpca}><Text style={styles.iconeIpcaTexto}>IPCA</Text></View>
              <Text style={styles.tag}>OFICIAL</Text>
            </View>
            <Text style={styles.cartaoTitulo}>Calculadora IPCA</Text>
            <Text style={styles.cartaoTexto}>Atualize valores históricos pela inflação oficial e veja como o poder de compra mudou.</Text>
            <View style={styles.acaoLinha}><Text style={styles.acao}>Corrigir um valor</Text><Text style={styles.acaoSeta}>→</Text></View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cartao} onPress={() => onSelecionar('pessoal')} activeOpacity={0.82} accessibilityRole="button">
            <View style={styles.cartaoTopo}>
              <View style={styles.iconePessoal}><Text style={styles.iconePessoalTexto}>R$</Text></View>
              <Text style={styles.tag}>DO SEU JEITO</Text>
            </View>
            <Text style={styles.cartaoTitulo}>Inflação pessoal</Text>
            <Text style={styles.cartaoTexto}>Monte sua cesta de gastos e compare sua inflação com o índice oficial.</Text>
            <View style={styles.acaoLinha}><Text style={styles.acao}>Montar minha cesta</Text><Text style={styles.acaoSeta}>→</Text></View>
          </TouchableOpacity>
        </View>

        <View style={styles.historicoSecao}>
          <View style={styles.secaoTopo}>
            <View>
              <Text style={styles.secaoTitulo}>Cálculos recentes</Text>
              <Text style={styles.secaoSubtitulo}>Retome uma análise da sua inflação pessoal.</Text>
            </View>
            {carregandoHistorico && <ActivityIndicator size="small" color={colors.accent} />}
          </View>
          {historico.length > 0 ? (
            <View style={styles.listaHistorico}>
              {historico.map((item) => (
                <TouchableOpacity key={item.id} style={styles.itemHistorico} onPress={() => onSelecionar('pessoal')} activeOpacity={0.75}>
                  <View style={styles.historicoIcone}><Text style={styles.historicoIconeTexto}>R$</Text></View>
                  <View style={styles.historicoInfo}>
                    <Text style={styles.historicoPeriodo}>{item.dataInicio} até {item.dataFim}</Text>
                    <Text style={styles.historicoDetalhe}>{item.itens?.length ?? 0} itens na sua cesta</Text>
                  </View>
                  <Text style={styles.historicoResultado}>{item.inflacaoPessoalPercentual?.toFixed(2) ?? '0,00'}%</Text>
                  <Text style={styles.historicoSeta}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.vazioHistorico}>
              <View style={styles.vazioIcone}><Text style={styles.vazioIconeTexto}>01</Text></View>
              <View style={styles.vazioInfo}>
                <Text style={styles.vazioTitulo}>Seu histórico começa com o primeiro cálculo</Text>
                <Text style={styles.vazioTexto}>Faça uma análise pessoal e ela aparecerá aqui para você consultar depois.</Text>
              </View>
              <TouchableOpacity onPress={() => onSelecionar('pessoal')} activeOpacity={0.75} accessibilityRole="button">
                <Text style={styles.vazioAcao}>Começar  →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (c: Colors) => StyleSheet.create({
  scroll: { flexGrow: 1 },
  conteudo: { width: '100%', maxWidth: 1040, alignSelf: 'center', padding: 24, paddingTop: 32, paddingBottom: 48 },
  conteudoDesktop: { paddingHorizontal: 52, paddingTop: 44 },
  cabecalhoLinha: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  acoesCabecalho: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  botaoModo: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border },
  iconeModo: { fontSize: 16 },
  intro: { flex: 1, marginBottom: 22 },
  etiqueta: { color: c.accent, fontSize: 16, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },
  titulo: { color: c.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  tituloDesktop: { fontSize: 36 },
  subtitulo: { color: c.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 8, maxWidth: 600 },
  seloCabecalho: { backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginTop: 8 },
  seloTexto: { color: c.textSecondary, fontSize: 9, letterSpacing: 1, fontWeight: '800' },
  destaque: { backgroundColor: c.primary, borderRadius: 22, padding: 24, marginBottom: 28, flexDirection: 'row', alignItems: 'center', gap: 20, overflow: 'hidden' },
  destaqueTexto: { flex: 1 },
  destaqueEtiqueta: { color: '#554900', fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: 10 },
  destaqueTitulo: { color: '#0A0A0A', fontSize: 23, lineHeight: 28, fontWeight: '800', letterSpacing: -0.5, maxWidth: 460 },
  destaqueSubtitulo: { color: 'rgba(10,10,10,0.72)', fontSize: 13, lineHeight: 19, marginTop: 8, maxWidth: 510 },
  ilustracao: { width: 210, borderRadius: 16, padding: 16, backgroundColor: 'rgba(10,10,10,0.92)' },
  barraGraficoLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 5 },
  graficoLabel: { color: '#A3A3A3', fontSize: 9, width: 34, fontWeight: '800', letterSpacing: 0.6 },
  barraGrafico: { height: 8, borderRadius: 10 },
  barraIpca: { width: 86, backgroundColor: '#A3A3A3' },
  barraVoce: { width: 126, backgroundColor: c.primary },
  graficoLegenda: { color: '#D4D4D4', fontSize: 9, marginTop: 11 },
  secaoTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 },
  secaoTitulo: { color: c.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  secaoSubtitulo: { color: c.textMuted, fontSize: 12, marginTop: 4 },
  passo: { color: c.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  cartoes: { gap: 14 },
  cartoesDesktop: { flexDirection: 'row' },
  cartao: { flex: 1, minHeight: 204, padding: 20, borderRadius: 20, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, boxShadow: c.cardShadow },
  cartaoTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 },
  iconeIpca: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primarySoft },
  iconeIpcaTexto: { color: c.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.4 },
  iconePessoal: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border },
  iconePessoalTexto: { color: c.text, fontSize: 14, fontWeight: '800' },
  tag: { color: c.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  cartaoTitulo: { color: c.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  cartaoTexto: { color: c.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 7, flex: 1 },
  acaoLinha: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 19 },
  acao: { color: c.text, fontSize: 12, fontWeight: '800' },
  acaoSeta: { color: c.accent, fontSize: 17, fontWeight: '800' },
  historicoSecao: { marginTop: 30 },
  listaHistorico: { gap: 8 },
  itemHistorico: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 15, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  historicoIcone: { width: 36, height: 36, borderRadius: 11, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' },
  historicoIconeTexto: { color: c.accent, fontSize: 10, fontWeight: '900' },
  historicoInfo: { flex: 1 },
  historicoPeriodo: { color: c.text, fontSize: 12, fontWeight: '700' },
  historicoDetalhe: { color: c.textMuted, fontSize: 10, marginTop: 3 },
  historicoResultado: { color: c.accent, fontSize: 13, fontWeight: '800' },
  historicoSeta: { color: c.textMuted, fontSize: 16 },
  vazioHistorico: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  vazioIcone: { width: 38, height: 38, borderRadius: 12, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  vazioIconeTexto: { color: c.accent, fontSize: 12, fontWeight: '900' },
  vazioInfo: { flex: 1 },
  vazioTitulo: { color: c.text, fontSize: 12, fontWeight: '700' },
  vazioTexto: { color: c.textMuted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  vazioAcao: { color: c.accent, fontSize: 11, fontWeight: '800' },
});
