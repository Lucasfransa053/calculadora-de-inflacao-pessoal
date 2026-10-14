import { Platform } from 'react-native';
import { API_BASE_URL } from './api';

export interface Usuario {
  email: string;
  nome: string;
  token?: string;
}

const CHAVE_SESSAO = '@sessao';

export async function solicitarRedefinicaoSenha(email: string): Promise<void> {
  let resposta: Response;
  try {
    resposta = await fetch(`${API_BASE_URL}/auth/password-reset/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
  }
  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => null);
    throw new Error(erro?.message || 'Não foi possível solicitar a redefinição. Tente novamente.');
  }
}

export async function redefinirSenha(token: string, novaSenha: string): Promise<void> {
  let resposta: Response;
  try {
    resposta = await fetch(`${API_BASE_URL}/auth/password-reset/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, novaSenha }),
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
  }
  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => null);
    throw new Error(erro?.message || 'Não foi possível alterar a senha. Solicite um novo link.');
  }
}

/**
 * Realiza o login no backend, obtém o Token JWT e salva a sessão.
 */
export async function autenticar(email: string, senha: string): Promise<Usuario> {
  let resposta: Response;
  try {
    resposta = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
  }

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => null);
    throw new Error(erro?.message || `E-mail ou senha incorretos (status ${resposta.status}).`);
  }

  // Backend retorna o token e o nome completo cadastrado.
  const dados = (await resposta.json()) as { token: string; nome?: string };

  const usuario: Usuario = {
    email: email,
    nome: dados.nome?.trim() || email.split('@')[0],
    token: dados.token,
  };

  salvarSessao(usuario);
  return usuario;
}

/**
 * Cria a conta no backend e em seguida realiza o login para obter o token JWT.
 */
export async function criarConta(nome: string, email: string, senha: string): Promise<Usuario> {
  let resposta: Response;
  try {
    resposta = await fetch(`${API_BASE_URL}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha }),
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
  }

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => null);
    throw new Error(erro?.message || `Erro no servidor (${resposta.status}).`);
  }

  // Após cadastrar com sucesso, faz o login para obter o token JWT
  const usuarioLogado = await autenticar(email, senha);
  // Garante que usamos o nome completo informado no cadastro
  const usuarioComNome: Usuario = { ...usuarioLogado, nome };
  salvarSessao(usuarioComNome);

  return usuarioComNome;
}

// ---- Gestão de Sessão e Token ----

export function lerSessao(): Usuario | null {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const bruto = window.localStorage.getItem(CHAVE_SESSAO);
      if (!bruto) return null;
      return JSON.parse(bruto) as Usuario;
    }
  } catch {
    // armazenamento indisponível ou conteúdo inválido
  }
  return null;
}

export function obterToken(): string | null {
  const usuario = lerSessao();
  return usuario?.token || null;
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
