import * as readline from 'readline';
import * as path from 'path';
import { promises as fs } from 'fs';

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  cep: string;
  endereco: string;
  complemento: string;
}

interface Produto {
  id: string;
  nome: string;
  preco: number;
}

interface Pedido {
  id: string;
  clienteId: string;
  produtoIds: string[];
  total: number;
  data: string;
  pagamento: 'Dinheiro' | 'Cartão' | 'Pix';
  entrega: 'Entrega' | 'Retirada';
}

const arquivoClientes = path.join(__dirname, '../data/clientes.csv');
const arquivoProdutos = path.join(__dirname, '../data/produtos.csv');
const arquivoPedidos = path.join(__dirname, '../data/pedidos.csv');
const pastaRecibos = path.join(__dirname, '../data/recibos');

let clientes: Cliente[] = [];
let produtos: Produto[] = [];
let pedidos: Pedido[] = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// -------------------- Funções CSV --------------------

async function salvarCSV<T>(arquivo: string, dados: T[], cabecalho: string) {
  const linhas = dados.map((d: any) => Object.values(d).join(',')).join('\n');
  await fs.writeFile(arquivo, cabecalho + '\n' + linhas, 'utf8');
}

async function carregarCSVClientes() {
  try {
    const dados = await fs.readFile(arquivoClientes, 'utf8');
    const linhas = dados.trim().split('\n');
    clientes = linhas.slice(1).map(linha => {
      const [id, nome, telefone, cep, endereco, complemento] = linha.split(',');
      return { id, nome, telefone, cep, endereco, complemento };
    });
  } catch { clientes = []; }
}

async function carregarCSVProdutos() {
  try {
    const dados = await fs.readFile(arquivoProdutos, 'utf8');
    const linhas = dados.trim().split('\n');
    produtos = linhas.slice(1).map(linha => {
      const [id, nome, preco] = linha.split(',');
      return { id, nome, preco: parseFloat(preco) };
    });
  } catch { produtos = []; }
}

async function carregarCSVPedidos() {
  try {
    const dados = await fs.readFile(arquivoPedidos, 'utf8');
    const linhas = dados.trim().split('\n');
    pedidos = linhas.slice(1).map(linha => {
      const [id, clienteId, produtoIdsStr, total, data, pagamento, entrega] = linha.split(',');
      return { id, clienteId, produtoIds: produtoIdsStr.split('|'), total: parseFloat(total), data, pagamento: pagamento as any, entrega: entrega as any };
    });
  } catch { pedidos = []; }
}

// -------------------- Menu --------------------

function menu() {
  console.log('\n=== Sistema Pizzaria ===');
  console.log('1 - Cadastrar Cliente e Fazer Pedido');
  console.log('2 - Listar Clientes');
  console.log('3 - Cadastrar Produto');
  console.log('4 - Listar Produtos');
  console.log('5 - Relatórios de Vendas');
  console.log('6 - Sair');
  rl.question('Escolha uma opção: ', (opcao: string) => {
    switch(opcao.trim()) {
      case '1': cadastrarCliente(); break; // agora já leva direto para o pedido
      case '2': listarClientes(); break;
      case '3': cadastrarProduto(); break;
      case '4': listarProdutos(); break;
      case '5': gerarRelatorios(); break;
      case '6': console.log('Até mais!'); rl.close(); break;
      default: console.log('Opção inválida!'); menu();
    }
  });
}

// -------------------- Funções do Sistema --------------------

function cadastrarCliente() {
  rl.question('Nome do cliente: ', nome => {
    rl.question('Telefone: ', telefone => {
      rl.question('CEP: ', cep => {
        rl.question('Endereço completo: ', endereco => {
          rl.question('Complemento: ', async complemento => {
            const id = (clientes.length + 1).toString();
            clientes.push({ id, nome, telefone, cep, endereco, complemento });
            await salvarCSV(arquivoClientes, clientes, 'id,nome,telefone,cep,endereco,complemento');
            console.log('Cliente cadastrado com sucesso!');
            registrarPedido(id);
          });
        });
      });
    });
  });
}

function listarClientes() {
  if(clientes.length === 0) console.log('Nenhum cliente cadastrado.');
  else clientes.forEach(c => console.log(`ID: ${c.id} | Nome: ${c.nome} | Telefone: ${c.telefone} | Endereço: ${c.endereco} | CEP: ${c.cep} | Complemento: ${c.complemento}`));
  menu();
}

function cadastrarProduto() {
  rl.question('Nome do produto: ', nome => {
    rl.question('Preço do produto: ', async precoStr => {
      const preco = parseFloat(precoStr);
      const id = (produtos.length + 1).toString();
      produtos.push({ id, nome, preco });
      await salvarCSV(arquivoProdutos, produtos, 'id,nome,preco');
      console.log('Produto cadastrado com sucesso!');
      menu();
    });
  });
}

function listarProdutos() {
  if(produtos.length === 0) console.log('Nenhum produto cadastrado.');
  else produtos.forEach(p => console.log(`ID: ${p.id} | Nome: ${p.nome} | Preço: R$ ${p.preco.toFixed(2)}`));
  menu();
}

function registrarPedido(clienteId: string) {
  const cliente = clientes.find(c => c.id === clienteId);
  if (!cliente) { console.log('Cliente não encontrado.'); return menu(); }
  if (produtos.length === 0) { console.log('Nenhum produto cadastrado. Cadastre produtos primeiro.'); return menu(); }

  console.log('\nProdutos disponíveis:');
  produtos.forEach(p => console.log(`ID: ${p.id} | ${p.nome} | R$ ${p.preco.toFixed(2)}`));

  rl.question('Digite os IDs dos produtos separados por vírgula: ', async idsStr => {
    const ids = idsStr.split(',').map(s => s.trim());
    const itens = produtos.filter(p => ids.includes(p.id));
    if(itens.length === 0) { console.log('Nenhum produto válido selecionado.'); return menu(); }

    rl.question('Forma de pagamento (Dinheiro / Cartão / Pix): ', pagamento => {
      rl.question('Entrega ou Retirada? ', async entrega => {
        const total = itens.reduce((sum, p) => sum + p.preco, 0);
        const data = new Date().toISOString().slice(0,10);
        const id = (pedidos.length + 1).toString();
        const pedido: Pedido = {
          id, clienteId, produtoIds: itens.map(i => i.id),
          total, data, pagamento: pagamento as any, entrega: entrega as any
        };
        pedidos.push(pedido);
        await salvarCSV(arquivoPedidos, pedidos, 'id,clienteId,produtoIds,total,data,pagamento,entrega');
        console.log(`Pedido registrado! Total: R$ ${total.toFixed(2)}`);

        // -------------------- Gerar Recibo --------------------
        await gerarRecibo(pedido);
        console.log(`Recibo gerado em ${pastaRecibos}`);

        menu();
      });
    });
  });
}

async function gerarRecibo(pedido: Pedido) {
  // cria pasta de recibos se não existir
  try { await fs.mkdir(pastaRecibos, { recursive: true }); } catch {}
  const cliente = clientes.find(c => c.id === pedido.clienteId);
  const itens = produtos.filter(p => pedido.produtoIds.includes(p.id));
  const linhas = [
    `=== Recibo de Pedido #${pedido.id} ===`,
    `Data: ${pedido.data}`,
    `Cliente: ${cliente?.nome}`,
    `Telefone: ${cliente?.telefone}`,
    `Endereço: ${cliente?.endereco}, ${cliente?.complemento}`,
    `Forma de pagamento: ${pedido.pagamento}`,
    `Entrega: ${pedido.entrega}`,
    `--- Itens ---`,
    ...itens.map(i => `${i.nome} - R$ ${i.preco.toFixed(2)}`),
    `--- Total ---`,
    `R$ ${pedido.total.toFixed(2)}`
  ];
  const arquivoRecibo = path.join(pastaRecibos, `pedido_${pedido.id}.txt`);
  await fs.writeFile(arquivoRecibo, linhas.join('\n'), 'utf8');
}

function gerarRelatorios() {
  if(pedidos.length === 0) { console.log('Nenhum pedido registrado ainda.'); return menu(); }
  const vendasPorDia: Record<string, number> = {};
  const vendasPorMes: Record<string, number> = {};

  pedidos.forEach(p => {
    vendasPorDia[p.data] = (vendasPorDia[p.data] || 0) + 1;
    const mes = p.data.slice(0,7);
    vendasPorMes[mes] = (vendasPorMes[mes] || 0) + 1;
  });

  console.log('\n=== Vendas por dia ===');
  Object.entries(vendasPorDia).forEach(([dia, qtd]) => console.log(`${dia}: ${qtd} pedido(s)`));
  
  console.log('\n=== Vendas por mês ===');
  Object.entries(vendasPorMes).forEach(([mes, qtd]) => console.log(`${mes}: ${qtd} pedido(s)`));

  menu();
}

// -------------------- Inicialização --------------------

(async () => {
  await carregarCSVClientes();
  await carregarCSVProdutos();
  await carregarCSVPedidos();
  menu();
})();
