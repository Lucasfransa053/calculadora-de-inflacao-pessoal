import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, useTheme } from '../theme';
import { useIsDesktop } from '../hooks/useLayout';

interface Props {
  titulo: string;
  subtitulo: string;
  children?: React.ReactNode; // ex.: pílula "Base atualizada até..."
}

export function PageHeader({ titulo, subtitulo, children }: Props) {
  const { colors, isDark, toggleTheme } = useTheme();
  const desktop = useIsDesktop();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.linha}>
      <View style={styles.textos}>
        <Text style={[styles.titulo, desktop && styles.tituloDesktop]}>{titulo}</Text>
        <Text style={styles.subtitulo}>{subtitulo}</Text>
        {children}
      </View>
      {/* No celular o botão de tema fica na barra superior; no computador ele fica aqui. */}
      {desktop && (
        <TouchableOpacity style={styles.botaoTema} onPress={toggleTheme} activeOpacity={0.7}>
          <Text style={styles.temaIcone}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (c: Colors) =>
  StyleSheet.create({
    linha: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 24 },
    textos: { flex: 1 },
    titulo: { fontSize: 26, fontWeight: '800', color: c.text, letterSpacing: -0.8 },
    tituloDesktop: { fontSize: 34 },
    subtitulo: { fontSize: 14, color: c.textSecondary, marginTop: 8, lineHeight: 21 },
    botaoTema: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    temaIcone: { fontSize: 16 },
  });
