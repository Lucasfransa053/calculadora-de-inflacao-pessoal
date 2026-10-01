import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { autenticar, criarConta, limparSessao, lerSessao, salvarSessao, Usuario } from '../services/auth';

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

  // Lança Error com a mensagem a exibir na tela de login quando os dados estão incorretos.
  const entrar = useCallback(async (email: string, senha: string) => {
    const logado = await autenticar(email, senha);
    salvarSessao(logado);
    setUsuario(logado);
  }, []);

  // Cria a conta e já deixa o usuário logado. Lança Error com a mensagem a exibir.
  const cadastrar = useCallback(async (nome: string, email: string, senha: string) => {
    const criado = await criarConta(nome, email, senha);
    salvarSessao(criado);
    setUsuario(criado);
  }, []);

  const sair = useCallback(() => {
    limparSessao();
    setUsuario(null);
  }, []);

  const value = useMemo(() => ({ usuario, entrar, cadastrar, sair }), [usuario, entrar, cadastrar, sair]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
