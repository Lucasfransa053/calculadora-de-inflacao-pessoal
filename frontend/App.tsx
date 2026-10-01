import React, { useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Animated,
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
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { BrandMark } from './src/components/Brand';
import { UserBar, UserCard } from './src/components/UserPanel';
import { useIsDesktop } from './src/hooks/useLayout';
import { Colors, ThemeProvider, useTheme } from './src/theme';

const SIDEBAR_WIDTH = 350;
const DRAWER_WIDTH = 280;

type Tela = 'oficial' | 'pessoal';

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
  const { usuario } = useAuth();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {usuario ? <AppContent /> : <LoginScreen />}
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
    { id: 'oficial', icone: '📊', rotulo: 'IPCA Oficial' },
    { id: 'pessoal', icone: '🛒', rotulo: 'Inflação Pessoal' },
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

function AppContent() {
  const { colors, isDark, toggleTheme } = useTheme();
  const desktop = useIsDesktop();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Inicializa o estado lendo o localStorage (na Web) ou usando 'oficial' (Calculadora IPCA) como padrão
  const [telaAtiva, setTelaAtiva] = useState<Tela>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const salva = localStorage.getItem('@aba_ativa');
      if (salva === 'oficial' || salva === 'pessoal') {
        return salva;
      }
    }
    return 'oficial';
  });

  const [menuAberto, setMenuAberto] = useState(false);

  // Animação do menu lateral (celular) e do fundo escurecido
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const toggleMenu = (abrir: boolean) => {
    if (abrir) {
      setMenuAberto(true);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setMenuAberto(false);
      });
    }
  };

  const selecionarTela = (tela: Tela) => {
    setTelaAtiva(tela);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.setItem('@aba_ativa', tela);
    }
    if (menuAberto) toggleMenu(false);
  };

  const conteudo = telaAtiva === 'oficial' ? <CalculadoraIpcaScreen /> : <InflacaoPessoalScreen />;

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

  // ---------- Celular: topbar + menu deslizante + barra do usuário embaixo ----------
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => toggleMenu(!menuAberto)}
          activeOpacity={0.7}
          accessibilityLabel="Abrir menu"
        >
          <View style={styles.hamburgerIcon}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </View>
        </TouchableOpacity>

        <BrandMark size={32} />
        <Text style={styles.topBarTitle} numberOfLines={1}>
          InflateIQ
        </Text>

        <TouchableOpacity style={styles.iconButton} onPress={toggleTheme} activeOpacity={0.7}>
          <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mainLayout}>
        {menuAberto && (
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => toggleMenu(false)} />
          </Animated.View>
        )}

        <Animated.View
          style={[
            styles.drawer,
            !menuAberto && { boxShadow: 'none' },
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <SidebarHeader styles={styles} />
          <Navegacao telaAtiva={telaAtiva} onSelecionar={selecionarTela} styles={styles} />
        </Animated.View>

        <View style={styles.conteudo}>{conteudo}</View>
      </View>

      <UserBar />
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
      zIndex: 30,
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
    hamburgerIcon: { width: 16, height: 12, justifyContent: 'space-between' },
    hamburgerLine: { width: '100%', height: 2, backgroundColor: c.text, borderRadius: 2 },
    themeIcon: { fontSize: 16 },
    topBarTitle: { flex: 1, color: c.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
    mainLayout: { flex: 1, position: 'relative' },
    backdrop: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: c.overlay,
      zIndex: 10,
    },
    drawer: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      width: DRAWER_WIDTH,
      backgroundColor: c.surface,
      borderRightWidth: 1,
      borderRightColor: c.border,
      padding: 20,
      zIndex: 20,
      boxShadow: '8px 0px 30px rgba(0, 0, 0, 0.25)',
    },

    // compartilhado (sidebar fixa e menu deslizante)
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
