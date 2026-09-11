import { IpcaPonto } from '../types/ipca';

export interface ResultadoCalculo {
  valorInicial: number;
  valorCorrigido: number;
  inflacaoAcumuladaPercentual: number;
  mesesConsiderados: number;
}

/**
 * Calcula o valor corrigido pela inflação (IPCA) acumulada entre duas datas.
 * @param historico Lista de pontos do IPCA (mensal), já ordenada por data.
 * @param valorInicial Valor original em reais.
 * @param dataInicial Data a partir da qual o valor deve ser corrigido.
 * @param dataFinal Data final da correção (padrão: hoje / último dado disponível).
 */
export function calcularValorCorrigido(
  historico: IpcaPonto[],
  valorInicial: number,
  dataInicial: Date,
  dataFinal?: Date
): ResultadoCalculo {
  if (historico.length === 0) {
    throw new Error('Histórico do IPCA vazio.');
  }

  const fim = dataFinal ?? historico[historico.length - 1].dataObj;

  const pontosNoPeriodo = historico.filter(
    (ponto) => ponto.dataObj >= inicioDoMes(dataInicial) && ponto.dataObj <= fim
  );

  if (pontosNoPeriodo.length === 0) {
    throw new Error('Não há dados de IPCA no período selecionado.');
  }

  // Acumula a inflação compondo os percentuais mensais: (1 + i1) * (1 + i2) * ...
  const fatorAcumulado = pontosNoPeriodo.reduce(
    (fator, ponto) => fator * (1 + ponto.valorPercentual / 100),
    1
  );

  const valorCorrigido = valorInicial * fatorAcumulado;
  const inflacaoAcumuladaPercentual = (fatorAcumulado - 1) * 100;

  return {
    valorInicial,
    valorCorrigido,
    inflacaoAcumuladaPercentual,
    mesesConsiderados: pontosNoPeriodo.length,
  };
}

function inicioDoMes(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), 1);
}
