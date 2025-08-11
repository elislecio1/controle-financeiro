import React, { useState } from 'react'
import { Plus, Edit, Trash2, Save, X, Tag, FolderOpen } from 'lucide-react'
import { Categoria, Subcategoria } from '../../../types'

interface CategoriasProps {
  categorias: Categoria[]
  subcategorias: Subcategoria[]
  onCategoriaChange: (categorias: Categoria[]) => void
  onSubcategoriaChange: (subcategorias: Subcategoria[]) => void
  onCategoriaSaved?: () => void
  onSubcategoriaSaved?: () => void
}

export default function Categorias({ 
  categorias, 
  subcategorias, 
  onCategoriaChange, 
  onSubcategoriaChange,
  onCategoriaSaved,
  onSubcategoriaSaved
}: CategoriasProps) {
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)
  const [editingSubcategoria, setEditingSubcategoria] = useState<Subcategoria | null>(null)
  const [showCategoriaForm, setShowCategoriaForm] = useState(false)
  const [showSubcategoriaForm, setShowSubcategoriaForm] = useState(false)
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>('')

  const [categoriaForm, setCategoriaForm] = useState({
    nome: '',
    tipo: 'despesa' as 'receita' | 'despesa' | 'ambos',
    cor: '#3B82F6'
  })

  const [subcategoriaForm, setSubcategoriaForm] = useState({
    nome: '',
    categoriaId: ''
  })

  const handleSaveCategoria = async () => {
    if (!categoriaForm.nome.trim()) return

    try {
      if (editingCategoria) {
        // Editar categoria existente
        const updatedCategorias = categorias.map(cat =>
          cat.id === editingCategoria.id
            ? { ...cat, ...categoriaForm }
            : cat
        )
        onCategoriaChange(updatedCategorias)
        setEditingCategoria(null)
      } else {
        // Adicionar nova categoria
        const newCategoria: Omit<Categoria, 'id'> = {
          ...categoriaForm,
          ativo: true
        }
        
        // Aqui você pode chamar o Supabase se necessário
        // const result = await supabaseService.saveCategoria(newCategoria)
        // if (result.success) {
        //   onCategoriaChange([...categorias, result.data!])
        // }
        
        // Por enquanto, usando o estado local
        const tempCategoria: Categoria = {
          id: Date.now().toString(),
          ...newCategoria
        }
        onCategoriaChange([...categorias, tempCategoria])
      }

      setCategoriaForm({ nome: '', tipo: 'despesa', cor: '#3B82F6' })
      setShowCategoriaForm(false)
      
      // Notificar que uma categoria foi salva
      if (onCategoriaSaved) {
        onCategoriaSaved()
      }
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
    }
  }

  const handleSaveSubcategoria = () => {
    if (!subcategoriaForm.nome.trim() || !subcategoriaForm.categoriaId) return

    if (editingSubcategoria) {
      // Editar subcategoria existente
      const updatedSubcategorias = subcategorias.map(sub =>
        sub.id === editingSubcategoria.id
          ? { ...sub, ...subcategoriaForm }
          : sub
      )
      onSubcategoriaChange(updatedSubcategorias)
      setEditingSubcategoria(null)
    } else {
      // Adicionar nova subcategoria
      const newSubcategoria: Subcategoria = {
        id: Date.now().toString(),
        ...subcategoriaForm,
        ativo: true
      }
      onSubcategoriaChange([...subcategorias, newSubcategoria])
    }

    setSubcategoriaForm({ nome: '', categoriaId: '' })
    setShowSubcategoriaForm(false)
  }

  const handleDeleteCategoria = (id: string) => {
    const updatedCategorias = categorias.filter(cat => cat.id !== id)
    onCategoriaChange(updatedCategorias)
    
    // Remove subcategorias relacionadas
    const updatedSubcategorias = subcategorias.filter(sub => sub.categoriaId !== id)
    onSubcategoriaChange(updatedSubcategorias)
  }

  const handleDeleteSubcategoria = (id: string) => {
    const updatedSubcategorias = subcategorias.filter(sub => sub.id !== id)
    onSubcategoriaChange(updatedSubcategorias)
  }

  const handleEditCategoria = (categoria: Categoria) => {
    setEditingCategoria(categoria)
    setCategoriaForm({
      nome: categoria.nome,
      tipo: categoria.tipo,
      cor: categoria.cor
    })
    setShowCategoriaForm(true)
  }

  const handleEditSubcategoria = (subcategoria: Subcategoria) => {
    setEditingSubcategoria(subcategoria)
    setSubcategoriaForm({
      nome: subcategoria.nome,
      categoriaId: subcategoria.categoriaId
    })
    setShowSubcategoriaForm(true)
  }

  const getSubcategoriasByCategoria = (categoriaId: string) => {
    return subcategorias.filter(sub => sub.categoriaId === categoriaId)
  }

  return (
    <div className="space-y-6">
      {/* Categorias */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              Categorias
            </h3>
            <button
              onClick={() => setShowCategoriaForm(true)}
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </button>
          </div>

          {/* Lista de Categorias */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorias.map((categoria) => (
              <div
                key={categoria.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: categoria.cor }}
                    />
                    <span className="font-medium text-gray-900">{categoria.nome}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditCategoria(categoria)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategoria(categoria.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Tipo: {categoria.tipo === 'receita' ? 'Receita' : categoria.tipo === 'despesa' ? 'Despesa' : 'Ambos'}
                </div>
                <div className="text-sm text-gray-500">
                  Subcategorias: {getSubcategoriasByCategoria(categoria.id).length}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subcategorias */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FolderOpen className="h-5 w-5 mr-2" />
              Subcategorias
            </h3>
            <button
              onClick={() => setShowSubcategoriaForm(true)}
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Subcategoria
            </button>
          </div>

          {/* Lista de Subcategorias */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subcategorias.map((subcategoria) => {
              const categoria = categorias.find(cat => cat.id === subcategoria.categoriaId)
              return (
                <div
                  key={subcategoria.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium text-gray-900">{subcategoria.nome}</span>
                      {categoria && (
                        <div className="text-sm text-gray-500">
                          Categoria: {categoria.nome}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditSubcategoria(subcategoria)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubcategoria(subcategoria.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal Categoria */}
      {showCategoriaForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Categoria
                  </label>
                  <input
                    type="text"
                    value={categoriaForm.nome}
                    onChange={(e) => setCategoriaForm({ ...categoriaForm, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Alimentação"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={categoriaForm.tipo}
                    onChange={(e) => setCategoriaForm({ ...categoriaForm, tipo: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="despesa">Despesa</option>
                    <option value="receita">Receita</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cor
                  </label>
                  <input
                    type="color"
                    value={categoriaForm.cor}
                    onChange={(e) => setCategoriaForm({ ...categoriaForm, cor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCategoriaForm(false)
                    setEditingCategoria(null)
                    setCategoriaForm({ nome: '', tipo: 'despesa', cor: '#3B82F6' })
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <X className="h-4 w-4 mr-2 inline" />
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCategoria}
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

      {/* Modal Subcategoria */}
      {showSubcategoriaForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingSubcategoria ? 'Editar Subcategoria' : 'Nova Subcategoria'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Subcategoria
                  </label>
                  <input
                    type="text"
                    value={subcategoriaForm.nome}
                    onChange={(e) => setSubcategoriaForm({ ...subcategoriaForm, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Restaurantes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={subcategoriaForm.categoriaId}
                    onChange={(e) => setSubcategoriaForm({ ...subcategoriaForm, categoriaId: e.target.value })}
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
                    setShowSubcategoriaForm(false)
                    setEditingSubcategoria(null)
                    setSubcategoriaForm({ nome: '', categoriaId: '' })
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <X className="h-4 w-4 mr-2 inline" />
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSubcategoria}
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