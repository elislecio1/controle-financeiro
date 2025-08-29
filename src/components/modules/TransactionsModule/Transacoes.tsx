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
  Calendar,
  Target,
  Building,
  Save,
  X,
  DollarSign,
  FileText,
  User,
  CreditCard,
  Tag
} from 'lucide-react';
import { supabaseService } from '../../../services/supabase';
import ContatoSelector from '../../ContatoSelector';
import { parsearValorBrasileiro } from '../../../utils/formatters';

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
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');
  const [filterCentroCusto, setFilterCentroCusto] = useState('todos');
  const [filterBanco, setFilterBanco] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [loading, setLoading] = useState(false);

  // Estados para edição
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    vencimento: '',
    valor: '',
    descricao: '',
    conta: '',
    categoria: '',
    subcategoria: '', // Adicionado campo subcategoria
    contato: '',
    centroCusto: '',
    forma: '',
    parcelas: '1',
    situacao: 'pendente',
    observacoes: '',
    tipo: 'despesa' as 'receita' | 'despesa' | 'transferencia' | 'investimento'
  });

  // Filtrar subcategorias baseadas na categoria selecionada na edição
  const subcategoriasFiltradasEdicao = useMemo(() => {
    if (!editFormData.categoria) return [];
    // Encontrar a categoria selecionada pelo nome
    const categoriaSelecionada = categorias.find(cat => cat.nome === editFormData.categoria);
    if (!categoriaSelecionada) return [];
    // Filtrar subcategorias pelo ID da categoria
    const subcats = subcategorias.filter(sub => sub.categoriaId === categoriaSelecionada.id);
    console.log('🔍 Debug subcategorias edição:', {
      categoriaSelecionada: editFormData.categoria,
      categoriaId: categoriaSelecionada.id,
      totalSubcategorias: subcategorias.length,
      subcategoriasFiltradas: subcats.length,
      subcategorias: subcategorias.map(s => ({ nome: s.nome, categoriaId: s.categoriaId }))
    });
    return subcats;
  }, [editFormData.categoria, categorias, subcategorias]);

  // Função para formatar valor monetário brasileiro - VERSÃO CORRIGIDA
  const formatarValorBrasileiro = (valor: string): string => {
    // Remove símbolos de moeda e espaços
    let valorLimpo = valor.replace(/[R$\s]/g, '');
    
    // Se não há valor, retorna vazio
    if (!valorLimpo) return '';
    
    // Verifica se é negativo
    const isNegativo = valorLimpo.startsWith('-');
    if (isNegativo) {
      valorLimpo = valorLimpo.substring(1);
    }
    
    // Se tem vírgula, trata como formato brasileiro (ex: 4084,49)
    if (valorLimpo.includes(',')) {
      // Remove pontos de milhares e substitui vírgula por ponto
      valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.');
    } else if (valorLimpo.includes('.')) {
      // Se só tem ponto, verifica se é decimal ou milhares
      const partes = valorLimpo.split('.');
      if (partes.length === 2 && partes[1].length <= 2) {
        // Formato americano: 123.45
        valorLimpo = valorLimpo;
      } else {
        // Formato com separador de milhares: 1.234
        valorLimpo = valorLimpo.replace(/\./g, '');
      }
    }
    
    // Converte para número
    const numero = parseFloat(valorLimpo);
    if (isNaN(numero)) return '';
    
    // Aplica sinal negativo se necessário
    const valorFinal = isNegativo ? -numero : numero;
    
    // Formata para moeda brasileira
    return valorFinal.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para formatar valor automaticamente durante a digitação
  const formatarValorDuranteDigitacao = (valor: string): string => {
    // Remove tudo que não é número
    const numeros = valor.replace(/\D/g, '');
    
    // Se não há números, retorna vazio
    if (numeros === '') return '';
    
    // Converte para número e divide por 100 para ter centavos
    const valorNumerico = parseInt(numeros) / 100;
    
    // Formata para moeda brasileira
    return valorNumerico.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para lidar com mudança no campo valor - VERSÃO COM FORMATAÇÃO AUTOMÁTICA
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Se o valor está vazio, limpa o campo
    if (!inputValue.trim()) {
      handleEditInputChange('valor', '');
      return;
    }
    
    // Aplica formatação automática durante a digitação
    const valorFormatado = formatarValorDuranteDigitacao(inputValue);
    
    handleEditInputChange('valor', valorFormatado);
  };

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

    // Filtro por data de início
    if (filterDataInicio) {
      filtered = filtered.filter(item => {
        if (!item.vencimento) return false;
        const itemDate = new Date(item.vencimento.split('/').reverse().join('-'));
        const startDate = new Date(filterDataInicio);
        return itemDate >= startDate;
      });
    }

    // Filtro por data de fim
    if (filterDataFim) {
      filtered = filtered.filter(item => {
        if (!item.vencimento) return false;
        const itemDate = new Date(item.vencimento.split('/').reverse().join('-'));
        const endDate = new Date(filterDataFim);
        return itemDate <= endDate;
      });
    }

    // Filtro por centro de custo
    if (filterCentroCusto !== 'todos') {
      filtered = filtered.filter(item => item.centroCusto === filterCentroCusto);
    }

    // Filtro por banco
    if (filterBanco !== 'todos') {
      filtered = filtered.filter(item => {
        const contaEncontrada = contas.find(c => c.nome === item.conta);
        return contaEncontrada && contaEncontrada.banco === filterBanco;
      });
    }

    return filtered;
  }, [data, searchTerm, filterTipo, filterStatus, filterDataInicio, filterDataFim, filterCentroCusto, filterBanco, contas]);

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
    // Converter data de DD/MM/YYYY para DD/MM/YYYY (manter formato)
    const dataFormatada = item.vencimento || item.data;
    
    setEditFormData({
      vencimento: dataFormatada,
      valor: Math.abs(item.valor).toString(),
      descricao: item.descricao || '',
      conta: item.conta || '',
      categoria: item.categoria || '',
      subcategoria: item.subcategoria || '', // Adicionado subcategoria
      contato: item.contato || '',
      centroCusto: item.centroCusto || '',
      forma: item.forma || '',
      parcelas: (item.parcelas || 1).toString(),
      situacao: item.status || item.situacao || 'pendente',
      observacoes: item.observacoes || '',
      tipo: item.tipo || 'despesa'
    });
    
    setEditingTransaction(item);
    setShowEditModal(true);
  };

  const handleEditInputChange = (field: string, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;
    
    if (!editFormData.descricao || !editFormData.valor || !editFormData.vencimento) {
      alert('Por favor, preencha os campos obrigatórios (Descrição, Valor e Vencimento)');
      return;
    }
    
    setLoading(true);
    try {
      // Obter data atual para o campo data
      const dataAtual = new Date().toLocaleDateString('pt-BR');
      
      // Ajustar valor baseado no tipo
      const valorFinal = editFormData.tipo === 'despesa' ? -parsearValorBrasileiro(editFormData.valor) : parsearValorBrasileiro(editFormData.valor);
      
      const updateData = {
        data: dataAtual, // Data atual de atualização
        valor: valorFinal,
        descricao: editFormData.descricao,
        conta: editFormData.conta,
        categoria: editFormData.categoria,
        subcategoria: editFormData.subcategoria || undefined, // Adicionado subcategoria
        contato: editFormData.contato || undefined,
        centro: editFormData.centroCusto || undefined, // Corrigido: centroCusto -> centro
        forma: editFormData.forma,
        vencimento: editFormData.vencimento, // Data de vencimento informada pelo usuário
        parcelas: parseInt(editFormData.parcelas),
        situacao: editFormData.situacao as 'pendente' | 'pago' | 'vencido',
        status: editFormData.situacao as 'pendente' | 'pago' | 'vencido',
        tipo: editFormData.tipo,
        observacoes: editFormData.observacoes || undefined
      };

      console.log('🔄 Atualizando transação:', updateData);

      const { success, message } = await supabaseService.updateTransaction(editingTransaction.id, updateData);

      if (success) {
        console.log('✅ Transação atualizada com sucesso!');
        
        // Atualizar dados locais
        const updatedData = data.map(transaction =>
          transaction.id === editingTransaction.id
            ? { ...transaction, ...updateData }
            : transaction
        );
        onDataChange(updatedData);
        
        setShowEditModal(false);
        setEditingTransaction(null);
        alert('Transação atualizada com sucesso!');
      } else {
        console.error('❌ Erro ao atualizar transação:', message);
        alert(`Erro ao atualizar: ${message}`);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar transação:', error);
      alert('Erro ao atualizar transação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingTransaction(null);
    setEditFormData({
      vencimento: '',
      valor: '',
      descricao: '',
      conta: '',
      categoria: '',
      subcategoria: '', // Adicionado subcategoria
      contato: '',
      centroCusto: '',
      forma: '',
      parcelas: '1',
      situacao: 'pendente',
      observacoes: '',
      tipo: 'despesa'
    });
  };

  // Função para formatar data no input de edição
  const handleEditDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é número

    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2);
    }
    if (value.length >= 5) {
      value = value.substring(0, 5) + '/' + value.substring(5, 9);
    }

    handleEditInputChange('vencimento', value);
  };

  const handleConfirmPayment = async (item: any) => {
    if (!window.confirm('Confirmar pagamento desta transação?')) {
      return;
    }

    setLoading(true);
    try {
      const { success, message } = await supabaseService.updateTransaction(item.id, {
        status: 'pago',
        dataPagamento: new Date().toLocaleDateString('pt-BR')
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

  const limparFiltros = () => {
    setSearchTerm('');
    setFilterTipo('todos');
    setFilterStatus('todos');
    setFilterDataInicio('');
    setFilterDataFim('');
    setFilterCentroCusto('todos');
    setFilterBanco('todos');
    setCurrentPage(1);
  };

  // Obter bancos únicos para o filtro
  const bancosUnicos = useMemo(() => {
    const bancos = contas.map(conta => conta.banco);
    return [...new Set(bancos)].sort();
  }, [contas]);

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

        {/* Filtros Adicionais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-3 w-3 inline mr-1" />
              Data Início
            </label>
            <input
              type="date"
              value={filterDataInicio}
              onChange={(e) => setFilterDataInicio(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-3 w-3 inline mr-1" />
              Data Fim
            </label>
            <input
              type="date"
              value={filterDataFim}
              onChange={(e) => setFilterDataFim(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              <Target className="h-3 w-3 inline mr-1" />
              Centro de Custo
            </label>
            <select
              value={filterCentroCusto}
              onChange={(e) => setFilterCentroCusto(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="todos">Todos</option>
              {centrosCusto.map(centro => (
                <option key={centro.id} value={centro.nome}>
                  {centro.nome}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              <Building className="h-3 w-3 inline mr-1" />
              Banco
            </label>
            <select
              value={filterBanco}
              onChange={(e) => setFilterBanco(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="todos">Todos</option>
              {bancosUnicos.map(banco => (
                <option key={banco} value={banco}>
                  {banco}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={limparFiltros}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </button>
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
                        className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {item.status === 'pendente' && (
                        <button
                          onClick={() => handleConfirmPayment(item)}
                          className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors"
                          title="Marcar como pago"
                          disabled={loading}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item)}
                        className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
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

      {/* Modal de Edição */}
      {showEditModal && editingTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-4xl max-h-full">
            <div className="relative bg-white rounded-lg shadow-lg">
              {/* Cabeçalho do Modal */}
              <div className="flex items-start justify-between p-4 border-b rounded-t">
                <h3 className="text-xl font-semibold text-gray-900">
                  Editar Transação
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Conteúdo do Modal */}
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Primeira linha - Data e Valor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="vencimento" className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Data de Vencimento *
                    </label>
                    <input
                      type="text"
                      id="vencimento"
                      value={editFormData.vencimento}
                      onChange={handleEditDateChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="DD/MM/AAAA"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-1">
                      <DollarSign className="h-4 w-4 inline mr-1" />
                      Valor *
                    </label>
                    <input
                      type="text"
                      id="valor"
                      value={editFormData.valor}
                      onChange={handleValorChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="0,00"
                      maxLength={15}
                    />
                  </div>
                </div>

                {/* Segunda linha - Descrição */}
                <div>
                  <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Descrição *
                  </label>
                  <input
                    type="text"
                    id="descricao"
                    value={editFormData.descricao}
                    onChange={(e) => handleEditInputChange('descricao', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    maxLength={100}
                  />
                </div>

                {/* Terceira linha - Conta, Categoria e Centro de Custo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="conta" className="block text-sm font-medium text-gray-700 mb-1">
                      <Building className="h-4 w-4 inline mr-1" />
                      Conta *
                    </label>
                    <select
                      id="conta"
                      value={editFormData.conta}
                      onChange={(e) => handleEditInputChange('conta', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">Selecione uma conta</option>
                      {contas.map(conta => (
                        <option key={conta.id} value={conta.nome}>
                          {conta.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">
                      <Tag className="h-4 w-4 inline mr-1" />
                      Categoria *
                    </label>
                    <select
                      id="categoria"
                      value={editFormData.categoria}
                      onChange={(e) => handleEditInputChange('categoria', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categorias.map(categoria => (
                        <option key={categoria.id} value={categoria.nome}>
                          {categoria.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="subcategoria" className="block text-sm font-medium text-gray-700 mb-1">
                      <Tag className="h-4 w-4 inline mr-1" />
                      Subcategoria
                    </label>
                    <select
                      id="subcategoria"
                      value={editFormData.subcategoria}
                      onChange={(e) => handleEditInputChange('subcategoria', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">Selecione uma subcategoria</option>
                      {subcategoriasFiltradasEdicao.map(sub => (
                        <option key={sub.id} value={sub.nome}>
                          {sub.nome}
                        </option>
                      ))}
                    </select>
                    {subcategoriasFiltradasEdicao.length === 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        Nenhuma subcategoria disponível para esta categoria
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="centroCusto" className="block text-sm font-medium text-gray-700 mb-1">
                      <Target className="h-4 w-4 inline mr-1" />
                      Centro de Custo
                    </label>
                    <select
                      id="centroCusto"
                      value={editFormData.centroCusto}
                      onChange={(e) => handleEditInputChange('centroCusto', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">Selecione um centro de custo</option>
                      {centrosCusto.map(centro => (
                        <option key={centro.id} value={centro.nome}>
                          {centro.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quarta linha - Contato e Forma de Pagamento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contato" className="block text-sm font-medium text-gray-700 mb-1">
                      <User className="h-4 w-4 inline mr-1" />
                      Cliente/Fornecedor
                    </label>
                    <ContatoSelector
                      value={editFormData.contato}
                      onChange={(contato: string) => handleEditInputChange('contato', contato)}
                      placeholder="Selecione ou digite para buscar..."
                    />
                  </div>
                  <div>
                    <label htmlFor="forma" className="block text-sm font-medium text-gray-700 mb-1">
                      <CreditCard className="h-4 w-4 inline mr-1" />
                      Forma de Pagamento *
                    </label>
                    <select
                      id="forma"
                      value={editFormData.forma}
                      onChange={(e) => handleEditInputChange('forma', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">Selecione a forma de pagamento</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="PIX">PIX</option>
                      <option value="Transferência">Transferência</option>
                      <option value="Boleto">Boleto</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                {/* Quinta linha - Parcelas, Situação e Tipo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="parcelas" className="block text-sm font-medium text-gray-700 mb-1">
                      Parcelas
                    </label>
                    <input
                      type="number"
                      min="1"
                      id="parcelas"
                      value={editFormData.parcelas}
                      onChange={(e) => handleEditInputChange('parcelas', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      maxLength={3}
                    />
                  </div>
                  <div>
                    <label htmlFor="situacao" className="block text-sm font-medium text-gray-700 mb-1">
                      Situação
                    </label>
                    <select
                      id="situacao"
                      value={editFormData.situacao}
                      onChange={(e) => handleEditInputChange('situacao', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="pago">Pago</option>
                      <option value="vencido">Vencido</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <select
                      id="tipo"
                      value={editFormData.tipo}
                      onChange={(e) => handleEditInputChange('tipo', e.target.value as 'receita' | 'despesa' | 'transferencia' | 'investimento')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="despesa">Despesa</option>
                      <option value="receita">Receita</option>
                      <option value="transferencia">Transferência</option>
                      <option value="investimento">Investimento</option>
                    </select>
                  </div>
                </div>

                {/* Sexta linha - Observações */}
                <div>
                  <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    id="observacoes"
                    value={editFormData.observacoes}
                    onChange={(e) => handleEditInputChange('observacoes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Observações adicionais..."
                    maxLength={200}
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end p-4 sm:p-6 space-x-3 border-t border-gray-200">
                <button
                  onClick={handleCancelEdit}
                  disabled={loading}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
