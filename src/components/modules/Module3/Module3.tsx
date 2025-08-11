import React, { useState } from 'react'
import { TrendingUp, Building, Settings } from 'lucide-react'
import { Investimento } from '../../../types'
import Investimentos from './Investimentos'
import Negocios from './Negocios'

interface Module3Props {
  investimentos: Investimento[]
  onInvestimentoChange: (investimentos: Investimento[]) => void
}

export default function Module3({ investimentos, onInvestimentoChange }: Module3Props) {
  const [activeSection, setActiveSection] = useState<'investimentos' | 'negocios'>('investimentos')
  const [regimeContabil, setRegimeContabil] = useState<'caixa' | 'competencia'>('caixa')

  const sections = [
    {
      id: 'investimentos',
      name: 'Gestão de Investimentos',
      icon: TrendingUp,
      description: 'Controle e análise de carteira de investimentos'
    },
    {
      id: 'negocios',
      name: 'Funcionalidades para Negócios',
      icon: Building,
      description: 'Recursos avançados para empresas'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Módulo 3: Recursos Avançados</h1>
          <p className="text-gray-600 mt-2">
            Funcionalidades sofisticadas para negócios e investidores
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
                  onClick={() => setActiveSection(section.id as 'investimentos' | 'negocios')}
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
        {activeSection === 'investimentos' && (
          <Investimentos
            investimentos={investimentos}
            onInvestimentoChange={onInvestimentoChange}
          />
        )}
        
        {activeSection === 'negocios' && (
          <Negocios
            regimeContabil={regimeContabil}
            onRegimeChange={setRegimeContabil}
          />
        )}
      </div>
    </div>
  )
} 