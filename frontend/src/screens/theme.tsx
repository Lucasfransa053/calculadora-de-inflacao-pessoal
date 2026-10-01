import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';

export const AMARELO = '#FFE100';

export interface Colors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string; // amarelo da marca (preenchimento de botões)
  onPrimary: string; // texto sobre o amarelo
  primarySoft: string; // amarelo translúcido para fundos de destaque
  accent: string; // amarelo legível como TEXTO / linha (escurecido no modo claro)
  danger: string;
  dangerSoft: string;
  success: string;
  warnBg: string;
  warnBorder: string;
  warnText: string;
  warnBadgeBg: string;
  warnBadgeText: string;
  overlay: string;
  cardShadow: string;
  buttonShadow: string;
}

export const dark: Colors = {
  bg: '#0A0A0A',
  surface: '#141414',
  surfaceAlt: '#1C1C1C',
  border: '#2A2A2A',
  text: '#FAFAFA',
  textSecondary: '#A3A3A3',
  textMuted: '#737373',
  primary: AMARELO,
  onPrimary: '#000000',
  primarySoft: 'rgba(255, 225, 0, 0.10)',
  accent: AMARELO,
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.14)',
  success: '#4ADE80',
  warnBg: 'rgba(245, 158, 11, 0.12)',
  warnBorder: 'rgba(245, 158, 11, 0.5)',
  warnText: '#FDE68A',
  warnBadgeBg: 'rgba(245, 158, 11, 0.2)',
  warnBadgeText: '#FEF08A',
  overlay: 'rgba(0, 0, 0, 0.7)',
  cardShadow: '0px 0px 0px rgba(0, 0, 0, 0)',
  buttonShadow: '0px 6px 20px rgba(255, 225, 0, 0.18)',
};

export const light: Colors = {
  bg: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F5F5',
  border: '#E5E5E5',
  text: '#0A0A0A',
  textSecondary: '#525252',
  textMuted: '#737373',
  primary: AMARELO,
  onPrimary: '#000000',
  primarySoft: 'rgba(255, 225, 0, 0.22)',
  accent: '#8A6A00', // amarelo só como preenchimento; para texto usa o dourado escuro
  danger: '#DC2626',
  dangerSoft: 'rgba(220, 38, 38, 0.10)',
  success: '#15803D',
  warnBg: '#FFFBEB',
  warnBorder: '#F59E0B',
  warnText: '#92400E',
  warnBadgeBg: '#FEF3C7',
  warnBadgeText: '#92400E',
  overlay: 'rgba(0, 0, 0, 0.45)',
  cardShadow: '0px 4px 20px rgba(0, 0, 0, 0.06)',
  buttonShadow: '0px 6px 16px rgba(255, 190, 0, 0.35)',
};

interface ThemeContextValue {
  colors: Colors;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: dark,
  isDark: true,
  toggleTheme: () => {},
});

const CHAVE = '@tema';

function lerTemaSalvo(): 'light' | 'dark' | null {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const v = window.localStorage.getItem(CHAVE);
      if (v === 'light' || v === 'dark') return v;
    }
  } catch {
    // ignora: armazenamento indisponível
  }
  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const sistema = useColorScheme(); // segue o tema do celular/navegador por padrão
  const [escolhido, setEscolhido] = useState<'light' | 'dark' | null>(lerTemaSalvo);

  const isDark = (escolhido ?? (sistema === 'light' ? 'light' : 'dark')) === 'dark';

  const toggleTheme = useCallback(() => {
    const novo = isDark ? 'light' : 'dark';
    setEscolhido(novo);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.setItem(CHAVE, novo);
      }
    } catch {
      // ignora
    }
  }, [isDark]);

  const value = useMemo(
    () => ({ colors: isDark ? dark : light, isDark, toggleTheme }),
    [isDark, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
