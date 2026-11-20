import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, useTheme } from '../theme';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_COMPLETOS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

type Props = {
  mes: string; // '1'..'12' ou ''
  ano: string; // 'AAAA' ou ''
  onChange: (mes: string, ano: string) => void;
  anoMin?: number;
  anoMax: number;
  mesMax: number; // último mês permitido dentro de anoMax (1..12)
  desabilitado?: boolean;
  titulo: string;
};

// Campo que abre um mini calendário. O IPCA é mensal: vale o mês e o ano do dia tocado.
export function SeletorMesAno({ mes, ano, onChange, anoMin = 1994, anoMax, mesMax, desabilitado, titulo }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [aberto, setAberto] = useState(false);
  const [escolhendoMes, setEscolhendoMes] = useState(false);

  const mesNum = Number(mes);
  const anoNum = Number(ano);
  const temValor = mesNum >= 1 && mesNum <= 12 && anoNum >= anoMin;

  // mês/ano que o calendário está mostrando
  const [verMes, setVerMes] = useState(mesMax);
  const [verAno, setVerAno] = useState(anoMax);

  function abrir() {
    if (desabilitado) return;
    if (temValor) {
      setVerMes(mesNum);
      setVerAno(Math.min(anoNum, anoMax));
    } else {
      setVerMes(mesMax);
      setVerAno(anoMax);
    }
    setEscolhendoMes(false);
    setAberto(true);
  }

  const noMinimo = verAno <= anoMin && verMes <= 1;
  const noMaximo = verAno >= anoMax && verMes >= mesMax;

  function mudarMes(delta: number) {
    let m = verMes + delta;
    let a = verAno;
    if (m < 1) { m = 12; a -= 1; }
    if (m > 12) { m = 1; a += 1; }
    if (a < anoMin || a > anoMax || (a === anoMax && m > mesMax)) return;
    setVerMes(m);
    setVerAno(a);
  }

  function escolherDia() {
    onChange(String(verMes), String(verAno));
    setAberto(false);
  }

  function escolherMesDaGrade(m: number) {
    setVerMes(m);
    setEscolhendoMes(false);
  }

  // grade de dias do mês exibido
  const primeiroDiaSemana = new Date(verAno, verMes - 1, 1).getDay();
  const diasNoMes = new Date(verAno, verMes, 0).getDate();
  const celulas: (number | null)[] = [
    ...Array(primeiroDiaSemana).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];
  while (celulas.length % 7 !== 0) celulas.push(null);
  const mesSelecionado = temValor && anoNum === verAno && mesNum === verMes;

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
          {temValor ? `${MESES_COMPLETOS[mesNum - 1]} de ${anoNum}` : 'Selecionar data'}
        </Text>
        <Text style={styles.icone}>📅</Text>
      </TouchableOpacity>

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <Pressable style={styles.fundo} onPress={() => setAberto(false)}>
          <Pressable style={styles.painel} onPress={() => {}}>
            <Text style={styles.titulo}>{titulo}</Text>

            <View style={styles.cabecalho}>
              <TouchableOpacity
                style={[styles.seta, noMinimo && styles.setaOff]}
                onPress={() => mudarMes(-1)}
                disabled={noMinimo}
                accessibilityLabel="Mês anterior"
              >
                <Text style={styles.setaTexto}>‹</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setEscolhendoMes((v) => !v)} accessibilityLabel="Escolher mês">
                <Text style={styles.mesAno}>
                  {MESES_COMPLETOS[verMes - 1]} {verAno} ▾
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.seta, noMaximo && styles.setaOff]}
                onPress={() => mudarMes(1)}
                disabled={noMaximo}
                accessibilityLabel="Próximo mês"
              >
                <Text style={styles.setaTexto}>›</Text>
              </TouchableOpacity>
            </View>

            {escolhendoMes ? (
              <>
                <View style={styles.linhaAno}>
                  <TouchableOpacity
                    style={[styles.seta, verAno <= anoMin && styles.setaOff]}
                    onPress={() => setVerAno((a) => Math.max(anoMin, a - 1))}
                    disabled={verAno <= anoMin}
                    accessibilityLabel="Ano anterior"
                  >
                    <Text style={styles.setaTexto}>‹</Text>
                  </TouchableOpacity>
                  <Text style={styles.anoTexto}>{verAno}</Text>
                  <TouchableOpacity
                    style={[styles.seta, verAno >= anoMax && styles.setaOff]}
                    onPress={() => setVerAno((a) => Math.min(anoMax, a + 1))}
                    disabled={verAno >= anoMax}
                    accessibilityLabel="Próximo ano"
                  >
                    <Text style={styles.setaTexto}>›</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.gradeMeses}>
                  {MESES.map((nome, i) => {
                    const m = i + 1;
                    const futuro = verAno === anoMax && m > mesMax;
                    const ativo = m === verMes;
                    return (
                      <TouchableOpacity
                        key={nome}
                        style={[styles.mes, ativo && styles.mesAtivo, futuro && styles.off]}
                        onPress={() => escolherMesDaGrade(m)}
                        disabled={futuro}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.mesTexto, ativo && styles.mesTextoAtivo]}>{nome}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : (
              <>
                <View style={styles.semana}>
                  {DIAS_SEMANA.map((d, i) => (
                    <Text key={i} style={styles.diaSemana}>{d}</Text>
                  ))}
                </View>
                <View style={styles.gradeDias}>
                  {celulas.map((dia, i) => (
                    <View key={i} style={styles.celula}>
                      {dia !== null && (
                        <TouchableOpacity
                          style={[styles.dia, mesSelecionado && styles.diaAtivo]}
                          onPress={escolherDia}
                          activeOpacity={0.8}
                          accessibilityLabel={`${dia} de ${MESES_COMPLETOS[verMes - 1]} de ${verAno}`}
                        >
                          <Text style={[styles.diaTexto, mesSelecionado && styles.textoAtivo]}>{dia}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
                <Text style={styles.dica}>O IPCA é mensal: vale o mês escolhido.</Text>
              </>
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
    cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    seta: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    setaOff: { opacity: 0.35 },
    setaTexto: { color: c.text, fontSize: 22, lineHeight: 24 },
    mesAno: { color: c.text, fontSize: 16, fontWeight: '800' },

    semana: { flexDirection: 'row', marginBottom: 4 },
    diaSemana: { flex: 1, textAlign: 'center', color: c.textMuted, fontSize: 12, fontWeight: '700' },
    gradeDias: { flexDirection: 'row', flexWrap: 'wrap' },
    celula: { width: `${100 / 7}%`, height: 40, alignItems: 'center', justifyContent: 'center' },
    dia: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    diaAtivo: { backgroundColor: c.primarySoft },
    diaTexto: { color: c.text, fontSize: 14 },
    textoAtivo: { color: c.accent, fontWeight: '800' },
    dica: { color: c.textMuted, fontSize: 11, textAlign: 'center', marginTop: 10 },

    linhaAno: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    anoTexto: { color: c.text, fontSize: 20, fontWeight: '800' },
    gradeMeses: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    mes: { width: '23.5%', paddingVertical: 14, borderRadius: 12, backgroundColor: c.surfaceAlt, alignItems: 'center' },
    mesAtivo: { backgroundColor: c.primary },
    mesTexto: { color: c.text, fontSize: 14, fontWeight: '600' },
    mesTextoAtivo: { color: c.onPrimary, fontWeight: '800' },
    off: { opacity: 0.3 },

    cancelar: { alignItems: 'center', paddingTop: 14 },
    cancelarTexto: { color: c.textSecondary, fontSize: 14, fontWeight: '600' },
  });
