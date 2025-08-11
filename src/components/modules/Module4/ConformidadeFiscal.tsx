import React, { useState } from 'react'
import { FileText, Calculator, Download, AlertTriangle, TrendingUp, DollarSign, Calendar, Filter } from 'lucide-react'

interface ConformidadeFiscalProps {
  data: any[]
}

export default function ConformidadeFiscal({ data }: ConformidadeFiscalProps) {
  const [activeReport, setActiveReport] = useState<'carneleao' | 'impostos' | 'previsao'>('carneleao')
  const [ano, setAno] = useState('2024')
  const [mes, setMes] = useState('12')

  // Dados mock para demonstração
  const carneLeaoData = [
    { mes: 'Janeiro', rendimentos: 8000, despesas: 2000, baseCalculo: 6000, imposto: 1200 },
    { mes: 'Fevereiro', rendimentos: 8500, despesas: 2200, baseCalculo: 6300, imposto: 1260 },
    { mes: 'Março', rendimentos: 9000, despesas: 2400, baseCalculo: 6600, imposto: 1320 },
    { mes: 'Abril', rendimentos: 8200, despesas: 2100, baseCalculo: 6100, imposto: 1220 },
    { mes: 'Maio', rendimentos: 8800, despesas: 2300, baseCalculo: 6500, imposto: 1300 },
    { mes: 'Junho', rendimentos: 9200, despesas: 2500, baseCalculo: 6700, imposto: 1340 },
    { mes: 'Julho', rendimentos: 8500, despesas: 2200, baseCalculo: 6300, imposto: 1260 },
    { mes: 'Agosto', rendimentos: 8900, despesas: 2400, baseCalculo: 6500, imposto: 1300 },
    { mes: 'Setembro', rendimentos: 9300, despesas: 2600, baseCalculo: 6700, imposto: 1340 },
    { mes: 'Outubro', rendimentos: 8600, despesas: 2300, baseCalculo: 6300, imposto: 1260 },
    { mes: 'Novembro', rendimentos: 9000, despesas: 2500, baseCalculo: 6500, imposto: 1300 },
    { mes: 'Dezembro', rendimentos: 9400, despesas: 2700, baseCalculo: 6700, imposto: 1340 }
  ]

  const impostosData = [
    { imposto: 'ISS', aliquota: 5, baseCalculo: 50000, valor: 2500, vencimento: '2024-01-20' },
    { imposto: 'ICMS', aliquota: 18, baseCalculo: 30000, valor: 5400, vencimento: '2024-01-25' },
    { imposto: 'PIS', aliquota: 0.65, baseCalculo: 50000, valor: 325, vencimento: '2024-01-31' },
    { imposto: 'COFINS', aliquota: 3, baseCalculo: 50000, valor: 1500, vencimento: '2024-01-31' },
    { imposto: 'IRPJ', aliquota: 15, baseCalculo: 20000, valor: 3000, vencimento: '2024-02-28' },
    { imposto: 'CSLL', aliquota: 9, baseCalculo: 20000, valor: 1800, vencimento: '2024-02-28' }
  ]

  const previsaoData = [
    { mes: 'Jan/2024', receita: 50000, custos: 30000, lucro: 20000, impostos: 8000 },
    { mes: 'Fev/2024', receita: 52000, custos: 31000, lucro: 21000, impostos: 8400 },
    { mes: 'Mar/2024', receita: 54000, custos: 32000, lucro: 22000, impostos: 8800 },
    { mes: 'Abr/2024', receita: 56000, custos: 33000, lucro: 23000, impostos: 9200 },
    { mes: 'Mai/2024', receita: 58000, custos: 34000, lucro: 24000, impostos: 9600 },
    { mes: 'Jun/2024', receita: 60000, custos: 35000, lucro: 25000, impostos: 10000 }
  ]

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
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Carnê Leão - Declaração Mensal</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mês
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rendimentos
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Despesas
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Base de Cálculo
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Imposto Devido
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {carneLeaoData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.mes}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          R$ {item.rendimentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          R$ {item.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          R$ {item.baseCalculo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                          R$ {item.imposto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Rendimentos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      R$ {carneLeaoData.reduce((sum, item) => sum + item.rendimentos, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Despesas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      R$ {carneLeaoData.reduce((sum, item) => sum + item.despesas, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-red-500" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Base de Cálculo</p>
                    <p className="text-2xl font-bold text-gray-900">
                      R$ {carneLeaoData.reduce((sum, item) => sum + item.baseCalculo, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Calculator className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Imposto</p>
                    <p className="text-2xl font-bold text-red-600">
                      R$ {carneLeaoData.reduce((sum, item) => sum + item.imposto, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </div>
            </div>
          </div>
        )

      case 'impostos':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Controle de Impostos</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Imposto
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Alíquota (%)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Base de Cálculo
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vencimento
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {impostosData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.imposto}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {item.aliquota}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          R$ {item.baseCalculo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                          R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(item.vencimento).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
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

            {/* Alertas */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <h3 className="text-sm font-medium text-yellow-800">Alertas de Vencimento</h3>
              </div>
              <div className="mt-2 text-sm text-yellow-700">
                <p>• ISS vence em 20/01/2024 - R$ 2.500,00</p>
                <p>• ICMS vence em 25/01/2024 - R$ 5.400,00</p>
                <p>• PIS/COFINS vencem em 31/01/2024 - R$ 1.825,00</p>
              </div>
            </div>
          </div>
        )

      case 'previsao':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Previsão Fiscal - Próximos 6 Meses</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Período
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receita
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Custos
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lucro
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Impostos Previstos
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lucro Líquido
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previsaoData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.mes}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                          R$ {item.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                          R$ {item.custos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">
                          R$ {item.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                          R$ {item.impostos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                          R$ {(item.lucro - item.impostos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Gráfico de Previsão */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Evolução da Carga Tributária</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Carga Tributária Média</p>
                  <p className="text-2xl font-bold text-red-600">40%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Impostos Totais Previstos</p>
                  <p className="text-2xl font-bold text-red-600">
                    R$ {previsaoData.reduce((sum, item) => sum + item.impostos, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Receita Total Prevista</p>
                  <p className="text-2xl font-bold text-green-600">
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Conformidade Fiscal</h2>
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
              value={ano}
              onChange={(e) => setAno(e.target.value)}
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