import React, { useState } from 'react'
import { BarChart3, FileText, Calculator, TrendingUp, Settings } from 'lucide-react'
import RelatoriosGerenciais from './RelatoriosGerenciais'
import ConformidadeFiscal from './ConformidadeFiscal'

interface Module4Props {
  data: any[]
  categorias: any[]
  centrosCusto: any[]
}

export default function Module4({ data, categorias, centrosCusto }: Module4Props) {
  const [activeSection, setActiveSection] = useState<'gerenciais' | 'fiscal'>('gerenciais')

  const sections = [
    {
      id: 'gerenciais',
      name: 'Relatórios Gerenciais',
      icon: BarChart3,
      description: 'DRE, balanço patrimonial, fluxo de caixa e análises'
    },
    {
      id: 'fiscal',
      name: 'Conformidade Fiscal',
      icon: FileText,
      description: 'Carnê Leão, controle de impostos e previsão fiscal'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Relatórios e Análises</h2>
          <p className="text-gray-600 mt-2">
            Transformando dados em informações estratégicas para tomada de decisões
          </p>
        </div>
        <Settings className="h-8 w-8 text-blue-600" />
      </div>

      {/* Navegação */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as 'gerenciais' | 'fiscal')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeSection === section.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {section.name}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="bg-gray-50 rounded-lg p-6">
        {activeSection === 'gerenciais' && (
          <RelatoriosGerenciais
            data={data}
            categorias={categorias}
            centrosCusto={centrosCusto}
          />
        )}
        
        {activeSection === 'fiscal' && (
          <ConformidadeFiscal
            data={data}
          />
        )}
      </div>
    </div>
  )
} 