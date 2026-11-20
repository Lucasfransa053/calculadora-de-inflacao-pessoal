import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, useTheme } from '../theme';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_COMPLETOS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

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

// Campo que abre um mini calendário de meses: setas trocam o ano, tocar no mês escolhe.
export function SeletorMesAno({ mes, ano, onChange, anoMin = 1994, anoMax, mesMax, desabilitado, titulo, compacto }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [aberto, setAberto] = useState(false);

  const mesNum = Number(mes);
  const anoNum = Number(ano);
  const temValor = mesNum >= 1 && mesNum <= 12 && anoNum >= anoMin;
  const [anoVisivel, setAnoVisivel] = useState(anoMax);

  function abrir() {
    if (desabilitado) return;
    setAnoVisivel(temValor ? Math.min(anoNum, anoMax) : anoMax);
    setAberto(true);
  }

  function escolher(m: number) {
    onChange(String(m), String(anoVisivel));
    setAberto(false);
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
                style={[styles.seta, anoVisivel <= anoMin && styles.off]}
                onPress={() => setAnoVisivel((a) => Math.max(anoMin, a - 1))}
                disabled={anoVisivel <= anoMin}
                accessibilityLabel="Ano anterior"
              >
                <Text style={styles.setaTexto}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.anoTexto}>{anoVisivel}</Text>
              <TouchableOpacity
                style={[styles.seta, anoVisivel >= anoMax && styles.off]}
                onPress={() => setAnoVisivel((a) => Math.min(anoMax, a + 1))}
                disabled={anoVisivel >= anoMax}
                accessibilityLabel="Próximo ano"
              >
                <Text style={styles.setaTexto}>›</Text>
              </TouchableOpacity>
            </View>

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
    anoTexto: { color: c.text, fontSize: 20, fontWeight: '800' },
    grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    mes: { width: '23.5%', paddingVertical: 14, borderRadius: 12, backgroundColor: c.surfaceAlt, alignItems: 'center' },
    mesAtivo: { backgroundColor: c.primary },
    mesTexto: { color: c.text, fontSize: 14, fontWeight: '600' },
    mesTextoAtivo: { color: c.onPrimary, fontWeight: '800' },
    off: { opacity: 0.3 },
    cancelar: { alignItems: 'center', paddingTop: 16 },
    cancelarTexto: { color: c.textSecondary, fontSize: 14, fontWeight: '600' },
  });
