# 🍕 Sistema de Pizzaria - Guia Completo de Instalação

Sistema completo de gerenciamento de pizzaria com interface web, desenvolvido em TypeScript com React e SQL Server.

<<<<<<< HEAD
João Pedro de Andrade Silva – 2508650
=======
* João Pedro de Andrade Silva – 2508650
* Caio Zanfollim Cunha – 2509832
>>>>>>> cb9b29d2ac5873faee8f9224fadde8d7cae68af6

Caio Zanffolim Cunha – 2509832

## 📋 Pré-requisitos

Antes de começar, você precisa ter instalado:

- **Node.js** (v16 ou superior) - [Download](https://nodejs.org/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
- **Git** (opcional) - [Download](https://git-scm.com/)

<<<<<<< HEAD
## 🗄️ Configuração do Banco de Dados
=======
1. [Introdução](#introdução)
2. [Pré-requisitos](#pré-requisitos)
3. [Tecnologias Utilizadas](#tecnologias-utilizadas)
4. [Evolução do Projeto](#evolução-do-projeto)
5. [Estrutura do Projeto](#estrutura-do-projeto)
6. [Instalação – Backend CLI (CSV)](#instalação--backend-cli-csv)
7. [Instalação – Backend API (SQL Server)](#instalação--backend-api-sql-server)
8. [Instalação – Frontend React](#instalação--frontend-react)
9. [Como Executar o Sistema](#como-executar-o-sistema)
10. [Build para Produção](#build-para-produção)
11. [Diagrama do Projeto](#diagramas-do-projeto)
12. [Solução de Problemas](#solução-de-problemas)
13. [Estrutura do Banco](#estrutura-do-banco-de-dados)
>>>>>>> cb9b29d2ac5873faee8f9224fadde8d7cae68af6

### 1. Instalar e Iniciar o SQL Server no Docker

Abra o terminal e execute:

```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=P@sswOrd" -p 1433:1433 --name sqlserver -d mcr.microsoft.com/mssql/server:2019-latest
```

**Importante:** A senha `P@sswOrd` deve ter:
- Pelo menos 8 caracteres
- Letras maiúsculas e minúsculas
- Números
- Símbolos especiais

### 2. Verificar se o SQL Server está rodando

```bash
docker ps
```

Deve aparecer o container `sqlserver` com status `Up`.

### 3. Para iniciar o container posteriormente

```bash
docker start sqlserver
```

## 🚀 Instalação do Backend

### 1. Clone ou baixe o projeto

```bash
git clone seu-repositorio
cd Type-Sistema-Pizzaria
```

### 2. Instale as dependências

```bash
npm install
```

Se necessário, instale manualmente:

```bash
npm install express cors mssql dotenv readline-sync
npm install --save-dev typescript ts-node @types/node @types/express @types/cors
```

### 3. Configure o arquivo .env

Crie um arquivo `.env` na raiz do projeto com:

```env
DB_USER=sa
DB_PASS=P@sswOrd
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=PizzariaDB
```

**⚠️ IMPORTANTE:** Use a mesma senha que configurou no Docker!

### 4. Crie o arquivo src/database.ts

```typescript
import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

export const dbConfig: sql.config = {
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASS || "P@sswOrd",
  server: process.env.DB_SERVER || "localhost",
  port: Number(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME || "PizzariaDB",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

export async function getConnection() {
  try {
    console.log("Conectando ao banco de dados...");
    const pool = await sql.connect(dbConfig);
    console.log("✅ Conexão bem-sucedida com o SQL Server!");
    return pool;
  } catch (err) {
    console.error("❌ Erro ao conectar ao banco:", err);
    throw err;
  }
}
```

### 5. Crie o arquivo src/server.ts

Cole o código completo da API REST fornecido anteriormente.

### 6. Configure o package.json

Adicione os scripts:

```json
{
  "scripts": {
    "start": "ts-node src/index.ts",
    "api": "ts-node src/server.ts"
  }
}
```

### 7. Crie as tabelas do banco de dados

Execute o CLI uma vez para criar as tabelas:

```bash
npm start
```

Escolha a opção **9 - Sair** após a inicialização.

### 8. Inicie a API

```bash
npm start
```

Ou diretamente:

```bash
npx ts-node src/server.ts
```

Você deve ver:
```
Conectando ao banco de dados...
✅ Conexão bem-sucedida com o SQL Server!
🍕 API rodando na porta 3001
```

**🔥 Deixe este terminal aberto!**

## 🎨 Instalação do Frontend

### 1. Crie o projeto React (em outro terminal)

```bash
npx create-react-app pizzaria-frontend --template typescript
cd pizzaria-frontend
```

### 2. Instale as dependências

```bash
npm install lucide-react
npm install -D tailwindcss@3.4.1 postcss autoprefixer
```

### 3. Configure o Tailwind CSS

Crie o arquivo `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Crie o arquivo `postcss.config.js`:

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 4. Configure o CSS

Substitua o conteúdo de `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 5. Substitua o src/App.tsx

Cole o código completo da interface fornecido anteriormente.

### 6. Limpe arquivos desnecessários

Delete ou esvazie:
- `src/App.css`
- `src/logo.svg`

### 7. Inicie o frontend

```bash
npm start
```

O navegador deve abrir automaticamente em `http://localhost:3000`

## ✅ Verificação da Instalação

### 1. Teste a API

<<<<<<< HEAD
Abra o navegador e acesse:

```
http://localhost:3001/api/produtos
```

Deve retornar `[]` ou uma lista de produtos.
=======
```bash
npm start
```

### Terminal 2 — Frontend

```bash
cd pizzaria-frontend
npm start
```

### Acessar

* **Frontend:** [http://localhost:3000](http://localhost:3000)
* **API:** [http://localhost:3001/api](http://localhost:3001/api)
* **Banco:** localhost:1433

---

# 10. Build para Produção

### Compilar TypeScript

```bash
npx tsc
```

### Build do frontend

```bash
npm run build
```

---

# 11. Diagramas do Projeto

## Diagrama 1

*<img width="1760" height="1360" alt="image" src="https://github.com/user-attachments/assets/5a2733a9-beb6-4b77-b4f2-1fece3fcb183" />*

## Diagrama 2

*<img width="1228" height="1454" alt="image" src="https://github.com/user-attachments/assets/0711d058-0705-461f-a772-f0ea0ecedc11" />*

---

# 12. Solução de Problemas

### SQL Server não conecta
>>>>>>> cb9b29d2ac5873faee8f9224fadde8d7cae68af6

### 2. Teste o Frontend

- **Área do Cliente:** Ver cardápio, adicionar ao carrinho, fazer pedido
- **Área Admin:** Gerenciar produtos, clientes, pedidos e ver relatórios

## 🐛 Solução de Problemas Comuns

### Erro: "Cannot connect to SQL Server"

**Solução:**
```bash
# Verifique se o container está rodando
docker ps

# Se não estiver, inicie
docker start sqlserver

# Verifique os logs
docker logs sqlserver
```

### Erro: "Login failed for user 'sa'"

**Solução:**
- Verifique se a senha no `.env` é igual à do Docker
- A senha deve ter maiúsculas, minúsculas, números e símbolos

### Erro: "Port 3001 already in use"

**Solução:**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <numero_do_processo> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### Erro: "Tailwind CSS not working"

**Solução:**
```bash
cd pizzaria-frontend
rm -rf node_modules
npm install
npm start
```

### API retorna erro 500

**Solução:**
1. Verifique se as tabelas foram criadas:
   ```bash
   npm start  # Execute o CLI uma vez
   ```
2. Verifique a conexão do banco no terminal da API
3. Veja os logs de erro detalhados

## 📁 Estrutura do Projeto

```
Type-Sistema-Pizzaria/
├── src/
│   ├── index.ts          # CLI original
│   ├── server.ts         # API REST
│   └── database.ts       # Configuração do banco
├── pizzaria-frontend/
│   ├── src/
│   │   ├── App.tsx       # Interface React
│   │   └── index.css     # Estilos Tailwind
│   ├── tailwind.config.js
│   └── postcss.config.js
├── .env                  # Configurações do banco
└── package.json
```

## 🎯 Como Usar

### Executar o Sistema

**Terminal 1 - Backend:**
```bash
cd Type-Sistema-Pizzaria
npm run api
```

**Terminal 2 - Frontend:**
```bash
cd Type-Sistema-Pizzaria/pizzaria-frontend
npm start
```

### Acessar o Sistema

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001/api

## 🔄 Comandos Úteis

```bash
# Parar todos os containers Docker
docker stop $(docker ps -q)

# Iniciar o SQL Server
docker start sqlserver

# Ver logs do SQL Server
docker logs sqlserver

# Limpar cache do npm
npm cache clean --force

# Reinstalar dependências
rm -rf node_modules && npm install
```

## 📊 Estrutura do Banco de Dados

O sistema cria automaticamente estas tabelas:

- **Clientes:** id, nome, telefone, cep, endereco, complemento
- **Produtos:** id, nome, tipo, preco
- **PizzaPrecos:** produtoId, precoP, precoM, precoG
- **Pedidos:** id, clienteId, total, data, pagamento, entrega, status
- **PedidoItens:** id, pedidoId, produtoId, quantidade, tamanho

## 🛡️ Segurança (Para Produção)

⚠️ Este projeto é para desenvolvimento. Para produção, adicione:

- Autenticação JWT
- Validação de dados (express-validator)
- Rate limiting
- HTTPS
- Variáveis de ambiente seguras
- Hash de senhas
- Sanitização de inputs

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do backend (terminal 1)
2. Abra o Console do navegador (F12)
3. Teste a API diretamente no navegador
4. Verifique se o Docker está rodando

## 📝 Licença

MIT

---

<<<<<<< HEAD
**Desenvolvido com ❤️ para sua pizzaria!** 🍕
=======
>>>>>>> cb9b29d2ac5873faee8f9224fadde8d7cae68af6
