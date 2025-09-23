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
  tipo: string; // pizza | refrigerante | sobremesa | outro
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
      const [id, nome, preco, tipo] = linha.split(',');
      return { id, nome, preco: parseFloat(preco), tipo };
    });
  } catch { produtos = []; }
}

async function carregarCSVPedidos() {
  try {
    const dados = await fs.readFile(arquivoPedidos, 'utf8');
    const linhas = dados.trim().split('\n');
    pedidos = linhas.slice(1).map(linha => {
      const [id, clienteId, produtoIdsStr, total, data, pagamento, entrega] = linha.split(',');
      return {
        id,
        clienteId,
        produtoIds: produtoIdsStr.split('|'),
        total: parseFloat(total),
        data,
        pagamento: pagamento as any,
        entrega: entrega as any
      };
    });
  } catch { pedidos = []; }
}

// -------------------- Menu --------------------

function menu() {
  console.log('\n=== Sistema Pizzaria ===');
  console.log('1 - Cadastrar Cliente / Fazer Pedido');
  console.log('2 - Listar Clientes');
  console.log('3 - Cadastrar Produto');
  console.log('4 - Listar Produtos');
  console.log('5 - Relatórios de Vendas');
  console.log('6 - Histórico de Pedidos por Cliente');
  console.log('7 - Limpeza de Dados');
  console.log('8 - Sair');
  rl.question('Escolha uma opção: ', (opcao: string) => {
    switch(opcao.trim()) {
      case '1': cadastrarOuSelecionarCliente(); break;
      case '2': listarClientes(); break;
      case '3': cadastrarProduto(); break;
      case '4': listarProdutosCardapio(); break;
      case '5': gerarRelatorios(); break;
      case '6': selecionarClienteHistorico(); break;
      case '7': menuLimpeza(); break;
      case '8': console.log('Até mais!'); rl.close(); break;
      default: console.log('Opção inválida!'); menu();
    }
  });
}

// -------------------- Cadastro e Seleção de Cliente --------------------

function cadastrarOuSelecionarCliente() {
  rl.question('O cliente já está cadastrado? (s/n): ', resposta => {
    if(resposta.trim().toLowerCase() === 's') {
      if(clientes.length === 0) {
        console.log('Nenhum cliente cadastrado ainda.');
        return cadastrarCliente();
      }
      clientes.forEach(c => console.log(`ID: ${c.id} | ${c.nome} | Tel: ${c.telefone}`));
      rl.question('Digite o ID do cliente: ', id => {
        const cliente = clientes.find(c => c.id === id.trim());
        if(!cliente) {
          console.log('Cliente não encontrado. Tente novamente.');
          return cadastrarOuSelecionarCliente();
        }
        registrarPedido(cliente.id);
      });
    } else if(resposta.trim().toLowerCase() === 'n') {
      cadastrarCliente();
    } else {
      console.log('Opção inválida.');
      cadastrarOuSelecionarCliente();
    }
  });
}

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

// -------------------- Cadastro de Produtos --------------------

function cadastrarProduto() {
  rl.question('Nome do produto: ', nome => {
    if(!nome.trim()){
      console.log(' Nome não pode ficar vazio.');
      return menu();
    }

    rl.question('Preço (ex: 29.90): ', precoStr => {
      const preco = parseFloat(precoStr);
      if(isNaN(preco) || preco <= 0) {
        console.log(' Preço inválido. Digite um número positivo.');
        return menu();
      }

      console.log('\nTipos disponíveis:');
      console.log('1 - Pizza');
      console.log('2 - Refrigerante');
      console.log('3 - Sobremesa');
      console.log('4 - Outro');

      rl.question('Escolha o tipo (1-4): ', async tipoOpc => {
        const mapaTipos: Record<string,string> = {
          '1': 'pizza',
          '2': 'refrigerante',
          '3': 'sobremesa',
          '4': 'outro'
        };
        const tipo = mapaTipos[tipoOpc.trim()];
        if(!tipo){
          console.log(' Tipo inválido.');
          return menu();
        }

        const produto: Produto = {
          id: (produtos.length + 1).toString(),
          nome: nome.trim(),
          preco,
          tipo
        };

        produtos.push(produto);
        await salvarCSV(arquivoProdutos, produtos, 'id,nome,preco,tipo');
        console.log(` Produto "${produto.nome}" (${produto.tipo}) cadastrado com sucesso!`);
        menu();
      });
    });
  });
}

// -------------------- Listar Produtos / Cardápio --------------------

function listarProdutosCardapio() {
  if (produtos.length === 0) {
    console.log('Nenhum produto cadastrado.');
    return menu();
  }

  const grupos: Record<string, Produto[]> = {};
  for (const p of produtos) {
    if (!grupos[p.tipo]) grupos[p.tipo] = [];
    grupos[p.tipo].push(p);
  }

  console.log('\n========== CARDÁPIO ==========');
  Object.entries(grupos).forEach(([tipo, lista]) => {
    console.log(`\n🍕 ${tipo.toUpperCase()} ` + '-'.repeat(25 - tipo.length));
    console.log('ID'.padEnd(5) + 'Nome'.padEnd(25) + 'Preço'.padStart(10));
    console.log('-'.repeat(42));
    lista.forEach(p => {
      console.log(
        p.id.padEnd(5) +
        p.nome.padEnd(25) +
        `R$ ${p.preco.toFixed(2)}`.padStart(10)
      );
    });
  });
  console.log('==============================\n');
  menu();
}

// -------------------- Registrar Pedido --------------------

function registrarPedido(clienteId: string) {
  const cliente = clientes.find(c => c.id === clienteId);
  if (!cliente) { console.log('Cliente não encontrado.'); return menu(); }
  if (produtos.length === 0) { console.log('Nenhum produto cadastrado.'); return menu(); }

  console.log('\nProdutos disponíveis:');
  produtos.forEach(p => console.log(`ID: ${p.id} | ${p.nome} | R$ ${p.preco.toFixed(2)} | Tipo: ${p.tipo}`));

  rl.question('Digite os IDs dos produtos separados por vírgula: ', async idsStr => {
    const ids = idsStr.split(',').map(s => s.trim());
    const itens = produtos.filter(p => ids.includes(p.id));
    if(itens.length === 0) { console.log('Nenhum produto válido selecionado.'); return menu(); }

    rl.question('Forma de pagamento (Dinheiro / Cartão / Pix): ', pagamento => {
      rl.question('Entrega ou Retirada? ', async entrega => {
        // Promoção simples: 10% de desconto em pizzas
        let total = itens.reduce((sum, p) => {
          if(p.tipo === 'pizza') return sum + p.preco*0.9;
          return sum + p.preco;
        }, 0);

        const data = new Date().toISOString().slice(0,10);
        const id = (pedidos.length + 1).toString();
        const pedido: Pedido = {
          id, clienteId, produtoIds: itens.map(i => i.id),
          total, data, pagamento: pagamento as any, entrega: entrega as any
        };
        pedidos.push(pedido);
        await salvarCSV(arquivoPedidos, pedidos, 'id,clienteId,produtoIds,total,data,pagamento,entrega');
        console.log(`Pedido registrado! Total: R$ ${total.toFixed(2)}`);

        await gerarRecibo(pedido);
        console.log(`Recibo gerado em ${pastaRecibos}`);

        menu();
      });
    });
  });
}

// -------------------- Gerar Recibo --------------------

async function gerarRecibo(pedido: Pedido) {
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
    ...itens.map(i => `${i.nome} (${i.tipo}) - R$ ${i.preco.toFixed(2)}`),
    `--- Total ---`,
    `R$ ${pedido.total.toFixed(2)}`
  ];
  const arquivoRecibo = path.join(pastaRecibos, `pedido_${pedido.id}.txt`);
  await fs.writeFile(arquivoRecibo, linhas.join('\n'), 'utf8');
}

// -------------------- Relatórios --------------------

function gerarRelatorios() {
  if(pedidos.length === 0) { console.log('Nenhum pedido registrado ainda.'); return menu(); }
  const vendasPorDia: Record<string, number> = {};
  const vendasPorMes: Record<string, number> = {};
  let totalPizzasVendidas = 0;

  pedidos.forEach(p => {
    vendasPorDia[p.data] = (vendasPorDia[p.data] || 0) + 1;
    const mes = p.data.slice(0,7);
    vendasPorMes[mes] = (vendasPorMes[mes] || 0) + 1;

    const itens = produtos.filter(pr => p.produtoIds.includes(pr.id));
    totalPizzasVendidas += itens.filter(pr => pr?.tipo === 'pizza').length;
  });

  console.log('\n=== Vendas por dia ===');
  Object.entries(vendasPorDia).forEach(([dia, qtd]) => console.log(`${dia}: ${qtd} pedido(s)`));

  console.log('\n=== Vendas por mês ===');
  Object.entries(vendasPorMes).forEach(([mes, qtd]) => console.log(`${mes}: ${qtd} pedido(s)`));

  console.log(`\nTotal de pizzas vendidas: ${totalPizzasVendidas}`);
  menu();
}

// -------------------- Histórico de Pedidos --------------------

function listarClientes() {
  if(clientes.length === 0) {
    console.log('Nenhum cliente cadastrado.');
  } else {
    console.log('\n=== Lista de Clientes ===');
    clientes.forEach(c => {
      console.log(`ID: ${c.id} | Nome: ${c.nome} | Telefone: ${c.telefone} | Endereço: ${c.endereco} | CEP: ${c.cep} | Complemento: ${c.complemento}`);
    });
    console.log('========================\n');
  }
  menu();
}

function selecionarClienteHistorico() {
  if(clientes.length === 0) { console.log('Nenhum cliente cadastrado.'); return menu(); }
  clientes.forEach(c => console.log(`ID: ${c.id} | ${c.nome}`));
  rl.question('Digite o ID do cliente para ver histórico: ', id => mostrarHistoricoCliente(id.trim()));
}

function mostrarHistoricoCliente(clienteId: string) {
  const cliente = clientes.find(c => c.id === clienteId);
  if (!cliente) { console.log('Cliente não encontrado.'); return menu(); }

  const pedidosCliente = pedidos.filter(p => p.clienteId === clienteId);
  if (pedidosCliente.length === 0) { 
    console.log('Nenhum pedido registrado para esse cliente.');
    return menu();
  }

  console.log(`\n=== Histórico de Pedidos de ${cliente.nome} ===`);
  pedidosCliente.forEach(p => {
    const itens = produtos.filter(pr => p.produtoIds.includes(pr.id));
    console.log(`Pedido #${p.id} | Data: ${p.data} | Total: R$ ${p.total.toFixed(2)} | Pagamento: ${p.pagamento}`);
    itens.forEach(i => console.log(`  - ${i.nome} (${i.tipo}) - R$ ${i.preco.toFixed(2)}`));
  });
  console.log('==========================================\n');
  menu();
}

// -------------------- Limpeza de Dados --------------------

function menuLimpeza() {
  console.log('\n1 - Excluir Cliente');
  console.log('2 - Excluir Produto');
  console.log('3 - Voltar');
  rl.question('Escolha uma opção: ', opt => {
    switch(opt.trim()){
      case '1': excluirCliente(); break;
      case '2': excluirProduto(); break;
      case '3': menu(); break;
      default: console.log('Opção inválida!'); menuLimpeza();
    }
  });
}

async function excluirCliente() {
  if (clientes.length === 0) { console.log('Nenhum cliente cadastrado.'); return menu(); }
  clientes.forEach(c => console.log(`ID: ${c.id} | ${c.nome}`));
  rl.question('Digite o ID do cliente a excluir: ', async id => {
    const idx = clientes.findIndex(c => c.id === id.trim());
    if (idx === -1) { console.log('Cliente não encontrado.'); return menu(); }

    clientes.splice(idx,1);
    await salvarCSV(arquivoClientes, clientes, 'id,nome,telefone,cep,endereco,complemento');

    pedidos = pedidos.filter(p => p.clienteId !== id.trim());
    await salvarCSV(arquivoPedidos, pedidos, 'id,clienteId,produtoIds,total,data,pagamento,entrega');

    console.log(' Cliente e pedidos associados excluídos.');
    menu();
  });
}

async function excluirProduto() {
  if (produtos.length === 0) { console.log('Nenhum produto cadastrado.'); return menu(); }
  produtos.forEach(p => console.log(`ID: ${p.id} | ${p.nome} | R$ ${p.preco.toFixed(2)} | Tipo: ${p.tipo}`));
  rl.question('Digite o ID do produto a excluir: ', async id => {
    const idx = produtos.findIndex(p => p.id === id.trim());
    if (idx === -1) { console.log('Produto não encontrado.'); return menu(); }

    produtos.splice(idx,1);
    await salvarCSV(arquivoProdutos, produtos, 'id,nome,preco,tipo');

    pedidos.forEach(p => {
      p.produtoIds = p.produtoIds.filter(pid => pid !== id.trim());
      const itens = produtos.filter(pr => p.produtoIds.includes(pr.id));
      p.total = itens.reduce((s,pr) => s + pr.preco, 0);
    });
    await salvarCSV(arquivoPedidos, pedidos, 'id,clienteId,produtoIds,total,data,pagamento,entrega');

    console.log(' Produto removido. Pedidos atualizados.');
    menu();
  });
}

// -------------------- Inicialização --------------------

(async () => {
  await carregarCSVClientes();
  await carregarCSVProdutos();
  await carregarCSVPedidos();
  menu();
})();
