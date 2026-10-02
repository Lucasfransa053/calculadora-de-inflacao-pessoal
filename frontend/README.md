# InflateIQ — Calculadora de Inflação Pessoal (App React Native / Expo)

Aplicativo para calcular o impacto da inflação no seu bolso. Funciona no Android, no iOS e na web.

## Funcionalidades

1. **Correção monetária pelo IPCA**: informe um valor e um mês/ano de início, e o app calcula o valor corrigido pelo IPCA acumulado até o dado mais recente disponível.
2. **Inflação pessoal**: escolha categorias de gasto (alimentação, transporte etc.), informe quanto gastou em cada uma e o período, e o app calcula a sua inflação pessoal, compara com o IPCA oficial e mostra a perda de poder de compra por categoria.
3. **Conta de usuário**: cadastro e login por e-mail e senha.

## Backend

O app consome uma API em Spring Boot com banco PostgreSQL, hospedada no Render:

```
https://inflateiq.onrender.com/api
```

> **Atenção:** no plano gratuito do Render o serviço "dorme" depois de cerca de 15 minutos sem uso. A primeira requisição depois disso pode levar de 30 a 60 segundos. Depois que acorda, o app responde normalmente.

O endereço fica definido em `src/services/api.ts`:

```ts
export const API_BASE_URL = 'https://inflateiq.onrender.com/api';
```

### Rodando com o backend local (opcional)

Para testar mudanças no backend antes de publicar, suba o backend em `http://localhost:8080` (veja a pasta `backend/`) e troque temporariamente a constante `API_BASE_URL`:

| Onde o app roda | Endereço |
| --- | --- |
| Web e simulador iOS | `http://localhost:8080/api` |
| Emulador Android | `http://10.0.2.2:8080/api` |
| Celular físico (Expo Go) | `http://SEU_IP_LOCAL:8080/api` |

No celular físico, o app e o computador precisam estar na mesma rede Wi-Fi. Descubra o IP local com `ipconfig` no Windows, procurando por "Endereço IPv4". Lembre de voltar para a URL do Render antes de gerar o APK.

## Pré-requisitos

- Node.js (versão LTS)
- App **Expo Go** no celular (Android ou iOS), só se for testar em um aparelho físico

## Como rodar

```bash
cd frontend
npm install
npm start
```

Isso abre o Metro Bundler. A partir daí:

- Aperte `w` para abrir no navegador
- Aperte `a` para abrir no emulador Android
- Aperte `i` para abrir no simulador iOS (só em Mac)
- Ou escaneie o QR code com o **Expo Go** no celular

## Gerar o APK (Android)

O projeto usa o EAS Build, e o perfil `preview` já está configurado para gerar um `.apk`.

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

O build roda na nuvem do Expo e leva em média de 10 a 20 minutos. No final, o terminal mostra um link e um QR code para baixar o `.apk`, que também fica disponível na aba **Builds** do projeto em [expo.dev](https://expo.dev).

Para instalar no celular, baixe o `.apk`, abra o arquivo e permita a instalação de apps de fontes desconhecidas, se o Android pedir.

> A URL da API é embutida no app na hora do build. Confira se `API_BASE_URL` está apontando para o Render **antes** de gerar o APK.

## Estrutura

```
frontend/
├── App.tsx                  # Ponto de entrada e navegação
├── app.json                 # Configuração do Expo
├── eas.json                 # Perfis de build (EAS)
└── src/
    ├── components/          # Componentes reutilizáveis
    ├── context/             # AuthContext (sessão do usuário)
    ├── hooks/               # Hooks de layout
    ├── screens/             # Telas: Login, Calculadora IPCA, Inflação Pessoal
    ├── services/
    │   ├── api.ts           # Chamadas à API e URL do backend
    │   └── auth.ts          # Login, cadastro e sessão
    └── types/               # Tipos TypeScript
```

## CORS

O backend libera requisições de qualquer origem (`@CrossOrigin(origins = "*")`), então o app funciona também no navegador (`npm start` e tecla `w`) sem configuração extra.
