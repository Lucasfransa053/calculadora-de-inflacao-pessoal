import { Platform } from 'react-native';
import { IpcaDTO, IpcaPonto } from '../types/ipca';

/**
 * IMPORTANTE — endereço do backend:
 *
 * O backend Spring Boot roda em http://localhost:8080, mas "localhost" tem
 * significados diferentes dependendo de onde o app React Native está rodando:
 *
 * - Emulador Android:      use 10.0.2.2 (aponta para o localhost da sua máquina)
 * - Simulador iOS:         localhost funciona normalmente
 * - Celular físico (Expo Go): use o IP da sua máquina na rede local, ex: 192.168.0.10
 *   (rode `ipconfig` no Windows para descobrir; celular e PC precisam estar na mesma Wi-Fi)
 * - Web (expo start --web): localhost funciona normalmente
 *
 * Ajuste a constante abaixo conforme onde for testar.
 */
const HOST = Platform.select({
  android: '10.0.2.2',
  default: 'localhost',
});

// Troque pelo IP da sua máquina se for testar em um celular físico via Expo Go,
// ex: export const API_BASE_URL = 'http://192.168.0.10:8080/api';
export const API_BASE_URL = `http://192.168.0.2:8080/api`;

export async function buscarHistoricoIpca(): Promise<IpcaPonto[]> {
  const response = await fetch(`${API_BASE_URL}/ipca/historico`);

  if (!response.ok) {
    throw new Error(`Erro ao buscar histórico do IPCA (status ${response.status})`);
  }

  const dados: IpcaDTO[] = await response.json();

  return dados
    .map((item) => ({
      data: item.data,
      dataObj: parseDataBr(item.data),
      valorPercentual: Number(item.valor.replace(',', '.')),
    }))
    .sort((a, b) => a.dataObj.getTime() - b.dataObj.getTime());
}

// Converte "dd/MM/yyyy" (formato do Banco Central) para Date
function parseDataBr(data: string): Date {
  const [dia, mes, ano] = data.split('/').map(Number);
  return new Date(ano, mes - 1, dia);
}
