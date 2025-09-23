
# Sistema de Pizzaria em TypeScript

João Pedro de Andrade Silva – 2508650

Caio Zanffolim Cunha – 2509832

## 1. Introdução

Este projeto implementa um **Sistema de Pizzaria completo** em **TypeScript**, utilizando **Node.js**.
Ele oferece funcionalidades essenciais para o gerenciamento de uma pizzaria, como:
***cadastro de clientes***, ***produtos***, ***pedidos***, ***emissão de comprovantes*** e ***relatórios de vendas***.

## 2. Pré-requisitos

Antes de executar o sistema, é necessário ter instalado em seu computador:

* **Node.js**
* **VS Code** (ou outro editor de sua preferência)
* **npm** (gerenciador de pacotes do Node.js)

## 3. Tecnologias Utilizadas

* **TypeScript**
* **Node.js**
* **CSV**
* **GitHub**

## 4. Estrutura do Projeto

```bash
├─ data/
│  ├─ recibos/        # Recibos de pedidos gerados automaticamente
│  ├─ clientes.csv    # Base de dados dos clientes
│  ├─ pedidos.csv     # Base de dados dos pedidos
│  └─ produtos.csv    # Base de dados dos produtos
├─dist/
│  └─ index.js
├─ node_modules/      # Dependências do projeto
├─ src/
│  └─ index.ts        # Código principal do sistema
├─ package.json       # Dependências e scripts do Node.js
├─ package-lock.json  # Controle de versões das dependências
├─ tsconfig.json      # Configuração do TypeScript
└─ README.md          # Manual de utilização e informações do projeto
```

## 5. Recursos do Sistema

* **Entrada:** nome, telefone, endereço, complemento e forma de pagamento.
* **Armazenamento:** `data/clientes.csv`, `data/pedidos.csv`, `data/produtos.csv` e arquivos individuais `data/pedido_*.txt`.
* **Saída:** data, cliente, telefone, endereço, forma de pagamento, total, entrega e itens do pedido.
* **Relatórios:** vendas, lista de produtos, lista de clientes e histórico de pedidos por cliente.
* **Funcionalidade adicional:** criação automática de pastas e arquivos na primeira execução.

## 6. Comandos de Instalação

Para instalar e configurar o projeto corretamente, execute os seguintes comandos:

---

| Comando | Explicação |
|---------|------------|
| `mkdir Type-Sistema-Pizzaria` | Criar pasta |
| `cd Type-Sistema-Pizzaria` | Entrar na pasta |
| `mkdir src` | Criar pasta |
| `mkdir data` | Criar pasta |
| `cd data` | Entrar na pasta |
| `touch clientes.csv` | Criar o arquivo `clientes.csv` |
| `touch pedidos.csv` | Criar o arquivo `pedidos.csv` |
| `touch produtos.csv` | Criar o arquivo `produtos.csv` |
| `cd ..` | Sair da pasta |
| `npm i -g typescript` | Instalar TypeScript |
| `npx tsc --init` | Criar `tsconfig.json` |
| `npm i -D typescript ts-node @types/node` | Instale os tipos do Node e ajuste o `tsconfig` na raiz |
| `cd src` | Criar pasta |
| `touch index.ts` | Criar o arquivo `index.ts` |
| `cd ..` | Sair da pasta |
| `tsc index.ts` | Transpile o `index.ts` para `index.js` |



## 7. Instalação

Na raiz do projeto, execute:

```bash
npm i -D typescript ts-node @types/node
```

Crie ou verifique os scripts em `package.json`:

```json
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

Configuração mínima recomendada para `tsconfig.json`:

```json
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

## 8. Como executar

No terminal, dentro da pasta raiz do projeto:

```bash
npm start
```
OU
```bash
node dist/index.js
```
---

## 9. Build para Produção

Para gerar os arquivos JavaScript prontos para execução sem o `ts-node`:

```bash
npx tsc
```

Isso criará os arquivos compilados na pasta `dist/`.

Em seguida, você pode executar diretamente com o Node:

```bash
node dist/index.js
```

## 10. Diagrama 1 do projeto

<img width="1760" height="1360" alt="image" src="https://github.com/user-attachments/assets/e10ada99-537c-4dbb-8ac4-0b6e111f984b" />

## 10. Diagrama 2 do projeto

<img width="1760" height="1360" alt="image" src="https://github.com/user-attachments/assets/beeb61b5-64c3-448d-af15-cfe95060024e" />




 
