# 🍕 Sistema Completo de Pizzaria – TypeScript, SQL Server, React

**Autores:**

* João Pedro de Andrade Silva – 2508650
* Caio Zanfollim Cunha – 2509832

Este projeto implementa um **sistema completo de gerenciamento de pizzaria**, desenvolvido inicialmente em **TypeScript** com armazenamento em CSV e evoluído para uma solução **full-stack** com:

* 🖥 **Backend TypeScript** (CLI e API REST)
* 🗄 **SQL Server via Docker**
* 🌐 **Frontend React + Tailwind**
* 🔄 **Integração total entre cliente, pedidos e produtos**

---

# 📘 Índice

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

---

# 1. Introdução

O projeto começou como um sistema simples em TypeScript utilizando **arquivos CSV** para cadastro de:

* Clientes
* Produtos
* Pedidos
* Relatórios

Com a evolução do escopo, o sistema foi expandido para uma **arquitetura completa**:

* Banco de dados SQL Server
* API REST em Node.js + Express
* Interface Web moderna em React + Tailwind
* Docker para ambiente padronizado

---

# 2. Pré-requisitos

Recomendado ter instalado:

* **Node.js**
* **npm**
* **Visual Studio Code**
* **Docker Desktop**
* **Git** (opcional)

---

# 3. Tecnologias Utilizadas

### Backend

* TypeScript
* Node.js
* Express
* SQL Server (Docker)
* mssql
* dotenv

### Frontend

* React + TypeScript
* TailwindCSS
* Lucide Icons

### Versão inicial

* Readline-sync
* CSV como armazenamento

---

# 4. Evolução do Projeto

### ✔ Fase 1 — Backend com CSV (CLI)

Sistema rodando no terminal com:

* Cadastro de clientes
* Cadastro de produtos
* Criação de pedidos
* Emissão de comprovantes
* Relatórios (clientes, produtos, pedidos)

### ✔ Fase 2 — API REST + SQL Server

Migração do sistema para:

* Banco SQL Server
* API para CRUD completo
* Tabelas normalizadas

### ✔ Fase 3 — Frontend Web

Interface visual com:

* Cardápio
* Carrinho
* Realização de pedidos
* Painel administrativo

---

# 5. Estrutura do Projeto

```
Type-Sistema-Pizzaria/
├── src/
│   ├── index.ts          # CLI (versão CSV)
│   ├── server.ts         # API REST
│   └── database.ts       # Conexão SQL Server
├── pizzaria-frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   └── index.css
│   ├── tailwind.config.js
│   └── postcss.config.js
├── data/                 # Versão inicial (CSV)
├── .env                  # Configurações do banco
├── package.json
└── tsconfig.json
```

---

# 6. Instalação – Backend CLI (CSV)

### Criar pastas e arquivos

```bash
mkdir data src
touch data/clientes.csv data/produtos.csv data/pedidos.csv
touch src/index.ts
```

### Instalar dependências

```bash
npm i -D typescript ts-node @types/node readline-sync
npx tsc --init
```

### Executar

```bash
npm start
```

---

# 7. Instalação – Backend API (SQL Server)

## 1. Subir SQL Server no Docker

```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=P@sswOrd" \
  -p 1433:1433 --name sqlserver -d mcr.microsoft.com/mssql/server:2019-latest
```

## 2. Criar `.env`

```
DB_USER=sa
DB_PASS=P@sswOrd
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=PizzariaDB
```

## 3. Instalar dependências da API

```bash
npm install express cors mssql dotenv
npm install --save-dev @types/express @types/cors
```

## 4. Iniciar API

```bash
npm start
```

---

# 8. Instalação – Frontend React

```bash
npx create-react-app pizzaria-frontend --template typescript
cd pizzaria-frontend
npm install lucide-react
npm install -D tailwindcss postcss autoprefixer
```

Configurado com:

* `tailwind.config.js`
* `postcss.config.js`
* `src/index.css` usando Tailwind

### Executar frontend

```bash
npm start
```

---

# 9. Como Executar o Sistema

### Terminal 1 — API

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

*https://cdn.discordapp.com/attachments/841650196974272549/1442958940030767177/Fluxograma_2.png?ex=692753bc&is=6926023c&hm=9158007f1ad9d4566a4586af1c98adf788da8d1e0d2bc8039399ee69448b4f34&*

## Diagrama 2

*https://cdn.discordapp.com/attachments/841650196974272549/1442958940546797678/Fluxograma_Estrutura_.png?ex=692753bc&is=6926023c&hm=22b82c4a16d978462e5b7b9ebed6dd9d1aaa02565106060178dbfa9db138a5b3&*

---

# 12. Solução de Problemas

### SQL Server não conecta

```bash
docker ps
docker start sqlserver
docker logs sqlserver
```

### Porta 3001 ocupada

```bash
netstat -ano | findstr :3001
taskkill /PID <id> /F
```

### Tailwind não funciona

```bash
rm -rf node_modules
npm install
```

---

# 13. Estrutura do Banco de Dados

Tabelas criadas:

* **Clientes**
* **Produtos**
* **PizzaPrecos**
* **Pedidos**
* **PedidoItens**

---

