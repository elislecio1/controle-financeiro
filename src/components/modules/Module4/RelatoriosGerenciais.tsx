import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { FileText, TrendingUp, DollarSign, PieChart as PieChartIcon, BarChart3, Download, Filter, Calendar } from 'lucide-react'

interface RelatoriosGerenciaisProps {
  data: any[]
  categorias: any[]
  centrosCusto: any[]
}

export default function RelatoriosGerenciais({ data, categorias, centrosCusto }: RelatoriosGerenciaisProps) {
  const [activeReport, setActiveReport] = useState<'dre' | 'balanco' | 'fluxo' | 'categoria' | 'centro'>('dre')
  const [periodo, setPeriodo] = useState('2024')
  const [mes, setMes] = useState('12')

  // Dados mock para demonstração
  const dreData = [
    { conta: 'Receitas Operacionais', valor: 50000, tipo: 'receita' },
    { conta: '(-) Deduções', valor: -5000, tipo: 'despesa' },
    { conta: 'Receita Líquida', valor: 45000, tipo: 'receita' },
    { conta: '(-) Custos', valor: -20000, tipo: 'despesa' },
    { conta: 'Resultado Bruto', valor: 25000, tipo: 'receita' },
    { conta: '(-) Despesas Operacionais', valor: -15000, tipo: 'despesa' },
    { conta: 'Resultado Operacional', valor: 10000, tipo: 'receita' },
    { conta: '(-) Despesas Financeiras', valor: -2000, tipo: 'despesa' },
    { conta: 'Resultado Líquido', valor: 8000, tipo: 'receita' }
  ]

  const balancoData = [
    { conta: 'Ativo Circulante', valor: 100000, tipo: 'ativo' },
    { conta: 'Caixa e Bancos', valor: 30000, tipo: 'ativo' },
    { conta: 'Contas a Receber', valor: 40000, tipo: 'ativo' },
    { conta: 'Estoques', valor: 30000, tipo: 'ativo' },
    { conta: 'Ativo Não Circulante', valor: 200000, tipo: 'ativo' },
    { conta: 'Imobilizado', valor: 150000, tipo: 'ativo' },
    { conta: 'Investimentos', valor: 50000, tipo: 'ativo' },
    { conta: 'Total do Ativo', valor: 300000, tipo: 'ativo' },
    { conta: 'Passivo Circulante', valor: 80000, tipo: 'passivo' },
    { conta: 'Fornecedores', valor: 30000, tipo: 'passivo' },
    { conta: 'Contas a Pagar', valor: 50000, tipo: 'passivo' },
    { conta: 'Patrimônio Líquido', valor: 220000, tipo: 'patrimonio' },
    { conta: 'Capital Social', valor: 200000, tipo: 'patrimonio' },
    { conta: 'Lucros Acumulados', valor: 20000, tipo: 'patrimonio' },
    { conta: 'Total do Passivo + PL', valor: 300000, tipo: 'passivo' }
  ]

  const fluxoCaixaData = [
    { mes: 'Jan', entradas: 45000, saidas: 35000, saldo: 10000 },
    { mes: 'Fev', entradas: 48000, saidas: 38000, saldo: 10000 },
    { mes: 'Mar', entradas: 52000, saidas: 42000, saldo: 10000 },
    { mes: 'Abr', entradas: 49000, saidas: 39000, saldo: 10000 },
    { mes: 'Mai', entradas: 51000, saidas: 41000, saldo: 10000 },
    { mes: 'Jun', entradas: 54000, saidas: 44000, saldo: 10000 },
    { mes: 'Jul', entradas: 47000, saidas: 37000, saldo: 10000 },
    { mes: 'Ago', entradas: 50000, saidas: 40000, saldo: 10000 },
    { mes: 'Set', entradas: 53000, saidas: 43000, saldo: 10000 },
    { mes: 'Out', entradas: 46000, saidas: 36000, saldo: 10000 },
    { mes: 'Nov', entradas: 49000, saidas: 39000, saldo: 10000 },
    { mes: 'Dez', entradas: 52000, saidas: 42000, saldo: 10000 }
  ]

  const categoriaData = [
    { categoria: 'Alimentação', valor: 15000, percentual: 30 },
    { categoria: 'Transporte', valor: 10000, percentual: 20 },
    { categoria: 'Moradia', valor: 12000, percentual: 24 },
    { categoria: 'Saúde', valor: 5000, percentual: 10 },
    { categoria: 'Educação', valor: 3000, percentual: 6 },
    { categoria: 'Lazer', valor: 2000, percentual: 4 },
    { categoria: 'Serviços', valor: 3000, percentual: 6 }
  ]

  const centroCustoData = [
    { centro: 'Administrativo', valor: 20000, percentual: 40 },
    { centro: 'Comercial', valor: 15000, percentual: 30 },
    { centro: 'Produção', valor: 10000, percentual: 20 },
    { centro: 'TI', valor: 5000, percentual: 10 }
  ]

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658']

  const reports = [
    {
      id: 'dre',
      name: 'DRE',
      icon: FileText,
      description: 'Demonstrativo de Resultados do Exercício'
    },
    {
      id: 'balanco',
      name: 'Balanço Patrimonial',
      icon: BarChart3,
      description: 'Ativo, Passivo e Patrimônio Líquido'
    },
    {
      id: 'fluxo',
      name: 'Fluxo de Caixa',
      icon: TrendingUp,
      description: 'Entradas, saídas e saldo mensal'
    },
    {
      id: 'categoria',
      name: 'Por Categoria',
      icon: PieChartIcon,
      description: 'Análise por categoria de despesa'
    },
    {
      id: 'centro',
      name: 'Por Centro de Custo',
      icon: DollarSign,
      description: 'Análise por centro de custo'
    }
  ]

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exportando relatório ${activeReport} em formato ${format}`)
    // Implementar exportação
  }

  const renderReport = () => {
    switch (activeReport) {
      case 'dre':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Demonstrativo de Resultados do Exercício</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conta
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor (R$)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dreData.map((item, index) => (
                      <tr key={index} className={item.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {item.conta}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                          {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )

      case 'balanco':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4 text-blue-600">ATIVO</h3>
                <div className="space-y-2">
                  {balancoData.filter(item => item.tipo === 'ativo').map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{item.conta}</span>
                      <span className="text-sm font-medium">
                        R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4 text-red-600">PASSIVO + PATRIMÔNIO LÍQUIDO</h3>
                <div className="space-y-2">
                  {balancoData.filter(item => item.tipo !== 'ativo').map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{item.conta}</span>
                      <span className="text-sm font-medium">
                        R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 'fluxo':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Fluxo de Caixa - Análise Mensal</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={fluxoCaixaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${value?.toLocaleString('pt-BR')}`} />
                  <Legend />
                  <Line type="monotone" dataKey="entradas" stroke="#10B981" strokeWidth={2} name="Entradas" />
                  <Line type="monotone" dataKey="saidas" stroke="#EF4444" strokeWidth={2} name="Saídas" />
                  <Line type="monotone" dataKey="saldo" stroke="#3B82F6" strokeWidth={2} name="Saldo" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )

      case 'categoria':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Distribuição por Categoria</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoriaData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ categoria, percentual }) => `${categoria} (${percentual}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="valor"
                    >
                      {categoriaData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `R$ ${value?.toLocaleString('pt-BR')}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Detalhamento por Categoria</h3>
                <div className="space-y-2">
                  {categoriaData.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="text-sm">{item.categoria}</span>
                      </div>
                      <span className="text-sm font-medium">
                        R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 'centro':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Análise por Centro de Custo</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={centroCustoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="centro" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${value?.toLocaleString('pt-BR')}`} />
                  <Bar dataKey="valor" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Relatórios Gerenciais</h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('pdf')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <Download size={16} />
            PDF
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download size={16} />
            Excel
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download size={16} />
            CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="12">Dezembro</option>
              <option value="11">Novembro</option>
              <option value="10">Outubro</option>
              <option value="09">Setembro</option>
              <option value="08">Agosto</option>
              <option value="07">Julho</option>
              <option value="06">Junho</option>
              <option value="05">Maio</option>
              <option value="04">Abril</option>
              <option value="03">Março</option>
              <option value="02">Fevereiro</option>
              <option value="01">Janeiro</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2">
              <Filter size={16} />
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Navegação de Relatórios */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {reports.map((report) => {
              const Icon = report.icon
              return (
                <button
                  key={report.id}
                  onClick={() => setActiveReport(report.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
                    activeReport === report.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {report.name}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Conteúdo do Relatório */}
      <div className="bg-gray-50 rounded-lg p-6">
        {renderReport()}
      </div>
    </div>
  )
} 