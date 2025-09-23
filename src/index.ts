import * as readline from 'readline'
import * as path from 'path'
import { promises as fs } from 'fs'

// ---------- Interfaces ----------
interface Cliente {
  id: string
  nome: string
  telefone: string
  cep: string
  endereco: string
  complemento: string
}

interface Produto {
  id: string
  nome: string
  preco: number
  tipo: string
}

interface Pedido {
  id: string
  clienteId: string
  produtoIds: string[]
  total: number
  data: string
  pagamento: 'Dinheiro' | 'Cartão' | 'Pix'
  entrega: 'Entrega' | 'Retirada'
}

// ---------- Arquivos ----------
const arquivoClientes = path.join(__dirname, '../data/clientes.csv')
const arquivoProdutos = path.join(__dirname, '../data/produtos.csv')
const arquivoPedidos  = path.join(__dirname, '../data/pedidos.csv')
const pastaRecibos    = path.join(__dirname, '../data/recibos')

// ---------- Listas na memória ----------
let clientes: Cliente[] = []
let produtos: Produto[] = []
let pedidos: Pedido[] = []

// ---------- Interface CLI ----------
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// ---------- Funções CSV ----------
async function salvarCSV<T>(arquivo: string, dados: T[], cabecalho: string) {
  const linhas = dados.map((d: any) => Object.values(d).join(',')).join('\n')
  await fs.writeFile(arquivo, cabecalho + '\n' + linhas, 'utf8')
}

// carregar clientes
async function carregarCSVClientes() {
  try {
    const dados = await fs.readFile(arquivoClientes, 'utf8')
    const linhas = dados.trim().split('\n')
    clientes = linhas.slice(1).map(linha => {
      const [id, nome, telefone, cep, endereco, complemento] = linha.split(',')
      return { id, nome, telefone, cep, endereco, complemento }
    })
  } catch { clientes = [] }
}

// carregar produtos
async function carregarCSVProdutos() {
  try {
    const dados = await fs.readFile(arquivoProdutos, 'utf8')
    const linhas = dados.trim().split('\n')
    produtos = linhas.slice(1).map(linha => {
      const [id, nome, preco, tipo] = linha.split(',')
      return { id, nome, preco: Number(preco), tipo }
    })
  } catch { produtos = [] }
}

// carregar pedidos
async function carregarCSVPedidos() {
  try {
    const dados = await fs.readFile(arquivoPedidos, 'utf8')
    const linhas = dados.trim().split('\n')
    pedidos = linhas.slice(1).map(linha => {
      const [id, clienteId, produtoIdsStr, total, data, pagamento, entrega] = linha.split(',')
      return {
        id,
        clienteId,
        produtoIds: produtoIdsStr.split('|'),
        total: Number(total),
        data,
        pagamento: pagamento as 'Dinheiro' | 'Cartão' | 'Pix',
        entrega: entrega as 'Entrega' | 'Retirada'
      }
    })
  } catch { pedidos = [] }
}

// ---------- Menu ----------
function menu() {
  console.log('\n=== Sistema Pizzaria ===')
  console.log('1 - Cadastrar Cliente / Fazer Pedido')
  console.log('2 - Listar Clientes')
  console.log('3 - Cadastrar Produto')
  console.log('4 - Listar Produtos')
  console.log('5 - Relatórios de Vendas')
  console.log('6 - Histórico de Pedidos por Cliente')
  console.log('7 - Limpeza de Dados')
  console.log('8 - Sair')
  rl.question('Escolha uma opção: ', opcao => {
    switch(opcao.trim()) {
      case '1': cadastrarOuSelecionarCliente(); break
      case '2': listarClientes(); break
      case '3': cadastrarProduto(); break
      case '4': listarProdutosCardapio(); break
      case '5': gerarRelatorios(); break
      case '6': selecionarClienteHistorico(); break
      case '7': menuLimpeza(); break
      case '8': console.log('Até mais!'); rl.close(); break
      default: console.log('Opção inválida!'); menu()
    }
  })
}

// ---------- Cadastro/Seleção Cliente ----------
function cadastrarOuSelecionarCliente() { /* igual ao seu código original */ }
function cadastrarCliente() { /* igual ao seu código original */ }

// ---------- Cadastro Produto ----------
function cadastrarProduto() { /* igual ao seu código original */ }

// ---------- Listar Produtos ----------
function listarProdutosCardapio() { /* igual ao seu código original */ }

// ---------- Registrar Pedido ----------
function registrarPedido(clienteId: string) { /* igual ao seu código original */ }

// ---------- Gerar Recibo ----------
async function gerarRecibo(pedido: Pedido) { /* igual ao seu código original */ }

// ---------- Relatórios ----------
function gerarRelatorios() { /* igual ao seu código original */ }

// ---------- Histórico ----------
function listarClientes() { /* igual ao seu código original */ }
function selecionarClienteHistorico() { /* igual ao seu código original */ }
function mostrarHistoricoCliente(clienteId: string) { /* igual ao seu código original */ }

// ---------- Limpeza ----------
function menuLimpeza() { /* igual ao seu código original */ }
async function excluirCliente() { /* igual ao seu código original */ }
async function excluirProduto() { /* igual ao seu código original */ }

// ---------- Inicialização ----------
(async () => {
  await carregarCSVClientes()
  await carregarCSVProdutos()
  await carregarCSVPedidos()
  menu()
})();
