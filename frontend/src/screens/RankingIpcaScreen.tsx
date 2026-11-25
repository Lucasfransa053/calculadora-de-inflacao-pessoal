import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, useTheme } from '../theme';
import { PageHeader } from '../components/PageHeader';
import { SeletorMesAno } from '../components/SeletorMesAno';
import { useIsDesktop } from '../hooks/useLayout';
import {
  buscarRankingIpca,
  buscarUltimoIpca,
  RankingCategoriaDTO,
  TipoRankingFront,
} from '../services/api';

// Categorias do IBGE (SIDRA, tabela 1419) começam em jan/2012
const ANO_MIN_RANKING = 2012;

const OPCOES_LIMITE = [10, 20, 50] as const;

const formatarNomeItem = (nome: string) =>
  String(nome ?? '')
    .replace(/^[0-9]+\.\s*/, '')
    .trim();

export default function RankingIpcaScreen() {
  const { colors } = useTheme();
  const desktop = useIsDesktop();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [mesInicio, setMesInicio] = useState('01');
  const [anoInicio, setAnoInicio] = useState('2021');
  const [mesFim, setMesFim] = useState('12');
  const [anoFim, setAnoFim] = useState('2025');
  const [tipo, setTipo] = useState<TipoRankingFront>('ALTA');
  const [limite, setLimite] = useState<number>(20);

  const [ultimoIpca, setUltimoIpca] = useState<{ ano: number; mes: number } | null>(null);
  useEffect(() => {
    buscarUltimoIpca()
      .then((d) => {
        const partes = d?.dataReferencia?.split('-');
        if (partes && partes.length >= 2) {
          setUltimoIpca({ ano: Number(partes[0]), mes: Number(partes[1]) });
        }
      })
      .catch((e) => console.warn('Não foi possível carregar a última data do IPCA', e));
  }, []);

  const hoje = new Date();
  const limiteAno = ultimoIpca ? ultimoIpca.ano : hoje.getFullYear();
  const limiteMes = ultimoIpca ? ultimoIpca.mes : hoje.getMonth() + 1;

  const [dados, setDados] = useState<RankingCategoriaDTO[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleConsultar = async () => {
    setErro(null);

    const inicioFmt = `${anoInicio}-${mesInicio.padStart(2, '0')}-01`;
    const fimFmt = `${anoFim}-${mesFim.padStart(2, '0')}-01`;

    if (inicioFmt > fimFmt) {
      setErro('A data inicial não pode ser maior que a data final.');
      return;
    }

    setCarregando(true);
    try {
      const lista = await buscarRankingIpca({
        inicio: inicioFmt,
        fim: fimFmt,
        tipo,
        limite,
      });
      setDados(lista);
    } catch (e: any) {
      setErro(e?.message || 'Erro ao consultar o ranking.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    void handleConsultar();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.container, desktop && styles.containerDesktop]}>
        <PageHeader
          titulo="Ranking de Variação"
          subtitulo="Veja as categorias que mais subiram ou caíram no período selecionado."
        />

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Filtros da Consulta</Text>

          <View style={styles.datasRow}>
            <View style={styles.dataSeletor}>
              <SeletorMesAno
                titulo="Data inicial"
                mes={mesInicio}
                ano={anoInicio}
                onChange={(m, a) => { setMesInicio(m); setAnoInicio(a); }}
                anoMin={ANO_MIN_RANKING}
                anoMax={limiteAno}
                mesMax={limiteMes}
                compacto
              />
            </View>
            <Text style={styles.ateTexto}>até</Text>
            <View style={styles.dataSeletor}>
              <SeletorMesAno
                titulo="Data final"
                mes={mesFim}
                ano={anoFim}
                onChange={(m, a) => { setMesFim(m); setAnoFim(a); }}
                anoMin={ANO_MIN_RANKING}
                anoMax={limiteAno}
                mesMax={limiteMes}
                compacto
              />
            </View>
          </View>

          <View style={styles.linhaOpcoes}>
            <View style={styles.grupoOpcao}>
              <Text style={styles.labelCampo}>Sentido</Text>
              <View style={styles.botoesSegmentados}>
                <TouchableOpacity
                  style={[styles.btnSegmento, tipo === 'ALTA' && styles.btnSegmentoAtivo]}
                  onPress={() => setTipo('ALTA')}
                >
                  <Text style={[styles.textoSegmento, tipo === 'ALTA' && styles.textoSegmentoAtivo]}>
                    Maiores altas
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnSegmento, tipo === 'QUEDA' && styles.btnSegmentoAtivo]}
                  onPress={() => setTipo('QUEDA')}
                >
                  <Text style={[styles.textoSegmento, tipo === 'QUEDA' && styles.textoSegmentoAtivo]}>
                    Maiores quedas
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.grupoOpcao}>
              <Text style={styles.labelCampo}>Quantidade</Text>
              <View style={styles.botoesSegmentados}>
                {OPCOES_LIMITE.map((qtd) => (
                  <TouchableOpacity
                    key={qtd}
                    style={[styles.btnSegmento, limite === qtd && styles.btnSegmentoAtivo]}
                    onPress={() => setLimite(qtd)}
                  >
                    <Text style={[styles.textoSegmento, limite === qtd && styles.textoSegmentoAtivo]}>
                      Top {qtd}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {erro && <Text style={styles.textoErro}>{erro}</Text>}

          <TouchableOpacity style={styles.botaoAcao} onPress={handleConsultar} disabled={carregando}>
            {carregando ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.botaoTextoAcao}>Consultar Ranking</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>
            {tipo === 'ALTA' ? `Top ${limite} Maiores Altas` : `Top ${limite} Maiores Quedas`}
          </Text>

          {carregando ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 24 }} />
          ) : dados.length === 0 ? (
            <Text style={styles.vazioTexto}>Nenhum dado encontrado para o período informado.</Text>
          ) : (
            <View style={styles.lista}>
              {dados.map((item, index) => {
                const positiva = item.variacaoAcumuladaPct > 0;
                const negativa = item.variacaoAcumuladaPct < 0;
                return (
                  <View key={item.categoriaId} style={styles.itemRow}>
                    <View style={styles.posicaoBadge}>
                      <Text style={styles.posicaoTexto}>{index + 1}º</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.nomeItem} numberOfLines={2}>
                        {formatarNomeItem(item.categoriaNome)}
                      </Text>
                      <Text style={styles.subItem}>
                        {item.qtdMeses} {item.qtdMeses === 1 ? 'mês' : 'meses'}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.valorPct,
                        positiva && { color: colors.danger },
                        negativa && { color: colors.success },
                      ]}
                    >
                      {positiva ? '+' : ''}
                      {Number(item.variacaoAcumuladaPct).toFixed(2)}%
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (c: Colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.bg, paddingTop: 10 },
    container: { padding: 20, width: '100%', maxWidth: 820, alignSelf: 'center', gap: 20 },
    containerDesktop: { maxWidth: 1040, paddingHorizontal: 48, paddingVertical: 40 },
    card: {
      backgroundColor: c.surface,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardTitulo: { fontSize: 17, fontWeight: '800', color: c.text, marginBottom: 14 },
    datasRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    dataSeletor: { flex: 1, minWidth: 0 },
    ateTexto: { color: c.textMuted, fontSize: 13 },
    linhaOpcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 16 },
    grupoOpcao: { flex: 1, minWidth: 220 },
    labelCampo: { color: c.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
    botoesSegmentados: { flexDirection: 'row', gap: 8 },
    btnSegmento: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    btnSegmentoAtivo: {
      backgroundColor: c.primarySoft,
      borderColor: c.primary,
    },
    textoSegmento: { color: c.textSecondary, fontSize: 13, fontWeight: '700' },
    textoSegmentoAtivo: { color: c.accent },
    textoErro: { color: c.danger, fontSize: 13, marginBottom: 12, textAlign: 'center' },
    botaoAcao: {
      backgroundColor: c.primary,
      borderRadius: 16,
      paddingVertical: 15,
      alignItems: 'center',
    },
    botaoTextoAcao: { color: c.onPrimary, fontWeight: '800', fontSize: 15 },
    vazioTexto: { color: c.textMuted, fontSize: 13, fontStyle: 'italic' },
    lista: { gap: 10 },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surfaceAlt,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      gap: 12,
    },
    posicaoBadge: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    posicaoTexto: { color: c.accent, fontWeight: '800', fontSize: 12 },
    infoItem: { flex: 1 },
    nomeItem: { color: c.text, fontSize: 14, fontWeight: '700' },
    subItem: { color: c.textMuted, fontSize: 12, marginTop: 2 },
    valorPct: { color: c.text, fontSize: 15, fontWeight: '800' },
  });