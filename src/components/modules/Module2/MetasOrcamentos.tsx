import React, { useState } from 'react'
import { Plus, Edit, Trash2, Save, X, Target, Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Meta, Orcamento, Categoria } from '../../../types'
import { formatarMoeda } from '../../../utils/formatters'

interface MetasOrcamentosProps {
  metas: Meta[]
  orcamentos: Orcamento[]
  categorias: Categoria[]
  onMetaChange: (metas: Meta[]) => void
  onOrcamentoChange: (orcamentos: Orcamento[]) => void
}

export default function MetasOrcamentos({ 
  metas, 
  orcamentos, 
  categorias,
  onMetaChange, 
  onOrcamentoChange 
}: MetasOrcamentosProps) {
  const [activeTab, setActiveTab] = useState<'metas' | 'orcamentos'>('metas')
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null)
  const [editingOrcamento, setEditingOrcamento] = useState<Orcamento | null>(null)
  const [showMetaForm, setShowMetaForm] = useState(false)
  const [showOrcamentoForm, setShowOrcamentoForm] = useState(false)

  const [metaForm, setMetaForm] = useState({
    nome: '',
    tipo: 'despesa' as 'receita' | 'despesa' | 'investimento',
    valorMeta: 0,
    dataInicio: '',
    dataFim: '',
    categoriaId: ''
  })

  const [orcamentoForm, setOrcamentoForm] = useState({
    mes: '',
    categoriaId: '',
    valorPrevisto: 0
  })

  const handleSaveMeta = () => {
    if (!metaForm.nome.trim() || !metaForm.valorMeta || !metaForm.dataInicio || !metaForm.dataFim) return

    if (editingMeta) {
      // Editar meta existente
      const updatedMetas = metas.map(meta =>
        meta.id === editingMeta.id
          ? { ...meta, ...metaForm }
          : meta
      )
      onMetaChange(updatedMetas)
      setEditingMeta(null)
    } else {
      // Adicionar nova meta
      const newMeta: Meta = {
        id: Date.now().toString(),
        ...metaForm,
        valorAtual: 0,
        ativo: true
      }
      onMetaChange([...metas, newMeta])
    }

    setMetaForm({ nome: '', tipo: 'despesa', valorMeta: 0, dataInicio: '', dataFim: '', categoriaId: '' })
    setShowMetaForm(false)
  }

  const handleSaveOrcamento = () => {
    if (!orcamentoForm.mes || !orcamentoForm.categoriaId || !orcamentoForm.valorPrevisto) return

    if (editingOrcamento) {
      // Editar orçamento existente
      const updatedOrcamentos = orcamentos.map(orc =>
        orc.id === editingOrcamento.id
          ? { ...orc, ...orcamentoForm }
          : orc
      )
      onOrcamentoChange(updatedOrcamentos)
      setEditingOrcamento(null)
    } else {
      // Adicionar novo orçamento
      const newOrcamento: Orcamento = {
        id: Date.now().toString(),
        ...orcamentoForm,
        valorRealizado: 0,
        ativo: true
      }
      onOrcamentoChange([...orcamentos, newOrcamento])
    }

    setOrcamentoForm({ mes: '', categoriaId: '', valorPrevisto: 0 })
    setShowOrcamentoForm(false)
  }

  const handleDeleteMeta = (id: string) => {
    const updatedMetas = metas.filter(meta => meta.id !== id)
    onMetaChange(updatedMetas)
  }

  const handleDeleteOrcamento = (id: string) => {
    const updatedOrcamentos = orcamentos.filter(orc => orc.id !== id)
    onOrcamentoChange(updatedOrcamentos)
  }

  const handleEditMeta = (meta: Meta) => {
    setEditingMeta(meta)
    setMetaForm({
      nome: meta.nome,
      tipo: meta.tipo,
      valorMeta: meta.valorMeta,
      dataInicio: meta.dataInicio,
      dataFim: meta.dataFim,
      categoriaId: meta.categoriaId || ''
    })
    setShowMetaForm(true)
  }

  const handleEditOrcamento = (orcamento: Orcamento) => {
    setEditingOrcamento(orcamento)
    setOrcamentoForm({
      mes: orcamento.mes,
      categoriaId: orcamento.categoriaId,
      valorPrevisto: orcamento.valorPrevisto
    })
    setShowOrcamentoForm(true)
  }

  const getProgressPercentage = (meta: Meta) => {
    return Math.min((meta.valorAtual / meta.valorMeta) * 100, 100)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  const getOrcamentoProgress = (orcamento: Orcamento) => {
    return Math.min((orcamento.valorRealizado / orcamento.valorPrevisto) * 100, 100)
  }

  const getOrcamentoColor = (percentage: number) => {
    if (percentage > 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('metas')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'metas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Target className="h-4 w-4 mr-2 inline" />
              Metas
            </button>
            <button
              onClick={() => setActiveTab('orcamentos')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orcamentos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="h-4 w-4 mr-2 inline" />
              Orçamentos
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'metas' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Metas Financeiras</h3>
                <button
                  onClick={() => setShowMetaForm(true)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Meta
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metas.map((meta) => {
                  const progress = getProgressPercentage(meta)
                  const categoria = categorias.find(cat => cat.id === meta.categoriaId)
                  return (
                    <div key={meta.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {meta.tipo === 'receita' ? (
                            <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
                          )}
                          <span className="font-medium text-gray-900">{meta.nome}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditMeta(meta)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMeta(meta.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500 mb-2">
                        Meta: {formatarMoeda(meta.valorMeta)}
                      </div>
                      <div className="text-sm text-gray-500 mb-2">
                        Atual: {formatarMoeda(meta.valorAtual)}
                      </div>
                      
                      {categoria && (
                        <div className="text-sm text-gray-500 mb-2">
                          Categoria: {categoria.nome}
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-500 mb-3">
                        {meta.dataInicio} a {meta.dataFim}
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(progress)}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        {progress.toFixed(1)}% concluído
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'orcamentos' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Orçamentos Mensais</h3>
                <button
                  onClick={() => setShowOrcamentoForm(true)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Orçamento
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orcamentos.map((orcamento) => {
                  const progress = getOrcamentoProgress(orcamento)
                  const categoria = categorias.find(cat => cat.id === orcamento.categoriaId)
                  return (
                    <div key={orcamento.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="font-medium text-gray-900">
                            {orcamento.mes}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditOrcamento(orcamento)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrcamento(orcamento.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {categoria && (
                        <div className="text-sm text-gray-500 mb-2">
                          Categoria: {categoria.nome}
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-500 mb-2">
                        Previsto: {formatarMoeda(orcamento.valorPrevisto)}
                      </div>
                      <div className="text-sm text-gray-500 mb-2">
                        Realizado: {formatarMoeda(orcamento.valorRealizado)}
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full ${getOrcamentoColor(progress)}`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        {progress.toFixed(1)}% do orçamento
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Meta */}
      {showMetaForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingMeta ? 'Editar Meta' : 'Nova Meta'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Meta
                  </label>
                  <input
                    type="text"
                    value={metaForm.nome}
                    onChange={(e) => setMetaForm({ ...metaForm, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Economizar para viagem"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={metaForm.tipo}
                    onChange={(e) => setMetaForm({ ...metaForm, tipo: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="despesa">Reduzir Despesa</option>
                    <option value="receita">Aumentar Receita</option>
                    <option value="investimento">Investimento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor da Meta
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={metaForm.valorMeta}
                    onChange={(e) => setMetaForm({ ...metaForm, valorMeta: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0,00"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Início
                    </label>
                    <input
                      type="date"
                      value={metaForm.dataInicio}
                      onChange={(e) => setMetaForm({ ...metaForm, dataInicio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Fim
                    </label>
                    <input
                      type="date"
                      value={metaForm.dataFim}
                      onChange={(e) => setMetaForm({ ...metaForm, dataFim: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria (Opcional)
                  </label>
                  <select
                    value={metaForm.categoriaId}
                    onChange={(e) => setMetaForm({ ...metaForm, categoriaId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowMetaForm(false)
                    setEditingMeta(null)
                    setMetaForm({ nome: '', tipo: 'despesa', valorMeta: 0, dataInicio: '', dataFim: '', categoriaId: '' })
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <X className="h-4 w-4 mr-2 inline" />
                  Cancelar
                </button>
                <button
                  onClick={handleSaveMeta}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2 inline" />
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Orçamento */}
      {showOrcamentoForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingOrcamento ? 'Editar Orçamento' : 'Novo Orçamento'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mês/Ano
                  </label>
                  <input
                    type="month"
                    value={orcamentoForm.mes}
                    onChange={(e) => setOrcamentoForm({ ...orcamentoForm, mes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={orcamentoForm.categoriaId}
                    onChange={(e) => setOrcamentoForm({ ...orcamentoForm, categoriaId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Previsto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={orcamentoForm.valorPrevisto}
                    onChange={(e) => setOrcamentoForm({ ...orcamentoForm, valorPrevisto: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowOrcamentoForm(false)
                    setEditingOrcamento(null)
                    setOrcamentoForm({ mes: '', categoriaId: '', valorPrevisto: 0 })
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <X className="h-4 w-4 mr-2 inline" />
                  Cancelar
                </button>
                <button
                  onClick={handleSaveOrcamento}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2 inline" />
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 