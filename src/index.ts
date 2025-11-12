
import * as fs from "fs";
import * as path from "path";
import readlineSync from "readline-sync";
import sql from "mssql";
import { getConnection } from "./database";
import * as readline from 'readline';



/**
 * Assumimos as tabelas:
 * - Clientes(id, nome, telefone, cep, endereco, complemento)
 * - Produtos(id, nome, preco, tipo)
 * - Pedidos(id, clienteId, total, data, pagamento, entrega, status)  <-- status pode ser adicionado se não existir
 * - PedidoItens(id, pedidoId, produtoId, quantidade, tamanho)
 * - PizzaPrecos(produtoId PK, precoP, precoM, precoG)  <-- criada automaticamente se não existir
 */

/* ------------------ util / inicialização DB ------------------ */

async function ensureSchema() {
  const pool = await getConnection();
  // 1) garantir coluna 'status' em Pedidos
  const addStatusQuery = `
IF COL_LENGTH('dbo.Pedidos','status') IS NULL
BEGIN
  ALTER TABLE dbo.Pedidos ADD status NVARCHAR(20) CONSTRAINT DF_Pedidos_Status DEFAULT('aberto');
END
`;
  await pool.request().batch(addStatusQuery);

  // 2) garantir tabela PizzaPrecos
  const createPizzaPrecos = `
IF OBJECT_ID('dbo.PizzaPrecos','U') IS NULL
BEGIN
  CREATE TABLE dbo.PizzaPrecos (
    produtoId INT PRIMARY KEY,
    precoP DECIMAL(10,2) NULL,
    precoM DECIMAL(10,2) NULL,
    precoG DECIMAL(10,2) NULL
  );
END
`;
  await pool.request().batch(createPizzaPrecos);
}

/* ------------------ helpers ------------------ */

function limparTela() {
  console.clear();
}

function pausar() {
  readlineSync.question("\nPressione ENTER para continuar...");
}

function formatMoney(v: number) {
  return v.toFixed(2);
}

/* ------------------ tipos locais ------------------ */

type FormaPagamento = "Dinheiro" | "Cartão" | "Pix";
type TipoEntrega = "Entrega" | "Retirada";
type StatusPedido = "aberto" | "preparando" | "pronto" | "entregue" | "cancelado";

/* ------------------ menu principal ------------------ */

async function menu() {
  limparTela();
process.stdout.setDefaultEncoding('utf8');
  console.log("=== SISTEMA PIZZARIA ===");
  console.log("1 - Cadastrar Cliente / Fazer Pedido");
  console.log("2 - Listar Clientes");
  console.log("3 - Cadastrar Produto (pizza / borda / adicional / outros)");
  console.log("4 - Listar Produtos (Cardápio)");
  console.log("5 - Relatórios de Vendas / Gerenciar Pedidos");
  console.log("6 - Histórico de Pedidos por Cliente");
  console.log("7 - Gerenciar Status");
  console.log("8 - Limpeza de Dados (Excluir)");
  console.log("9 - Sair");
  const opcao = readlineSync.questionInt("\nEscolha uma opção: ");

  switch (opcao) {
    case 1:
      await menuClientePedido();
      break;
    case 2:
      await listarClientes();
      break;
    case 3:
      await cadastrarProduto();
      break;
    case 4:
      await listarProdutosCardapio();
      break;
    case 5:
      await relatoriosVendas();
      break;
    case 6:
      await historicoCliente();
      break;
    case 7:
      await gerenciarAdicionaisBordasEstatus();
      break;
    case 8:
      await menuLimpeza();
      break;
    case 9:
      console.log("Saindo...");
      process.exit(0);
    default:
      console.log("Opção inválida!");
      pausar();
      await menu();
  }
}

/* ------------------ clientes ------------------ */

async function cadastrarCliente(): Promise<number> {
  limparTela();
  console.log("=== CADASTRAR CLIENTE ===");
  const nome = readlineSync.question("Nome completo: ").trim();
  const telefone = readlineSync.question("Telefone: ").trim();
  const cep = readlineSync.question("CEP: ").trim();
  const endereco = readlineSync.question("Endereço (rua, nº): ").trim();
  const complemento = readlineSync.question("Complemento (opcional): ").trim();
  const cidade = readlineSync.question("Cidade: ").trim();
  const bairro = readlineSync.question("Bairro: ").trim();
  const observacoes = readlineSync.question("Observações (ponto de referência etc) (opcional): ").trim();

  // vamos concatenar endereço e complemento (a sua tabela tem ENDERECO e COMPLEMENTO)
  const enderecoCompleto = `${endereco} - ${bairro} - ${cidade}`;

  const pool = await getConnection();
  const res = await pool
    .request()
    .input("nome", sql.NVarChar, nome)
    .input("telefone", sql.NVarChar, telefone)
    .input("cep", sql.NVarChar, cep)
    .input("endereco", sql.NVarChar, enderecoCompleto)
    .input("complemento", sql.NVarChar, complemento || observacoes || "")
    .query(
      `INSERT INTO Clientes (nome, telefone, cep, endereco, complemento)
       OUTPUT INSERTED.id
       VALUES (@nome, @telefone, @cep, @endereco, @complemento)`
    );

  const id = res.recordset[0].id;
  console.log(`✅ Cliente cadastrado com sucesso! ID: ${id}`);
  pausar();
  return id;
}

async function listarClientes() {
  limparTela();
  console.log("=== LISTA DE CLIENTES ===");
  const pool = await getConnection();
  const r = await pool.request().query("SELECT * FROM Clientes ORDER BY id");
  if (r.recordset.length === 0) {
    console.log("Nenhum cliente cadastrado.");
  } else {
    r.recordset.forEach((c: any) => {
      console.log(`ID:${c.id} | ${c.nome} | Tel:${c.telefone} | CEP:${c.cep} | ${c.endereco} ${c.complemento ? '- ' + c.complemento : ''}`);
    });
  }
  pausar();
  await menu();
}

/* ------------------ produtos ------------------ */

async function cadastrarProduto() {
  limparTela();
  console.log("=== CADASTRAR PRODUTO ===");
  const nome = readlineSync.question("Nome do produto: ").trim();
  console.log("Categorias: 1-Pizza  2-Bebida/Outros  3-Adicional  4-Borda");
  const cat = readlineSync.questionInt("Escolha: ");
  let tipo = "outro";
  if (cat === 1) tipo = "pizza";
  else if (cat === 2) tipo = "outro";
  else if (cat === 3) tipo = "adicional";
  else if (cat === 4) tipo = "borda";

  const pool = await getConnection();

  if (tipo === "pizza") {
    console.log("Informe os preços por tamanho (use '.' como separador)");
    const precoP = parseFloat(readlineSync.question("Preço P: ").replace(",", "."));
    const precoM = parseFloat(readlineSync.question("Preço M: ").replace(",", "."));
    const precoG = parseFloat(readlineSync.question("Preço G: ").replace(",", "."));

    const insert = await pool.request()
      .input("nome", sql.NVarChar, nome)
      .input("tipo", sql.NVarChar, tipo)
      .input("preco", sql.Decimal(10,2), 0)
      .query("INSERT INTO Produtos (nome, tipo, preco) OUTPUT INSERTED.id VALUES (@nome, @tipo, @preco)");
    const id = insert.recordset[0].id;

    // gravar preços por tamanho em PizzaPrecos
    await pool.request()
      .input("produtoId", sql.Int, id)
      .input("p", sql.Decimal(10,2), precoP)
      .input("m", sql.Decimal(10,2), precoM)
      .input("g", sql.Decimal(10,2), precoG)
      .query(`INSERT INTO PizzaPrecos (produtoId, precoP, precoM, precoG) VALUES (@produtoId, @p, @m, @g)`);

    console.log(`✅ Pizza cadastrada (ID ${id}).`);
    pausar();
    await menu();
    return;
  } else {
    const preco = parseFloat(readlineSync.question("Preço: ").replace(",", "."));
    await pool.request()
      .input("nome", sql.NVarChar, nome)
      .input("tipo", sql.NVarChar, tipo)
      .input("preco", sql.Decimal(10,2), preco)
      .query("INSERT INTO Produtos (nome, tipo, preco) VALUES (@nome, @tipo, @preco)");
    console.log("✅ Produto cadastrado.");
    pausar();
    await menu();
  }
}

async function listarProdutosCardapio() {
  limparTela();
  console.log("=== CARDÁPIO ===");
  const pool = await getConnection();
  const res = await pool.request().query("SELECT * FROM Produtos ORDER BY tipo, nome");
  if (res.recordset.length === 0) {
    console.log("Nenhum produto cadastrado.");
    pausar();
    await menu();
    return;
  }

  // listar pizzas com preços
  const pizzas = res.recordset.filter((p:any) => p.tipo === "pizza");
  if (pizzas.length) {
    console.log("\n--- PIZZAS ---");
    for (const p of pizzas) {
      const pp = await pool.request().input("id", sql.Int, p.id).query("SELECT precoP, precoM, precoG FROM PizzaPrecos WHERE produtoId = @id");
      const precos = pp.recordset[0] ?? { precoP: 0, precoM: 0, precoG: 0 };
      console.log(`ID:${p.id} | ${p.nome} | P:${formatMoney(Number(precos.precoP))} M:${formatMoney(Number(precos.precoM))} G:${formatMoney(Number(precos.precoG))}`);
    }
  }

  // demais produtos
  const outros = res.recordset.filter((p:any) => p.tipo !== "pizza");
  if (outros.length) {
    console.log("\n--- OUTROS ---");
    outros.forEach((o:any) => {
      console.log(`ID:${o.id} | ${o.nome} | ${o.tipo} | R$ ${formatMoney(Number(o.preco))}`);
    });
  }

  pausar();
  await menu();
}

/* ------------------ pedidos ------------------ */

async function menuClientePedido() {
  limparTela();
  console.log("=== CADASTRAR CLIENTE / FAZER PEDIDO ===");
  console.log("1 - Novo cliente");
  console.log("2 - Cliente existente");
  const opc = readlineSync.questionInt("Escolha uma opção: ");
  let clienteId: number;
  if (opc === 1) clienteId = await cadastrarCliente();
  else {
    clienteId = readlineSync.questionInt("ID do cliente: ");
  }
  await fazerPedido(clienteId);
}

async function fazerPedido(clienteId: number) {
  limparTela();
  console.log("=== FAZER PEDIDO ===");

  const pool = await getConnection();
  const produtosRes = await pool.request().query("SELECT * FROM Produtos ORDER BY tipo, nome");
  if (produtosRes.recordset.length === 0) {
    console.log("Nenhum produto cadastrado.");
    pausar();
    return;
  }

  const itens: { produtoId:number; quantidade:number; tamanho?:string; descricao?:string; precoUnit:number }[] = [];
  let continuar = true;
  while (continuar) {
    console.log("\nProdutos disponíveis:");
    produtosRes.recordset.forEach((p:any) => {
      console.log(`${p.id} - ${p.nome} (${p.tipo}) - R$ ${formatMoney(Number(p.preco))}`);
    });

    const pid = readlineSync.questionInt("\nDigite o ID do produto (0 para finalizar): ");
    if (pid === 0) break;
    const produto = produtosRes.recordset.find((p:any) => p.id === pid);
    if (!produto) { console.log("Produto inválido."); continue; }

    const qtd = Math.max(1, readlineSync.questionInt("Quantidade: "));
    let tamanho: string | undefined;
    let precoUnit = Number(produto.preco);

    if (produto.tipo === "pizza") {
      const tam = (readlineSync.question("Tamanho (P/M/G) [M]: ") || "M").toUpperCase();
      tamanho = (["P","M","G"].includes(tam) ? tam : "M");
      // buscar preço da pizza nos precos
      const pp = await pool.request().input("pid", sql.Int, pid).query("SELECT precoP, precoM, precoG FROM PizzaPrecos WHERE produtoId = @pid");
      const precos = pp.recordset[0];
      if (precos) {
        precoUnit = tamanho === "P" ? Number(precos.precoP) : tamanho === "M" ? Number(precos.precoM) : Number(precos.precoG);
      } else {
        precoUnit = Number(produto.preco) || 0;
      }

      // borda
      const bordas = (await pool.request().query("SELECT * FROM Produtos WHERE tipo = 'borda'")).recordset;
      let bordaId: number | null = null;
      if (bordas.length) {
        console.log("Bordas disponíveis (ou ENTER para nenhuma):");
        bordas.forEach((b:any) => console.log(`ID:${b.id} | ${b.nome} | R$ ${formatMoney(Number(b.preco))}`));
        const bord = readlineSync.question("ID da borda (ou ENTER): ").trim();
        if (bord) {
          const bid = Number(bord);
          const bSel = bordas.find((x:any) => x.id === bid);
          if (bSel) {
            itens.push({ produtoId: bSel.id, quantidade: 1*qtd, descricao: `Borda: ${bSel.nome}`, precoUnit: Number(bSel.preco) });
          } else console.log("Borda inválida; ignorada.");
        }
      }

      // adicionais
      const adicionais = (await pool.request().query("SELECT * FROM Produtos WHERE tipo = 'adicional'")).recordset;
      if (adicionais.length) {
        console.log("Adicionais disponíveis (separe IDs por vírgula ou ENTER para nenhum):");
        adicionais.forEach((a:any) => console.log(`ID:${a.id} | ${a.nome} | R$ ${formatMoney(Number(a.preco))}`));
        const addResp = readlineSync.question("IDs dos adicionais: ").trim();
        if (addResp) {
          const ids = addResp.split(",").map(s=>s.trim()).filter(Boolean).map(Number);
          for (const aid of ids) {
            const aProd = adicionais.find((x:any) => x.id === aid);
            if (aProd) {
              itens.push({ produtoId: aProd.id, quantidade: 1*qtd, descricao: `Adicional: ${aProd.nome}`, precoUnit: Number(aProd.preco) });
            } else {
              console.log(`Adicional ${aid} inválido; ignorado.`);
            }
          }
        }
      }
    }

    // adicionar item principal (pizza ou outro)
    itens.push({ produtoId: produto.id, quantidade: qtd, tamanho, descricao: produto.nome, precoUnit });

    const continuarResp = (readlineSync.question("Deseja adicionar mais itens? (s/n): ") || "s").toLowerCase();
    continuar = continuarResp.startsWith("s");
  }

  if (itens.length === 0) {
    console.log("Nenhum item adicionado. Voltando ao menu.");
    pausar();
    return;
  }

  // calcular total
  let total = 0;
  for (const it of itens) total += (it.precoUnit || 0) * (it.quantidade || 1);

  // perguntar forma de pagamento / entrega
  let pagamento = (readlineSync.question("Forma de pagamento (Dinheiro/Cartão/Pix) [Dinheiro]: ") || "Dinheiro");
  if (!["Dinheiro","Cartão","Pix"].includes(pagamento)) pagamento = "Dinheiro";
  let entrega = (readlineSync.question("Entrega ou Retirada? (Entrega/Retirada) [Entrega]: ") || "Entrega");
  if (!["Entrega","Retirada"].includes(entrega)) entrega = "Entrega";

  // inserir pedido
  const insertPedido = await pool.request()
    .input("clienteId", sql.Int, clienteId)
    .input("total", sql.Decimal(10,2), total)
    .input("pagamento", sql.NVarChar, pagamento)
    .input("entrega", sql.NVarChar, entrega)
    .input("status", sql.NVarChar, "aberto")
    .query(`INSERT INTO Pedidos (clienteId, total, data, pagamento, entrega, status)
            OUTPUT INSERTED.id
            VALUES (@clienteId, @total, GETDATE(), @pagamento, @entrega, @status)`);

  const pedidoId = insertPedido.recordset[0].id;

  // inserir itens
  for (const it of itens) {
    await pool.request()
      .input("pedidoId", sql.Int, pedidoId)
      .input("produtoId", sql.Int, it.produtoId)
      .input("quantidade", sql.Int, it.quantidade)
      .input("tamanho", sql.NVarChar, it.tamanho ?? "")
      .query(`INSERT INTO PedidoItens (pedidoId, produtoId, quantidade, tamanho)
              VALUES (@pedidoId, @produtoId, @quantidade, @tamanho)`);
  }

  console.log(`✅ Pedido #${pedidoId} registrado! Total: R$ ${formatMoney(total)}`);
  gerarRecibo(pedidoId).catch(()=>{});
  pausar();
  await menu();
}

/* ------------------ gerar recibo ------------------ */

async function gerarRecibo(pedidoId: number) {
  const pool = await getConnection();

  // buscar pedido e cliente
  const ped = await pool.request().input("id", sql.Int, pedidoId).query("SELECT p.*, c.nome AS clienteNome, c.telefone FROM Pedidos p JOIN Clientes c ON c.id = p.clienteId WHERE p.id = @id");
  if (ped.recordset.length === 0) {
    console.log("Pedido não encontrado para gerar recibo.");
    return;
  }
  const pinfo = ped.recordset[0];

  // itens
  const itens = await pool.request().input("id", sql.Int, pedidoId).query(`
    SELECT pi.*, pr.nome AS produtoNome, pr.tipo, pr.preco AS produtoPreco
    FROM PedidoItens pi
    JOIN Produtos pr ON pr.id = pi.produtoId
    WHERE pi.pedidoId = @id
  `);

  const recibosDir = path.join(__dirname, "../data/recibos");
  if (!fs.existsSync(recibosDir)) fs.mkdirSync(recibosDir, { recursive: true });

  const lines: string[] = [];
  lines.push(`=== Recibo Pedido #${pedidoId} ===`);
  lines.push(`Data: ${new Date(pinfo.data).toLocaleString()}`);
  lines.push(`Cliente: ${pinfo.clienteNome} Tel: ${pinfo.telefone}`);
  lines.push(`Pagamento: ${pinfo.pagamento} | Entrega: ${pinfo.entrega} | Status: ${pinfo.status}`);
  lines.push('--- Itens ---');

  let soma = 0;
  for (const it of itens.recordset) {
    let unit = Number(it.produtoPreco || 0);
    if (it.tipo === "pizza") {
      // checar PizzaPrecos
      const prc = await pool.request().input("pid", sql.Int, it.produtoId).query("SELECT precoP, precoM, precoG FROM PizzaPrecos WHERE produtoId = @pid");
      const precos = prc.recordset[0];
      if (precos) {
        unit = it.tamanho === "P" ? Number(precos.precoP) : it.tamanho === "M" ? Number(precos.precoM) : Number(precos.precoG);
      }
    }
    const totalItem = unit * it.quantidade;
    soma += totalItem;
    lines.push(`${it.produtoNome} ${it.tamanho ? `(${it.tamanho})` : ""} x${it.quantidade} -> Unit: R$ ${formatMoney(unit)} | Total: R$ ${formatMoney(totalItem)}`);
  }

  lines.push('--- Total ---');
  lines.push(`R$ ${formatMoney(soma)}`);

  const filePath = path.join(recibosDir, `pedido_${pedidoId}.txt`);
  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
  console.log(`🧾 Recibo gerado em ${filePath}`);
}

/* ------------------ relatórios / histórico ------------------ */

async function relatoriosVendas() {
  limparTela();
  console.log("=== RELATÓRIOS DE VENDAS ===");
  const pool = await getConnection();
  const res = await pool.request().query(`
    SELECT p.id, p.clienteId, c.nome AS clienteNome, p.total, p.data, p.status
    FROM Pedidos p
    JOIN Clientes c ON c.id = p.clienteId
    ORDER BY p.data DESC
  `);

  if (res.recordset.length === 0) {
    console.log("Nenhum pedido encontrado.");
  } else {
    res.recordset.forEach((r:any) => {
      console.log(`Pedido #${r.id} | Cliente: ${r.clienteNome} | Total: R$ ${formatMoney(Number(r.total))} | Data: ${new Date(r.data).toLocaleString()} | Status: ${r.status}`);
    });
  }

  // permitir gerenciar status
  console.log("\nDeseja gerenciar um pedido? (id ou 0 para voltar)");
  const id = readlineSync.questionInt("ID: ");
  if (id > 0) {
    await gerenciarPedidoPorId(id);
  }

  pausar();
  await menu();
}

async function historicoCliente() {
  limparTela();
  console.log("=== HISTÓRICO DE PEDIDOS POR CLIENTE ===");
  const idCliente = readlineSync.questionInt("Informe o ID do cliente: ");
  const pool = await getConnection();
  const cliente = await pool.request().input("id", sql.Int, idCliente).query("SELECT * FROM Clientes WHERE id = @id");
  if (cliente.recordset.length === 0) {
    console.log("Cliente não encontrado.");
    pausar();
    await menu();
    return;
  }

  console.log(`Cliente: ${cliente.recordset[0].nome}`);
  const pedidos = await pool.request().input("id", sql.Int, idCliente).query("SELECT * FROM Pedidos WHERE clienteId = @id ORDER BY data DESC");
  if (pedidos.recordset.length === 0) {
    console.log("Nenhum pedido para este cliente.");
    pausar();
    await menu();
    return;
  }

  for (const p of pedidos.recordset) {
    console.log(`\nPedido #${p.id} | Data: ${new Date(p.data).toLocaleString()} | Total: R$ ${formatMoney(Number(p.total))} | Status: ${p.status}`);
    const itens = await pool.request().input("pid", sql.Int, p.id).query(`
      SELECT pi.*, pr.nome AS produtoNome, pr.preco, pr.tipo
      FROM PedidoItens pi
      JOIN Produtos pr ON pr.id = pi.produtoId
      WHERE pi.pedidoId = @pid
    `);
    itens.recordset.forEach((it:any) => {
      console.log(`  - ${it.produtoNome} ${it.tamanho ? `(${it.tamanho})` : ""} x${it.quantidade}`);
    });
  }

  pausar();
  await menu();
}

/* ------------------ limpeza / exclusão ------------------ */

async function menuLimpeza() {
  limparTela();
  console.log("=== LIMPEZA DE DADOS ===");
  console.log("1 - Excluir Cliente");
  console.log("2 - Excluir Produto");
  console.log("3 - Excluir Pedido");
  console.log("4 - Voltar");
  const opc = readlineSync.questionInt("Escolha: ");
  switch (opc) {
    case 1: await excluirCliente(); break;
    case 2: await excluirProduto(); break;
    case 3: await excluirPedido(); break;
    default: await menu(); break;
  }
}

async function excluirCliente() {
  const id = readlineSync.questionInt("ID do cliente a excluir: ");
  const pool = await getConnection();
  await pool.request().input("id", sql.Int, id).query("DELETE FROM Clientes WHERE id = @id");
  console.log("✅ Cliente excluído.");
  pausar();
  await menuLimpeza();
}

async function excluirProduto() {
  const id = readlineSync.questionInt("ID do produto a excluir: ");
  const pool = await getConnection();
  // remover precos de pizza se houver
  await pool.request().input("pid", sql.Int, id).query("DELETE FROM PizzaPrecos WHERE produtoId = @pid");
  await pool.request().input("id", sql.Int, id).query("DELETE FROM Produtos WHERE id = @id");
  console.log("✅ Produto excluído.");
  pausar();
  await menuLimpeza();
}

async function excluirPedido() {
  const id = readlineSync.questionInt("ID do pedido a excluir: ");
  const pool = await getConnection();
  await pool.request().input("id", sql.Int, id).query("DELETE FROM PedidoItens WHERE pedidoId = @id");
  await pool.request().input("id", sql.Int, id).query("DELETE FROM Pedidos WHERE id = @id");
  console.log("✅ Pedido excluído.");
  pausar();
  await menuLimpeza();
}

/* ------------------ adicionais / bordas / status ------------------ */

async function gerenciarAdicionaisBordasEstatus() {
  limparTela();
  console.log("=== GERENCIAR STATUS ===");
  console.log("1 - Atualizar status de um pedido");
  console.log("2 - Voltar");
  const opc = readlineSync.questionInt("Escolha: ");
  switch (opc) {
    case 1:
      const id = readlineSync.questionInt("ID do pedido: ");
      await gerenciarPedidoPorId(id);
      break;
    default: await menu(); break;
  }
}

async function gerenciarPedidoPorId(id: number) {
  const pool = await getConnection();
  const p = await pool.request().input("id", sql.Int, id).query("SELECT * FROM Pedidos WHERE id = @id");
  if (p.recordset.length === 0) { console.log("Pedido não encontrado."); pausar(); return; }
  const pedido = p.recordset[0];
  console.log(`Pedido #${pedido.id} | Total: R$ ${formatMoney(Number(pedido.total))} | Status: ${pedido.status}`);
  console.log("1 - Avançar status (aberto->preparando->pronto->entregue)");
  console.log("2 - Marcar como cancelado");
  console.log("3 - Voltar");
  const opc = readlineSync.questionInt("Escolha: ");
  const fluxo = ["aberto","preparando","pronto","entregue"] as StatusPedido[];
  if (opc === 1) {
    const idx = fluxo.indexOf(pedido.status as StatusPedido);
    if (idx === -1 || idx === fluxo.length - 1) { console.log("Não é possível avançar."); }
    else {
      const novo = fluxo[idx+1];
      await pool.request().input("id", sql.Int, id).input("status", sql.NVarChar, novo).query("UPDATE Pedidos SET status = @status WHERE id = @id");
      console.log(`Status atualizado para ${novo}`);
    }
  } else if (opc === 2) {
    await pool.request().input("id", sql.Int, id).input("status", sql.NVarChar, "cancelado").query("UPDATE Pedidos SET status = @status WHERE id = @id");
    console.log("Pedido cancelado.");
  }
  pausar();
}

/* ------------------ inicialização ------------------ */

(async () => {
  try {
    console.clear();
    console.log("Iniciando sistema e verificando schema...");
    await ensureSchema();
    console.log("✅ Schema verificado.");
    pausar();
    await menu();
  } catch (err) {
    console.error("Erro na inicialização:", err);
  }
})();
