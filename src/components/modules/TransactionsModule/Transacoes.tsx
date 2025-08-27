import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Edit, 
  CheckCircle, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Filter,
  Calendar
} from 'lucide-react';
import { supabaseService } from '../../../services/supabase';

interface TransacoesProps {
  data: any[];
  categorias: any[];
  subcategorias: any[];
  centrosCusto: any[];
  contas: any[];
  cartoes: any[];
  onDataChange: (data: any[]) => void;
}

export default function Transacoes({
  data,
  categorias,
  subcategorias,
  centrosCusto,
  contas,
  cartoes,
  onDataChange
}: TransacoesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [loading, setLoading] = useState(false);

  // Filtros aplicados
  const filteredData = useMemo(() => {
    let filtered = data;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.contato?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (filterTipo !== 'todos') {
      filtered = filtered.filter(item => item.tipo === filterTipo);
    }

    // Filtro por status
    if (filterStatus !== 'todos') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    return filtered;
  }, [data, searchTerm, filterTipo, filterStatus]);

  // Ordenação
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (sortConfig.key === 'valor') {
        return sortConfig.direction === 'asc' 
          ? Math.abs(aValue) - Math.abs(bValue)
          : Math.abs(bValue) - Math.abs(aValue);
      }

      if (sortConfig.key === 'vencimento') {
        const aDate = new Date(aValue.split('/').reverse().join('-'));
        const bDate = new Date(bValue.split('/').reverse().join('-'));
        return sortConfig.direction === 'asc' 
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginação
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // Funções auxiliares
  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getClasseValor = (valor: number) => {
    return valor >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getBancoConta = (conta: string) => {
    const contaEncontrada = contas.find(c => c.nome === conta);
    return contaEncontrada ? contaEncontrada.banco : '-';
  };

  const handleEdit = (item: any) => {
    // Implementar edição
    console.log('Editar transação:', item);
  };

  const handleConfirmPayment = async (item: any) => {
    setLoading(true);
    try {
      const { success, message } = await supabaseService.updateTransaction(item.id, {
        status: 'pago',
        dataPagamento: new Date().toLocaleDateString('pt-BR'),
        updated_at: new Date().toISOString()
      });

      if (success) {
        // Atualizar dados locais
        const updatedData = data.map(transaction =>
          transaction.id === item.id
            ? { ...transaction, status: 'pago', dataPagamento: new Date().toLocaleDateString('pt-BR') }
            : transaction
        );
        onDataChange(updatedData);
        alert('Transação marcada como paga com sucesso!');
      } else {
        alert(`Erro ao marcar como pago: ${message}`);
      }
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
      alert('Erro ao marcar como pago. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: any) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) {
      return;
    }

    setLoading(true);
    try {
      const { success, message } = await supabaseService.deleteTransaction(item.id);

      if (success) {
        // Atualizar dados locais
        const updatedData = data.filter(transaction => transaction.id !== item.id);
        onDataChange(updatedData);
        alert('Transação excluída com sucesso!');
      } else {
        alert(`Erro ao excluir: ${message}`);
      }
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      alert('Erro ao excluir transação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Database className="h-5 w-5 text-gray-600" />
            Transações
          </h3>
          <div className="text-sm text-gray-500">
            {filteredData.length} de {data.length} transações
          </div>
        </div>
        
        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Descrição, categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="todos">Todos</option>
              <option value="receita">Receitas</option>
              <option value="despesa">Despesas</option>
              <option value="transferencia">Transferências</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="todos">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Itens por página</label>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('vencimento')}
                >
                  <div className="flex items-center">
                    <span className="hidden sm:inline">Data de Vencimento</span>
                    <span className="sm:hidden">Vencimento</span>
                    {sortConfig?.key === 'vencimento' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="hidden sm:inline">Descrição</span>
                  <span className="sm:hidden">Desc.</span>
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="hidden sm:inline">Categoria</span>
                  <span className="sm:hidden">Cat.</span>
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="hidden sm:inline">Cliente/Fornecedor</span>
                  <span className="sm:hidden">Contato</span>
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="hidden sm:inline">Banco</span>
                  <span className="sm:hidden">Banco</span>
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="hidden sm:inline">Forma de Pagamento</span>
                  <span className="sm:hidden">Forma</span>
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 ${
                  item.tipo === 'despesa' ? 'bg-red-50' :
                  item.status === 'pago' ? 'bg-green-50' : 
                  item.status === 'vencido' ? 'bg-red-50' : 'bg-yellow-50'
                }`}>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                    {item.vencimento}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={item.descricao}>
                      {item.descricao}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {item.categoria}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {item.contato || '-'}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {getBancoConta(item.conta)}
                  </td>
                  <td className={`px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium ${getClasseValor(item.tipo === 'despesa' ? -Math.abs(item.valor) : item.valor)}`}>
                    {item.tipo === 'despesa' ? '- ' : ''}{formatarMoeda(Math.abs(item.valor))}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {item.forma}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.status === 'pago' ? 'bg-green-100 text-green-800' :
                      item.status === 'vencido' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.status === 'pago' ? 'Pago' :
                       item.status === 'vencido' ? 'Vencido' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {item.status === 'pendente' && (
                        <button
                          onClick={() => handleConfirmPayment(item)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Marcar como pago"
                          disabled={loading}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Excluir"
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Mostrando {startIndex + 1} a {Math.min(endIndex, sortedData.length)} de {sortedData.length} resultados
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="px-3 py-2 text-sm font-medium text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
