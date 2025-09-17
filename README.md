# Sistema de Pizzaria em Typescript

*João Pedro de Andrade Silva - 2508650*

*Caio Zanffolim Cunha - 2509832*

## 1. Introdução 
Neste projeto nos fizemos **Sistema de Pizzaria Completo** em **Typescript** com a utilização do **Node.JS**.
Ele possui as principais funcionalidades para uma Pizzaria como exemplo, o ***gerenciamento de clientes***, ***produtos***, ***pedidos***, ***comprovantes*** e ***relatorio de vendas***.

## 2. Pré-requisitos
Antes de fazer o sistema rodar, é necessario ter instalado em seu computador os seguintes itens:
  - Node.js
  - VSCode
  - npm

## 3. Tecnologias Utilizadas 
  - **TypeScript**
  - **CSV**
  - **Git Hub**

## 4. Estrutura do Projeto
```bash
├─ data/
│  ├─ recibos/        # Pasta onde os recibos de pedidos são gerados
│  ├─ clientes.csv    # Base de dados dos clientes
│  ├─ pedidos.csv     # Base de dados dos pedidos
│  └─ produtos.csv    # Base de dados dos produtos
├─ node_modules/      # Dependências do projeto
├─ src/
│  └─ index.ts        # Código principal do sistema
├─ package.json       # Dependências e scripts do Node.js
├─ package-lock.json  # Controle de versões das dependências
├─ tsconfig.json      # Configuração do TypeScript
└─ README.md          # Manual de utilização e informações do projeto
```

## 5. Recursos do Sistema

```bash
Entrada: Nome, telefone, endereço, complemento, forma de pagamento.

Armazenamento: data/clientes.csv, data/pedidos.csv, data/produtos.csv e arquivos individuais data/pedido_*.txt.

Saída: Data, cliente, telefone, endereço, forma de pagamento, total, entrega, itens.

Relatórios: Vendas, lista de produtos, lista de clientes e histórico de pedidos por cliente.

Funcionalidade adicional: Criação automática de pastas e arquivos na primeira execução.
```
6. Instalação
Na raiz do projeto:
```bash
npm i -D typescript ts-node @types/node
```
Crie (ou confira) os scripts no package.json:
```bash
{
  "name": "type-sistema-pizzaria",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "npx ts-node src/index.ts"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "devDependencies": {
    "@types/node": "^24.5.1",
    "readline-sync": "^1.4.10",
    "ts-node": "^10.9.2",
    "typescript": "^5.9.2"
  }
}
```
tsconfig.json mínimo recomendado:
```bash
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## 7. Como executar
Apenas colocar esse comando no terminal:
```bash
npm start
```


