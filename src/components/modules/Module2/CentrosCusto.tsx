import React, { useState } from 'react'
import { Plus, Edit, Trash2, Save, X, Building, TrendingUp, TrendingDown } from 'lucide-react'
import { CentroCusto } from '../../../types'
import { supabaseService } from '../../../services/supabase'

interface CentrosCustoProps {
  centrosCusto: CentroCusto[]
  onCentroCustoChange: (centrosCusto: CentroCusto[]) => void
}

export default function CentrosCusto({ 
  centrosCusto, 
  onCentroCustoChange 
}: CentrosCustoProps) {
  const [editingCentro, setEditingCentro] = useState<CentroCusto | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'custo' as 'custo' | 'lucro' | 'ambos',
    descricao: ''
  })

  const handleSave = async () => {
    if (!formData.nome.trim()) return

    setLoading(true)
    try {
      if (editingCentro) {
        // Editar centro existente
        const result = await supabaseService.updateCentroCusto(editingCentro.id, formData)
        if (result.success) {
          // Atualizar o estado local em vez de recarregar do banco
          const updatedCentros = centrosCusto.map(centro => 
            centro.id === editingCentro.id 
              ? { ...centro, ...formData }
              : centro
          )
          onCentroCustoChange(updatedCentros)
          setEditingCentro(null)
          setFormData({ nome: '', tipo: 'custo', descricao: '' })
          setShowForm(false)
          alert('Centro de custo atualizado com sucesso!')
        } else {
          alert(`Erro ao atualizar: ${result.message}`)
        }
      } else {
        // Adicionar novo centro
        const result = await supabaseService.saveCentroCusto({
          ...formData,
          ativo: true
        })
        if (result.success && result.data) {
          // Adicionar o novo centro ao estado local
          const newCentro: CentroCusto = {
            id: result.data.id,
            nome: formData.nome,
            tipo: formData.tipo,
            descricao: formData.descricao,
            ativo: true
          }
          onCentroCustoChange([...centrosCusto, newCentro])
          setFormData({ nome: '', tipo: 'custo', descricao: '' })
          setShowForm(false)
          alert('Centro de custo salvo com sucesso!')
        } else {
          alert(`Erro ao salvar: ${result.message}`)
        }
      }
    } catch (error) {
      console.error('Erro ao salvar centro de custo:', error)
      alert('Erro ao salvar centro de custo. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este centro de custo?')) {
      return
    }

    setLoading(true)
    try {
      const result = await supabaseService.deleteCentroCusto(id)
      if (result.success) {
        // Remover do estado local em vez de recarregar do banco
        const updatedCentros = centrosCusto.filter(centro => centro.id !== id)
        onCentroCustoChange(updatedCentros)
        alert('Centro de custo excluído com sucesso!')
      } else {
        alert(`Erro ao excluir: ${result.message}`)
      }
    } catch (error) {
      console.error('Erro ao excluir centro de custo:', error)
      alert('Erro ao excluir centro de custo. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (centro: CentroCusto) => {
    setEditingCentro(centro)
    setFormData({
      nome: centro.nome,
      tipo: centro.tipo,
      descricao: centro.descricao || ''
    })
    setShowForm(true)
  }

  const getTipoIcon = (tipo: 'custo' | 'lucro' | 'ambos') => {
    if (tipo === 'custo') return TrendingDown
    if (tipo === 'lucro') return TrendingUp
    return Building // Ícone para "ambos"
  }

  const getTipoColor = (tipo: 'custo' | 'lucro' | 'ambos') => {
    if (tipo === 'custo') return 'text-red-600'
    if (tipo === 'lucro') return 'text-green-600'
    return 'text-purple-600' // Cor para "ambos"
  }

  const getTipoLabel = (tipo: 'custo' | 'lucro' | 'ambos') => {
    if (tipo === 'custo') return 'Custo'
    if (tipo === 'lucro') return 'Lucro'
    return 'Custo e Lucro'
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Centros de Custo e Lucro
            </h3>
            <button
              onClick={() => setShowForm(true)}
              disabled={loading}
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Centro
            </button>
          </div>

          {/* Lista de Centros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {centrosCusto.map((centro) => {
              const TipoIcon = getTipoIcon(centro.tipo)
              return (
                <div
                  key={centro.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <TipoIcon className={`h-4 w-4 mr-2 ${getTipoColor(centro.tipo)}`} />
                      <span className="font-medium text-gray-900">{centro.nome}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(centro)}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(centro.id)}
                        disabled={loading}
                        className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Tipo: {getTipoLabel(centro.tipo)}
                  </div>
                  {centro.descricao && (
                    <div className="text-sm text-gray-500 mt-1">
                      {centro.descricao}
                    </div>
                  )}
                  <div className="text-sm text-gray-500 mt-1">
                    Status: {centro.ativo ? 'Ativo' : 'Inativo'}
                  </div>
                </div>
              )
            })}
          </div>

          {centrosCusto.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum centro de custo/lucro cadastrado</p>
              <p className="text-sm">Clique em "Novo Centro" para começar</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCentro ? 'Editar Centro' : 'Novo Centro'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Centro
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Departamento de Vendas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'custo' | 'lucro' | 'ambos' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="custo">Custo</option>
                    <option value="lucro">Lucro</option>
                    <option value="ambos">Ambos (Custo e Lucro)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição (Opcional)
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descrição detalhada do centro..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowForm(false)
                    setEditingCentro(null)
                    setFormData({ nome: '', tipo: 'custo', descricao: '' })
                  }}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  <X className="h-4 w-4 mr-2 inline" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2 inline" />
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 