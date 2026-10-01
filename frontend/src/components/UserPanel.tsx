import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';

type Styles = ReturnType<typeof createStyles>;

function UserInfo({ nome, email, styles }: { nome: string; email: string; styles: Styles }) {
  const inicial = nome.trim().charAt(0).toUpperCase() || '?';
  return (
    <View style={styles.info}>
      <View style={styles.avatar}>
        <Text style={styles.avatarTexto}>{inicial}</Text>
      </View>
      <View style={styles.nomeBox}>
        <Text style={styles.nome} numberOfLines={1}>
          {nome}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {email}
        </Text>
        <View style={styles.statusLinha}>
          <View style={styles.statusPonto} />
          <Text style={styles.statusTexto}>Conectado</Text>
        </View>
      </View>
    </View>
  );
}

function LogoutButton({ onPress, styles, cheio }: { onPress: () => void; styles: Styles; cheio?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.sair, cheio && styles.sairCheio]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Sair"
    >
      <Text style={styles.sairTexto}>Sair</Text>
    </TouchableOpacity>
  );
}

/** Barra fixa na parte de baixo da tela (celular). */
export function UserBar() {
  const { colors } = useTheme();
  const { usuario, sair } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);
  if (!usuario) return null;
  return (
    <View style={styles.barra}>
      <View style={styles.barraInfo}>
        <UserInfo nome={usuario.nome} email={usuario.email} styles={styles} />
      </View>
      <LogoutButton onPress={sair} styles={styles} />
    </View>
  );
}

/** Cartão no rodapé da sidebar (computador). */
export function UserCard() {
  const { colors } = useTheme();
  const { usuario, sair } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);
  if (!usuario) return null;
  return (
    <View style={styles.cartao}>
      <UserInfo nome={usuario.nome} email={usuario.email} styles={styles} />
      <LogoutButton onPress={sair} styles={styles} cheio />
    </View>
  );
}

const createStyles = (c: Colors) =>
  StyleSheet.create({
    barra: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderTopColor: c.border,
      zIndex: 40,
    },
    barraInfo: { flex: 1, minWidth: 0 },
    cartao: {
      gap: 14,
      padding: 14,
      borderRadius: 18,
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.border,
    },
    info: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarTexto: { color: c.accent, fontSize: 16, fontWeight: '800' },
    nomeBox: { flex: 1, minWidth: 0 },
    nome: { color: c.text, fontSize: 15, fontWeight: '700' },
    email: { color: c.textMuted, fontSize: 12, marginTop: 1 },
    statusLinha: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    statusPonto: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.success },
    statusTexto: { color: c.textMuted, fontSize: 12, fontWeight: '500' },
    sair: {
      paddingHorizontal: 16,
      paddingVertical: 11,
      borderRadius: 12,
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sairCheio: { alignSelf: 'stretch', backgroundColor: c.surface },
    sairTexto: { color: c.danger, fontSize: 14, fontWeight: '700' },
  });
