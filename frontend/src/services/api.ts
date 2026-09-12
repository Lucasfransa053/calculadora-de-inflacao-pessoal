import { Platform } from 'react-native';

export const API_BASE_URL = 'http://localhost:8080/api';

export interface CorrecaoRequestDTO {
  valorInicial: number;
  dataInicio: string; // Formato "YYYY-MM" para bater com o YearMonth do Spring
  dataFim: string;    // Formato "YYYY-MM"
}

export interface CorrecaoResponseDTO {
  valorInicial: number;
  valorCorrigido: number;
  variacaoPercentualAcumulada: number;
  totalMeses: number;
}

// Interfaces para a Inflação Pessoal
export interface CategoriaIpca {
  id: string;
  nome: string;
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

export async function calcularCorrecaoBackend(payload: CorrecaoRequestDTO): Promise<CorrecaoResponseDTO> {
  const response = await fetch(`${API_BASE_URL}/ipca/correcao-monetaria`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Erro no servidor (status ${response.status})`);
  }

  return await response.json();
}

export async function buscarUltimoIpca(): Promise<{ dataReferencia: string; valorPercentual: number }> {
  const response = await fetch(`${API_BASE_URL}/ipca/ultimo-registro`);
  if (!response.ok) {
    throw new Error('Falha ao obter último IPCA disponível.');
  }
  return response.json();
}

// 1. Buscar Categorias do Banco
export async function buscarCategoriasIpca(): Promise<CategoriaIpca[]> {
  const response = await fetch(`${API_BASE_URL}/inflacao-pessoal/categorias`);
  if (!response.ok) {
    throw new Error('Falha ao buscar categorias do IPCA.');
  }
  return response.json();
}

// 2. Calcular Inflação Pessoal
export async function calcularInflacaoPessoal(
  payload: CalculoInflacaoRequestDTO
): Promise<CalculoInflacaoResponseDTO> {
  const response = await fetch(`${API_BASE_URL}/inflacao-pessoal/calcular`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Erro no cálculo (${response.status})`);
  }

  return response.json();
}

// 3. (Opcional) Forçar Carga de Dados via Frontend se o banco estiver vazio
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