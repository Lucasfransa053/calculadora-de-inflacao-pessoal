# Calculadora de Inflação Pessoal — App (React Native / Expo)

Tela única com duas funcionalidades:
1. **Calculadora**: digite um valor e um mês/ano, o app calcula o valor corrigido pelo IPCA acumulado até o dado mais recente disponível.
2. **Histórico do IPCA**: lista expansível com todos os pontos retornados pelo backend.

## Pré-requisitos

* Node.js (LTS) instalado
* Backend rodando em `http://localhost:8080` (veja o projeto `backend/`)
* App **Expo Go** instalado no celular (Android/iOS) — só se for testar em um dispositivo físico

## Como rodar

```bash
cd frontend-app
npm install
npm start
```

Isso abre o Metro Bundler no terminal/navegador. A partir daí:
- Aperte `a` para abrir no emulador Android
- Aperte `i` para abrir no simulador iOS (só em Mac)
- Aperte `w` para abrir no navegador
- Ou escaneie o QR code com o app **Expo Go** no celular

## Configurar o endereço do backend

O arquivo `src/services/api.ts` já trata automaticamente o emulador Android (`10.0.2.2`).
Se for testar em um **celular físico** via Expo Go, o app e o computador precisam estar na mesma rede Wi-Fi, e você precisa trocar a constante `API_BASE_URL` nesse arquivo para o IP local da sua máquina, por exemplo:

```ts
export const API_BASE_URL = 'http://192.168.0.10:8080/api';
```

(Descubra seu IP local com `ipconfig` no Windows, procurando por "Endereço IPv4".)

## Atenção: CORS

O backend Spring Boot ainda não tem CORS configurado. Isso **não afeta** o app rodando no emulador/celular (apps nativos não sofrem restrição de CORS), mas se for testar via `npm run web` (navegador), as chamadas para `localhost:8080` podem ser bloqueadas. Nesse caso, seria necessário adicionar `@CrossOrigin` (ou uma configuração global de CORS) no backend.
