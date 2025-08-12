import React, { useState, useEffect } from 'react'
import { FileText, Calculator, Download, AlertTriangle, TrendingUp, DollarSign, Calendar, Filter } from 'lucide-react'

interface ConformidadeFiscalProps {
  data: any[]
}

export default function ConformidadeFiscal({ data }: ConformidadeFiscalProps) {
  const [activeReport, setActiveReport] = useState<'carneleao' | 'impostos' | 'previsao'>('carneleao')
  
  // Calcular anos disponíveis baseado nas movimentações existentes
  const calcularAnosDisponiveis = () => {
    if (!data || data.length === 0) return []
    
    const anos = new Set<string>()
    
    data.forEach(item => {
      const ano = item.vencimento?.split('/')[2] || item.data?.split('/')[2]
      if (ano) {
        anos.add(ano)
      }
    })
    
    return Array.from(anos).sort((a, b) => parseInt(b) - parseInt(a))
  }
  
  const anosDisponiveis = calcularAnosDisponiveis()
  const [ano, setAno] = useState(anosDisponiveis.length > 0 ? anosDisponiveis[0] : '2024')
  
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
    
    return Array.from(meses).sort((a, b) => a - b)
  }
  
  const mesesDisponiveis = calcularMesesDisponiveis(ano)
  const [mes, setMes] = useState(mesesDisponiveis.length > 0 ? mesesDisponiveis[0].toString() : '12')

  // Atualizar mês quando ano for alterado
  useEffect(() => {
    const novosMeses = calcularMesesDisponiveis(ano)
    if (novosMeses.length > 0) {
      setMes(novosMeses[0].toString())
    } else {
      setMes('12')
    }
  }, [ano, data])

  // Calcular dados reais do Carnê Leão
  const calcularCarneLeao = () => {
    if (!data || data.length === 0) return []
    
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    
    return meses.map((nomeMes, index) => {
      const mesNum = index + 1
      const dadosMes = data.filter(item => {
        const anoItem = item.vencimento?.split('/')[2] || item.data?.split('/')[2]
        const mesItem = parseInt(item.vencimento?.split('/')[1] || item.data?.split('/')[1])
        return anoItem === ano && mesItem === mesNum && item.status === 'pago'
      })
      
      const rendimentos = dadosMes.filter(item => item.tipo === 'receita')
        .reduce((sum, item) => sum + Math.abs(item.valor), 0)
      
      const despesas = dadosMes.filter(item => item.tipo === 'despesa')
        .reduce((sum, item) => sum + Math.abs(item.valor), 0)
      
      const baseCalculo = rendimentos - despesas
      const imposto = baseCalculo > 0 ? baseCalculo * 0.20 : 0 // 20% de IR
      
      return {
        mes: nomeMes,
        rendimentos,
        despesas,
        baseCalculo,
        imposto
      }
    })
  }

  // Calcular dados reais de impostos
  const calcularImpostos = () => {
    if (!data || data.length === 0) return []
    
    const dadosAno = data.filter(item => {
      const anoItem = item.vencimento?.split('/')[2] || item.data?.split('/')[2]
      return anoItem === ano && item.status === 'pago'
    })
    
    const receitas = dadosAno.filter(item => item.tipo === 'receita')
      .reduce((sum, item) => sum + Math.abs(item.valor), 0)
    
    const despesas = dadosAno.filter(item => item.tipo === 'despesa')
      .reduce((sum, item) => sum + Math.abs(item.valor), 0)
    
    const lucro = receitas - despesas
    
    return [
      {
        imposto: 'ISS',
        aliquota: 5,
        baseCalculo: receitas,
        valor: receitas * 0.05,
        vencimento: `${ano}-01-20`
      },
      {
        imposto: 'ICMS',
        aliquota: 18,
        baseCalculo: receitas,
        valor: receitas * 0.18,
        vencimento: `${ano}-01-25`
      },
      {
        imposto: 'PIS',
        aliquota: 0.65,
        baseCalculo: receitas,
        valor: receitas * 0.0065,
        vencimento: `${ano}-01-31`
      },
      {
        imposto: 'COFINS',
        aliquota: 3,
        baseCalculo: receitas,
        valor: receitas * 0.03,
        vencimento: `${ano}-01-31`
      },
      {
        imposto: 'IRPJ',
        aliquota: 15,
        baseCalculo: lucro > 0 ? lucro : 0,
        valor: lucro > 0 ? lucro * 0.15 : 0,
        vencimento: `${ano}-02-28`
      },
      {
        imposto: 'CSLL',
        aliquota: 9,
        baseCalculo: lucro > 0 ? lucro : 0,
        valor: lucro > 0 ? lucro * 0.09 : 0,
        vencimento: `${ano}-02-28`
      }
    ]
  }

  // Calcular dados reais de previsão
  const calcularPrevisao = () => {
    if (!data || data.length === 0) return []
    
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
    const mesAtual = new Date().getMonth()
    
    return meses.map((nomeMes, index) => {
      const mesNum = ((mesAtual + index + 1) % 12) + 1
      const anoPrevisao = mesNum < mesAtual + 1 ? parseInt(ano) + 1 : parseInt(ano)
      
      // Calcular média dos últimos 3 meses para previsão
      const mesesAnteriores = [mesNum - 3, mesNum - 2, mesNum - 1].map(m => m > 0 ? m : m + 12)
      const dadosMedios = data.filter(item => {
        const anoItem = item.vencimento?.split('/')[2] || item.data?.split('/')[2]
        const mesItem = parseInt(item.vencimento?.split('/')[1] || item.data?.split('/')[1])
        return anoItem === ano && mesesAnteriores.includes(mesItem) && item.status === 'pago'
      })
      
      const receitaMedia = dadosMedios.filter(item => item.tipo === 'receita')
        .reduce((sum, item) => sum + Math.abs(item.valor), 0) / 3
      
      const custosMedios = dadosMedios.filter(item => item.tipo === 'despesa')
        .reduce((sum, item) => sum + Math.abs(item.valor), 0) / 3
      
      const lucro = receitaMedia - custosMedios
      const impostos = receitaMedia * 0.40 // 40% de carga tributária estimada
      
      return {
        mes: `${nomeMes}/${anoPrevisao}`,
        receita: receitaMedia,
        custos: custosMedios,
        lucro,
        impostos
      }
    })
  }

  const carneLeaoData = calcularCarneLeao()
  const impostosData = calcularImpostos()
  const previsaoData = calcularPrevisao()

  // Verificar se há dados para o período selecionado
  const temDadosParaPeriodo = data && data.length > 0 && anosDisponiveis.length > 0 && mesesDisponiveis.length > 0

  const reports = [
    {
      id: 'carneleao',
      name: 'Carnê Leão',
      icon: FileText,
      description: 'Relatório para declaração mensal'
    },
    {
      id: 'impostos',
      name: 'Controle de Impostos',
      icon: Calculator,
      description: 'Taxas e vencimentos'
    },
    {
      id: 'previsao',
      name: 'Previsão Fiscal',
      icon: TrendingUp,
      description: 'Simulação de impostos futuros'
    }
  ]

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exportando relatório fiscal ${activeReport} em formato ${format}`)
    // Implementar exportação
  }

  const renderReport = () => {
    switch (activeReport) {
      case 'carneleao':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Carnê Leão - Declaração Mensal</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mês
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rendimentos
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Despesas
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Base de Cálculo
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Imposto Devido
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {carneLeaoData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          {item.mes}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right text-gray-900">
                          R$ {item.rendimentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right text-gray-900">
                          R$ {item.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right text-gray-900">
                          R$ {item.baseCalculo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right font-medium text-red-600">
                          R$ {item.imposto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resumo responsivo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Rendimentos</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      R$ {carneLeaoData.reduce((sum, item) => sum + item.rendimentos, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Despesas</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      R$ {carneLeaoData.reduce((sum, item) => sum + item.despesas, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                </div>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Base de Cálculo</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      R$ {carneLeaoData.reduce((sum, item) => sum + item.baseCalculo, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Imposto</p>
                    <p className="text-lg sm:text-2xl font-bold text-red-600">
                      R$ {carneLeaoData.reduce((sum, item) => sum + item.imposto, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                </div>
              </div>
            </div>
          </div>
        )

      case 'impostos':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Controle de Impostos</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Imposto
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Alíquota (%)
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Base de Cálculo
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vencimento
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {impostosData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          {item.imposto}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right text-gray-900">
                          {item.aliquota}%
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right text-gray-900">
                          R$ {item.baseCalculo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right font-medium text-red-600">
                          R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {new Date(item.vencimento).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pendente
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alertas responsivos */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                <h3 className="text-xs sm:text-sm font-medium text-yellow-800">Alertas de Vencimento</h3>
              </div>
              <div className="mt-2 text-xs sm:text-sm text-yellow-700">
                {impostosData.slice(0, 3).map((item, index) => (
                  <p key={index}>• {item.imposto} vence em {new Date(item.vencimento).toLocaleDateString('pt-BR')} - R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                ))}
              </div>
            </div>
          </div>
        )

      case 'previsao':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Previsão Fiscal - Próximos 6 Meses</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Período
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receita
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Custos
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lucro
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Impostos Previstos
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lucro Líquido
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previsaoData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          {item.mes}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right text-green-600">
                          R$ {item.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right text-red-600">
                          R$ {item.custos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right text-blue-600">
                          R$ {item.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right text-red-600">
                          R$ {item.impostos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right font-medium text-green-600">
                          R$ {(item.lucro - item.impostos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Gráfico de Previsão responsivo */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Evolução da Carga Tributária</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-600">Carga Tributária Média</p>
                  <p className="text-lg sm:text-2xl font-bold text-red-600">40%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-600">Impostos Totais Previstos</p>
                  <p className="text-lg sm:text-2xl font-bold text-red-600">
                    R$ {previsaoData.reduce((sum, item) => sum + item.impostos, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-600">Receita Total Prevista</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">
                    R$ {previsaoData.reduce((sum, item) => sum + item.receita, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Conformidade Fiscal</h2>
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
              value={ano}
              onChange={(e) => setAno(e.target.value)}
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