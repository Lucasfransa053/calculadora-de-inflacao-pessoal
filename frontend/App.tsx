import React, { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import CalculadoraIpcaScreen from './src/screens/CalculadoraIpcaScreen';
import InflacaoPessoalScreen from './src/screens/InflacaoPessoalScreen';
import LoginScreen from './src/screens/LoginScreen';
import PasswordResetScreen from './src/screens/PasswordResetScreen';
import HomeScreen from './src/screens/HomeScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { BrandMark } from './src/components/Brand';
import { UserCard } from './src/components/UserPanel';
import { useIsDesktop } from './src/hooks/useLayout';
import { Colors, ThemeProvider, useTheme } from './src/theme';

const SIDEBAR_WIDTH = 350;

type Tela = 'inicio' | 'oficial' | 'pessoal' | 'conta';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// Só mostra a home depois do login; ao sair, volta para a tela de login.
function Root() {
  const { isDark } = useTheme();
  const { usuario, sair } = useAuth();
  const [tokenRedefinicao, setTokenRedefinicao] = useState<string | null>(null);

  useEffect(() => {
    const tokenDaUrl = (url: string | null): string | null => {
      if (!url) return null;
      try {
        return new URL(url).searchParams.get('token');
      } catch {
        // Fallback para ambientes que não suportem a URL completa.
        const match = url.match(/[?&]token=([^&#]+)/);
        return match ? decodeURIComponent(match[1]) : null;
      }
    };

    let ativo = true;
    const abrirLinkInicial = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        let token = tokenDaUrl(initialUrl);
        if (!token && Platform.OS === 'web' && typeof window !== 'undefined') {
          token = new URLSearchParams(window.location.search).get('token');
        }
        if (ativo && token) setTokenRedefinicao(token);
      } catch {
        // Mantém o app utilizável mesmo se não for possível ler o link inicial.
      }
    };

    void abrirLinkInicial();
    const subscription = Linking.addEventListener('url', ({ url }) => {
      const token = tokenDaUrl(url);
      if (token) setTokenRedefinicao(token);
    });

    return () => {
      ativo = false;
      subscription.remove();
    };
  }, []);

  const concluirRedefinicao = () => {
    sair();
    setTokenRedefinicao(null);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }
  };

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {tokenRedefinicao
        ? <PasswordResetScreen token={tokenRedefinicao} onDone={concluirRedefinicao} />
        : usuario ? <AppContent /> : <LoginScreen />}
    </>
  );
}

function SidebarHeader({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.sidebarHeader}>
      <BrandMark size={44} />
      <View>
        <Text style={styles.sidebarBrand}>InflateIQ</Text>
        <Text style={styles.sidebarBrandSub}>Calculadora IPCA</Text>
      </View>
    </View>
  );
}

function Navegacao({
  telaAtiva,
  onSelecionar,
  styles,
}: {
  telaAtiva: Tela;
  onSelecionar: (t: Tela) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const itens: { id: Tela; icone: string; rotulo: string }[] = [
    { id: 'inicio', icone: '⌂', rotulo: 'Início' },
    { id: 'oficial', icone: '↗', rotulo: 'IPCA Oficial' },
    { id: 'pessoal', icone: '◉', rotulo: 'Inflação Pessoal' },
  ];
  return (
    <View>
      <Text style={styles.sidebarSectionTitle}>FERRAMENTAS</Text>
      {itens.map((item) => {
        const ativo = telaAtiva === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.navItem, ativo && styles.navItemAtivo]}
            onPress={() => onSelecionar(item.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.navIcon}>{item.icone}</Text>
            <Text style={[styles.navLabel, ativo && styles.navLabelAtivo]}>{item.rotulo}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Ícones das abas, desenhados com Views (sem biblioteca de ícones).
// Todos ocupam a mesma caixa de 22 x 22 para ficarem com o mesmo tamanho.
const ICONE = 22;

function IconeAba({ id, cor, fundo }: { id: Tela; cor: string; fundo: string }) {
  const caixa = { width: ICONE, height: ICONE, alignItems: 'center' as const };

  if (id === 'inicio') {
    // casa: telhado + corpo com porta
    return (
      <View style={[caixa, { justifyContent: 'flex-end' }]}>
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 11,
            borderRightWidth: 11,
            borderBottomWidth: 9,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: cor,
          }}
        />
        <View style={{ width: 16, height: 12, backgroundColor: cor, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 }}>
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 5.5,
              width: 5,
              height: 7,
              backgroundColor: fundo,
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
            }}
          />
        </View>
      </View>
    );
  }

  if (id === 'oficial') {
    // barras crescendo (índice oficial)
    return (
      <View style={[caixa, { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }]}>
        <View style={{ width: 6, height: 9, borderRadius: 2, backgroundColor: cor }} />
        <View style={{ width: 6, height: 14, borderRadius: 2, backgroundColor: cor }} />
        <View style={{ width: 6, height: 21, borderRadius: 2, backgroundColor: cor }} />
      </View>
    );
  }

  if (id === 'pessoal') {
    // alvo: anel com ponto no centro
    return (
      <View style={[caixa, { justifyContent: 'center' }]}>
        <View
          style={{
            width: ICONE,
            height: ICONE,
            borderRadius: ICONE / 2,
            borderWidth: 3,
            borderColor: cor,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cor }} />
        </View>
      </View>
    );
  }

  // conta: pessoa (cabeça + ombros)
  return (
    <View style={[caixa, { justifyContent: 'space-between' }]}>
      <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: cor }} />
      <View
        style={{
          width: 18,
          height: 9,
          borderTopLeftRadius: 9,
          borderTopRightRadius: 9,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          backgroundColor: cor,
        }}
      />
    </View>
  );
}

// Barra de abas fixa embaixo (celular): um ícone por tela, a aba ativa fica em amarelo.
function BarraAbas({
  telaAtiva,
  onSelecionar,
  styles,
}: {
  telaAtiva: Tela;
  onSelecionar: (t: Tela) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const { colors } = useTheme();
  const abas: { id: Tela; rotulo: string }[] = [
    { id: 'inicio', rotulo: 'Início' },
    { id: 'oficial', rotulo: 'IPCA' },
    { id: 'pessoal', rotulo: 'Pessoal' },
    { id: 'conta', rotulo: 'Conta' },
  ];
  return (
    <View style={styles.barraAbas}>
      {abas.map((aba) => {
        const ativo = telaAtiva === aba.id;
        return (
          <TouchableOpacity
            key={aba.id}
            style={styles.aba}
            onPress={() => onSelecionar(aba.id)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativo }}
            accessibilityLabel={aba.rotulo}
          >
            <View style={styles.abaIcone}>
              <IconeAba id={aba.id} cor={ativo ? colors.primary : colors.textMuted} fundo={colors.surface} />
            </View>
            <Text style={[styles.abaRotulo, ativo && styles.abaRotuloAtivo]}>{aba.rotulo}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Aba "Conta" (celular): quem está conectado, tema e sair.
function ContaScreen({ styles }: { styles: ReturnType<typeof createStyles> }) {
  const { isDark, toggleTheme } = useTheme();
  return (
    <View style={styles.contaTela}>
      <Text style={styles.contaTitulo}>Conta</Text>
      <UserCard />
      <TouchableOpacity style={styles.temaLinha} onPress={toggleTheme} activeOpacity={0.8}>
        <Text style={styles.navLabel}>Tema {isDark ? 'escuro' : 'claro'}</Text>
        <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function AppContent() {
  const { colors, isDark, toggleTheme } = useTheme();
  const desktop = useIsDesktop();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Cada login começa na home, onde a pessoa escolhe uma calculadora.
  const [telaAtiva, setTelaAtiva] = useState<Tela>('inicio');

  const selecionarTela = (tela: Tela) => {
    setTelaAtiva(tela);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.setItem('@aba_ativa', tela);
    }
  };

  const conteudo = telaAtiva === 'inicio'
    ? <HomeScreen onSelecionar={selecionarTela} />
    : telaAtiva === 'oficial'
      ? <CalculadoraIpcaScreen />
      : telaAtiva === 'pessoal'
        ? <InflacaoPessoalScreen />
        : <ContaScreen styles={styles} />;

  // ---------- Computador: sidebar fixa, com usuário e "Sair" no rodapé ----------
  if (desktop) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.desktopLinha}>
          <View style={styles.sidebarFixa}>
            <SidebarHeader styles={styles} />
            <Navegacao telaAtiva={telaAtiva} onSelecionar={selecionarTela} styles={styles} />
            <View style={{ flex: 1 }} />
            <UserCard />
          </View>
          <View style={styles.conteudo}>{conteudo}</View>
        </View>
      </SafeAreaView>
    );
  }

  // ---------- Celular: topbar + conteúdo + barra de abas embaixo ----------
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <BrandMark size={32} />
        <Text style={styles.topBarTitle} numberOfLines={1}>
          InflateIQ
        </Text>
        <TouchableOpacity style={styles.iconButton} onPress={toggleTheme} activeOpacity={0.7}>
          <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.conteudo}>{conteudo}</View>

      <BarraAbas telaAtiva={telaAtiva} onSelecionar={selecionarTela} styles={styles} />
    </SafeAreaView>
  );
}

const createStyles = (c: Colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    conteudo: { flex: 1, backgroundColor: c.bg },

    // computador
    desktopLinha: { flex: 1, flexDirection: 'row' },
    sidebarFixa: {
      width: SIDEBAR_WIDTH,
      backgroundColor: c.surface,
      borderRightWidth: 1,
      borderRightColor: c.border,
      padding: 20,
    },

    // celular
    topBar: {
      height: 64,
      backgroundColor: c.surface,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeIcon: { fontSize: 16 },
    topBarTitle: { flex: 1, color: c.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },

    // barra de abas (celular)
    barraAbas: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: 8,
      paddingBottom: 8,
      paddingHorizontal: 8,
    },
    aba: { flex: 1, alignItems: 'center', gap: 4 },
    abaIcone: { width: 48, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    abaRotulo: { fontSize: 11, fontWeight: '600', color: c.textMuted },
    abaRotuloAtivo: { color: c.text, fontWeight: '800' },

    // aba Conta
    contaTela: { flex: 1, padding: 18, gap: 16 },
    contaTitulo: { color: c.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.6, marginTop: 6 },
    temaLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderRadius: 16,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },

    // sidebar fixa (computador)
    sidebarHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingBottom: 20,
      marginBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    sidebarBrand: { color: c.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
    sidebarBrandSub: { color: c.textMuted, fontSize: 12, marginTop: 1 },
    sidebarSectionTitle: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.2,
      marginBottom: 10,
      marginTop: 4,
    },
    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderRadius: 14,
      marginBottom: 6,
    },
    navItemAtivo: { backgroundColor: c.primary },
    navIcon: { fontSize: 16, marginRight: 12 },
    navLabel: { color: c.textSecondary, fontSize: 14, fontWeight: '600' },
    navLabelAtivo: { color: c.onPrimary, fontWeight: '800' },
  });
