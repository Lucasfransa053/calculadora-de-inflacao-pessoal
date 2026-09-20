import { Platform } from 'react-native';

// Trata a URL dependendo da plataforma (Web, Android Emulator ou iOS/Dispositivo)
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080/api'; // IP especial para o Emulador Android acessar o Host
  }
  return 'http://localhost:8080/api'; // Para Web, iOS Simulator
};

export const API_BASE_URL = getBaseUrl();

// ==========================================
// INTERFACES (DTOs)
// ==========================================

export interface CorrecaoRequestDTO {
  valorInicial: number;
  dataInicio: string; // Formato "YYYY-MM"
  dataFim: string;    // Formato "YYYY-MM"
}

export interface CorrecaoResponseDTO {
  valorInicial: number;
  valorCorrigido: number;
  variacaoPercentualAcumulada: number;
  totalMeses: number;
}

export interface CategoriaIpca {
  id: string;
  nome: string;
}

export interface FiltroCategoriaParams {
  grupoId?: string;
  termo?: string;
}

export interface ItemGastoDTO {
  categoriaId: string;
  valorGasto: number;
}

export interface CalculoInflacaoRequestDTO {
  dataInicio: string; // Formato "YYYY-MM-DD"
  dataFim: string;    // Formato "YYYY-MM-DD"
  itensGasto: ItemGastoDTO[];
}

export interface DetalhamentoCategoriaDTO {
  categoriaId: string;
  nomeCategoria: string;
  valorGastoInicial: number;
  valorGastoRecomposto: number;
  impactoFinanceiroReais: number;
  pesoPercentual: number;
  inflacaoAcumuladaCategoriaPercentual: number;
}

export interface CalculoInflacaoResponseDTO {
  inflacaoPessoalPercentual: number;
  inflacaoOficialIpcaPercentual: number;
  diferencaParaIpcaOficialPercentual: number;
  custoTotalInicial: number;
  custoTotalRecomposto: number;
  perdaPoderCompraReais: number;
  dataInicioCalculada: string;
  dataFimCalculada: string;
  mensagemAviso?: string;
  detalhamento: DetalhamentoCategoriaDTO[];
}

// ==========================================
// FUNÇÕES DE REQUISIÇÃO
// ==========================================

export async function calcularCorrecaoBackend(payload: CorrecaoRequestDTO): Promise<CorrecaoResponseDTO> {
  const response = await fetch(`${API_BASE_URL}/ipca/correcao-monetaria`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Erro no servidor (status ${response.status})`);
  }

  return response.json();
}

export async function buscarUltimoIpca(): Promise<{ dataReferencia: string; valorPercentual: number }> {
  const response = await fetch(`${API_BASE_URL}/ipca/ultimo-registro`);
  if (!response.ok) {
    throw new Error('Falha ao obter último IPCA disponível.');
  }
  return response.json();
}

export const buscarCategoriasIpca = async (params?: FiltroCategoriaParams): Promise<CategoriaIpca[]> => {
  const queryParams = new URLSearchParams();
  
  if (params?.grupoId) {
    queryParams.append('grupoId', params.grupoId);
  }
  if (params?.termo) {
    queryParams.append('termo', params.termo);
  }

  const url = `${API_BASE_URL}/inflacao-pessoal/categorias?${queryParams.toString()}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Erro ao carregar categorias (${response.status})`);
  }

  return response.json();
};

export async function buscarCategoriasValidas(inicio: string, fim: string): Promise<CategoriaIpca[]> {
  const url = `${API_BASE_URL}/inflacao-pessoal/categorias/validas?inicio=${inicio}&fim=${fim}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Erro ao carregar categorias válidas (${response.status})`);
  }

  return response.json();
}

export async function calcularInflacaoPessoal(
  payload: CalculoInflacaoRequestDTO
): Promise<CalculoInflacaoResponseDTO> {
  const response = await fetch(`${API_BASE_URL}/inflacao-pessoal/calcular`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage = errorData?.message || `Erro no cálculo (${response.status})`;
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function sincronizarPeriodoIpca(periodo: string): Promise<string> {
  const response = await fetch(
    `${API_BASE_URL}/inflacao-pessoal/sincronizar-periodo?periodo=${periodo}`,
    { method: 'POST' }
  );
  if (!response.ok) {
    throw new Error('Falha ao sincronizar dados com IBGE.');
  }
  return response.text();
}