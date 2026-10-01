import { useWindowDimensions } from 'react-native';

// A partir dessa largura usamos o layout de computador (sidebar fixa, duas colunas).
export const DESKTOP_BREAKPOINT = 960;

export function useIsDesktop(): boolean {
  const { width } = useWindowDimensions();
  return width >= DESKTOP_BREAKPOINT;
}
