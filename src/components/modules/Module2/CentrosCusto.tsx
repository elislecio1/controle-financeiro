import React, { useState } from 'react'
import { Plus, Edit, Trash2, Save, X, Building, TrendingUp, TrendingDown } from 'lucide-react'
import { CentroCusto } from '../../../types'

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

  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'custo' as 'custo' | 'lucro',
    descricao: ''
  })

  const handleSave = () => {
    if (!formData.nome.trim()) return

    if (editingCentro) {
      // Editar centro existente
      const updatedCentros = centrosCusto.map(centro =>
        centro.id === editingCentro.id
          ? { ...centro, ...formData }
          : centro
      )
      onCentroCustoChange(updatedCentros)
      setEditingCentro(null)
    } else {
      // Adicionar novo centro
      const newCentro: CentroCusto = {
        id: Date.now().toString(),
        ...formData,
        ativo: true
      }
      onCentroCustoChange([...centrosCusto, newCentro])
    }

    setFormData({ nome: '', tipo: 'custo', descricao: '' })
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    const updatedCentros = centrosCusto.filter(centro => centro.id !== id)
    onCentroCustoChange(updatedCentros)
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

  const getTipoIcon = (tipo: 'custo' | 'lucro') => {
    return tipo === 'custo' ? TrendingDown : TrendingUp
  }

  const getTipoColor = (tipo: 'custo' | 'lucro') => {
    return tipo === 'custo' ? 'text-red-600' : 'text-green-600'
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
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
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
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(centro.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Tipo: {centro.tipo === 'custo' ? 'Custo' : 'Lucro'}
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
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'custo' | 'lucro' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="custo">Custo</option>
                    <option value="lucro">Lucro</option>
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <X className="h-4 w-4 mr-2 inline" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
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
    </div>
  )
} 