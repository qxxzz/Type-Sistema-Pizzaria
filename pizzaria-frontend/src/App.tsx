import React, { useState, useEffect } from 'react';
import { Pizza, Users, Package, ShoppingCart, BarChart3, Clock, Trash2, Plus, Minus, X, Eye, ChevronDown, ChevronUp, FileText, Download } from 'lucide-react';

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
  const [pedidoFinalizado, setPedidoFinalizado] = useState<DetalhesPedido | null>(null);

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

  const gerarComprovanteTXT = (pedido: DetalhesPedido) => {
    const linha = (char: string, qtd: number = 50) => char.repeat(qtd);
    const centralizar = (texto: string, largura: number = 50) => {
      const espacos = Math.max(0, Math.floor((largura - texto.length) / 2));
      return ' '.repeat(espacos) + texto;
    };

    let txt = '';
    txt += linha('=') + '\n';
    txt += centralizar('🍕 PIZZARIA SISTEMA 🍕') + '\n';
    txt += linha('=') + '\n';
    txt += 'Endereço: Rua das Pizzas, 123 - Centro\n';
    txt += 'Telefone: (11) 98765-4321\n';
    txt += 'CNPJ: 12.345.678/0001-90\n';
    txt += linha('-') + '\n\n';

    txt += `COMPROVANTE DE PEDIDO #${pedido.id}\n`;
    txt += `Data: ${new Date(pedido.data).toLocaleString('pt-BR')}\n`;
    txt += linha('-') + '\n\n';

    txt += 'DADOS DO CLIENTE:\n';
    txt += `Nome: ${pedido.clienteNome}\n`;
    txt += `Telefone: ${pedido.telefone}\n`;
    txt += `Endereço: ${pedido.endereco}\n`;
    if (pedido.complemento) {
      txt += `Complemento: ${pedido.complemento}\n`;
    }
    txt += linha('-') + '\n\n';

    txt += 'ITENS DO PEDIDO:\n\n';
    let subtotal = 0;
    pedido.itens.forEach((item, idx) => {
      const precoItem = Number(item.preco);
      const totalItem = precoItem * item.quantidade;
      subtotal += totalItem;
      
      txt += `${idx + 1}. ${item.produtoNome}`;
      if (item.tamanho) txt += ` (${item.tamanho})`;
      txt += '\n';
      txt += `   Qtd: ${item.quantidade}x | Unitário: R$ ${precoItem.toFixed(2)}\n`;
      txt += `   Subtotal: R$ ${totalItem.toFixed(2)}\n\n`;
    });

    txt += linha('-') + '\n';
    txt += `SUBTOTAL: R$ ${subtotal.toFixed(2)}\n`;
    txt += `TOTAL: R$ ${Number(pedido.total).toFixed(2)}\n`;
    txt += linha('-') + '\n\n';

    txt += `FORMA DE PAGAMENTO: ${pedido.pagamento}\n`;
    txt += `TIPO DE ENTREGA: ${pedido.entrega}\n`;
    txt += `STATUS: ${pedido.status.toUpperCase()}\n`;

    if (pedido.entrega === 'Entrega') {
      txt += '\n' + linha('=') + '\n';
      txt += centralizar('📍 INFORMAÇÕES PARA ENTREGA 📍') + '\n';
      txt += linha('=') + '\n';
      txt += `Cliente: ${pedido.clienteNome}\n`;
      txt += `Telefone: ${pedido.telefone}\n`;
      txt += `Endereço: ${pedido.endereco}\n`;
      if (pedido.complemento) {
        txt += `Complemento: ${pedido.complemento}\n`;
      }
      txt += `\nValor a cobrar: R$ ${Number(pedido.total).toFixed(2)}\n`;
      txt += `Forma de pagamento: ${pedido.pagamento}\n`;
      txt += linha('=') + '\n';
    }

    txt += '\n' + centralizar('Obrigado pela preferência!') + '\n';
    txt += centralizar('Volte sempre! 🍕❤️') + '\n';
    txt += linha('=') + '\n';

    return txt;
  };

  const baixarComprovante = (pedido: DetalhesPedido) => {
    const conteudo = gerarComprovanteTXT(pedido);
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comprovante-pedido-${pedido.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Personalizar Pizza</h2>
            <button onClick={() => setModalPizza({aberto: false, pizza: null})} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-2">{pizza.nome}</h3>
              <p className="text-gray-600">Escolha o tamanho e personalize sua pizza</p>
            </div>

            <div>
              <label className="block font-semibold mb-3">Tamanho:</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setTamanho('P')}
                  className={`p-4 border-2 rounded-lg transition ${tamanho === 'P' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'}`}
                >
                  <div className="font-bold">Pequena</div>
                  <div className="text-sm text-gray-600">R$ {Number(pizza.precos!.precoP).toFixed(2)}</div>
                </button>
                <button
                  onClick={() => setTamanho('M')}
                  className={`p-4 border-2 rounded-lg transition ${tamanho === 'M' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'}`}
                >
                  <div className="font-bold">Média</div>
                  <div className="text-sm text-gray-600">R$ {Number(pizza.precos!.precoM).toFixed(2)}</div>
                </button>
                <button
                  onClick={() => setTamanho('G')}
                  className={`p-4 border-2 rounded-lg transition ${tamanho === 'G' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'}`}
                >
                  <div className="font-bold">Grande</div>
                  <div className="text-sm text-gray-600">R$ {Number(pizza.precos!.precoG).toFixed(2)}</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-3">Quantidade:</label>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                  className="bg-gray-200 hover:bg-gray-300 rounded-full p-2"
                >
                  <Minus size={20} />
                </button>
                <span className="text-2xl font-bold w-12 text-center">{quantidade}</span>
                <button 
                  onClick={() => setQuantidade(quantidade + 1)}
                  className="bg-gray-200 hover:bg-gray-300 rounded-full p-2"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {bordas.length > 0 && (
              <div>
                <label className="block font-semibold mb-3">Borda (opcional):</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setBordaSelecionada(null)}
                    className={`w-full p-3 border-2 rounded-lg text-left transition ${!bordaSelecionada ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'}`}
                  >
                    <div className="flex justify-between">
                      <span>Sem borda</span>
                      <span className="text-gray-600">R$ 0,00</span>
                    </div>
                  </button>
                  {bordas.map(borda => (
                    <button
                      key={borda.id}
                      onClick={() => setBordaSelecionada(borda.id)}
                      className={`w-full p-3 border-2 rounded-lg text-left transition ${bordaSelecionada === borda.id ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'}`}
                    >
                      <div className="flex justify-between">
                        <span>{borda.nome}</span>
                        <span className="text-gray-600">+ R$ {Number(borda.preco).toFixed(2)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {adicionais.length > 0 && (
              <div>
                <label className="block font-semibold mb-3">Adicionais (opcional):</label>
                <div className="space-y-2">
                  {adicionais.map(adicional => (
                    <button
                      key={adicional.id}
                      onClick={() => toggleAdicional(adicional.id)}
                      className={`w-full p-3 border-2 rounded-lg text-left transition ${adicionaisSelecionados.includes(adicional.id) ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{adicional.nome}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">+ R$ {Number(adicional.preco).toFixed(2)}</span>
                          {adicionaisSelecionados.includes(adicional.id) && (
                            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="text-sm text-gray-600">Pizza {tamanho}</div>
                  {borda && <div className="text-sm text-gray-600">+ {borda.nome}</div>}
                  {adicionaisObj.length > 0 && <div className="text-sm text-gray-600">+ {adicionaisObj.length} adicional(is)</div>}
                  <div className="text-sm text-gray-600">Quantidade: {quantidade}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">R$ {precoTotal.toFixed(2)}</div>
                </div>
              </div>
              <button 
                onClick={adicionarAoCarrinho}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition"
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
        <h2 className="text-3xl font-bold mb-6 text-red-600">🍕 Cardápio</h2>
        
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4">Pizzas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pizzas.map(pizza => (
              <div key={pizza.id} className="bg-white rounded-lg shadow-lg p-6 border-2 border-red-100 hover:border-red-300 transition">
                <h4 className="font-bold text-xl mb-4">{pizza.nome}</h4>
                {pizza.precos && (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pequena</span>
                      <span className="font-semibold">R$ {Number(pizza.precos.precoP).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Média</span>
                      <span className="font-semibold">R$ {Number(pizza.precos.precoM).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Grande</span>
                      <span className="font-semibold">R$ {Number(pizza.precos.precoG).toFixed(2)}</span>
                    </div>
                  </div>
                )}
                <button 
                  onClick={() => setModalPizza({aberto: true, pizza})}
                  className="w-full bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 font-semibold transition"
                >
                  Personalizar e Adicionar
                </button>
              </div>
            ))}
          </div>
        </div>

        {outros.length > 0 && (
          <div>
            <h3 className="text-2xl font-semibold mb-4">Outros Produtos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {outros.map(prod => (
                <div key={prod.id} className="bg-white rounded-lg shadow p-4 border-2 border-gray-100 hover:border-green-300 transition">
                  <h4 className="font-bold text-lg mb-2">{prod.nome}</h4>
                  <p className="text-sm text-gray-600 mb-3 capitalize">{prod.tipo}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-green-600">R$ {Number(prod.preco).toFixed(2)}</span>
                    <button 
                      onClick={() => adicionarOutroAoCarrinho(prod)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
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
          const pedidoCriado = await resPedido.json();
          // Carregar detalhes completos do pedido
          const resDetalhes = await fetch(`${API_URL}/pedidos/${pedidoCriado.id}`);
          const detalhes = await resDetalhes.json();
          setPedidoFinalizado(detalhes);
          setCarrinho([]);
          setFormCliente({ nome: '', telefone: '', cep: '', endereco: '', complemento: '' });
        }
      } catch (err) {
        alert('Erro ao finalizar pedido');
      }
    };

    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-red-600">🛒 Carrinho</h2>
        
        {carrinho.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Seu carrinho está vazio</p>
            <p className="text-gray-400">Adicione pizzas deliciosas ao seu pedido!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="font-bold text-lg mb-4">Itens do Pedido</h3>
            {carrinho.map((item, idx) => (
              <div key={idx} className="border-b pb-4 mb-4 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-bold text-lg">{item.nome} {item.tamanho ? `(${item.tamanho})` : ''}</p>
                    {item.bordaNome && (
                      <p className="text-sm text-gray-600">+ Borda: {item.bordaNome} (R$ {item.bordaPreco?.toFixed(2)})</p>
                    )}
                    {item.adicionais && item.adicionais.length > 0 && (
                      <div className="text-sm text-gray-600">
                        + Adicionais: {item.adicionais.map(a => `${a.nome} (R$ ${a.preco.toFixed(2)})`).join(', ')}
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-1">Quantidade: {item.quantidade}</p>
                  </div>
                  <div className="text-right flex items-start gap-4">
                    <div>
                      <p className="font-bold text-lg text-green-600">R$ {(item.precoUnit * item.quantidade).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">R$ {item.precoUnit.toFixed(2)} cada</p>
                    </div>
                    <button 
                      onClick={() => removerItem(idx)} 
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Total:</span>
                <span className="text-3xl font-bold text-green-600">R$ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Dados para Entrega</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Nome completo *"
              className="border rounded px-4 py-3"
              value={formCliente.nome}
              onChange={e => setFormCliente({...formCliente, nome: e.target.value})}
            />
            <input
              type="text"
              placeholder="Telefone *"
              className="border rounded px-4 py-3"
              value={formCliente.telefone}
              onChange={e => setFormCliente({...formCliente, telefone: e.target.value})}
            />
            <input
              type="text"
              placeholder="CEP"
              className="border rounded px-4 py-3"
              value={formCliente.cep}
              onChange={e => setFormCliente({...formCliente, cep: e.target.value})}
            />
            <input
              type="text"
              placeholder="Endereço completo"
              className="border rounded px-4 py-3"
              value={formCliente.endereco}
              onChange={e => setFormCliente({...formCliente, endereco: e.target.value})}
            />
            <input
              type="text"
              placeholder="Complemento"
              className="border rounded px-4 py-3 md:col-span-2"
              value={formCliente.complemento}
              onChange={e => setFormCliente({...formCliente, complemento: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block mb-2 font-semibold">Forma de Pagamento:</label>
              <select 
                className="w-full border rounded px-4 py-3"
                value={pagamento}
                onChange={e => setPagamento(e.target.value)}
              >
                <option>Dinheiro</option>
                <option>Cartão</option>
                <option>Pix</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 font-semibold">Tipo de Entrega:</label>
              <select 
                className="w-full border rounded px-4 py-3"
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
            className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            Finalizar Pedido - R$ {total.toFixed(2)}
          </button>
        </div>

        {pedidoFinalizado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Pedido Realizado!</h2>
                <p className="text-gray-600">Pedido #{pedidoFinalizado.id} confirmado com sucesso</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">Total do pedido:</p>
                <p className="text-3xl font-bold text-green-600">R$ {Number(pedidoFinalizado.total).toFixed(2)}</p>
              </div>

              <button
                onClick={() => {
                  baixarComprovante(pedidoFinalizado);
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 mb-3"
              >
                <Download size={20} />
                Baixar Comprovante (.txt)
              </button>

              <button
                onClick={() => setPedidoFinalizado(null)}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
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
        <h2 className="text-3xl font-bold mb-6 text-gray-800">👥 Gerenciar Clientes</h2>
        
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl shadow-lg p-6 mb-6 border border-cyan-200">
          <h3 className="font-bold text-xl mb-4 text-cyan-900">➕ Cadastrar Novo Cliente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              placeholder="Nome" 
              className="border-2 border-cyan-300 rounded-lg px-4 py-3 focus:border-cyan-500 focus:outline-none bg-white" 
              value={form.nome} 
              onChange={e => setForm({...form, nome: e.target.value})} 
            />
            <input 
              placeholder="Telefone" 
              className="border-2 border-cyan-300 rounded-lg px-4 py-3 focus:border-cyan-500 focus:outline-none bg-white" 
              value={form.telefone} 
              onChange={e => setForm({...form, telefone: e.target.value})} 
            />
            <input 
              placeholder="CEP" 
              className="border-2 border-cyan-300 rounded-lg px-4 py-3 focus:border-cyan-500 focus:outline-none bg-white" 
              value={form.cep} 
              onChange={e => setForm({...form, cep: e.target.value})} 
            />
            <input 
              placeholder="Endereço" 
              className="border-2 border-cyan-300 rounded-lg px-4 py-3 focus:border-cyan-500 focus:outline-none bg-white" 
              value={form.endereco} 
              onChange={e => setForm({...form, endereco: e.target.value})} 
            />
            <input 
              placeholder="Complemento (opcional)" 
              className="border-2 border-cyan-300 rounded-lg px-4 py-3 focus:border-cyan-500 focus:outline-none bg-white md:col-span-2" 
              value={form.complemento} 
              onChange={e => setForm({...form, complemento: e.target.value})} 
            />
          </div>
          <button onClick={cadastrar} className="mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-cyan-700 hover:to-blue-700 font-semibold shadow-md transition">
            Cadastrar Cliente
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
              <tr>
                <th className="text-left p-4 font-bold">ID</th>
                <th className="text-left p-4 font-bold">Nome</th>
                <th className="text-left p-4 font-bold">Telefone</th>
                <th className="text-left p-4 font-bold">Endereço</th>
                <th className="text-left p-4 font-bold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(c => (
                <tr key={c.id} className="border-t hover:bg-gray-50 transition">
                  <td className="p-4 font-semibold text-gray-700">{c.id}</td>
                  <td className="p-4">{c.nome}</td>
                  <td className="p-4">{c.telefone}</td>
                  <td className="p-4">{c.endereco}</td>
                  <td className="p-4">
                    <button onClick={() => excluir(c.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition">
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
        <h2 className="text-3xl font-bold mb-6 text-gray-800">📦 Gerenciar Produtos</h2>
        
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-lg p-6 mb-6 border border-orange-200">
          <h3 className="font-bold text-xl mb-4 text-orange-900">➕ Cadastrar Novo Produto</h3>
          <div className="space-y-4">
            <input placeholder="Nome do Produto" className="w-full border-2 border-orange-300 rounded-lg px-4 py-3 focus:border-orange-500 focus:outline-none bg-white" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
            <select className="w-full border-2 border-orange-300 rounded-lg px-4 py-3 focus:border-orange-500 focus:outline-none bg-white" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
              <option value="pizza">🍕 Pizza</option>
              <option value="bebida">🥤 Bebida</option>
              <option value="adicional">➕ Adicional</option>
              <option value="borda">🥖 Borda</option>
              <option value="outro">📦 Outro</option>
            </select>
            
            {form.tipo === 'pizza' ? (
              <div className="grid grid-cols-3 gap-4">
                <input placeholder="Preço P" type="number" step="0.01" className="border-2 border-orange-300 rounded-lg px-4 py-3 focus:border-orange-500 focus:outline-none bg-white" value={form.precoP} onChange={e => setForm({...form, precoP: e.target.value})} />
                <input placeholder="Preço M" type="number" step="0.01" className="border-2 border-orange-300 rounded-lg px-4 py-3 focus:border-orange-500 focus:outline-none bg-white" value={form.precoM} onChange={e => setForm({...form, precoM: e.target.value})} />
                <input placeholder="Preço G" type="number" step="0.01" className="border-2 border-orange-300 rounded-lg px-4 py-3 focus:border-orange-500 focus:outline-none bg-white" value={form.precoG} onChange={e => setForm({...form, precoG: e.target.value})} />
              </div>
            ) : (
              <input placeholder="Preço" type="number" step="0.01" className="w-full border-2 border-orange-300 rounded-lg px-4 py-3 focus:border-orange-500 focus:outline-none bg-white" value={form.preco} onChange={e => setForm({...form, preco: e.target.value})} />
            )}
          </div>
          <button onClick={cadastrar} className="mt-4 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg hover:from-orange-700 hover:to-red-700 font-semibold shadow-md transition">
            Cadastrar Produto
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
              <tr>
                <th className="text-left p-4 font-bold">ID</th>
                <th className="text-left p-4 font-bold">Nome</th>
                <th className="text-left p-4 font-bold">Tipo</th>
                <th className="text-left p-4 font-bold">Preço</th>
                <th className="text-left p-4 font-bold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map(p => (
                <tr key={p.id} className="border-t hover:bg-gray-50 transition">
                  <td className="p-4 font-semibold text-gray-700">{p.id}</td>
                  <td className="p-4">{p.nome}</td>
                  <td className="p-4">
                    <span className="capitalize px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-700">
                      {p.tipo}
                    </span>
                  </td>
                  <td className="p-4 font-semibold">
                    {p.tipo === 'pizza' && p.precos ? 
                      `P: R$ ${Number(p.precos.precoP).toFixed(2)} | M: R$ ${Number(p.precos.precoM).toFixed(2)} | G: R$ ${Number(p.precos.precoG).toFixed(2)}` : 
                      `R$ ${Number(p.preco).toFixed(2)}`}
                  </td>
                  <td className="p-4">
                    <button onClick={() => excluir(p.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition">
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
    const calcularPrecoItem = (item: any) => {
      // Se o item tem tamanho, buscar o preço correto da pizza
      if (item.tamanho && item.tipo === 'pizza') {
        const pizza = produtos.find(p => p.id === item.produtoId);
        if (pizza && pizza.precos) {
          return item.tamanho === 'P' ? Number(pizza.precos.precoP) : 
                 item.tamanho === 'M' ? Number(pizza.precos.precoM) : 
                 Number(pizza.precos.precoG);
        }
      }
      return Number(item.preco);
    };

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

    const toggleDetalhes = (id: number) => {
      if (pedidoExpandido === id) {
        setPedidoExpandido(null);
        setDetalhesPedido(null);
      } else {
        carregarDetalhesPedido(id);
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

    return (
      <div className="p-6">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">📋 Gerenciar Pedidos</h2>
        
        <div className="space-y-4">
          {pedidos.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden hover:shadow-xl transition">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-gray-800">Pedido #{p.id}</h3>
                      <span className={`px-4 py-1 rounded-full text-sm font-bold border-2 ${getStatusColor(p.status)}`}>
                        {p.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-700 font-semibold">👤 {p.clienteNome}</p>
                    <p className="text-gray-600">📱 {p.telefone}</p>
                    <p className="text-gray-600">📍 {p.endereco}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      🕐 {new Date(p.data).toLocaleString('pt-BR')} | 💳 {p.pagamento} | 🚚 {p.entrega}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-600">R$ {Number(p.total).toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 flex-wrap mb-4">
                  <button 
                    onClick={async () => {
                      const res = await fetch(`${API_URL}/pedidos/${p.id}`);
                      const detalhes = await res.json();
                      baixarComprovante(detalhes);
                    }}
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:from-teal-600 hover:to-cyan-600 font-semibold flex items-center gap-2 shadow-md transition"
                  >
                    <FileText size={18} />
                    Comprovante
                  </button>

                  <button 
                    onClick={() => toggleDetalhes(p.id)}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-indigo-600 hover:to-purple-600 font-semibold flex items-center gap-2 shadow-md transition"
                  >
                    <Eye size={18} />
                    {pedidoExpandido === p.id ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                    {pedidoExpandido === p.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  
                  {p.status === 'aberto' && (
                    <button onClick={() => atualizarStatus(p.id, 'preparando')} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-semibold shadow-md transition">
                      ▶️ Iniciar Preparo
                    </button>
                  )}
                  {p.status === 'preparando' && (
                    <button onClick={() => atualizarStatus(p.id, 'pronto')} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-semibold shadow-md transition">
                      ✅ Marcar Pronto
                    </button>
                  )}
                  {p.status === 'pronto' && (
                    <button onClick={() => atualizarStatus(p.id, 'entregue')} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 font-semibold shadow-md transition">
                      🚚 Marcar Entregue
                    </button>
                  )}
                  <button onClick={() => atualizarStatus(p.id, 'cancelado')} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-semibold shadow-md transition">
                    ❌ Cancelar
                  </button>
                  <button onClick={() => excluir(p.id)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 font-semibold shadow-md transition">
                    <Trash2 size={18} className="inline" />
                  </button>
                </div>

                {pedidoExpandido === p.id && detalhesPedido && (
                  <div className="mt-4 pt-4 border-t-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4">
                    <h4 className="font-bold text-xl mb-3 text-gray-800">📦 Itens do Pedido:</h4>
                    <div className="space-y-3">
                      {detalhesPedido.itens.map((item, idx) => {
                        const precoCorreto = calcularPrecoItem(item);
                        return (
                          <div key={idx} className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-bold text-lg text-gray-800">
                                  {item.produtoNome} 
                                  {item.tamanho && <span className="text-red-600"> ({item.tamanho})</span>}
                                </p>
                                <p className="text-sm text-gray-600 capitalize">
                                  Tipo: <span className="font-semibold">{item.tipo}</span>
                                </p>
                                <p className="text-sm text-gray-600">
                                  Quantidade: <span className="font-semibold">{item.quantidade}x</span>
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-xl text-green-600">
                                  R$ {(precoCorreto * item.quantidade).toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  R$ {precoCorreto.toFixed(2)} cada
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-3 border-t-2 border-gray-300 flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-800">Total do Pedido:</span>
                      <span className="text-3xl font-bold text-green-600">
                        R$ {Number(detalhesPedido.total).toFixed(2)}
                      </span>
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

  const Relatorios = () => {
    const total = pedidos.reduce((sum, p) => sum + Number(p.total), 0);
    const porStatus = pedidos.reduce((acc: Record<string, number>, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});

    return (
      <div className="p-6">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">📊 Relatórios de Vendas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg mb-2 opacity-90">Total de Pedidos</h3>
            <p className="text-5xl font-bold">{pedidos.length}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg mb-2 opacity-90">Faturamento Total</h3>
            <p className="text-4xl font-bold">R$ {total.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg mb-2 opacity-90">Ticket Médio</h3>
            <p className="text-4xl font-bold">
              R$ {pedidos.length > 0 ? (total / pedidos.length).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Pedidos por Status</h3>
          <div className="space-y-3">
            {Object.entries(porStatus).map(([status, qtd]) => (
              <div key={status} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="capitalize font-semibold text-gray-700">{status}</span>
                <span className="font-bold text-xl text-gray-800">{qtd}</span>
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
              className={`px-4 py-2 rounded font-semibold transition ${view === 'cliente' ? 'bg-white text-red-600' : 'bg-red-700 hover:bg-red-800'}`}
            >
              Área do Cliente
            </button>
            <button 
              onClick={() => { setView('admin'); setPage('pedidos'); }}
              className={`px-4 py-2 rounded font-semibold transition ${view === 'admin' ? 'bg-white text-red-600' : 'bg-red-700 hover:bg-red-800'}`}
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
              <button onClick={() => setPage('cardapio')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 font-semibold transition ${page === 'cardapio' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'}`}>
                <Pizza size={20} /> Cardápio
              </button>
              <button onClick={() => setPage('carrinho')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 font-semibold transition ${page === 'carrinho' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'}`}>
                <ShoppingCart size={20} /> Carrinho ({carrinho.length})
              </button>
            </nav>
          ) : (
            <nav className="space-y-2">
              <button onClick={() => setPage('pedidos')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 font-semibold transition ${page === 'pedidos' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'}`}>
                <Clock size={20} /> Pedidos
              </button>
              <button onClick={() => setPage('clientes')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 font-semibold transition ${page === 'clientes' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'}`}>
                <Users size={20} /> Clientes
              </button>
              <button onClick={() => setPage('produtos')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 font-semibold transition ${page === 'produtos' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'}`}>
                <Package size={20} /> Produtos
              </button>
              <button onClick={() => setPage('relatorios')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 font-semibold transition ${page === 'relatorios' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'}`}>
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
