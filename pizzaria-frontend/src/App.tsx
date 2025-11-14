import React, { useState, useEffect } from 'react';
import { Pizza, Users, Package, ShoppingCart, BarChart3, Clock, Trash2, Plus, Minus, X, Eye, ChevronDown, ChevronUp } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

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
  bordaId?: number;
  bordaNome?: string;
  bordaPreco?: number;
  adicionais?: Array<{id: number, nome: string, preco: number}>;
}

interface DetalhesPedido {
  id: number;
  clienteId: number;
  clienteNome: string;
  telefone: string;
  endereco: string;
  complemento: string;
  total: number;
  data: string;
  pagamento: string;
  entrega: string;
  status: string;
  itens: Array<{
    id: number;
    produtoId: number;
    produtoNome: string;
    quantidade: number;
    tamanho: string;
    tipo: string;
    preco: number;
  }>;
}

export default function PizzariaSystem() {
  const [view, setView] = useState<'cliente' | 'admin'>('cliente');
  const [page, setPage] = useState<string>('cardapio');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [modalPizza, setModalPizza] = useState<{aberto: boolean, pizza: Produto | null}>({aberto: false, pizza: null});
  const [pedidoExpandido, setPedidoExpandido] = useState<number | null>(null);
  const [detalhesPedido, setDetalhesPedido] = useState<DetalhesPedido | null>(null);

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
      setProdutos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      setProdutos([]);
    }
  };

  const carregarPedidos = async () => {
    try {
      const res = await fetch(`${API_URL}/pedidos`);
      const data = await res.json();
      setPedidos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
      setPedidos([]);
    }
  };

  const carregarDetalhesPedido = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/pedidos/${id}`);
      const data = await res.json();
      setDetalhesPedido(data);
      setPedidoExpandido(id);
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
      alert('Erro ao carregar detalhes do pedido');
    }
  };

  const ModalPersonalizarPizza = () => {
    const [tamanho, setTamanho] = useState<'P' | 'M' | 'G'>('M');
    const [quantidade, setQuantidade] = useState(1);
    const [bordaSelecionada, setBordaSelecionada] = useState<number | null>(null);
    const [adicionaisSelecionados, setAdicionaisSelecionados] = useState<number[]>([]);

    const bordas = produtos.filter(p => p.tipo === 'borda');
    const adicionais = produtos.filter(p => p.tipo === 'adicional');

    if (!modalPizza.aberto || !modalPizza.pizza) return null;

    const pizza = modalPizza.pizza;
    const precoBase = tamanho === 'P' ? pizza.precos!.precoP : tamanho === 'M' ? pizza.precos!.precoM : pizza.precos!.precoG;
    
    const borda = bordas.find(b => b.id === bordaSelecionada);
    const precoBorda = borda ? borda.preco : 0;
    
    const adicionaisObj = adicionais.filter(a => adicionaisSelecionados.includes(a.id));
    const precoAdicionais = adicionaisObj.reduce((sum, a) => sum + a.preco, 0);
    
    const precoTotal = (precoBase + precoBorda + precoAdicionais) * quantidade;

    const toggleAdicional = (id: number) => {
      if (adicionaisSelecionados.includes(id)) {
        setAdicionaisSelecionados(adicionaisSelecionados.filter(a => a !== id));
      } else {
        setAdicionaisSelecionados([...adicionaisSelecionados, id]);
      }
    };

    const adicionarAoCarrinho = () => {
      const item: ItemCarrinho = {
        produtoId: pizza.id,
        nome: pizza.nome,
        quantidade,
        tamanho,
        precoUnit: precoBase + precoBorda + precoAdicionais,
        bordaId: bordaSelecionada || undefined,
        bordaNome: borda?.nome,
        bordaPreco: precoBorda,
        adicionais: adicionaisObj.map(a => ({id: a.id, nome: a.nome, preco: a.preco}))
      };
      
      setCarrinho([...carrinho, item]);
      setModalPizza({aberto: false, pizza: null});
      setQuantidade(1);
      setBordaSelecionada(null);
      setAdicionaisSelecionados([]);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-orange-200">
          <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Personalizar Pizza</h2>
            <button onClick={() => setModalPizza({aberto: false, pizza: null})} className="hover:bg-white/20 rounded-full p-1 transition">
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{pizza.nome}</h3>
              <p className="text-gray-600">Escolha o tamanho e personalize sua pizza</p>
            </div>

            <div>
              <label className="block font-semibold mb-3 text-gray-900">Tamanho:</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setTamanho('P')}
                  className={`p-4 border-2 rounded-lg transition ${tamanho === 'P' ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-gray-300 hover:border-orange-300'}`}
                >
                  <div className="font-bold text-gray-900">Pequena</div>
                  <div className="text-sm text-gray-600">R$ {Number(pizza.precos!.precoP).toFixed(2)}</div>
                </button>
                <button
                  onClick={() => setTamanho('M')}
                  className={`p-4 border-2 rounded-lg transition ${tamanho === 'M' ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-gray-300 hover:border-orange-300'}`}
                >
                  <div className="font-bold text-gray-900">MÃ©dia</div>
                  <div className="text-sm text-gray-600">R$ {Number(pizza.precos!.precoM).toFixed(2)}</div>
                </button>
                <button
                  onClick={() => setTamanho('G')}
                  className={`p-4 border-2 rounded-lg transition ${tamanho === 'G' ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-gray-300 hover:border-orange-300'}`}
                >
                  <div className="font-bold text-gray-900">Grande</div>
                  <div className="text-sm text-gray-600">R$ {Number(pizza.precos!.precoG).toFixed(2)}</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-3 text-gray-900">Quantidade:</label>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                  className="bg-orange-100 hover:bg-orange-200 rounded-full p-2 transition"
                >
                  <Minus size={20} className="text-orange-700" />
                </button>
                <span className="text-2xl font-bold w-12 text-center text-gray-900">{quantidade}</span>
                <button 
                  onClick={() => setQuantidade(quantidade + 1)}
                  className="bg-orange-100 hover:bg-orange-200 rounded-full p-2 transition"
                >
                  <Plus size={20} className="text-orange-700" />
                </button>
              </div>
            </div>

            {bordas.length > 0 && (
              <div>
                <label className="block font-semibold mb-3 text-gray-900">Borda (opcional):</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setBordaSelecionada(null)}
                    className={`w-full p-3 border-2 rounded-lg text-left transition ${!bordaSelecionada ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-gray-300 hover:border-orange-300'}`}
                  >
                    <div className="flex justify-between text-gray-900">
                      <span>Sem borda</span>
                      <span className="text-gray-600">R$ 0,00</span>
                    </div>
                  </button>
                  {bordas.map(borda => (
                    <button
                      key={borda.id}
                      onClick={() => setBordaSelecionada(borda.id)}
                      className={`w-full p-3 border-2 rounded-lg text-left transition ${bordaSelecionada === borda.id ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-gray-300 hover:border-orange-300'}`}
                    >
                      <div className="flex justify-between">
                        <span className="text-gray-900">{borda.nome}</span>
                        <span className="text-gray-600">+ R$ {Number(borda.preco).toFixed(2)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {adicionais.length > 0 && (
              <div>
                <label className="block font-semibold mb-3 text-gray-900">Adicionais (opcional):</label>
                <div className="space-y-2">
                  {adicionais.map(adicional => (
                    <button
                      key={adicional.id}
                      onClick={() => toggleAdicional(adicional.id)}
                      className={`w-full p-3 border-2 rounded-lg text-left transition ${adicionaisSelecionados.includes(adicional.id) ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-gray-300 hover:border-orange-300'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-gray-900">{adicional.nome}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">+ R$ {Number(adicional.preco).toFixed(2)}</span>
                          {adicionaisSelecionados.includes(adicional.id) && (
                            <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">âœ“</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t-2 border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="text-sm text-gray-600">Pizza {tamanho}</div>
                  {borda && <div className="text-sm text-gray-600">+ {borda.nome}</div>}
                  {adicionaisObj.length > 0 && <div className="text-sm text-gray-600">+ {adicionaisObj.length} adicional(is)</div>}
                  <div className="text-sm text-gray-600">Quantidade: {quantidade}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">R$ {precoTotal.toFixed(2)}</div>
                </div>
              </div>
              <button 
                onClick={adicionarAoCarrinho}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-bold hover:from-orange-600 hover:to-red-600 transition shadow-lg"
              >
                Adicionar ao Carrinho
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CardapioCliente = () => {
    const pizzas = produtos.filter(p => p.tipo === 'pizza');
    const outros = produtos.filter(p => p.tipo !== 'pizza' && p.tipo !== 'borda' && p.tipo !== 'adicional');

    const adicionarOutroAoCarrinho = (produto: Produto) => {
      setCarrinho([...carrinho, {
        produtoId: produto.id,
        nome: produto.nome,
        quantidade: 1,
        precoUnit: produto.preco
      }]);
    };

    return (
      <div className="p-6">
        <h2 className="text-3xl font-bold mb-6 text-orange-600 flex items-center gap-2">
          <Pizza size={32} /> CardÃ¡pio
        </h2>
        
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4 text-gray-900">Pizzas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pizzas.map(pizza => (
              <div key={pizza.id} className="bg-white rounded-lg shadow-lg p-6 border-2 border-orange-200 hover:border-orange-400 transition hover:shadow-xl">
                <h4 className="font-bold text-xl mb-4 text-gray-900">{pizza.nome}</h4>
                {pizza.precos && (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pequena</span>
                      <span className="font-semibold text-orange-600">R$ {Number(pizza.precos.precoP).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">MÃ©dia</span>
                      <span className="font-semibold text-orange-600">R$ {Number(pizza.precos.precoM).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Grande</span>
                      <span className="font-semibold text-orange-600">R$ {Number(pizza.precos.precoG).toFixed(2)}</span>
                    </div>
                  </div>
                )}
                <button 
                  onClick={() => setModalPizza({aberto: true, pizza})}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 rounded-lg hover:from-orange-600 hover:to-red-600 font-semibold transition shadow-md"
                >
                  Personalizar e Adicionar
                </button>
              </div>
            ))}
          </div>
        </div>

        {outros.length > 0 && (
          <div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900">Outros Produtos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {outros.map(prod => (
                <div key={prod.id} className="bg-white rounded-lg shadow p-4 border-2 border-gray-200 hover:border-red-300 transition hover:shadow-lg">
                  <h4 className="font-bold text-lg mb-2 text-gray-900">{prod.nome}</h4>
                  <p className="text-sm text-gray-600 mb-3 capitalize">{prod.tipo}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-red-600">R$ {Number(prod.preco).toFixed(2)}</span>
                    <button 
                      onClick={() => adicionarOutroAoCarrinho(prod)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition shadow-md"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ModalPersonalizarPizza />
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
      <div className="p-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-orange-600 flex items-center gap-2">
          <ShoppingCart size={32} /> Carrinho
        </h2>
        
        {carrinho.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-lg border-2 border-orange-200">
            <ShoppingCart size={64} className="mx-auto text-orange-300 mb-4" />
            <p className="text-gray-900 text-lg font-semibold">Seu carrinho estÃ¡ vazio</p>
            <p className="text-gray-600">Adicione pizzas deliciosas ao seu pedido!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-orange-200">
            <h3 className="font-bold text-lg mb-4 text-gray-900">Itens do Pedido</h3>
            {carrinho.map((item, idx) => (
              <div key={idx} className="border-b-2 border-gray-200 pb-4 mb-4 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-bold text-lg text-gray-900">{item.nome} {item.tamanho ? `(${item.tamanho})` : ''}</p>
                    {item.bordaNome && (
                      <p className="text-sm text-gray-600">+ Borda: {item.bordaNome} (R$ {item.bordaPreco?.toFixed(2)})</p>
                    )}
                    {item.adicionais && item.adicionais.length > 0 && (
                      <div className="text-sm text-gray-600">
                        + Adicionais: {item.adicionais.map(a => `${a.nome} (R$ ${a.preco.toFixed(2)})`).join(', ')}
                      </div>
                    )}
                    <p className="text-sm text-gray-600 mt-1">Quantidade: {item.quantidade}</p>
                  </div>
                  <div className="text-right flex items-start gap-4">
                    <div>
                      <p className="font-bold text-lg text-red-600">R$ {(item.precoUnit * item.quantidade).toFixed(2)}</p>
                      <p className="text-xs text-gray-600">R$ {item.precoUnit.toFixed(2)} cada</p>
                    </div>
                    <button 
                      onClick={() => removerItem(idx)} 
                      className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-6 pt-4 border-t-2 border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">Total:</span>
                <span className="text-3xl font-bold text-orange-600">R$ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-orange-200">
          <h3 className="text-xl font-bold mb-4 text-gray-900">Dados para Entrega</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Nome completo *"
              className="border-2 border-gray-300 bg-white rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-orange-500"
              value={formCliente.nome}
              onChange={e => setFormCliente({...formCliente, nome: e.target.value})}
            />
            <input
              type="text"
              placeholder="Telefone *"
              className="border-2 border-gray-300 bg-white rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-orange-500"
              value={formCliente.telefone}
              onChange={e => setFormCliente({...formCliente, telefone: e.target.value})}
            />
            <input
              type="text"
              placeholder="CEP"
              className="border-2 border-gray-300 bg-white rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-orange-500"
              value={formCliente.cep}
              onChange={e => setFormCliente({...formCliente, cep: e.target.value})}
            />
            <input
              type="text"
              placeholder="EndereÃ§o completo"
              className="border-2 border-gray-300 bg-white rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-orange-500"
              value={formCliente.endereco}
              onChange={e => setFormCliente({...formCliente, endereco: e.target.value})}
            />
            <input
              type="text"
              placeholder="Complemento"
              className="border-2 border-gray-300 bg-white rounded-lg px-4 py-3 md:col-span-2 text-gray-900 focus:outline-none focus:border-orange-500"
              value={formCliente.complemento}
              onChange={e => setFormCliente({...formCliente, complemento: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block mb-2 font-semibold text-gray-900">Forma de Pagamento:</label>
              <select 
                className="w-full border-2 border-gray-300 bg-white rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-orange-500"
                value={pagamento}
                onChange={e => setPagamento(e.target.value)}
              >
                <option>Dinheiro</option>
                <option>CartÃ£o</option>
                <option>Pix</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-900">Tipo de Entrega:</label>
              <select 
                className="w-full border-2 border-gray-300 bg-white rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-orange-500"
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
            disabled={carrinho.length === 0}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-lg font-bold text-lg hover:from-orange-600 hover:to-red-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition shadow-lg"
          >
            Finalizar Pedido - R$ {total.toFixed(2)}
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
        <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
          <Users size={28} /> Gerenciar Clientes
        </h2>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-orange-300">
          <h3 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
            <Plus size={20} /> Cadastrar Novo Cliente
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Nome" className="border-2 border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 focus:border-orange-500 focus:outline-none" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
            <input placeholder="Telefone" className="border-2 border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 focus:border-orange-500 focus:outline-none" value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} />
            <input placeholder="CEP" className="border-2 border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 focus:border-orange-500 focus:outline-none" value={form.cep} onChange={e => setForm({...form, cep: e.target.value})} />
            <input placeholder="Endereço" className="border-2 border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 focus:border-orange-500 focus:outline-none" value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} />
            <input placeholder="Complemento" className="border-2 border-gray-300 rounded-lg px-4 py-3 col-span-2 bg-white text-gray-900 focus:border-orange-500 focus:outline-none" value={form.complemento} onChange={e => setForm({...form, complemento: e.target.value})} />
          </div>
          <button onClick={cadastrar} className="mt-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 shadow-md transition">
            Cadastrar Cliente
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200">
          <div className="bg-orange-100 px-6 py-4 border-b-2 border-orange-200">
            <h3 className="font-bold text-gray-900">Lista de Clientes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">ID</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Nome</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Telefone</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Endereço</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map(c => (
                  <tr key={c.id} className="border-t border-gray-200 hover:bg-orange-50 transition">
                    <td className="p-4 font-medium text-gray-900">{c.id}</td>
                    <td className="p-4 text-gray-900">{c.nome}</td>
                    <td className="p-4 text-gray-900">{c.telefone}</td>
                    <td className="p-4 text-gray-900">{c.endereco}</td>
                    <td className="p-4">
                      <button onClick={() => excluir(c.id)} className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
          <Package size={28} /> Gerenciar Produtos
        </h2>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-orange-300">
          <h3 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
            <Plus size={20} /> Cadastrar Novo Produto
          </h3>
          <div className="space-y-4">
            <input placeholder="Nome do Produto" className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 focus:border-orange-500 focus:outline-none" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
            <select className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 focus:border-orange-500 focus:outline-none" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
              <option value="pizza">🍕 Pizza</option>
              <option value="bebida">🥤 Bebida</option>
              <option value="adicional">➕ Adicional</option>
              <option value="borda">🌟 Borda</option>
              <option value="outro">📦 Outro</option>
            </select>
            
            {form.tipo === 'pizza' ? (
              <div className="grid grid-cols-3 gap-4">
                <input placeholder="Preço P" type="number" step="0.01" className="border-2 border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 focus:border-orange-500 focus:outline-none" value={form.precoP} onChange={e => setForm({...form, precoP: e.target.value})} />
                <input placeholder="Preço M" type="number" step="0.01" className="border-2 border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 focus:border-orange-500 focus:outline-none" value={form.precoM} onChange={e => setForm({...form, precoM: e.target.value})} />
                <input placeholder="Preço G" type="number" step="0.01" className="border-2 border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 focus:border-orange-500 focus:outline-none" value={form.precoG} onChange={e => setForm({...form, precoG: e.target.value})} />
              </div>
            ) : (
              <input placeholder="Preço" type="number" step="0.01" className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 focus:border-orange-500 focus:outline-none" value={form.preco} onChange={e => setForm({...form, preco: e.target.value})} />
            )}
          </div>
          <button onClick={cadastrar} className="mt-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 shadow-md transition">
            Cadastrar Produto
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200">
          <div className="bg-orange-100 px-6 py-4 border-b-2 border-orange-200">
            <h3 className="font-bold text-gray-900">Lista de Produtos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">ID</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Nome</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Tipo</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Preço</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map(p => (
                  <tr key={p.id} className="border-t border-gray-200 hover:bg-orange-50 transition">
                    <td className="p-4 font-medium text-gray-900">{p.id}</td>
                    <td className="p-4 font-semibold text-gray-900">{p.nome}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm capitalize font-medium">{p.tipo}</span>
                    </td>
                    <td className="p-4 font-mono text-gray-900">
                      {p.tipo === 'pizza' && p.precos ? 
                        <div className="text-sm">
                          <div>P: R$ {Number(p.precos.precoP).toFixed(2)}</div>
                          <div>M: R$ {Number(p.precos.precoM).toFixed(2)}</div>
                          <div>G: R$ {Number(p.precos.precoG).toFixed(2)}</div>
                        </div> : 
                        `R$ ${Number(p.preco).toFixed(2)}`}
                    </td>
                    <td className="p-4">
                      <button onClick={() => excluir(p.id)} className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
          <BarChart3 size={28} /> Relatórios de Vendas
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-lg p-6 border-2 border-blue-200">
            <h3 className="text-blue-700 mb-2 font-semibold">Total de Pedidos</h3>
            <p className="text-4xl font-bold text-blue-600">{pedidos.length}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-lg p-6 border-2 border-green-200">
            <h3 className="text-green-700 mb-2 font-semibold">Faturamento Total</h3>
            <p className="text-4xl font-bold text-green-600">R$ {total.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-lg p-6 border-2 border-purple-200">
            <h3 className="text-purple-700 mb-2 font-semibold">Ticket Médio</h3>
            <p className="text-4xl font-bold text-purple-600">
              R$ {pedidos.length > 0 ? (total / pedidos.length).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
          <h3 className="text-xl font-bold mb-4 text-gray-900">Pedidos por Status</h3>
          <div className="space-y-3">
            {Object.entries(porStatus).map(([status, qtd]) => {
              const getStatusColor = (st: string) => {
                const colors: Record<string, string> = {
                  aberto: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                  preparando: 'bg-blue-100 text-blue-800 border-blue-200',
                  pronto: 'bg-green-100 text-green-800 border-green-200',
                  entregue: 'bg-gray-100 text-gray-800 border-gray-200',
                  cancelado: 'bg-red-100 text-red-800 border-red-200'
                };
                return colors[st] || 'bg-gray-100';
              };

              return (
                <div key={status} className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <span className={`capitalize px-4 py-2 rounded-full font-semibold border-2 ${getStatusColor(status)}`}>
                    {status}
                  </span>
                  <span className="text-2xl font-bold text-gray-900">{qtd}</span>
                </div>
              );
            })}
          </div>
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
        if (pedidoExpandido === id) {
          setPedidoExpandido(null);
          setDetalhesPedido(null);
        }
      } catch (err) {
        alert('Erro ao excluir');
      }
    };

    const getStatusColor = (status: string) => {
      const colors: Record<string, string> = {
        aberto: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        preparando: 'bg-blue-100 text-blue-800 border-blue-300',
        pronto: 'bg-green-100 text-green-800 border-green-300',
        entregue: 'bg-gray-100 text-gray-800 border-gray-300',
        cancelado: 'bg-red-100 text-red-800 border-red-300'
      };
      return colors[status] || 'bg-gray-100';
    };

    const toggleDetalhes = (id: number) => {
      if (pedidoExpandido === id) {
        setPedidoExpandido(null);
        setDetalhesPedido(null);
      } else {
        carregarDetalhesPedido(id);
      }
    };

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
          <BarChart3 size={28} /> Gerenciar Pedidos
        </h2>
        
        <div className="space-y-4">
          {pedidos.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow-lg border-2 border-orange-200 overflow-hidden hover:shadow-xl transition">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-gray-900">Pedido #{p.id}</h3>
                      <span className={`px-4 py-1 rounded-full text-sm font-bold border-2 ${getStatusColor(p.status)}`}>
                        {p.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-1 text-gray-600">
                      <p className="flex items-center gap-2">
                        <Users size={16} />
                        <strong className="text-gray-900">{p.clienteNome}</strong> - {p.telefone}
                      </p>
                      <p className="flex items-center gap-2">
                        <Package size={16} />
                        {p.endereco}
                      </p>
                      <p className="flex items-center gap-2 text-sm">
                        <Clock size={16} />
                        {new Date(p.data).toLocaleString('pt-BR')} | {p.pagamento} | {p.entrega}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-orange-600">R$ {Number(p.total).toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 flex-wrap mb-4">
                  {p.status === 'aberto' && (
                    <button onClick={() => atualizarStatus(p.id, 'preparando')} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-semibold transition shadow-md flex items-center gap-2">
                      <Clock size={18} /> Iniciar Preparo
                    </button>
                  )}
                  {p.status === 'preparando' && (
                    <button onClick={() => atualizarStatus(p.id, 'pronto')} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-semibold transition shadow-md flex items-center gap-2">
                      <Package size={18} /> Marcar Pronto
                    </button>
                  )}
                  {p.status === 'pronto' && (
                    <button onClick={() => atualizarStatus(p.id, 'entregue')} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 font-semibold transition shadow-md flex items-center gap-2">
                      <ShoppingCart size={18} /> Marcar Entregue
                    </button>
                  )}
                  <button onClick={() => atualizarStatus(p.id, 'cancelado')} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-semibold transition shadow-md">
                    Cancelar
                  </button>
                  <button onClick={() => excluir(p.id)} className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 font-semibold transition shadow-md flex items-center gap-2">
                    <Trash2 size={18} /> Excluir
                  </button>
                  <button 
                    onClick={() => toggleDetalhes(p.id)} 
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-semibold transition shadow-md flex items-center gap-2 ml-auto"
                  >
                    <Eye size={18} /> 
                    {pedidoExpandido === p.id ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                    {pedidoExpandido === p.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                {pedidoExpandido === p.id && detalhesPedido && (
                  <div className="border-t-2 border-orange-200 pt-4 mt-4">
                    <h4 className="font-bold text-lg mb-3 text-gray-900">Itens do Pedido:</h4>
                    <div className="space-y-2">
                      {detalhesPedido.itens.map(item => (
                        <div key={item.id} className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {item.produtoNome} {item.tamanho && `(${item.tamanho})`}
                              </p>
                              <p className="text-sm text-gray-600">
                                Quantidade: {item.quantidade} | Tipo: {item.tipo}
                              </p>
                            </div>
                            <p className="font-bold text-orange-600">R$ {Number(item.preco).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t-2 border-orange-200">
                      <p className="text-sm text-gray-600"><strong>Complemento:</strong> {detalhesPedido.complemento || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <header className="bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Pizza size={36} />
              Sistema Pizzaria
            </h1>
            <div className="flex gap-2">
              <button 
                onClick={() => { setView('cliente'); setPage('cardapio'); }}
                className={`px-6 py-2 rounded-lg font-semibold transition ${view === 'cliente' ? 'bg-white text-orange-600 shadow-lg' : 'bg-orange-500/30 hover:bg-orange-500/50'}`}
              >
                Modo Cliente
              </button>
              <button 
                onClick={() => { setView('admin'); setPage('clientes'); }}
                className={`px-6 py-2 rounded-lg font-semibold transition ${view === 'admin' ? 'bg-white text-orange-600 shadow-lg' : 'bg-orange-500/30 hover:bg-orange-500/50'}`}
              >
                Modo Admin
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b-2 border-orange-200 shadow-md">
        <div className="container mx-auto px-6">
          <div className="flex gap-1">
            {view === 'cliente' ? (
              <>
                <button 
                  onClick={() => setPage('cardapio')}
                  className={`px-6 py-4 font-semibold transition border-b-4 ${page === 'cardapio' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-600 hover:text-orange-600'}`}
                >
                  Cardápio
                </button>
                <button 
                  onClick={() => setPage('carrinho')}
                  className={`px-6 py-4 font-semibold transition border-b-4 flex items-center gap-2 ${page === 'carrinho' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-600 hover:text-orange-600'}`}
                >
                  Carrinho
                  {carrinho.length > 0 && (
                    <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs font-bold">
                      {carrinho.length}
                    </span>
                  )}
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setPage('clientes')}
                  className={`px-6 py-4 font-semibold transition border-b-4 ${page === 'clientes' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-600 hover:text-orange-600'}`}
                >
                  Clientes
                </button>
                <button 
                  onClick={() => setPage('produtos')}
                  className={`px-6 py-4 font-semibold transition border-b-4 ${page === 'produtos' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-600 hover:text-orange-600'}`}
                >
                  Produtos
                </button>
                <button 
                  onClick={() => setPage('pedidos')}
                  className={`px-6 py-4 font-semibold transition border-b-4 ${page === 'pedidos' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-600 hover:text-orange-600'}`}
                >
                  Pedidos
                </button>
                <button 
                  onClick={() => setPage('relatorios')}
                  className={`px-6 py-4 font-semibold transition border-b-4 ${page === 'relatorios' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-600 hover:text-orange-600'}`}
                >
                  Relatórios
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto">
        {view === 'cliente' ? (
          page === 'cardapio' ? <CardapioCliente /> : <CarrinhoCliente />
        ) : (
          page === 'clientes' ? <GerenciarClientes /> : 
          page === 'produtos' ? <GerenciarProdutos /> : 
          page === 'relatorios' ? <Relatorios /> :
          <GerenciarPedidos />
        )}
      </main>
    </div>
  );
}