// importa as bibliotecas necessárias
import * as readline from 'readline' // para ler e escrever no terminal
import * as path from 'path'         // pra montar caminho de arquivos de forma segura
import { promises as fs } from 'fs'  // pra ler e escrever arquivos usando promises

// --------- Interfaces ---------
// aqui definimos o "formato" que cada tipo de dado vai ter no programa

interface Cliente {
  id: string       // id único do cliente
  nome: string     // nome completo
  telefone: string // telefone de contato
  cep: string      // CEP
  endereco: string // endereço completo
  complemento: string // complemento tipo apto/bloco
}

interface Produto {
  id: string       // id do produto
  nome: string     // nome da pizza ou bebida
  preco: number    // preço em reais
  tipo: string     // tipo: pizza, refrigerante, sobremesa ou outro
}

interface Pedido {
  id: string
  clienteId: string       // qual cliente fez
  produtoIds: string[]    // lista de ids de produtos
  total: number           // valor total
  data: string            // data do pedido
  pagamento: 'Dinheiro' | 'Cartão' | 'Pix' // forma de pagamento
  entrega: 'Entrega' | 'Retirada'          // se é pra entregar ou se o cliente retira
}

// caminhos dos arquivos que vão guardar os dados em CSV
const arquivoClientes = path.join(__dirname, '../data/clientes.csv')
const arquivoProdutos = path.join(__dirname, '../data/produtos.csv')
const arquivoPedidos = path.join(__dirname, '../data/pedidos.csv')
const pastaRecibos   = path.join(__dirname, '../data/recibos')

// listas na memória pra trabalhar com os dados
let clientes: Cliente[] = []
let produtos: Produto[] = []
let pedidos: Pedido[]  = []

// readline pra conversar com o usuário no terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// --------- Funções pra salvar e carregar CSV ---------
// essas funções servem pra gravar e ler os arquivos CSV que vão armazenar tudo

async function salvarCSV<T>(arquivo: string, dados: T[], cabecalho: string) {
  const linhas = dados.map((d: any) => Object.values(d).join(',')).join('\n')
  await fs.writeFile(arquivo, cabecalho + '\n' + linhas, 'utf8')
}

async function carregarCSVClientes() {
  try {
    const dados = await fs.readFile(arquivoClientes, 'utf8')
    const linhas = dados.trim().split('\n')
    // pula o cabeçalho e monta os objetos Cliente
    clientes = linhas.slice(1).map(linha => {
      const [id, nome, telefone, cep, endereco, complemento] = linha.split(',')
      return { id, nome, telefone, cep, endereco, complemento }
    })
  } catch {
    clientes = [] // se o arquivo não existe ainda, começa com lista vazia
  }
}

// carregarCSVProdutos e carregarCSVPedidos fazem a mesma coisa, só mudam os campos

// --------- Menu principal ---------
// mostra as opções e chama a função certa de acordo com a escolha
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
  rl.question('Escolha uma opção: ', (opcao: string) => {
    switch(opcao.trim()) {
      case '1': cadastrarOuSelecionarCliente(); break
      case '2': listarClientes(); break
      // ... outras opções
      case '8': console.log('Até mais!'); rl.close(); break
      default: console.log('Opção inválida!'); menu()
    }
  })
}

// --------- Cadastro de Cliente ---------
// pergunta se já existe cliente e se não existir cadastra um novo
function cadastrarOuSelecionarCliente() { /* ... */ }
function cadastrarCliente() { /* ... */ }

// --------- Cadastro de Produto ---------
// pede nome, preço e tipo e salva no CSV
function cadastrarProduto() { /* ... */ }

// --------- Listar Produtos ---------
// agrupa por tipo e mostra no formato de cardápio
function listarProdutosCardapio() { /* ... */ }

// --------- Registrar Pedido ---------
// pega cliente e produtos escolhidos, calcula total e aplica 10% de desconto em pizzas
function registrarPedido(clienteId: string) { /* ... */ }

// --------- Gerar Recibo ---------
// cria um arquivo .txt com os dados do pedido
async function gerarRecibo(pedido: Pedido) { /* ... */ }

// --------- Relatórios ---------
// mostra quantos pedidos foram feitos por dia/mês e total de pizzas vendidas
function gerarRelatorios() { /* ... */ }

// --------- Histórico de Pedidos ---------
// lista os pedidos que um cliente já fez
function listarClientes() { /* ... */ }
function selecionarClienteHistorico() { /* ... */ }
function mostrarHistoricoCliente(clienteId: string) { /* ... */ }

// --------- Limpeza de Dados ---------
// permite excluir clientes ou produtos e atualiza os pedidos
function menuLimpeza() { /* ... */ }
async function excluirCliente() { /* ... */ }
async function excluirProduto() { /* ... */ }

// --------- Inicialização ---------
// carrega os CSVs (se já existirem) e abre o menu principal
;(async () => {
  await carregarCSVClientes()
  await carregarCSVProdutos()
  await carregarCSVPedidos()
  menu()
})()
