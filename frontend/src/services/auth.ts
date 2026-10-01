import { Platform } from 'react-native';
import { API_BASE_URL } from './api';

export interface Usuario {
  email: string;
  nome: string;
}

const CHAVE_SESSAO = '@sessao';

async function chamarAuth(caminho: 'login' | 'registro', corpo: object): Promise<Usuario> {
  let resposta: Response;
  try {
    resposta = await fetch(`${API_BASE_URL}/auth/${caminho}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
  }

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => null);
    throw new Error(erro?.message || `Erro no servidor (status ${resposta.status}).`);
  }

  const dados = (await resposta.json()) as Usuario;
  return { email: dados.email, nome: dados.nome };
}

/** Lança Error com a mensagem a exibir na tela quando e-mail/senha estão incorretos. */
export function autenticar(email: string, senha: string): Promise<Usuario> {
  return chamarAuth('login', { email, senha });
}

/** Cria a conta no backend. Lança Error com a mensagem a exibir (ex.: e-mail já cadastrado). */
export function criarConta(nome: string, email: string, senha: string): Promise<Usuario> {
  return chamarAuth('registro', { nome, email, senha });
}

// ---- Sessão (persistida só na Web, como já é feito com tema e aba ativa) ----

export function lerSessao(): Usuario | null {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const bruto = window.localStorage.getItem(CHAVE_SESSAO);
      if (!bruto) return null;
      const dados = JSON.parse(bruto) as Partial<Usuario>;
      if (typeof dados.email === 'string' && typeof dados.nome === 'string') {
        return { email: dados.email, nome: dados.nome };
      }
    }
  } catch {
    // armazenamento indisponível ou conteúdo inválido: segue sem sessão
  }
  return null;
}

export function salvarSessao(usuario: Usuario): void {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.setItem(CHAVE_SESSAO, JSON.stringify(usuario));
    }
  } catch {
    // ignora
  }
}

export function limparSessao(): void {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.removeItem(CHAVE_SESSAO);
    }
  } catch {
    // ignora
  }
}
