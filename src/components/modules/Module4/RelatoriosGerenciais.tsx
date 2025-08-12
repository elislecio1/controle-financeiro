import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { FileText, TrendingUp, DollarSign, PieChart as PieChartIcon, BarChart3, Download, Filter, Calendar } from 'lucide-react'

interface RelatoriosGerenciaisProps {
  data: any[]
  categorias: any[]
  centrosCusto: any[]
}

export default function RelatoriosGerenciais({ data, categorias, centrosCusto }: RelatoriosGerenciaisProps) {
  const [activeReport, setActiveReport] = useState<'dre' | 'balanco' | 'fluxo' | 'categoria' | 'centro'>('dre')
  
  // Calcular anos disponíveis baseado nas movimentações existentes
  const calcularAnosDisponiveis = () => {
    if (!data || data.length === 0) return []
    
    const anos = new Set<string>()
    
    data.forEach(item => {
      // Extrair ano da data de vencimento ou data
      const ano = item.vencimento?.split('/')[2] || item.data?.split('/')[2]
      if (ano) {
        anos.add(ano)
      }
    })
    
    // Converter para array e ordenar decrescente (mais recente primeiro)
    return Array.from(anos).sort((a, b) => parseInt(b) - parseInt(a))
  }
  
  const anosDisponiveis = calcularAnosDisponiveis()
  const [periodo, setPeriodo] = useState(anosDisponiveis.length > 0 ? anosDisponiveis[0] : '2024')
  
  // Calcular meses disponíveis para o ano selecionado
  const calcularMesesDisponiveis = (anoSelecionado: string) => {
    if (!data || data.length === 0) return []
    
    const meses = new Set<number>()
    
    data.forEach(item => {
      const ano = item.vencimento?.split('/')[2] || item.data?.split('/')[2]
      if (ano === anoSelecionado) {
        const mes = parseInt(item.vencimento?.split('/')[1] || item.data?.split('/')[1])
        if (mes && mes >= 1 && mes <= 12) {
          meses.add(mes)
        }
      }
    })
    
    // Converter para array e ordenar crescente
    return Array.from(meses).sort((a, b) => a - b)
  }
  
  const mesesDisponiveis = calcularMesesDisponiveis(periodo)
  const [mes, setMes] = useState(mesesDisponiveis.length > 0 ? mesesDisponiveis[0].toString() : '12')

  // Atualizar mês quando ano for alterado
  useEffect(() => {
    const novosMeses = calcularMesesDisponiveis(periodo)
    if (novosMeses.length > 0) {
      setMes(novosMeses[0].toString())
    } else {
      setMes('12')
    }
  }, [periodo, data])

  // Calcular dados reais baseados nas transações
  const calcularDadosReais = () => {
    if (!data || data.length === 0) return { dre: [], balanco: [], fluxo: [], categoria: [], centro: [] }

    // Filtrar dados por período (ano e mês)
    const dadosPeriodo = data.filter(item => {
      const ano = item.vencimento?.split('/')[2] || item.data?.split('/')[2]
      const mes = item.vencimento?.split('/')[1] || item.data?.split('/')[1]
      return ano === periodo && mes === mes
    })

    // DRE - Demonstrativo de Resultados
    const receitas = dadosPeriodo.filter(item => item.tipo === 'receita' && item.status === 'pago')
      .reduce((sum, item) => sum + Math.abs(item.valor), 0)
    
    const despesas = dadosPeriodo.filter(item => item.tipo === 'despesa' && item.status === 'pago')
      .reduce((sum, item) => sum + Math.abs(item.valor), 0)
    
    const resultadoLiquido = receitas - despesas

    const dreData = [
      { conta: 'Receitas Operacionais', valor: receitas, tipo: 'receita' },
      { conta: '(-) Despesas Operacionais', valor: -despesas, tipo: 'despesa' },
      { conta: 'Resultado Líquido', valor: resultadoLiquido, tipo: resultadoLiquido >= 0 ? 'receita' : 'despesa' }
    ]

    // Balanço Patrimonial
    const ativoCirculante = dadosPeriodo.filter(item => 
      item.tipo === 'receita' && item.status === 'pago'
    ).reduce((sum, item) => sum + Math.abs(item.valor), 0)
    
    const passivoCirculante = dadosPeriodo.filter(item => 
      item.tipo === 'despesa' && item.status === 'pendente'
    ).reduce((sum, item) => sum + Math.abs(item.valor), 0)
    
    const patrimonioLiquido = ativoCirculante - passivoCirculante

    const balancoData = [
      { conta: 'Ativo Circulante', valor: ativoCirculante, tipo: 'ativo' },
      { conta: 'Passivo Circulante', valor: passivoCirculante, tipo: 'passivo' },
      { conta: 'Patrimônio Líquido', valor: patrimonioLiquido, tipo: 'patrimonio' }
    ]

    // Fluxo de Caixa por mês (para o ano selecionado)
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const fluxoCaixaData = meses.map((nomeMes, index) => {
      const mesNum = index + 1
      const dadosMes = data.filter(item => {
        const anoItem = item.vencimento?.split('/')[2] || item.data?.split('/')[2]
        const mesItem = parseInt(item.vencimento?.split('/')[1] || item.data?.split('/')[1])
        return anoItem === periodo && mesItem === mesNum
      })
      
      const entradas = dadosMes.filter(item => item.tipo === 'receita' && item.status === 'pago')
        .reduce((sum, item) => sum + Math.abs(item.valor), 0)
      
      const saidas = dadosMes.filter(item => item.tipo === 'despesa' && item.status === 'pago')
        .reduce((sum, item) => sum + Math.abs(item.valor), 0)
      
      return {
        mes: nomeMes,
        entradas,
        saidas,
        saldo: entradas - saidas
      }
    })

    // Análise por Categoria (para o período selecionado)
    const categoriaData = categorias.map(cat => {
      const valor = dadosPeriodo.filter(item => 
        item.categoria === cat.nome && item.status === 'pago'
      ).reduce((sum, item) => sum + Math.abs(item.valor), 0)
      
      const percentual = despesas > 0 ? (valor / despesas) * 100 : 0
      
      return {
        categoria: cat.nome,
        valor,
        percentual: Math.round(percentual * 100) / 100
      }
    }).filter(item => item.valor > 0).sort((a, b) => b.valor - a.valor)

    // Análise por Centro de Custo (para o período selecionado)
    const centroCustoData = centrosCusto.map(centro => {
      const valor = dadosPeriodo.filter(item => 
        item.centro === centro.nome && item.status === 'pago'
      ).reduce((sum, item) => sum + Math.abs(item.valor), 0)
      
      const percentual = despesas > 0 ? (valor / despesas) * 100 : 0
      
      return {
        centro: centro.nome,
        valor,
        percentual: Math.round(percentual * 100) / 100
      }
    }).filter(item => item.valor > 0).sort((a, b) => b.valor - a.valor)

    return { dre: dreData, balanco: balancoData, fluxo: fluxoCaixaData, categoria: categoriaData, centro: centroCustoData }
  }

  const { dre: dreData, balanco: balancoData, fluxo: fluxoCaixaData, categoria: categoriaData, centro: centroCustoData } = calcularDadosReais()

  // Verificar se há dados para o período selecionado
  const temDadosParaPeriodo = data && data.length > 0 && anosDisponiveis.length > 0 && mesesDisponiveis.length > 0

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
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Demonstrativo de Resultados do Exercício</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conta
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor (R$)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dreData.map((item, index) => (
                      <tr key={index} className={item.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                          {item.conta}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-right font-medium">
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
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <h3 className="text-base sm:text-lg font-semibold mb-4 text-blue-600">ATIVO</h3>
                <div className="space-y-2">
                  {balancoData.filter(item => item.tipo === 'ativo').map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm">{item.conta}</span>
                      <span className="text-xs sm:text-sm font-medium">
                        R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <h3 className="text-base sm:text-lg font-semibold mb-4 text-red-600">PASSIVO + PATRIMÔNIO LÍQUIDO</h3>
                <div className="space-y-2">
                  {balancoData.filter(item => item.tipo !== 'ativo').map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm">{item.conta}</span>
                      <span className="text-xs sm:text-sm font-medium">
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
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Fluxo de Caixa - Análise Mensal</h3>
              <div className="w-full h-64 sm:h-96 lg:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
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
          </div>
        )

      case 'categoria':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <h3 className="text-base sm:text-lg font-semibold mb-4">Distribuição por Categoria</h3>
                <div className="w-full h-48 sm:h-64 lg:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoriaData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ categoria, percentual }) => `${categoria} (${percentual}%)`}
                        outerRadius={60}
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
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <h3 className="text-base sm:text-lg font-semibold mb-4">Detalhamento por Categoria</h3>
                <div className="space-y-2">
                  {categoriaData.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="text-xs sm:text-sm">{item.categoria}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-medium">
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
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Análise por Centro de Custo</h3>
              <div className="w-full h-64 sm:h-80 lg:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
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
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header responsivo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Relatórios Gerenciais</h2>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleExport('pdf')}
            className="flex-1 sm:flex-none bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-sm"
          >
            <Download size={16} />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="flex-1 sm:flex-none bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex-1 sm:flex-none bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
          >
            <Download size={16} />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Filtros responsivos */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            >
              {anosDisponiveis.map(ano => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            >
              {mesesDisponiveis.map(mesNum => (
                <option key={mesNum} value={mesNum}>{`${mesNum} - ${['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][mesNum - 1]}`}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 text-sm sm:text-base">
              <Filter size={16} />
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Navegação de Relatórios responsiva */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-2 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
            {reports.map((report) => {
              const Icon = report.icon
              return (
                <button
                  key={report.id}
                  onClick={() => setActiveReport(report.id as any)}
                  className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap ${
                    activeReport === report.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden xs:inline">{report.name}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Conteúdo do Relatório responsivo */}
      <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
        {temDadosParaPeriodo ? renderReport() : (
          <div className="text-center py-8 sm:py-12">
            <p className="text-base sm:text-lg text-gray-600">Não há dados disponíveis para o período selecionado.</p>
            <p className="text-sm text-gray-500 mt-2">Por favor, selecione um período diferente ou verifique os dados.</p>
          </div>
        )}
      </div>
    </div>
  )
} 