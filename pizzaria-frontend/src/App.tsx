import React, { useState, useEffect } from 'react';
import { Pizza, Users, Package, ShoppingCart, BarChart3, Clock, Trash2 } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

// Tipos
interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  cep: string;
  endereco: string;
  complemento: string;
}

interface PrecoPizza {
  precoP: number;
  precoM: number;
  precoG: number;
}

interface Produto {
  id: number;
  nome: string;
  tipo: string;
  preco: number;
  precos?: PrecoPizza;
}

interface Pedido {
  id: number;
  clienteId: number;
  clienteNome: string;
  telefone: string;
  endereco: string;
  total: number;
  data: string;
  pagamento: string;
  entrega: string;
  status: string;
}

interface ItemCarrinho {
  produtoId: number;
  nome: string;
  quantidade: number;
  tamanho?: string | null;
  precoUnit: number;
}

export default function PizzariaSystem() {
  const [view, setView] = useState<'cliente' | 'admin'>('cliente');
  const [page, setPage] = useState<string>('cardapio');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  useEffect(() => {
    carregarProdutos();
    if (view === 'admin') {
      carregarClientes();
      carregarPedidos();
    }
  }, [view]);

  const carregarClientes = async () => {
    try {
      const res = await fetch(`${API_URL}/clientes`);
      const data = await res.json();
      console.log('Clientes recebidos:', data);
      setClientes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setClientes([]);
    }
  };

  const carregarProdutos = async () => {
    try {
      const res = await fetch(`${API_URL}/produtos`);
      const data = await res.json();
      console.log('Produtos recebidos:', data); // Debug
      setProdutos(Array.isArray(data) ? data : []); // Garante que seja array
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      setProdutos([]); // Define array vazio em caso de erro
    }
  };

  const carregarPedidos = async () => {
    try {
      const res = await fetch(`${API_URL}/pedidos`);
      const data = await res.json();
      console.log('Pedidos recebidos:', data);
      setPedidos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
      setPedidos([]);
    }
  };

  const CardapioCliente = () => {
    const pizzas = produtos.filter(p => p.tipo === 'pizza');
    const outros = produtos.filter(p => p.tipo !== 'pizza');

    const adicionarAoCarrinho = (produto: Produto, tamanho: string | null = null) => {
      let preco = produto.preco;
      if (produto.tipo === 'pizza' && tamanho && produto.precos) {
        preco = tamanho === 'P' ? produto.precos.precoP :
          tamanho === 'M' ? produto.precos.precoM :
            produto.precos.precoG;
      }

      setCarrinho([...carrinho, {
        produtoId: produto.id,
        nome: produto.nome,
        quantidade: 1,
        tamanho,
        precoUnit: preco
      }]);
    };

    return (
      <div className="p-6">
        <h2 className="text-3xl font-bold mb-6 text-red-600">🍕 Cardápio</h2>

        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4">Pizzas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pizzas.map(pizza => (
              <div key={pizza.id} className="bg-white rounded-lg shadow p-4 border-2 border-red-100">
                <h4 className="font-bold text-lg mb-2">{pizza.nome}</h4>
                {pizza.precos && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Pequena</span>
                      <button
                        onClick={() => adicionarAoCarrinho(pizza, 'P')}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        R$ {Number(pizza.precos.precoP).toFixed(2)}
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Média</span>
                      <button
                        onClick={() => adicionarAoCarrinho(pizza, 'M')}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        R$ {Number(pizza.precos.precoM).toFixed(2)}
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Grande</span>
                      <button
                        onClick={() => adicionarAoCarrinho(pizza, 'G')}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        R$ {Number(pizza.precos.precoG).toFixed(2)}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {outros.length > 0 && (
          <div>
            <h3 className="text-2xl font-semibold mb-4">Outros Produtos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {outros.map(prod => (
                <div key={prod.id} className="bg-white rounded-lg shadow p-4 border-2 border-gray-100">
                  <h4 className="font-bold text-lg mb-2">{prod.nome}</h4>
                  <p className="text-sm text-gray-600 mb-2">{prod.tipo}</p>
                  <button
                    onClick={() => adicionarAoCarrinho(prod)}
                    className="w-full bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600"
                  >
                    R$ {Number(prod.preco).toFixed(2)}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const CarrinhoCliente = () => {
    const [formCliente, setFormCliente] = useState({
      nome: '', telefone: '', cep: '', endereco: '', complemento: ''
    });
    const [pagamento, setPagamento] = useState('Dinheiro');
    const [entrega, setEntrega] = useState('Entrega');

    const total = carrinho.reduce((sum, item) => sum + (item.precoUnit * item.quantidade), 0);

    const removerItem = (index: number) => {
      setCarrinho(carrinho.filter((_, i) => i !== index));
    };

    const finalizarPedido = async () => {
      if (carrinho.length === 0) {
        alert('Adicione itens ao carrinho!');
        return;
      }
      if (!formCliente.nome || !formCliente.telefone) {
        alert('Preencha seus dados!');
        return;
      }

      try {
        const resCliente = await fetch(`${API_URL}/clientes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formCliente)
        });
        const cliente = await resCliente.json();

        const resPedido = await fetch(`${API_URL}/pedidos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clienteId: cliente.id,
            itens: carrinho,
            pagamento,
            entrega
          })
        });

        if (resPedido.ok) {
          alert('Pedido realizado com sucesso!');
          setCarrinho([]);
          setFormCliente({ nome: '', telefone: '', cep: '', endereco: '', complemento: '' });
        }
      } catch (err) {
        alert('Erro ao finalizar pedido');
      }
    };

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-red-600">🛒 Carrinho</h2>

        {carrinho.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Carrinho vazio</p>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            {carrinho.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-3 border-b">
                <div>
                  <p className="font-semibold">{item.nome} {item.tamanho ? `(${item.tamanho})` : ''}</p>
                  <p className="text-sm text-gray-600">R$ {item.precoUnit.toFixed(2)} x {item.quantidade}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold">R$ {(item.precoUnit * item.quantidade).toFixed(2)}</p>
                  <button onClick={() => removerItem(idx)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
            <div className="mt-4 text-right">
              <p className="text-2xl font-bold">Total: R$ {total.toFixed(2)}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Dados para Entrega</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Nome completo"
              className="border rounded px-3 py-2"
              value={formCliente.nome}
              onChange={e => setFormCliente({ ...formCliente, nome: e.target.value })}
            />
            <input
              type="text"
              placeholder="Telefone"
              className="border rounded px-3 py-2"
              value={formCliente.telefone}
              onChange={e => setFormCliente({ ...formCliente, telefone: e.target.value })}
            />
            <input
              type="text"
              placeholder="CEP"
              className="border rounded px-3 py-2"
              value={formCliente.cep}
              onChange={e => setFormCliente({ ...formCliente, cep: e.target.value })}
            />
            <input
              type="text"
              placeholder="Endereço completo"
              className="border rounded px-3 py-2"
              value={formCliente.endereco}
              onChange={e => setFormCliente({ ...formCliente, endereco: e.target.value })}
            />
            <input
              type="text"
              placeholder="Complemento"
              className="border rounded px-3 py-2"
              value={formCliente.complemento}
              onChange={e => setFormCliente({ ...formCliente, complemento: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2 font-semibold">Pagamento:</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={pagamento}
                onChange={e => setPagamento(e.target.value)}
              >
                <option>Dinheiro</option>
                <option>Cartão</option>
                <option>Pix</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 font-semibold">Tipo:</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={entrega}
                onChange={e => setEntrega(e.target.value)}
              >
                <option>Entrega</option>
                <option>Retirada</option>
              </select>
            </div>
          </div>

          <button
            onClick={finalizarPedido}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700"
          >
            Finalizar Pedido
          </button>
        </div>
      </div>
    );
  };

  const GerenciarClientes = () => {
    const [form, setForm] = useState({ nome: '', telefone: '', cep: '', endereco: '', complemento: '' });

    const cadastrar = async () => {
      try {
        await fetch(`${API_URL}/clientes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        setForm({ nome: '', telefone: '', cep: '', endereco: '', complemento: '' });
        carregarClientes();
        alert('Cliente cadastrado!');
      } catch (err) {
        alert('Erro ao cadastrar');
      }
    };

    const excluir = async (id: number) => {
      if (!window.confirm('Excluir cliente?')) return;
      try {
        await fetch(`${API_URL}/clientes/${id}`, { method: 'DELETE' });
        carregarClientes();
      } catch (err) {
        alert('Erro ao excluir');
      }
    };

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Gerenciar Clientes</h2>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-bold mb-4">Cadastrar Novo Cliente</h3>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Nome" className="border rounded px-3 py-2" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
            <input placeholder="Telefone" className="border rounded px-3 py-2" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
            <input placeholder="CEP" className="border rounded px-3 py-2" value={form.cep} onChange={e => setForm({ ...form, cep: e.target.value })} />
            <input placeholder="Endereço" className="border rounded px-3 py-2" value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} />
            <input placeholder="Complemento" className="border rounded px-3 py-2 col-span-2" value={form.complemento} onChange={e => setForm({ ...form, complemento: e.target.value })} />
          </div>
          <button onClick={cadastrar} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Cadastrar
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-4">ID</th>
                <th className="text-left p-4">Nome</th>
                <th className="text-left p-4">Telefone</th>
                <th className="text-left p-4">Endereço</th>
                <th className="text-left p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(c => (
                <tr key={c.id} className="border-t">
                  <td className="p-4">{c.id}</td>
                  <td className="p-4">{c.nome}</td>
                  <td className="p-4">{c.telefone}</td>
                  <td className="p-4">{c.endereco}</td>
                  <td className="p-4">
                    <button onClick={() => excluir(c.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const GerenciarProdutos = () => {
    const [form, setForm] = useState({ nome: '', tipo: 'pizza', preco: '', precoP: '', precoM: '', precoG: '' });

    const cadastrar = async () => {
      try {
        await fetch(`${API_URL}/produtos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        setForm({ nome: '', tipo: 'pizza', preco: '', precoP: '', precoM: '', precoG: '' });
        carregarProdutos();
        alert('Produto cadastrado!');
      } catch (err) {
        alert('Erro ao cadastrar');
      }
    };

    const excluir = async (id: number) => {
      if (!window.confirm('Excluir produto?')) return;
      try {
        await fetch(`${API_URL}/produtos/${id}`, { method: 'DELETE' });
        carregarProdutos();
      } catch (err) {
        alert('Erro ao excluir');
      }
    };

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Gerenciar Produtos</h2>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-bold mb-4">Cadastrar Novo Produto</h3>
          <div className="space-y-4">
            <input placeholder="Nome" className="w-full border rounded px-3 py-2" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
            <select className="w-full border rounded px-3 py-2" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
              <option value="pizza">Pizza</option>
              <option value="bebida">Bebida</option>
              <option value="adicional">Adicional</option>
              <option value="borda">Borda</option>
              <option value="outro">Outro</option>
            </select>

            {form.tipo === 'pizza' ? (
              <div className="grid grid-cols-3 gap-4">
                <input placeholder="Preço P" type="number" className="border rounded px-3 py-2" value={form.precoP} onChange={e => setForm({ ...form, precoP: e.target.value })} />
                <input placeholder="Preço M" type="number" className="border rounded px-3 py-2" value={form.precoM} onChange={e => setForm({ ...form, precoM: e.target.value })} />
                <input placeholder="Preço G" type="number" className="border rounded px-3 py-2" value={form.precoG} onChange={e => setForm({ ...form, precoG: e.target.value })} />
              </div>
            ) : (
              <input placeholder="Preço" type="number" className="w-full border rounded px-3 py-2" value={form.preco} onChange={e => setForm({ ...form, preco: e.target.value })} />
            )}
          </div>
          <button onClick={cadastrar} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Cadastrar
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-4">ID</th>
                <th className="text-left p-4">Nome</th>
                <th className="text-left p-4">Tipo</th>
                <th className="text-left p-4">Preço</th>
                <th className="text-left p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-4">{p.id}</td>
                  <td className="p-4">{p.nome}</td>
                  <td className="p-4">{p.tipo}</td>
                  <td className="p-4">
                    {p.tipo === 'pizza' && p.precos ?
                      `P: ${Number(p.precos.precoP).toFixed(2)} | M: ${Number(p.precos.precoM).toFixed(2)} | G: ${Number(p.precos.precoG).toFixed(2)}` :
                      `R$ ${Number(p.preco).toFixed(2)}`}
                  </td>
                  <td className="p-4">
                    <button onClick={() => excluir(p.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const GerenciarPedidos = () => {
    const atualizarStatus = async (id: number, novoStatus: string) => {
      try {
        await fetch(`${API_URL}/pedidos/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: novoStatus })
        });
        carregarPedidos();
      } catch (err) {
        alert('Erro ao atualizar status');
      }
    };

    const excluir = async (id: number) => {
      if (!window.confirm('Excluir pedido?')) return;
      try {
        await fetch(`${API_URL}/pedidos/${id}`, { method: 'DELETE' });
        carregarPedidos();
      } catch (err) {
        alert('Erro ao excluir');
      }
    };

    const getStatusColor = (status: string) => {
      const colors: Record<string, string> = {
        aberto: 'bg-yellow-100 text-yellow-800',
        preparando: 'bg-blue-100 text-blue-800',
        pronto: 'bg-green-100 text-green-800',
        entregue: 'bg-gray-100 text-gray-800',
        cancelado: 'bg-red-100 text-red-800'
      };
      return colors[status] || 'bg-gray-100';
    };

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Gerenciar Pedidos</h2>

        <div className="space-y-4">
          {pedidos.map(p => (
            <div key={p.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">Pedido #{p.id}</h3>
                  <p className="text-gray-600">Cliente: {p.clienteNome} - {p.telefone}</p>
                  <p className="text-gray-600">Endereço: {p.endereco}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(p.data).toLocaleString('pt-BR')} | {p.pagamento} | {p.entrega}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">R$ {Number(p.total).toFixed(2)}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-2 ${getStatusColor(p.status)}`}>
                    {p.status}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {p.status === 'aberto' && (
                  <button onClick={() => atualizarStatus(p.id, 'preparando')} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    Iniciar Preparo
                  </button>
                )}
                {p.status === 'preparando' && (
                  <button onClick={() => atualizarStatus(p.id, 'pronto')} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                    Marcar Pronto
                  </button>
                )}
                {p.status === 'pronto' && (
                  <button onClick={() => atualizarStatus(p.id, 'entregue')} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                    Marcar Entregue
                  </button>
                )}
                <button onClick={() => atualizarStatus(p.id, 'cancelado')} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                  Cancelar
                </button>
                <button onClick={() => excluir(p.id)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Relatorios = () => {
    const total = pedidos.reduce((sum, p) => sum + Number(p.total), 0);
    const porStatus = pedidos.reduce((acc: Record<string, number>, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Relatórios de Vendas</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 mb-2">Total de Pedidos</h3>
            <p className="text-4xl font-bold text-blue-600">{pedidos.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 mb-2">Faturamento Total</h3>
            <p className="text-4xl font-bold text-green-600">R$ {total.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 mb-2">Ticket Médio</h3>
            <p className="text-4xl font-bold text-purple-600">
              R$ {pedidos.length > 0 ? (total / pedidos.length).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Pedidos por Status</h3>
          <div className="space-y-2">
            {Object.entries(porStatus).map(([status, qtd]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="capitalize">{status}</span>
                <span className="font-bold">{qtd}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-red-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Pizza size={32} />
            Sistema de Pizzaria
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => { setView('cliente'); setPage('cardapio'); }}
              className={`px-4 py-2 rounded ${view === 'cliente' ? 'bg-white text-red-600' : 'bg-red-700'}`}
            >              Área do Cliente
            </button>
            <button
              onClick={() => { setView('admin'); setPage('pedidos'); }}
              className={`px-4 py-2 rounded ${view === 'admin' ? 'bg-white text-red-600' : 'bg-red-700'}`}
            >
              Área Admin
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto flex">
        <aside className="w-64 bg-white shadow-lg min-h-screen p-4">
          {view === 'cliente' ? (
            <nav className="space-y-2">
              <button onClick={() => setPage('cardapio')} className={`w-full text-left px-4 py-3 rounded flex items-center gap-2 ${page === 'cardapio' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'}`}>
                <Pizza size={20} /> Cardápio
              </button>
              <button onClick={() => setPage('carrinho')} className={`w-full text-left px-4 py-3 rounded flex items-center gap-2 ${page === 'carrinho' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'}`}>
                <ShoppingCart size={20} /> Carrinho ({carrinho.length})
              </button>
            </nav>
          ) : (
            <nav className="space-y-2">
              <button onClick={() => setPage('pedidos')} className={`w-full text-left px-4 py-3 rounded flex items-center gap-2 ${page === 'pedidos' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'}`}>
                <Clock size={20} /> Pedidos
              </button>
              <button onClick={() => setPage('clientes')} className={`w-full text-left px-4 py-3 rounded flex items-center gap-2 ${page === 'clientes' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'}`}>
                <Users size={20} /> Clientes
              </button>
              <button onClick={() => setPage('produtos')} className={`w-full text-left px-4 py-3 rounded flex items-center gap-2 ${page === 'produtos' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'}`}>
                <Package size={20} /> Produtos
              </button>
              <button onClick={() => setPage('relatorios')} className={`w-full text-left px-4 py-3 rounded flex items-center gap-2 ${page === 'relatorios' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'}`}>
                <BarChart3 size={20} /> Relatórios
              </button>
            </nav>
          )}
        </aside>

        <main className="flex-1">
          {view === 'cliente' ? (
            <>
              {page === 'cardapio' && <CardapioCliente />}
              {page === 'carrinho' && <CarrinhoCliente />}
            </>
          ) : (
            <>
              {page === 'pedidos' && <GerenciarPedidos />}
              {page === 'clientes' && <GerenciarClientes />}
              {page === 'produtos' && <GerenciarProdutos />}
              {page === 'relatorios' && <Relatorios />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}