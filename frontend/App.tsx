import React, { useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Animated,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import CalculadoraIpcaScreen from './src/screens/CalculadoraIpcaScreen';
import InflacaoPessoalScreen from './src/screens/InflacaoPessoalScreen';

const SIDEBAR_WIDTH = 260;

export default function App() {
  // Inicializa o estado lendo o localStorage (na Web) ou usando 'oficial' (Calculadora IPCA) como padrão
  const [telaAtiva, setTelaAtiva] = useState<'oficial' | 'pessoal'>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const salva = localStorage.getItem('@aba_ativa');
      if (salva === 'oficial' || salva === 'pessoal') {
        return salva;
      }
    }
    return 'oficial'; // Define 'oficial' como padrão
  });

  const [menuAberto, setMenuAberto] = useState(false);

  // Animação do Sidebar e Backdrop
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const toggleMenu = (abrir: boolean) => {
    if (abrir) {
      setMenuAberto(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMenuAberto(false);
      });
    }
  };

  const selecionarTela = (tela: 'oficial' | 'pessoal') => {
    setTelaAtiva(tela);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.setItem('@aba_ativa', tela);
    }
    toggleMenu(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Topbar Fixo */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.menuIconButton}
          onPress={() => toggleMenu(!menuAberto)}
          activeOpacity={0.7}
        >
          {/* Ícone de Menu Hambúrguer */}
          <View style={styles.hamburgerIcon}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </View>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Sistema de Correção Monetária</Text>
      </View>

      <View style={styles.mainLayout}>
        {/* Overlay escuro animado */}
        {menuAberto && (
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={() => toggleMenu(false)}
            />
          </Animated.View>
        )}

        {/* Sidebar animado deslizante */}
        <Animated.View
          style={[
            styles.sidebar,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarBrand}>NAVEGAÇÃO</Text>
          </View>

          <Text style={styles.sidebarSectionTitle}>FERRAMENTAS</Text>

          <TouchableOpacity
            style={[
              styles.navItem,
              telaAtiva === 'oficial' && styles.navItemAtivo,
            ]}
            onPress={() => selecionarTela('oficial')}
            activeOpacity={0.8}
          >
            <Text style={styles.navIcon}>📊</Text>
            <Text
              style={[
                styles.navLabel,
                telaAtiva === 'oficial' && styles.navLabelAtivo,
              ]}
            >
              IPCA Oficial
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navItem,
              telaAtiva === 'pessoal' && styles.navItemAtivo,
            ]}
            onPress={() => selecionarTela('pessoal')}
            activeOpacity={0.8}
          >
            <Text style={styles.navIcon}>🛒</Text>
            <Text
              style={[
                styles.navLabel,
                telaAtiva === 'pessoal' && styles.navLabelAtivo,
              ]}
            >
              Inflação Pessoal
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Área de Conteúdo */}
        <View style={styles.conteudo}>
          {telaAtiva === 'oficial' ? (
            <CalculadoraIpcaScreen />
          ) : (
            <InflacaoPessoalScreen />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topBar: {
    height: 56,
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    zIndex: 30,
  },
  menuIconButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerIcon: {
    width: 18,
    height: 14,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#38BDF8',
    borderRadius: 2,
  },
  topBarTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '700',
  },
  mainLayout: {
    flex: 1,
    position: 'relative',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    zIndex: 10,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#1E293B',
    borderRightWidth: 1,
    borderRightColor: '#334155',
    padding: 16,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  sidebarHeader: {
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  sidebarBrand: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  sidebarSectionTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navItemAtivo: {
    backgroundColor: '#0F172A',
    borderColor: '#38BDF8',
  },
  navIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  navLabel: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  navLabelAtivo: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  conteudo: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});