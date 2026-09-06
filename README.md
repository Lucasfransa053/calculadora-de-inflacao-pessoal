## Pré-requisitos

* **Java JDK 21** ou superior instalado e configurado no `JAVA_HOME`.
* Git para clonar o repositório.

*(Nota: Não é necessário instalar o Maven globalmente, pois o projeto utiliza o Maven Wrapper).*

## Como executar o projeto

```bash
# Clonar o repositório
git clone <URL_DO_REPOSITORIO>

# Entrar na pasta do backend
cd backend

# Executar a aplicação
.\mvnw.cmd spring-boot:run  # Windows




# 📊 Calculadora de Inflação Pessoal

A **Calculadora de Inflação Pessoal** é uma aplicação web de alta performance construída para mensurar o impacto real da variação de preços no orçamento individual do usuário, superando as limitações dos índices médios nacionais.

---

## 🛠️ Tech Stack & Arquitetura
* **Backend:** Java 21, Spring Boot 4.1.1, Maven
* **Banco de Dados:** PostgreSQL
* **Arquitetura Backend:** Modular *Package by Feature* (`ipca`, `podercompra`, `inflacaopessoal`)
* **Integradores de APIs:** 
  * **BACEN SGS (Série 433):** Para dados históricos e consolidados do IPCA Geral.
  * **IBGE SIDRA (Tabela 7060):** Para dados granulares por grupos, subgrupos e subitens de produtos.

---

## 🚀 Funcionalidades Principais

### 1. Reajuste de Valor Histórico (Correção Monetária)
Calcula a atualização de um montante financeiro ao longo do tempo aplicando a variação acumulada do IPCA oficial no período selecionado.
* **Mecânica:** O usuário informa o valor inicial, mês/ano de origem e mês/ano de destino. O backend recupera a série temporal e aplica os juros compostos das taxas mensais.

### 2. Perda do Poder de Compra
Mede a corrosão do valor real do dinheiro que permaneceu parado ou sem rendimento no período.
* **Mecânica:** Traduz a desvalorização nominal da moeda em perda de capacidade aquisitiva real (ex: *"R$ 1.000,00 parados em 2020 equivalem a apenas R$ 680,00 em poder de compra hoje"*).

---

### 3. Calculadora de Inflação Pessoal (O Diferencial do Sistema)

#### 📌 O Problema
O IPCA oficial medido pelo IBGE é uma **média ponderada nacional** baseada em uma cesta de consumo padronizada. Na prática, a inflação afeta cada indivíduo de forma única: quem não possui veículo não é impactado diretamente pela alta do combustível, assim como quem não consome carne vermelha não sofre o impacto desse subitem.

#### 💡 A Solução
A funcionalidade de **Inflação Pessoal** permite ao usuário construir sua própria cesta de consumo mensal e calcular a sua **taxa de inflação customizada**.

#### ⚙️ Como Funciona (Lógica de Execução & UX):

1. **Seleção Precisa de Produtos via Autocomplete:**
   * O frontend consome um endpoint do backend que expõe a lista completa de grupos e produtos da **Tabela 7060 do IBGE**.
   * Através de um campo *Autocomplete*, o usuário pesquisa e seleciona os produtos específicos ou grupos genéricos que compõem sua rotina (ex: *Arroz, Gasolina, Aluguel, Plano de Saúde*).
   * **Trava de Validação:** O usuário só pode adicionar itens oficialmente rastreados pelo IBGE, garantindo consistência matemática.

2. **Entrada Simplificada por Valor Financeiro (R$):**
   * Em vez de exigir que o usuário calcule porcentagens complexas de seu orçamento, ele informa diretamente **quanto dinheiro (R$) gasta por mês** em cada item/categoria.
   * *Exemplo:* R$ 80,00 em Arroz, R$ 300,00 em Gasolina, R$ 1.200,00 em Aluguel.

3. **Cálculo de Pesos e Média Ponderada no Backend:**
   * O backend soma os gastos totais em R$ e converte automaticamente os valores em **pesos relativos ($\%$)**:
     $$\text{Peso do Item } (P_i) = \frac{\text{Gasto do Item (R\$)}}{\text{Gasto Total (R\$)}}$$
   * O sistema consome a API do IBGE SIDRA para o período dinâmico requisitado pelo usuário (formatando o intervalo no padrão de períodos da API) para obter a variação percentual individual ($V_i$) de cada item.
   * O backend calcula a **Inflação Pessoal** através da média ponderada:
     $$\text{Inflação Pessoal} = \sum (V_i \times P_i)$$

4. **Resultado e Análise Comparativa:**
   * O sistema retorna o percentual de variação acumulada do orçamento individual do usuário e plota um gráfico comparativo: **Sua Inflação Pessoal vs. IPCA Oficial do IBGE**.