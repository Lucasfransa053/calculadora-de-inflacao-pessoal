import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Altura do teclado virtual no navegador (no app nativo o KeyboardAvoidingView resolve).
export function useKeyboardHeight(): number {
  const [altura, setAltura] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const vv = window.visualViewport;
    if (!vv) return;

    const atualizar = () => {
      const h = window.innerHeight - vv.height - vv.offsetTop;
      setAltura(h > 100 ? h : 0); // ignora pequenas variações da barra do navegador
    };

    atualizar();
    vv.addEventListener('resize', atualizar);
    vv.addEventListener('scroll', atualizar);
    return () => {
      vv.removeEventListener('resize', atualizar);
      vv.removeEventListener('scroll', atualizar);
    };
  }, []);

  return altura;
}
