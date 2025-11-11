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

type CategoriaProduto = 'pizza' | 'refrigerante' | 'sobremesa' | 'adicional' | 'borda' | 'outro';
type SubcategoriaPizza = 'salgada' | 'doce' | '';

interface Produto {
  id: string;
  nome: string;
  tipo: CategoriaProduto;
  subcategoria?: SubcategoriaPizza;
  preco?: number; // para refrigerante, sobremesa, adicional, borda, outro
  precosPorTamanho?: { P: number; M: number; G: number }; // para pizza
}

type StatusPedido = 'aberto' | 'preparando' | 'pronto' | 'entregue' | 'cancelado';
type FormaPagamento = 'Dinheiro' | 'Cartão' | 'Pix';
type TipoEntrega = 'Entrega' | 'Retirada';

interface PedidoItem {
  produtoId: string;
  quantidade: number;
  tamanho?: 'P' | 'M' | 'G';
  bordaId?: string | null;
  adicionaisIds?: string[];
  precoUnitario: number; // preço base por unidade (já considerando tamanho)
  precoAdicionaisUnit?: number; // soma (borda + adicionais) por unidade
}

interface Pedido {
  id: string;
  clienteId: string;
  itens: PedidoItem[];
  subtotal: number;
  taxaEntrega: number;
  total: number;
  data: string; // YYYY-MM-DD
  pagamento: FormaPagamento;
  entregaTipo: TipoEntrega;
  status: StatusPedido;
}

const pastaDados = path.join(__dirname, '../data');
const arquivoClientes = path.join(pastaDados, 'clientes.csv');
const arquivoProdutos = path.join(pastaDados, 'produtos.csv');
const arquivoPedidos = path.join(pastaDados, 'pedidos.csv');
const pastaRecibos = path.join(pastaDados, 'recibos');

let clientes: Cliente[] = [];
let produtos: Produto[] = [];
let pedidos: Pedido[] = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(q: string): Promise<string> {
  return new Promise(resolve => rl.question(q, ans => resolve(ans)));
}

/* ------------------ util CSV helpers ------------------ */

async function garantirPastaDados() {
  try { await fs.mkdir(pastaDados, { recursive: true }); } catch {}
  try { await fs.mkdir(pastaRecibos, { recursive: true }); } catch {}
}

function linhaCSVEscape(valor: string) {
  if (valor == null) return '';
  const s = String(valor);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function splitCSVLine(line: string): string[] {
  const res: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === ',') {
        res.push(cur);
        cur = '';
      } else if (ch === '"') {
        inQuotes = true;
      } else {
        cur += ch;
      }
    }
  }
  res.push(cur);
  return res;
}

/* ------------------ salvar / carregar CSV ------------------ */

async function salvarClientesCSV() {
  await garantirPastaDados();
  const header = ['id','nome','telefone','cep','endereco','complemento'].join(',');
  const linhas = clientes.map(c => [
    linhaCSVEscape(c.id),
    linhaCSVEscape(c.nome),
    linhaCSVEscape(c.telefone),
    linhaCSVEscape(c.cep),
    linhaCSVEscape(c.endereco),
    linhaCSVEscape(c.complemento)
  ].join(',')).join('\n');
  await fs.writeFile(arquivoClientes, header + '\n' + linhas, 'utf8');
}

async function carregarClientesCSV() {
  try {
    const txt = await fs.readFile(arquivoClientes, 'utf8');
    const linhas = txt.trim().split('\n');
    clientes = linhas.slice(1).map(l => {
      const cols = splitCSVLine(l);
      return {
        id: cols[0] ?? '',
        nome: cols[1] ?? '',
        telefone: cols[2] ?? '',
        cep: cols[3] ?? '',
        endereco: cols[4] ?? '',
        complemento: cols[5] ?? ''
      } as Cliente;
    });
  } catch {
    clientes = [];
  }
}

async function salvarProdutosCSV() {
  await garantirPastaDados();
  const header = ['id','nome','tipo','subcategoria','preco','precosPorTamanho'].join(',');
  const linhas = produtos.map(p => {
    const preco = p.preco != null ? p.preco.toFixed(2) : '';
    const precosJson = p.precosPorTamanho ? JSON.stringify(p.precosPorTamanho) : '';
    return [
      linhaCSVEscape(p.id),
      linhaCSVEscape(p.nome),
      linhaCSVEscape(p.tipo),
      linhaCSVEscape(p.subcategoria ?? ''),
      linhaCSVEscape(preco),
      linhaCSVEscape(precosJson)
    ].join(',');
  }).join('\n');
  await fs.writeFile(arquivoProdutos, header + '\n' + linhas, 'utf8');
}

async function carregarProdutosCSV() {
  try {
    const txt = await fs.readFile(arquivoProdutos, 'utf8');
    const linhas = txt.trim().split('\n');
    produtos = linhas.slice(1).map(l => {
      const cols = splitCSVLine(l);
      const precosStr = cols[5] ?? '';
      let precos: {P:number;M:number;G:number} | undefined = undefined;
      if (precosStr) {
        try { precos = JSON.parse(precosStr); } catch {}
      }
      return {
        id: cols[0] ?? '',
        nome: cols[1] ?? '',
        tipo: (cols[2] ?? 'outro') as CategoriaProduto,
        subcategoria: (cols[3] ?? '') as SubcategoriaPizza,
        preco: cols[4] ? parseFloat(cols[4]) : undefined,
        precosPorTamanho: precos
      } as Produto;
    });
  } catch {
    produtos = [];
  }
}

async function salvarPedidosCSV() {
  await garantirPastaDados();
  const header = ['id','clienteId','itensJson','subtotal','taxaEntrega','total','data','pagamento','entrega','status'].join(',');
  const linhas = pedidos.map(ped => {
    const itensJson = JSON.stringify(ped.itens);
    return [
      linhaCSVEscape(ped.id),
      linhaCSVEscape(ped.clienteId),
      linhaCSVEscape(itensJson),
      linhaCSVEscape(ped.subtotal.toFixed(2)),
      linhaCSVEscape(ped.taxaEntrega.toFixed(2)),
      linhaCSVEscape(ped.total.toFixed(2)),
      linhaCSVEscape(ped.data),
      linhaCSVEscape(ped.pagamento),
      linhaCSVEscape(ped.entregaTipo),
      linhaCSVEscape(ped.status)
    ].join(',');
  }).join('\n');
  await fs.writeFile(arquivoPedidos, header + '\n' + linhas, 'utf8');
}

/**
 * carregarPedidosCSV:
 * - tolera versões antigas onde o arquivo pode ter apenas produtoIds (coluna antiga),
 * - ou onde itensJson é uma string JSON.
 */
async function carregarPedidosCSV() {
  try {
    const txt = await fs.readFile(arquivoPedidos, 'utf8');
    const linhas = txt.trim().split('\n');
    pedidos = linhas.slice(1).map(l => {
      const cols = splitCSVLine(l);
      // se arquivo tiver o formato antigo (id,clienteId,produtoIds,total,data,pagamento,entrega)
      // detectamos isso pelo número de colunas ou pelo formato do terceiro campo.
      let itens: PedidoItem[] = [];
      const third = cols[2] ?? '';
      // tentativa 1: se third parece com JSON array -> parse
      if (third.trim().startsWith('[') || third.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(third);
          // parsed pode ser array de itens ou array de produtoIds - normalizar
          if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
            itens = parsed as PedidoItem[];
          } else if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
            // era uma lista de productIds (antigo) -> transformar em itens com quantidade 1 e precoUnitario 0 (será recalculado na carga)
            itens = (parsed as string[]).map(pid => ({ produtoId: pid, quantidade: 1, precoUnitario: 0 }));
          } else {
            itens = [];
          }
        } catch {
          itens = [];
        }
      } else {
        // terceiro campo não é JSON -> possivelmente formato antigo, ou vazio
        // tentar detectar se é produtoIds separados por '|' (antigo)
        if (third.includes('|')) {
          const ids = third.split('|').map(s => s.trim()).filter(Boolean);
          itens = ids.map(pid => ({ produtoId: pid, quantidade: 1, precoUnitario: 0 }));
        } else {
          itens = [];
        }
      }

      // Recalcular precoUnitario e precoAdicionaisUnit se estiverem zerados e produtos conhecem preços
      for (const it of itens) {
        if ((it.precoUnitario ?? 0) === 0) {
          const prod = produtos.find(p => p.id === it.produtoId);
          if (prod) {
            if (prod.tipo === 'pizza' && it.tamanho && prod.precosPorTamanho) {
              it.precoUnitario = prod.precosPorTamanho[it.tamanho as 'P'|'M'|'G'] ?? 0;
            } else {
              it.precoUnitario = prod.preco ?? 0;
            }
          }
        }
      }

      return {
        id: cols[0] ?? '',
        clienteId: cols[1] ?? '',
        itens,
        subtotal: cols[3] ? parseFloat(cols[3]) : 0,
        taxaEntrega: cols[4] ? parseFloat(cols[4]) : 0,
        total: cols[5] ? parseFloat(cols[5]) : 0,
        data: cols[6] ?? '',
        pagamento: (cols[7] ?? 'Dinheiro') as FormaPagamento,
        entregaTipo: (cols[8] ?? 'Entrega') as TipoEntrega,
        status: (cols[9] ?? 'aberto') as StatusPedido
      } as Pedido;
    });
  } catch {
    pedidos = [];
  }
}

/* ------------------ Menu principal ------------------ */

function menu() {
  console.log('\n=== Sistema Pizzaria ===');
  console.log('1 - Cadastrar Cliente / Fazer Pedido');
  console.log('2 - Listar Clientes');
  console.log('3 - Cadastrar Produto (pizza / borda / adicional / outros)');
  console.log('4 - Listar Produtos (Cardápio)');
  console.log('5 - Relatórios de Vendas / Gerenciar Pedidos');
  console.log('6 - Histórico de Pedidos por Cliente');
  console.log('7 - Limpeza de Dados (Excluir)');
  console.log('8 - Gerenciar Pedidos (status / cancelar)');
  console.log('9 - Sair');
  ask('Escolha uma opção: ').then(op => {
    switch(op.trim()) {
      case '1': cadastrarOuSelecionarCliente(); break;
      case '2': listarClientes(); break;
      case '3': cadastrarProduto(); break;
      case '4': listarProdutosCardapio(); break;
      case '5': gerarRelatorios(); break;
      case '6': selecionarClienteHistorico(); break;
      case '7': menuLimpeza(); break;
      case '8': gerenciarPedidoMenu(); break;
      case '9': console.log('Até mais!'); rl.close(); break;
      default: console.log('Opção inválida!'); menu();
    }
  });
}

/* ------------------ Clientes ------------------ */

async function cadastrarOuSelecionarCliente() {
  const r = (await ask('O cliente já está cadastrado? (s/n): ')).trim().toLowerCase();
  if (r === 's') {
    if (clientes.length === 0) {
      console.log('Nenhum cliente cadastrado ainda.');
      return cadastrarCliente();
    }
    clientes.forEach(c => console.log(`ID: ${c.id} | ${c.nome} | Tel: ${c.telefone} | CEP: ${c.cep}`));
    const id = (await ask('Digite o ID do cliente: ')).trim();
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) { console.log('Cliente não encontrado.'); return cadastrarOuSelecionarCliente(); }
    await registrarPedido(cliente.id);
  } else if (r === 'n') {
    await cadastrarCliente();
  } else {
    console.log('Opção inválida.');
    await cadastrarOuSelecionarCliente();
  }
}

async function cadastrarCliente() {
  const nome = (await ask('Nome do cliente: ')).trim();
  const telefone = (await ask('Telefone: ')).trim();
  const cep = (await ask('CEP: ')).trim();
  const endereco = (await ask('Endereço completo: ')).trim();
  const complemento = (await ask('Complemento: ')).trim();
  const id = (clientes.length + 1).toString();
  clientes.push({ id, nome, telefone, cep, endereco, complemento });
  await salvarClientesCSV();
  console.log('Cliente cadastrado com sucesso!');
  await registrarPedido(id);
}

function listarClientes() {
  if (clientes.length === 0) {
    console.log('Nenhum cliente cadastrado.');
  } else {
    console.log('\n=== Lista de Clientes ===');
    clientes.forEach(c => {
      console.log(`ID: ${c.id} | Nome: ${c.nome} | Tel: ${c.telefone} | CEP: ${c.cep} | ${c.endereco} ${c.complemento ? '- ' + c.complemento : ''}`);
    });
    console.log('========================\n');
  }
  menu();
}

/* ------------------ Produtos ------------------ */

async function cadastrarProduto() {
  console.log('\nCategorias: 1-Pizza  2-Refrigerante  3-Sobremesa  4-Adicional  5-Borda  6-Outro');
  const cat = (await ask('Escolha categoria (1-6): ')).trim();
  const mapa: Record<string, CategoriaProduto> = { '1':'pizza','2':'refrigerante','3':'sobremesa','4':'adicional','5':'borda','6':'outro' };
  const tipo = mapa[cat];
  if (!tipo) { console.log('Categoria inválida.'); return menu(); }

  const nome = (await ask('Nome do produto: ')).trim();
  if (!nome) { console.log('Nome não pode ficar vazio.'); return menu(); }

  const novo: Produto = {
    id: (produtos.length + 1).toString(),
    nome,
    tipo
  };

  if (tipo === 'pizza') {
    const sub = (await ask('Subcategoria (1 - salgada, 2 - doce): ')).trim();
    novo.subcategoria = sub === '2' ? 'doce' : 'salgada';
    const pP = parseFloat((await ask('Preço P (ex: 29.90): ')).replace(',', '.'));
    const pM = parseFloat((await ask('Preço M (ex: 39.90): ')).replace(',', '.'));
    const pG = parseFloat((await ask('Preço G (ex: 49.90): ')).replace(',', '.'));
    if ([pP,pM,pG].some(v => isNaN(v) || v <= 0)) { console.log('Preços inválidos.'); return menu(); }
    novo.precosPorTamanho = { P: pP, M: pM, G: pG };
  } else {
    const preco = parseFloat((await ask('Preço (ex: 9.90): ')).replace(',', '.'));
    if (isNaN(preco) || preco <= 0) { console.log('Preço inválido.'); return menu(); }
    novo.preco = preco;
  }

  produtos.push(novo);
  await salvarProdutosCSV();
  console.log(`Produto "${novo.nome}" cadastrado como ${novo.tipo}.`);
  menu();
}

function listarProdutosCardapio() {
  if (produtos.length === 0) {
    console.log('Nenhum produto cadastrado.');
    return menu();
  }
  console.log('\n========== CARDÁPIO ==========');

  const pizzas = produtos.filter(p => p.tipo === 'pizza');
  const salgadas = pizzas.filter(p => p.subcategoria === 'salgada');
  const doces = pizzas.filter(p => p.subcategoria === 'doce');

  if (salgadas.length) {
    console.log('\n--- PIZZAS SALGADAS ---');
    salgadas.forEach(p => console.log(`ID:${p.id} | ${p.nome} | P:${p.precosPorTamanho?.P?.toFixed(2)} M:${p.precosPorTamanho?.M?.toFixed(2)} G:${p.precosPorTamanho?.G?.toFixed(2)}`));
  }
  if (doces.length) {
    console.log('\n--- PIZZAS DOCES ---');
    doces.forEach(p => console.log(`ID:${p.id} | ${p.nome} | P:${p.precosPorTamanho?.P?.toFixed(2)} M:${p.precosPorTamanho?.M?.toFixed(2)} G:${p.precosPorTamanho?.G?.toFixed(2)}`));
  }

  const bordas = produtos.filter(p => p.tipo === 'borda');
  if (bordas.length) {
    console.log('\n--- BORDAS ---');
    bordas.forEach(b => console.log(`ID:${b.id} | ${b.nome} | R$ ${b.preco?.toFixed(2)}`));
  }

  const adicionais = produtos.filter(p => p.tipo === 'adicional');
  if (adicionais.length) {
    console.log('\n--- ADICIONAIS ---');
    adicionais.forEach(a => console.log(`ID:${a.id} | ${a.nome} | R$ ${a.preco?.toFixed(2)}`));
  }

  const outros = produtos.filter(p => ['refrigerante','sobremesa','outro'].includes(p.tipo));
  if (outros.length) {
    console.log('\n--- OUTROS ---');
    outros.forEach(o => console.log(`ID:${o.id} | ${o.nome} | R$ ${o.preco?.toFixed(2)} | ${o.tipo}`));
  }

  console.log('==============================\n');
  menu();
}

/* ------------------ Registrar Pedido (múltiplos itens) ------------------ */

function calcularTaxaPorCEP(cep: string): number {
  const clean = (cep || '').replace(/\D/g,'');
  if (clean.endsWith('00')) return 8;
  return 5;
}

async function registrarPedido(clienteId: string) {
  const cliente = clientes.find(c => c.id === clienteId);
  if (!cliente) { console.log('Cliente não encontrado.'); return menu(); }
  if (produtos.length === 0) { console.log('Nenhum produto cadastrado.'); return menu(); }

  console.log('\n=== Registrar Pedido ===');
  listarProdutosResumo();

  const itens: PedidoItem[] = [];

  while (true) {
    const prodId = (await ask('Digite o ID do produto a adicionar (ou ENTER para terminar): ')).trim();
    if (!prodId) break;
    const produto = produtos.find(p => p.id === prodId);
    if (!produto) { console.log('Produto inválido.'); continue; }

    const qtd = Math.max(1, parseInt((await ask('Quantidade: ')).trim()) || 1);

    let tamanho: 'P'|'M'|'G'|undefined = undefined;
    let precoUnitario = 0;
    let precoAdicionaisUnit = 0;
    let bordaId: string | null = null;
    const adicionaisIds: string[] = [];

    if (produto.tipo === 'pizza') {
      const t = ((await ask('Tamanho (P/M/G) [M]: ')).trim().toUpperCase() || 'M');
      if (!['P','M','G'].includes(t)) { console.log('Tamanho inválido. Usando M.'); tamanho = 'M'; } else tamanho = t as 'P'|'M'|'G';
      precoUnitario = produto.precosPorTamanho ? produto.precosPorTamanho[tamanho] : 0;

      // borda (opcional)
      const bordas = produtos.filter(p => p.tipo === 'borda');
      if (bordas.length) {
        console.log('Bordas disponíveis (ou ENTER para nenhuma):');
        bordas.forEach(b => console.log(`ID:${b.id} | ${b.nome} | R$ ${b.preco?.toFixed(2)}`));
        const bordResp = (await ask('ID da borda (ou ENTER): ')).trim();
        if (bordResp) {
          const bSel = bordas.find(b => b.id === bordResp);
          if (bSel) { bordaId = bSel.id; precoAdicionaisUnit += bSel.preco ?? 0; }
          else console.log('Borda inválida; ignorada.');
        }
      }

      // adicionais
      const adicionais = produtos.filter(p => p.tipo === 'adicional');
      if (adicionais.length) {
        console.log('Adicionais disponíveis (separe IDs por vírgula ou ENTER para nenhum):');
        adicionais.forEach(a => console.log(`ID:${a.id} | ${a.nome} | R$ ${a.preco?.toFixed(2)}`));
        const addResp = (await ask('IDs dos adicionais: ')).trim();
        if (addResp) {
          const addIds = addResp.split(',').map(s => s.trim()).filter(Boolean);
          for (const aid of addIds) {
            const aProd = adicionais.find(a => a.id === aid);
            if (aProd) { adicionaisIds.push(aid); precoAdicionaisUnit += aProd.preco ?? 0; }
            else console.log(`Adicional ${aid} inválido e será ignorado.`);
          }
        }
      }
    } else {
      precoUnitario = produto.preco ?? 0;
    }

    itens.push({
      produtoId: produto.id,
      quantidade: qtd,
      tamanho,
      bordaId,
      adicionaisIds,
      precoUnitario,
      precoAdicionaisUnit
    });

    console.log(`Adicionado ${produto.nome} x${qtd}`);
  }

  if (itens.length === 0) { console.log('Nenhum item adicionado. Voltando ao menu.'); return menu(); }

  let pagamento = (await ask('Forma de pagamento (Dinheiro / Cartão / Pix): ')).trim();
  if (!['Dinheiro','Cartão','Pix'].includes(pagamento)) pagamento = 'Dinheiro';
  let entrega = (await ask('Entrega ou Retirada? (Entrega / Retirada): ')).trim();
  if (!['Entrega','Retirada'].includes(entrega)) entrega = 'Entrega';

  // calcular subtotal
  let subtotal = 0;
  for (const it of itens) {
    const unit = it.precoUnitario + (it.precoAdicionaisUnit ?? 0);
    subtotal += unit * it.quantidade;
  }

  let taxaEntrega = 0;
  if (entrega === 'Entrega') taxaEntrega = calcularTaxaPorCEP(cliente.cep);

  const total = subtotal + taxaEntrega;
  const data = new Date().toISOString().slice(0,10);
  const id = (pedidos.length + 1).toString();
  const pedido: Pedido = {
    id, clienteId, itens, subtotal, taxaEntrega, total,
    data, pagamento: pagamento as FormaPagamento,
    entregaTipo: entrega as TipoEntrega,
    status: 'aberto'
  };

  pedidos.push(pedido);
  await salvarPedidosCSV();
  console.log(`Pedido registrado! ID:${pedido.id} | Total: R$ ${pedido.total.toFixed(2)}`);

  await gerarRecibo(pedido);
  console.log(`Recibo gerado em ${pastaRecibos}`);

  menu();
}

function listarProdutosResumo() {
  produtos.forEach(p => {
    if (p.tipo === 'pizza') {
      console.log(`ID:${p.id} | ${p.nome} (pizza/${p.subcategoria}) - P:${p.precosPorTamanho?.P?.toFixed(2)} M:${p.precosPorTamanho?.M?.toFixed(2)} G:${p.precosPorTamanho?.G?.toFixed(2)}`);
    } else {
      console.log(`ID:${p.id} | ${p.nome} - R$ ${p.preco?.toFixed(2)} | ${p.tipo}`);
    }
  });
}

/* ------------------ Gerar Recibo ------------------ */

async function gerarRecibo(pedido: Pedido) {
  await garantirPastaDados();
  const cliente = clientes.find(c => c.id === pedido.clienteId);
  const lines: string[] = [];
  lines.push(`=== Recibo de Pedido #${pedido.id} ===`);
  lines.push(`Data: ${pedido.data}`);
  lines.push(`Cliente: ${cliente?.nome}`);
  lines.push(`Telefone: ${cliente?.telefone}`);
  lines.push(`Endereço: ${cliente?.endereco} ${cliente?.complemento ? ', ' + cliente?.complemento : ''}`);
  lines.push(`Forma de pagamento: ${pedido.pagamento}`);
  lines.push(`Entrega tipo: ${pedido.entregaTipo}`);
  lines.push(`Status: ${pedido.status}`);
  lines.push('--- Itens ---');

  for (const it of pedido.itens) {
    const prod = produtos.find(p => p.id === it.produtoId);
    if (!prod) continue;
    let line = `${prod.nome}`;
    if (prod.tipo === 'pizza') line += ` (${it.tamanho})`;
    line += ` x${it.quantidade} -> Unit: R$ ${it.precoUnitario.toFixed(2)}`;
    if (it.bordaId) {
      const b = produtos.find(bb => bb.id === it.bordaId);
      if (b) line += ` | Borda: ${b.nome} (R$ ${b.preco?.toFixed(2)})`;
    }
    if (it.adicionaisIds && it.adicionaisIds.length) {
      const nomes = it.adicionaisIds.map(id => produtos.find(p => p.id === id)?.nome ?? id);
      line += ` | Adicionais: ${nomes.join(', ')}`;
    }
    const totalItem = (it.precoUnitario + (it.precoAdicionaisUnit ?? 0)) * it.quantidade;
    line += ` | Total item: R$ ${totalItem.toFixed(2)}`;
    lines.push(line);
  }

  lines.push('--- Subtotal ---');
  lines.push(`R$ ${pedido.subtotal.toFixed(2)}`);
  if (pedido.taxaEntrega > 0) lines.push(`Taxa de entrega: R$ ${pedido.taxaEntrega.toFixed(2)}`);
  lines.push('--- Total ---');
  lines.push(`R$ ${pedido.total.toFixed(2)}`);

  const arquivo = path.join(pastaRecibos, `pedido_${pedido.id}.txt`);
  await fs.writeFile(arquivo, lines.join('\n'), 'utf8');
}

/* ------------------ Relatórios ------------------ */

function gerarRelatorios() {
  if (pedidos.length === 0) { console.log('Nenhum pedido registrado ainda.'); menu(); return; }

  const vendasPorDia: Record<string, number> = {};
  const vendasPorMes: Record<string, number> = {};
  const produtosVendidos: Record<string, number> = {};
  const pizzasPorTamanho: Record<string, number> = { P:0, M:0, G:0 };

  // iteração segura: garante que ped.itens seja array
  for (const ped of pedidos) {
    let itens = ped.itens;
    if (!Array.isArray(itens)) {
      // caso venha como string ou mal formado, tentar parse
      try { itens = JSON.parse((itens as any) as string); } catch { itens = []; }
    }
    vendasPorDia[ped.data] = (vendasPorDia[ped.data] || 0) + 1;
    const mes = ped.data.slice(0,7);
    vendasPorMes[mes] = (vendasPorMes[mes] || 0) + 1;

    for (const it of itens as PedidoItem[]) {
      produtosVendidos[it.produtoId] = (produtosVendidos[it.produtoId] || 0) + it.quantidade;
      const pr = produtos.find(pp => pp.id === it.produtoId);
      if (pr?.tipo === 'pizza' && it.tamanho) pizzasPorTamanho[it.tamanho] = (pizzasPorTamanho[it.tamanho] || 0) + it.quantidade;
      if (it.bordaId) produtosVendidos[it.bordaId] = (produtosVendidos[it.bordaId] || 0) + it.quantidade;
      if (it.adicionaisIds) it.adicionaisIds.forEach(aid => produtosVendidos[aid] = (produtosVendidos[aid] || 0) + it.quantidade);
    }
  }

  console.log('\n=== Vendas por dia ===');
  Object.entries(vendasPorDia).forEach(([d,q]) => console.log(`${d}: ${q} pedido(s)`));

  console.log('\n=== Vendas por mês ===');
  Object.entries(vendasPorMes).forEach(([m,q]) => console.log(`${m}: ${q} pedido(s)`));

  console.log('\n=== Pizzas por tamanho ===');
  console.log(`P: ${pizzasPorTamanho.P}  M: ${pizzasPorTamanho.M}  G: ${pizzasPorTamanho.G}`);

  console.log('\n=== Top produtos vendidos ===');
  const arr = Object.entries(produtosVendidos).map(([pid,q]) => {
    const p = produtos.find(pp => pp.id === pid);
    return { nome: p ? `${p.nome} (${p.tipo})` : pid, qtd: q };
  }).sort((a,b) => b.qtd - a.qtd).slice(0,10);
  arr.forEach(a => console.log(`${a.nome}: ${a.qtd}`));

  const totalVendido = pedidos.reduce((s,p) => s + p.total, 0);
  const ticketMedio = totalVendido / pedidos.length;
  console.log(`\nTotal vendido: R$ ${totalVendido.toFixed(2)}`);
  console.log(`Ticket médio: R$ ${ticketMedio.toFixed(2)}`);

  menu();
}

/* ------------------ Histórico de Pedidos por Cliente ------------------ */

async function selecionarClienteHistorico() {
  if (clientes.length === 0) { console.log('Nenhum cliente cadastrado.'); menu(); return; }
  clientes.forEach(c => console.log(`ID: ${c.id} | ${c.nome}`));
  const id = (await ask('Digite o ID do cliente para ver histórico: ')).trim();
  mostrarHistoricoCliente(id);
}

function mostrarHistoricoCliente(clienteId: string) {
  const cliente = clientes.find(c => c.id === clienteId);
  if (!cliente) { console.log('Cliente não encontrado.'); menu(); return; }

  const pedidosCliente = pedidos.filter(p => p.clienteId === clienteId);
  if (pedidosCliente.length === 0) { console.log('Nenhum pedido registrado para esse cliente.'); menu(); return; }

  console.log(`\n=== Histórico de ${cliente.nome} ===`);
  for (const p of pedidosCliente) {
    console.log(`Pedido #${p.id} | Data: ${p.data} | Total: R$ ${p.total.toFixed(2)} | Pagamento: ${p.pagamento} | Status: ${p.status}`);
    let itens = p.itens;
    if (!Array.isArray(itens)) {
      try { itens = JSON.parse((itens as any) as string); } catch { itens = []; }
    }
    for (const i of itens as PedidoItem[]) {
      const prod = produtos.find(pr => pr.id === i.produtoId);
      let line = `  - ${prod?.nome ?? i.produtoId}`;
      if (prod?.tipo === 'pizza') line += ` (${i.tamanho})`;
      line += ` x${i.quantidade} -> Unit: R$ ${i.precoUnitario.toFixed(2)}`;
      if (i.precoAdicionaisUnit && i.precoAdicionaisUnit > 0) line += ` | Adic/unit: R$ ${i.precoAdicionaisUnit.toFixed(2)}`;
      console.log(line);
    }
  }
  console.log('================================\n');
  menu();
}

/* ------------------ Limpeza de dados ------------------ */

async function menuLimpeza() {
  console.log('\n1 - Excluir Cliente');
  console.log('2 - Excluir Produto');
  console.log('3 - Excluir Pedido');
  console.log('4 - Voltar');
  const opt = (await ask('Escolha: ')).trim();
  if (opt === '1') await excluirCliente();
  else if (opt === '2') await excluirProduto();
  else if (opt === '3') await excluirPedido();
  else menu();
}

async function excluirCliente() {
  if (clientes.length === 0) { console.log('Nenhum cliente cadastrado.'); menu(); return; }
  clientes.forEach(c => console.log(`ID:${c.id} | ${c.nome}`));
  const id = (await ask('ID do cliente a excluir: ')).trim();
  const idx = clientes.findIndex(c => c.id === id);
  if (idx === -1) { console.log('Cliente não encontrado.'); menu(); return; }
  clientes.splice(idx,1);
  await salvarClientesCSV();
  pedidos = pedidos.filter(p => p.clienteId !== id);
  await salvarPedidosCSV();
  console.log('Cliente e pedidos associados excluídos.');
  menu();
}

async function excluirProduto() {
  if (produtos.length === 0) { console.log('Nenhum produto cadastrado.'); menu(); return; }
  produtos.forEach(p => console.log(`ID:${p.id} | ${p.nome} | ${p.tipo} | R$ ${p.preco ?? ''}`));
  const id = (await ask('ID do produto a excluir: ')).trim();
  const idx = produtos.findIndex(p => p.id === id);
  if (idx === -1) { console.log('Produto não encontrado.'); menu(); return; }
  produtos.splice(idx,1);
  await salvarProdutosCSV();

  // remover referências nos pedidos e recalcular
  for (const ped of pedidos) {
    ped.itens = ped.itens.filter(it => it.produtoId !== id && it.bordaId !== id && !(it.adicionaisIds || []).includes(id));
    ped.subtotal = ped.itens.reduce((s,it) => s + (it.precoUnitario + (it.precoAdicionaisUnit ?? 0)) * it.quantidade, 0);
    ped.total = ped.subtotal + ped.taxaEntrega;
  }
  await salvarPedidosCSV();
  console.log('Produto removido e pedidos atualizados.');
  menu();
}

async function excluirPedido() {
  if (pedidos.length === 0) { console.log('Nenhum pedido cadastrado.'); menu(); return; }
  pedidos.forEach(p => console.log(`ID:${p.id} | Cliente:${p.clienteId} | Total:R$ ${p.total.toFixed(2)} | Status:${p.status}`));
  const id = (await ask('ID do pedido a excluir: ')).trim();
  const idx = pedidos.findIndex(p => p.id === id);
  if (idx === -1) { console.log('Pedido não encontrado.'); menu(); return; }
  pedidos.splice(idx,1);
  await salvarPedidosCSV();
  console.log('Pedido excluído.');
  menu();
}

/* ------------------ Gerenciar pedidos (status) ------------------ */

async function gerenciarPedidoMenu() {
  if (pedidos.length === 0) { console.log('Nenhum pedido registrado.'); menu(); return; }
  console.log('\nPedidos:');
  pedidos.forEach(p => console.log(`ID:${p.id} | Cliente:${p.clienteId} | Total:R$ ${p.total.toFixed(2)} | Status:${p.status}`));
  const id = (await ask('ID do pedido para gerenciar (ou ENTER para voltar): ')).trim();
  if (!id) return menu();
  const ped = pedidos.find(p => p.id === id);
  if (!ped) { console.log('Pedido não encontrado.'); return menu(); }
  console.log(`Pedido #${ped.id} - Status atual: ${ped.status}`);
  console.log('1 - Avançar status (aberto -> preparando -> pronto -> entregue)');
  console.log('2 - Cancelar pedido');
  console.log('3 - Voltar');
  const opt = (await ask('Escolha: ')).trim();
  if (opt === '1') await avancarStatusPedido(ped);
  else if (opt === '2') { ped.status = 'cancelado'; await salvarPedidosCSV(); console.log('Pedido cancelado.'); menu(); }
  else menu();
}

async function avancarStatusPedido(ped: Pedido) {
  const fluxo: StatusPedido[] = ['aberto','preparando','pronto','entregue'];
  const idx = fluxo.indexOf(ped.status);
  if (idx === -1) { console.log('Status inválido.'); menu(); return; }
  if (idx === fluxo.length - 1) { console.log('Pedido já entregue.'); menu(); return; }
  ped.status = fluxo[idx + 1];
  await salvarPedidosCSV();
  console.log(`Status atualizado para ${ped.status}`);
  menu();
}

/* ------------------ Inicialização ------------------ */

(async () => {
  await garantirPastaDados();
  await carregarClientesCSV();
  await carregarProdutosCSV();
  await carregarPedidosCSV();

  console.log('Dados carregados. Produtos:', produtos.length, 'Clientes:', clientes.length, 'Pedidos:', pedidos.length);
  menu();
})();
