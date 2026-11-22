import React, { useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, useTheme } from '../theme';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_COMPLETOS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const COLUNAS_ANO = 4;
const ALTURA_ITEM_ANO = 46;
const GAP = 8;

type Props = {
  mes: string; // '1'..'12' ou ''
  ano: string; // 'AAAA' ou ''
  onChange: (mes: string, ano: string) => void;
  anoMin?: number;
  anoMax: number;
  mesMax: number; // último mês permitido dentro de anoMax (1..12)
  desabilitado?: boolean;
  titulo: string;
  compacto?: boolean; // mostra "Jan/2025" em vez de "Janeiro de 2025" (para caber lado a lado)
};

// Campo que abre um mini calendário de meses.
// As setas trocam o ano de 1 em 1; tocar no ano abre uma grade para escolher o ano direto.
export function SeletorMesAno({ mes, ano, onChange, anoMin = 1994, anoMax, mesMax, desabilitado, titulo, compacto }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [aberto, setAberto] = useState(false);
  const [escolhendoAno, setEscolhendoAno] = useState(false);
  const scrollAnosRef = useRef<ScrollView>(null);

  const mesNum = Number(mes);
  const anoNum = Number(ano);
  const temValor = mesNum >= 1 && mesNum <= 12 && anoNum >= anoMin;
  const [anoVisivel, setAnoVisivel] = useState(anoMax);

  // Do ano mais recente para o mais antigo
  const anos = useMemo(() => {
    const lista: number[] = [];
    for (let a = anoMax; a >= anoMin; a--) lista.push(a);
    return lista;
  }, [anoMin, anoMax]);

  function abrir() {
    if (desabilitado) return;
    setAnoVisivel(temValor ? Math.min(anoNum, anoMax) : anoMax);
    setEscolhendoAno(false);
    setAberto(true);
  }

  function escolher(m: number) {
    onChange(String(m), String(anoVisivel));
    setAberto(false);
  }

  function escolherAno(a: number) {
    setAnoVisivel(a);
    setEscolhendoAno(false);
  }

  // Ao abrir a grade de anos, rola até o ano selecionado
  function rolarParaAnoAtual() {
    const indice = anos.indexOf(anoVisivel);
    if (indice < 0) return;
    const linha = Math.floor(indice / COLUNAS_ANO);
    const y = Math.max(0, (linha - 1) * (ALTURA_ITEM_ANO + GAP));
    scrollAnosRef.current?.scrollTo({ y, animated: false });
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.campo, desabilitado && styles.campoDesabilitado]}
        onPress={abrir}
        disabled={desabilitado}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={titulo}
      >
        <Text style={[styles.campoTexto, !temValor && styles.campoPlaceholder]}>
          {temValor
            ? compacto
              ? `${MESES[mesNum - 1]}/${anoNum}`
              : `${MESES_COMPLETOS[mesNum - 1]} de ${anoNum}`
            : compacto
              ? 'Selecionar'
              : 'Selecionar mês e ano'}
        </Text>
        <Text style={styles.icone}>📅</Text>
      </TouchableOpacity>

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <Pressable style={styles.fundo} onPress={() => setAberto(false)}>
          <Pressable style={styles.painel} onPress={() => {}}>
            <Text style={styles.titulo}>{titulo}</Text>

            <View style={styles.linhaAno}>
              <TouchableOpacity
                style={[styles.seta, (escolhendoAno || anoVisivel <= anoMin) && styles.off]}
                onPress={() => setAnoVisivel((a) => Math.max(anoMin, a - 1))}
                disabled={escolhendoAno || anoVisivel <= anoMin}
                accessibilityLabel="Ano anterior"
              >
                <Text style={styles.setaTexto}>‹</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.anoBotao}
                onPress={() => setEscolhendoAno((v) => !v)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={escolhendoAno ? 'Voltar para os meses' : 'Escolher o ano'}
              >
                <Text style={styles.anoTexto}>{anoVisivel}</Text>
                <Text style={styles.anoSeta}>{escolhendoAno ? '▴' : '▾'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.seta, (escolhendoAno || anoVisivel >= anoMax) && styles.off]}
                onPress={() => setAnoVisivel((a) => Math.min(anoMax, a + 1))}
                disabled={escolhendoAno || anoVisivel >= anoMax}
                accessibilityLabel="Próximo ano"
              >
                <Text style={styles.setaTexto}>›</Text>
              </TouchableOpacity>
            </View>

            {escolhendoAno ? (
              <ScrollView
                ref={scrollAnosRef}
                style={styles.listaAnos}
                onLayout={rolarParaAnoAtual}
                showsVerticalScrollIndicator
              >
                <View style={styles.grade}>
                  {anos.map((a) => {
                    const ativo = a === anoVisivel;
                    return (
                      <TouchableOpacity
                        key={a}
                        style={[styles.ano, ativo && styles.mesAtivo]}
                        onPress={() => escolherAno(a)}
                        activeOpacity={0.8}
                        accessibilityLabel={`Ano ${a}`}
                      >
                        <Text style={[styles.mesTexto, ativo && styles.mesTextoAtivo]}>{a}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.grade}>
                {MESES.map((nome, i) => {
                  const m = i + 1;
                  const futuro = anoVisivel === anoMax && m > mesMax;
                  const ativo = temValor && anoNum === anoVisivel && mesNum === m;
                  return (
                    <TouchableOpacity
                      key={nome}
                      style={[styles.mes, ativo && styles.mesAtivo, futuro && styles.off]}
                      onPress={() => escolher(m)}
                      disabled={futuro}
                      activeOpacity={0.8}
                      accessibilityLabel={`${MESES_COMPLETOS[i]} de ${anoVisivel}`}
                    >
                      <Text style={[styles.mesTexto, ativo && styles.mesTextoAtivo]}>{nome}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <TouchableOpacity style={styles.cancelar} onPress={() => setAberto(false)}>
              <Text style={styles.cancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const createStyles = (c: Colors) =>
  StyleSheet.create({
    campo: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    campoDesabilitado: { backgroundColor: c.border },
    campoTexto: { color: c.text, fontSize: 15 },
    campoPlaceholder: { color: c.textMuted },
    icone: { fontSize: 16 },

    fundo: { flex: 1, backgroundColor: c.overlay, alignItems: 'center', justifyContent: 'center', padding: 24 },
    painel: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: c.surface,
      borderRadius: 24,
      padding: 18,
      borderWidth: 1,
      borderColor: c.border,
    },
    titulo: { color: c.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 12 },
    linhaAno: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    seta: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    setaTexto: { color: c.text, fontSize: 22, lineHeight: 24 },
    anoBotao: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: c.surfaceAlt,
    },
    anoTexto: { color: c.text, fontSize: 20, fontWeight: '800' },
    anoSeta: { color: c.textSecondary, fontSize: 12 },
    grade: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
    listaAnos: { maxHeight: 4 * (ALTURA_ITEM_ANO + GAP) },
    mes: { width: '23.5%', paddingVertical: 14, borderRadius: 12, backgroundColor: c.surfaceAlt, alignItems: 'center' },
    ano: {
      width: '23.5%',
      height: ALTURA_ITEM_ANO,
      borderRadius: 12,
      backgroundColor: c.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mesAtivo: { backgroundColor: c.primary },
    mesTexto: { color: c.text, fontSize: 14, fontWeight: '600' },
    mesTextoAtivo: { color: c.onPrimary, fontWeight: '800' },
    off: { opacity: 0.3 },
    cancelar: { alignItems: 'center', paddingTop: 16 },
    cancelarTexto: { color: c.textSecondary, fontSize: 14, fontWeight: '600' },
  });
