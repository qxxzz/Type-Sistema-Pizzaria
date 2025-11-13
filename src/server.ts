import express, { Request, Response } from "express";
import cors from "cors";
import sql from "mssql";
import { getConnection } from "./database";

const app = express();
app.use(cors());
app.use(express.json());

// ==================== CLIENTES ====================

app.get("/api/clientes", async (req: Request, res: Response) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT * FROM Clientes ORDER BY id");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

app.post("/api/clientes", async (req: Request, res: Response) => {
  try {
    const { nome, telefone, cep, endereco, complemento } = req.body;
    const pool = await getConnection();
    const result = await pool
      .request()
      .input("nome", sql.NVarChar, nome)
      .input("telefone", sql.NVarChar, telefone)
      .input("cep", sql.NVarChar, cep)
      .input("endereco", sql.NVarChar, endereco)
      .input("complemento", sql.NVarChar, complemento || "")
      .query(
        `INSERT INTO Clientes (nome, telefone, cep, endereco, complemento)
         OUTPUT INSERTED.*
         VALUES (@nome, @telefone, @cep, @endereco, @complemento)`
      );
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao cadastrar cliente" });
  }
});

app.delete("/api/clientes/:id", async (req: Request, res: Response) => {
  try {
    const pool = await getConnection();
    await pool.request()
      .input("id", sql.Int, req.params.id)
      .query("DELETE FROM Clientes WHERE id = @id");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erro ao excluir cliente" });
  }
});

// ==================== PRODUTOS ====================

app.get("/api/produtos", async (req: Request, res: Response) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT * FROM Produtos ORDER BY tipo, nome");
    
    for (const produto of result.recordset) {
      if (produto.tipo === "pizza") {
        const precos = await pool.request()
          .input("id", sql.Int, produto.id)
          .query("SELECT precoP, precoM, precoG FROM PizzaPrecos WHERE produtoId = @id");
        produto.precos = precos.recordset[0] || { precoP: 0, precoM: 0, precoG: 0 };
      }
    }
    
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
});

app.post("/api/produtos", async (req: Request, res: Response) => {
  try {
    const { nome, tipo, preco, precoP, precoM, precoG } = req.body;
    const pool = await getConnection();
    
    const result = await pool.request()
      .input("nome", sql.NVarChar, nome)
      .input("tipo", sql.NVarChar, tipo)
      .input("preco", sql.Decimal(10, 2), preco || 0)
      .query("INSERT INTO Produtos (nome, tipo, preco) OUTPUT INSERTED.* VALUES (@nome, @tipo, @preco)");
    
    const produtoId = result.recordset[0].id;
    
    if (tipo === "pizza") {
      await pool.request()
        .input("produtoId", sql.Int, produtoId)
        .input("p", sql.Decimal(10, 2), precoP)
        .input("m", sql.Decimal(10, 2), precoM)
        .input("g", sql.Decimal(10, 2), precoG)
        .query("INSERT INTO PizzaPrecos (produtoId, precoP, precoM, precoG) VALUES (@produtoId, @p, @m, @g)");
    }
    
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao cadastrar produto" });
  }
});

app.delete("/api/produtos/:id", async (req: Request, res: Response) => {
  try {
    const pool = await getConnection();
    await pool.request()
      .input("id", sql.Int, req.params.id)
      .query("DELETE FROM PizzaPrecos WHERE produtoId = @id");
    await pool.request()
      .input("id", sql.Int, req.params.id)
      .query("DELETE FROM Produtos WHERE id = @id");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erro ao excluir produto" });
  }
});

// ==================== PEDIDOS ====================

app.get("/api/pedidos", async (req: Request, res: Response) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT p.*, c.nome AS clienteNome, c.telefone, c.endereco
      FROM Pedidos p
      JOIN Clientes c ON c.id = p.clienteId
      ORDER BY p.data DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar pedidos" });
  }
});

app.get("/api/pedidos/:id", async (req: Request, res: Response) => {
  try {
    const pool = await getConnection();
    const pedido = await pool.request()
      .input("id", sql.Int, req.params.id)
      .query(`
        SELECT p.*, c.nome AS clienteNome, c.telefone, c.endereco, c.complemento
        FROM Pedidos p
        JOIN Clientes c ON c.id = p.clienteId
        WHERE p.id = @id
      `);
    
    if (pedido.recordset.length === 0) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }
    
    const itens = await pool.request()
      .input("id", sql.Int, req.params.id)
      .query(`
        SELECT pi.*, pr.nome AS produtoNome, pr.tipo, pr.preco
        FROM PedidoItens pi
        JOIN Produtos pr ON pr.id = pi.produtoId
        WHERE pi.pedidoId = @id
      `);
    
    res.json({
      ...pedido.recordset[0],
      itens: itens.recordset
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar pedido" });
  }
});

app.post("/api/pedidos", async (req: Request, res: Response) => {
  try {
    const { clienteId, itens, pagamento, entrega } = req.body;
    const pool = await getConnection();
    
    let total = 0;
    for (const item of itens) {
      total += item.precoUnit * item.quantidade;
    }
    
    const pedidoResult = await pool.request()
      .input("clienteId", sql.Int, clienteId)
      .input("total", sql.Decimal(10, 2), total)
      .input("pagamento", sql.NVarChar, pagamento)
      .input("entrega", sql.NVarChar, entrega)
      .input("status", sql.NVarChar, "aberto")
      .query(`
        INSERT INTO Pedidos (clienteId, total, data, pagamento, entrega, status)
        OUTPUT INSERTED.*
        VALUES (@clienteId, @total, GETDATE(), @pagamento, @entrega, @status)
      `);
    
    const pedidoId = pedidoResult.recordset[0].id;
    
    for (const item of itens) {
      await pool.request()
        .input("pedidoId", sql.Int, pedidoId)
        .input("produtoId", sql.Int, item.produtoId)
        .input("quantidade", sql.Int, item.quantidade)
        .input("tamanho", sql.NVarChar, item.tamanho || "")
        .query(`
          INSERT INTO PedidoItens (pedidoId, produtoId, quantidade, tamanho)
          VALUES (@pedidoId, @produtoId, @quantidade, @tamanho)
        `);
    }
    
    res.json(pedidoResult.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao criar pedido" });
  }
});

app.patch("/api/pedidos/:id/status", async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const pool = await getConnection();
    await pool.request()
      .input("id", sql.Int, req.params.id)
      .input("status", sql.NVarChar, status)
      .query("UPDATE Pedidos SET status = @status WHERE id = @id");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar status" });
  }
});

app.delete("/api/pedidos/:id", async (req: Request, res: Response) => {
  try {
    const pool = await getConnection();
    await pool.request()
      .input("id", sql.Int, req.params.id)
      .query("DELETE FROM PedidoItens WHERE pedidoId = @id");
    await pool.request()
      .input("id", sql.Int, req.params.id)
      .query("DELETE FROM Pedidos WHERE id = @id");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erro ao excluir pedido" });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🍕 API rodando na porta ${PORT}`);
});