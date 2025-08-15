import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Eye, 
  Edit, 
  CheckSquare, 
  Square,
  Save,
  X,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { integracoesService } from '../services/integracoes';
import { TransacaoImportada, IntegracaoBancaria } from '../types';

interface ConciliacaoAvancadaProps {
  integracoes: IntegracaoBancaria[];
}

export const ConciliacaoAvancada: React.FC<ConciliacaoAvancadaProps> = ({ integracoes }) => {
  // Estados principais
  const [transacoes, setTransacoes] = useState<TransacaoImportada[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para filtros
  const [filtroStatus, setFiltroStatus] = useState('pendentes');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroIntegracao, setFiltroIntegracao] = useState('todas');

  // Estados para edição em lote
  const [transacoesSelecionadas, setTransacoesSelecionadas] = useState<string[]>([]);
  const [modoEdicaoLote, setModoEdicaoLote] = useState(false);
  const [dadosEdicaoLote, setDadosEdicaoLote] = useState({
    categoriaBanco: '',
    descricao: '',
    tipo: 'debito' as 'debito' | 'credito' | 'transferencia'
  });

  // Estados para modal de detalhes/edição
  const [modalAberto, setModalAberto] = useState(false);
  const [transacaoSelecionada, setTransacaoSelecionada] = useState<TransacaoImportada | null>(null);
  const [editandoTransacao, setEditandoTransacao] = useState<{
    descricao?: string;
    categoriaBanco?: string;
    tipo?: 'debito' | 'credito' | 'transferencia';
  }>({});

  // Estados para estatísticas
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    conciliadas: 0,
    ignoradas: 0
  });

  // Carregar transações
  const carregarTransacoes = async () => {
    try {
      setLoading(true);
      const data = await integracoesService.getTransacoesImportadas();
      setTransacoes(data);
      calcularStats(data);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas
  const calcularStats = (data: TransacaoImportada[]) => {
    setStats({
      total: data.length,
      pendentes: data.filter(t => t.statusConciliacao === 'pendente').length,
      conciliadas: data.filter(t => t.statusConciliacao === 'conciliada').length,
      ignoradas: data.filter(t => t.statusConciliacao === 'ignorada').length
    });
  };

  // Filtrar transações
  const transacoesFiltradas = transacoes.filter(transacao => {
    // Filtro por status
    if (filtroStatus !== 'todos') {
      if (filtroStatus === 'pendentes' && transacao.statusConciliacao !== 'pendente') return false;
      if (filtroStatus === 'conciliadas' && transacao.statusConciliacao !== 'conciliada') return false;
      if (filtroStatus === 'ignoradas' && transacao.statusConciliacao !== 'ignorada') return false;
    }

    // Filtro por tipo
    if (filtroTipo !== 'todos' && transacao.tipo !== filtroTipo) return false;

    // Filtro por integração
    if (filtroIntegracao !== 'todas') {
      const integracao = integracoes.find(i => i.id === transacao.integracaoId);
      if (!integracao || integracao.nome !== filtroIntegracao) return false;
    }

    return true;
  });

  // Ações de conciliação
  const conciliarTransacao = async (id: string) => {
    try {
      await integracoesService.conciliarTransacao(id, crypto.randomUUID());
      await carregarTransacoes();
    } catch (error) {
      console.error('Erro ao conciliar transação:', error);
    }
  };

  const ignorarTransacao = async (id: string) => {
    try {
      await integracoesService.ignorarTransacao(id);
      await carregarTransacoes();
    } catch (error) {
      console.error('Erro ao ignorar transação:', error);
    }
  };

  // Conciliação em lote
  const conciliarTodas = async () => {
    try {
      setLoading(true);
      const pendentes = transacoesFiltradas.filter(t => t.statusConciliacao === 'pendente');
      for (const transacao of pendentes) {
        await integracoesService.conciliarTransacao(transacao.id, crypto.randomUUID());
      }
      await carregarTransacoes();
    } catch (error) {
      console.error('Erro ao conciliar todas:', error);
    } finally {
      setLoading(false);
    }
  };

  const ignorarTodas = async () => {
    try {
      setLoading(true);
      const pendentes = transacoesFiltradas.filter(t => t.statusConciliacao === 'pendente');
      for (const transacao of pendentes) {
        await integracoesService.ignorarTransacao(transacao.id);
      }
      await carregarTransacoes();
    } catch (error) {
      console.error('Erro ao ignorar todas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Seleção em lote
  const toggleSelecao = (id: string) => {
    setTransacoesSelecionadas(prev => 
      prev.includes(id) 
        ? prev.filter(t => t !== id)
        : [...prev, id]
    );
  };

  const selecionarTodas = () => {
    const ids = transacoesFiltradas.map(t => t.id);
    setTransacoesSelecionadas(ids);
  };

  const deselecionarTodas = () => {
    setTransacoesSelecionadas([]);
  };

  // Edição em lote
  const aplicarEdicaoLote = async () => {
    try {
      setLoading(true);
      for (const id of transacoesSelecionadas) {
        // Aqui você implementaria a atualização em lote
        console.log(`Editando transação ${id} com dados:`, dadosEdicaoLote);
      }
      setModoEdicaoLote(false);
      setTransacoesSelecionadas([]);
      await carregarTransacoes();
    } catch (error) {
      console.error('Erro ao aplicar edição em lote:', error);
    } finally {
      setLoading(false);
    }
  };

  // Modal de detalhes/edição
  const abrirModal = (transacao: TransacaoImportada, modo: 'visualizar' | 'editar') => {
    setTransacaoSelecionada(transacao);
    if (modo === 'editar') {
      setEditandoTransacao({
        descricao: transacao.descricao,
        categoriaBanco: transacao.categoriaBanco,
        tipo: transacao.tipo
      });
    }
    setModalAberto(true);
  };

  const salvarEdicao = async () => {
    if (!transacaoSelecionada) return;
    
    try {
      // Aqui você implementaria a atualização da transação
      console.log('Salvando edição:', editandoTransacao);
      setModalAberto(false);
      await carregarTransacoes();
    } catch (error) {
      console.error('Erro ao salvar edição:', error);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    carregarTransacoes();
  }, []);

  return (
    <div className="space-y-6">
      {/* Cabeçalho com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
          <div className="text-sm text-gray-600">Pendentes</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{stats.conciliadas}</div>
          <div className="text-sm text-gray-600">Conciliadas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{stats.ignoradas}</div>
          <div className="text-sm text-gray-600">Ignoradas</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              value={filtroStatus} 
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="pendentes">Pendentes</option>
              <option value="conciliadas">Conciliadas</option>
              <option value="ignoradas">Ignoradas</option>
              <option value="todos">Todos</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select 
              value={filtroTipo} 
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="todos">Todos</option>
              <option value="debito">Débito</option>
              <option value="credito">Crédito</option>
              <option value="transferencia">Transferência</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Integração</label>
            <select 
              value={filtroIntegracao} 
              onChange={(e) => setFiltroIntegracao(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="todas">Todas</option>
              {integracoes.map(integracao => (
                <option key={integracao.id} value={integracao.nome}>
                  {integracao.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ações em lote */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={carregarTransacoes}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

          <button
            onClick={conciliarTodas}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            Conciliar Todas
          </button>

          <button
            onClick={ignorarTodas}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            Ignorar Todas
          </button>

          <button
            onClick={() => setModoEdicaoLote(!modoEdicaoLote)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            <Edit className="w-4 h-4" />
            Edição em Lote
          </button>
        </div>

        {/* Controles de seleção */}
        {transacoesFiltradas.length > 0 && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <button
                onClick={selecionarTodas}
                className="text-blue-600 hover:text-blue-800"
              >
                Selecionar Todas
              </button>
              <button
                onClick={deselecionarTodas}
                className="text-gray-600 hover:text-gray-800"
              >
                Deselecionar Todas
              </button>
            </div>
            
            {transacoesSelecionadas.length > 0 && (
              <span className="text-sm text-gray-600">
                {transacoesSelecionadas.length} selecionada(s)
              </span>
            )}
          </div>
        )}

        {/* Formulário de edição em lote */}
        {modoEdicaoLote && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-3">Edição em Lote</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={dadosEdicaoLote.descricao}
                  onChange={(e) => setDadosEdicaoLote(prev => ({ ...prev, descricao: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Nova descrição"
                />
              </div>
              
                             <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                 <input
                   type="text"
                   value={dadosEdicaoLote.categoriaBanco}
                   onChange={(e) => setDadosEdicaoLote(prev => ({ ...prev, categoriaBanco: e.target.value }))}
                   className="w-full p-2 border border-gray-300 rounded-md"
                   placeholder="Nova categoria"
                 />
               </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={dadosEdicaoLote.tipo}
                                     onChange={(e) => setDadosEdicaoLote(prev => ({ ...prev, tipo: e.target.value as 'debito' | 'credito' | 'transferencia' }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="debito">Débito</option>
                  <option value="credito">Crédito</option>
                  <option value="transferencia">Transferência</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={aplicarEdicaoLote}
                disabled={loading || transacoesSelecionadas.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Aplicar a {transacoesSelecionadas.length} selecionada(s)
              </button>
              
              <button
                onClick={() => setModoEdicaoLote(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de transações */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">
            Transações Importadas ({transacoesFiltradas.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-gray-600">Carregando transações...</p>
          </div>
        ) : transacoesFiltradas.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">Nenhuma transação encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {modoEdicaoLote && (
                      <input
                        type="checkbox"
                        checked={transacoesSelecionadas.length === transacoesFiltradas.length}
                        onChange={(e) => e.target.checked ? selecionarTodas() : deselecionarTodas()}
                        className="rounded border-gray-300"
                      />
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Integração
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transacoesFiltradas.map((transacao) => (
                  <tr key={transacao.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {modoEdicaoLote && (
                        <input
                          type="checkbox"
                          checked={transacoesSelecionadas.includes(transacao.id)}
                          onChange={() => toggleSelecao(transacao.id)}
                          className="rounded border-gray-300"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transacao.dataTransacao}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{transacao.descricao}</div>
                      <div className="text-sm text-gray-500">{transacao.categoriaBanco}</div>
                      <div className="text-xs text-gray-400">ID: {transacao.idExterno}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        transacao.tipo === 'credito' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        R$ {transacao.valor.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transacao.tipo === 'credito' 
                          ? 'bg-green-100 text-green-800' 
                          : transacao.tipo === 'transferencia'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transacao.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transacao.statusConciliacao === 'conciliada'
                          ? 'bg-green-100 text-green-800'
                          : transacao.statusConciliacao === 'ignorada'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transacao.statusConciliacao}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {integracoes.find(i => i.id === transacao.integracaoId)?.nome || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => abrirModal(transacao, 'visualizar')}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => abrirModal(transacao, 'editar')}
                          className="text-purple-600 hover:text-purple-900"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        {transacao.statusConciliacao === 'pendente' && (
                          <>
                            <button
                              onClick={() => conciliarTransacao(transacao.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Conciliar"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => ignorarTransacao(transacao.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Ignorar"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de detalhes/edição */}
      {modalAberto && transacaoSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editandoTransacao.descricao ? 'Editar Transação' : 'Detalhes da Transação'}
              </h3>
              <button
                onClick={() => setModalAberto(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {editandoTransacao.descricao ? (
              // Formulário de edição
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <input
                    type="text"
                    value={editandoTransacao.descricao}
                    onChange={(e) => setEditandoTransacao(prev => ({ ...prev, descricao: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                   <input
                     type="text"
                     value={editandoTransacao.categoriaBanco}
                     onChange={(e) => setEditandoTransacao(prev => ({ ...prev, categoriaBanco: e.target.value }))}
                     className="w-full p-2 border border-gray-300 rounded-md"
                   />
                 </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={editandoTransacao.tipo}
                                         onChange={(e) => setEditandoTransacao(prev => ({ ...prev, tipo: e.target.value as 'debito' | 'credito' | 'transferencia' }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="debito">Débito</option>
                    <option value="credito">Crédito</option>
                    <option value="transferencia">Transferência</option>
                  </select>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={salvarEdicao}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Save className="w-4 h-4" />
                    Salvar
                  </button>
                  
                  <button
                    onClick={() => setModalAberto(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              // Visualização de detalhes
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data</label>
                    <p className="text-sm text-gray-900">{transacaoSelecionada.dataTransacao}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Valor</label>
                    <p className={`text-sm font-medium ${
                      transacaoSelecionada.tipo === 'credito' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      R$ {transacaoSelecionada.valor.toFixed(2)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                    <p className="text-sm text-gray-900">{transacaoSelecionada.descricao}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Categoria</label>
                    <p className="text-sm text-gray-900">{transacaoSelecionada.categoriaBanco}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <p className="text-sm text-gray-900">{transacaoSelecionada.tipo}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="text-sm text-gray-900">{transacaoSelecionada.statusConciliacao}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID Externo</label>
                    <p className="text-sm text-gray-900">{transacaoSelecionada.idExterno}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Conta Origem</label>
                    <p className="text-sm text-gray-900">{transacaoSelecionada.contaOrigem}</p>
                  </div>
                </div>
                
                <div className="pt-4">
                                     <button
                     onClick={() => {
                       setEditandoTransacao({
                         descricao: transacaoSelecionada.descricao,
                         categoriaBanco: transacaoSelecionada.categoriaBanco,
                         tipo: transacaoSelecionada.tipo
                       });
                     }}
                     className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                   >
                     <Edit className="w-4 h-4" />
                     Editar
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
