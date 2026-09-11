// Espelha o record IpcaDTO(String data, String valor) do backend Spring Boot.
// "data" vem no formato dd/MM/yyyy e "valor" é a variação mensal do IPCA (%) em string.
export interface IpcaDTO {
  data: string;
  valor: string;
}

export interface IpcaPonto {
  data: string; // dd/MM/yyyy original
  dataObj: Date;
  valorPercentual: number; // valor convertido para number
}
