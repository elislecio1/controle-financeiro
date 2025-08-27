import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Calendar,
  Building,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface ExtratoProps {
  data: any[];
  contas: any[];
}

export default function Extrato({
  data,
  contas
}: ExtratoProps) {
  const [selectedConta, setSelectedConta] = useState('todas');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [loading, setLoading] = useState(false);

  // Filtrar dados baseado nas seleções
  const filteredData = useMemo(() => {
    let filtered = data;

    // Filtro por conta
    if (selectedConta !== 'todas') {
      filtered = filtered.filter(item => item.conta === selectedConta);
    }

    // Filtro por período
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.data.split('/').reverse().join('-'));
        return itemDate >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.data.split('/').reverse().join('-'));
        return itemDate <= end;
      });
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.contato?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [data, selectedConta, startDate, endDate, searchTerm]);

  // Calcular totais
  const totals = useMemo(() => {
    const receitas = filteredData
      .filter(item => item.tipo === 'receita')
      .reduce((sum, item) => sum + Math.abs(item.valor), 0);
    
    const despesas = filteredData
      .filter(item => item.tipo === 'despesa')
      .reduce((sum, item) => sum + Math.abs(item.valor), 0);
    
    const saldo = receitas - despesas;
    
    return { receitas, despesas, saldo };
  }, [filteredData]);

  // Paginação
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Funções auxiliares
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getClasseValor = (valor: number) => {
    return valor >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    setLoading(true);
    try {
      // Simular exportação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Criar dados para exportação
      const exportData = filteredData.map(item => ({
        Data: item.data,
        Descrição: item.descricao,
        Categoria: item.categoria,
        Contato: item.contato || '-',
        Banco: item.conta,
        Valor: item.tipo === 'despesa' ? -Math.abs(item.valor) : Math.abs(item.valor),
        Forma: item.forma,
        Status: item.status,
        Tipo: item.tipo
      }));

      if (format === 'csv') {
        // Exportar CSV
        const headers = Object.keys(exportData[0] || {}).join(',');
        const rows = exportData.map(row => Object.values(row).join(','));
        const csv = [headers, ...rows].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `extrato_${selectedConta}_${startDate}_${endDate}.csv`;
        link.click();
      } else {
        // Para PDF e Excel, simular download
        alert(`${format.toUpperCase()} exportado com sucesso!`);
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar arquivo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedConta('todas');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            Extrato Bancário
          </h3>
          <div className="text-sm text-gray-500">
            {filteredData.length} transações encontradas
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Building className="h-4 w-4 inline mr-1" />
              Banco/Conta
            </label>
            <select
              value={selectedConta}
              onChange={(e) => setSelectedConta(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todas">Todas as Contas</option>
              {contas.map(conta => (
                <option key={conta.id} value={conta.nome}>
                  {conta.nome} - {conta.banco}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Data Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Data Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Search className="h-4 w-4 inline mr-1" />
              Buscar
            </label>
            <input
              type="text"
              placeholder="Descrição, categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors flex items-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Limpar Filtros
          </button>

          <div className="flex space-x-2">
            <button
              onClick={() => handleExport('csv')}
              disabled={loading || filteredData.length === 0}
              className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 rounded-md text-sm font-medium transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </>
              )}
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={loading || filteredData.length === 0}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 rounded-md text-sm font-medium transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={loading || filteredData.length === 0}
              className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 rounded-md text-sm font-medium transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Resumo financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-800">Receitas</p>
                <p className="text-lg font-semibold text-green-900">{formatarMoeda(totals.receitas)}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center">
              <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-red-800">Despesas</p>
                <p className="text-lg font-semibold text-red-900">{formatarMoeda(totals.despesas)}</p>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${
            totals.saldo >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-center">
              <DollarSign className={`h-5 w-5 mr-2 ${
                totals.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`} />
              <div>
                <p className={`text-sm font-medium ${
                  totals.saldo >= 0 ? 'text-blue-800' : 'text-orange-800'
                }`}>Saldo</p>
                <p className={`text-lg font-semibold ${
                  totals.saldo >= 0 ? 'text-blue-900' : 'text-orange-900'
                }`}>{formatarMoeda(totals.saldo)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de transações */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900">Transações do Período</h4>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700">Itens por página:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Forma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.data}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={item.descricao}>
                      {item.descricao}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.categoria}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.contato || '-'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getClasseValor(item.tipo === 'despesa' ? -Math.abs(item.valor) : item.valor)}`}>
                    {item.tipo === 'despesa' ? '- ' : ''}{formatarMoeda(Math.abs(item.valor))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.forma}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.status === 'pago' ? 'bg-green-100 text-green-800' :
                      item.status === 'vencido' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.status === 'pago' ? 'Pago' :
                       item.status === 'vencido' ? 'Vencido' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredData.length)} de {filteredData.length} resultados
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
          </div>
        )}
      </div>
    </div>
  );
}
