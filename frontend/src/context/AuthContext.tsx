import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { autenticar, criarConta, limparSessao, lerSessao, Usuario } from '../services/auth';

interface AuthContextValue {
  usuario: Usuario | null;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>;
  sair: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  usuario: null,
  entrar: async () => {},
  cadastrar: async () => {},
  sair: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(lerSessao);

  const entrar = useCallback(async (email: string, senha: string) => {
    const usuarioLogado = await autenticar(email, senha);
    setUsuario(usuarioLogado);
  }, []);

  const cadastrar = useCallback(async (nome: string, email: string, senha: string) => {
    const usuarioCriado = await criarConta(nome, email, senha);
    setUsuario(usuarioCriado);
  }, []);

  const sair = useCallback(() => {
    limparSessao();
    setUsuario(null);
  }, []);

  const value = useMemo(() => ({ usuario, entrar, cadastrar, sair }), [usuario, entrar, cadastrar, sair]);
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);