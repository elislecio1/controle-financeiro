import React, { useState } from 'react'
import { Tag, Building, Target, Users, CreditCard } from 'lucide-react'
import Categorias from './Categorias'
import CentrosCusto from './CentrosCusto'
import MetasOrcamentos from './MetasOrcamentos'
import ContasBancarias from './ContasBancarias'
import CartoesCredito from './CartoesCredito'
import Contatos from './Contatos'
import { Categoria, Subcategoria, CentroCusto, Meta, Orcamento, ContaBancaria, CartaoCredito } from '../../../types'

interface Module2Props {
  categorias: Categoria[]
  subcategorias: Subcategoria[]
  centrosCusto: CentroCusto[]
  metas: Meta[]
  orcamentos: Orcamento[]
  contas: ContaBancaria[]
  cartoes: CartaoCredito[]
  onCategoriaChange: (categorias: Categoria[]) => void
  onSubcategoriaChange: (subcategorias: Subcategoria[]) => void
  onCentroCustoChange: (centrosCusto: CentroCusto[]) => void
  onMetaChange: (metas: Meta[]) => void
  onOrcamentoChange: (orcamentos: Orcamento[]) => void
  onContaChange: (contas: ContaBancaria[]) => void
  onCartaoChange: (cartoes: CartaoCredito[]) => void
  onCategoriaSaved?: () => void
  onSubcategoriaSaved?: () => void
}

export default function Module2({
  categorias,
  subcategorias,
  centrosCusto,
  metas,
  orcamentos,
  contas,
  cartoes,
  onCategoriaChange,
  onSubcategoriaChange,
  onCentroCustoChange,
  onMetaChange,
  onOrcamentoChange,
  onContaChange,
  onCartaoChange,
  onCategoriaSaved,
  onSubcategoriaSaved
}: Module2Props) {
  const [activeSection, setActiveSection] = useState<'categorias' | 'centros' | 'metas' | 'contas' | 'cartoes' | 'contatos'>('categorias')

  const sections = [
    {
      id: 'categorias',
      name: 'Categorização',
      icon: Tag,
      description: 'Gerencie categorias e subcategorias para organizar suas transações'
    },
    {
      id: 'centros',
      name: 'Centros de Custo',
      icon: Building,
      description: 'Configure centros de custo e lucro para análises detalhadas'
    },
    {
      id: 'metas',
      name: 'Metas e Orçamentos',
      icon: Target,
      description: 'Defina metas financeiras e orçamentos mensais'
    },
    {
      id: 'contas',
      name: 'Contas Bancárias',
      icon: CreditCard,
      description: 'Gerencie suas contas bancárias e investimentos'
    },
    {
      id: 'cartoes',
      name: 'Cartões de Crédito',
      icon: CreditCard,
      description: 'Gerencie seus cartões de crédito e limites'
    },
    {
      id: 'contatos',
      name: 'Contatos',
      icon: Users,
      description: 'Gerencie clientes e fornecedores'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header do Módulo */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Tag className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">Organização e Planejamento</h2>
              <p className="text-sm text-gray-500">
                Organize suas finanças com categorização, centros de custo, metas e orçamentos
              </p>
            </div>
          </div>

          {/* Navegação entre seções */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeSection === section.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {section.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Conteúdo das seções */}
      {activeSection === 'categorias' && (
        <Categorias
          categorias={categorias}
          subcategorias={subcategorias}
          onCategoriaChange={onCategoriaChange}
          onSubcategoriaChange={onSubcategoriaChange}
          onCategoriaSaved={onCategoriaSaved}
          onSubcategoriaSaved={onSubcategoriaSaved}
        />
      )}

      {activeSection === 'centros' && (
        <CentrosCusto
          centrosCusto={centrosCusto}
          onCentroCustoChange={onCentroCustoChange}
        />
      )}

      {activeSection === 'metas' && (
        <MetasOrcamentos
          metas={metas}
          orcamentos={orcamentos}
          categorias={categorias}
          onMetaChange={onMetaChange}
          onOrcamentoChange={onOrcamentoChange}
        />
      )}

      {activeSection === 'contas' && (
        <ContasBancarias
          contas={contas}
          onContaChange={onContaChange}
        />
      )}

      {activeSection === 'cartoes' && (
        <CartoesCredito
          cartoes={cartoes}
          contas={contas}
          onCartaoChange={onCartaoChange}
        />
      )}

      {activeSection === 'contatos' && (
        <Contatos />
      )}

      {/* Resumo do Módulo */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Resumo do Módulo 2</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Tag className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900">Categorias</h4>
              <p className="text-sm text-gray-500 mt-1">
                {categorias.length} categorias cadastradas
              </p>
              <p className="text-sm text-gray-500">
                {subcategorias.length} subcategorias
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Building className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900">Centros de Custo</h4>
              <p className="text-sm text-gray-500 mt-1">
                {centrosCusto.length} centros configurados
              </p>
              <p className="text-sm text-gray-500">
                {centrosCusto.filter(c => c.tipo === 'custo').length} custos, {centrosCusto.filter(c => c.tipo === 'lucro').length} lucros
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900">Metas e Orçamentos</h4>
              <p className="text-sm text-gray-500 mt-1">
                {metas.length} metas ativas
              </p>
              <p className="text-sm text-gray-500">
                {orcamentos.length} orçamentos mensais
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900">Contas Bancárias</h4>
              <p className="text-sm text-gray-500 mt-1">
                {contas.length} contas cadastradas
              </p>
              <p className="text-sm text-gray-500">
                {contas.filter(c => c.ativo).length} ativas
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900">Cartões de Crédito</h4>
              <p className="text-sm text-gray-500 mt-1">
                {cartoes.length} cartões cadastrados
              </p>
              <p className="text-sm text-gray-500">
                {cartoes.filter(c => c.ativo).length} ativos
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 