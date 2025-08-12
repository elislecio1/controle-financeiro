import React, { useState } from 'react'
import { Plus, Edit, Trash2, Save, X, Tag, FolderOpen } from 'lucide-react'
import { Categoria, Subcategoria } from '../../../types'
import { supabaseService } from '../../../services/supabase'

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
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
    if (!categoriaForm.nome.trim()) {
      setMessage({ type: 'error', text: 'Nome da categoria é obrigatório' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      if (editingCategoria) {
        // Editar categoria existente
        const result = await supabaseService.updateCategoria(editingCategoria.id, categoriaForm)
        
        if (result.success) {
          const updatedCategorias = categorias.map(cat =>
            cat.id === editingCategoria.id
              ? { ...cat, ...categoriaForm }
              : cat
          )
          onCategoriaChange(updatedCategorias)
          setEditingCategoria(null)
          setMessage({ type: 'success', text: 'Categoria atualizada com sucesso!' })
        } else {
          setMessage({ type: 'error', text: result.message })
        }
      } else {
        // Adicionar nova categoria
        const newCategoria: Omit<Categoria, 'id'> = {
          ...categoriaForm,
          ativo: true
        }
        
        const result = await supabaseService.saveCategoria(newCategoria)
        
        if (result.success && result.data) {
          onCategoriaChange([...categorias, result.data])
          setMessage({ type: 'success', text: 'Categoria salva com sucesso!' })
        } else {
          setMessage({ type: 'error', text: result.message })
        }
      }

      setCategoriaForm({ nome: '', tipo: 'despesa', cor: '#3B82F6' })
      setShowCategoriaForm(false)
      
      // Notificar que uma categoria foi salva
      if (onCategoriaSaved) {
        onCategoriaSaved()
      }
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error)
      setMessage({ type: 'error', text: 'Erro ao salvar categoria. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSubcategoria = async () => {
    if (!subcategoriaForm.nome.trim() || !subcategoriaForm.categoriaId) {
      setMessage({ type: 'error', text: 'Nome e categoria são obrigatórios' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      if (editingSubcategoria) {
        // Editar subcategoria existente
        const result = await supabaseService.updateSubcategoria(editingSubcategoria.id, {
          nome: subcategoriaForm.nome,
          categoriaId: subcategoriaForm.categoriaId
        })
        
        if (result.success) {
          const updatedSubcategorias = subcategorias.map(sub =>
            sub.id === editingSubcategoria.id
              ? { ...sub, nome: subcategoriaForm.nome, categoriaId: subcategoriaForm.categoriaId }
              : sub
          )
          onSubcategoriaChange(updatedSubcategorias)
          setEditingSubcategoria(null)
          setMessage({ type: 'success', text: 'Subcategoria atualizada com sucesso!' })
        } else {
          setMessage({ type: 'error', text: result.message })
        }
      } else {
        // Adicionar nova subcategoria
        const newSubcategoria: Omit<Subcategoria, 'id'> = {
          nome: subcategoriaForm.nome,
          categoriaId: subcategoriaForm.categoriaId,
          ativo: true
        }
        
        const result = await supabaseService.saveSubcategoria(newSubcategoria)
        
        if (result.success && result.data) {
          onSubcategoriaChange([...subcategorias, result.data])
          setMessage({ type: 'success', text: 'Subcategoria salva com sucesso!' })
        } else {
          setMessage({ type: 'error', text: result.message })
        }
      }

      setSubcategoriaForm({ nome: '', categoriaId: '' })
      setShowSubcategoriaForm(false)
      
      // Notificar que uma subcategoria foi salva
      if (onSubcategoriaSaved) {
        onSubcategoriaSaved()
      }
    } catch (error: any) {
      console.error('Erro ao salvar subcategoria:', error)
      setMessage({ type: 'error', text: 'Erro ao salvar subcategoria. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategoria = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria? Todas as subcategorias relacionadas também serão excluídas.')) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const result = await supabaseService.deleteCategoria(id)
      
      if (result.success) {
        const updatedCategorias = categorias.filter(cat => cat.id !== id)
        onCategoriaChange(updatedCategorias)
        
        // Remove subcategorias relacionadas
        const updatedSubcategorias = subcategorias.filter(sub => sub.categoriaId !== id)
        onSubcategoriaChange(updatedSubcategorias)
        
        setMessage({ type: 'success', text: 'Categoria excluída com sucesso!' })
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch (error: any) {
      console.error('Erro ao excluir categoria:', error)
      setMessage({ type: 'error', text: 'Erro ao excluir categoria. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSubcategoria = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta subcategoria?')) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const result = await supabaseService.deleteSubcategoria(id)
      
      if (result.success) {
        const updatedSubcategorias = subcategorias.filter(sub => sub.id !== id)
        onSubcategoriaChange(updatedSubcategorias)
        setMessage({ type: 'success', text: 'Subcategoria excluída com sucesso!' })
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch (error: any) {
      console.error('Erro ao excluir subcategoria:', error)
      setMessage({ type: 'error', text: 'Erro ao excluir subcategoria. Tente novamente.' })
    } finally {
      setLoading(false)
    }
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
      {/* Mensagem de status */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <Save className="h-5 w-5 mr-2" />
            ) : (
              <X className="h-5 w-5 mr-2" />
            )}
            {message.text}
          </div>
        </div>
      )}

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
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </button>
          </div>

          {/* Lista de Categorias */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorias.map((categoria) => (
              <div key={categoria.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: categoria.cor }}
                    />
                    <h4 className="font-medium text-gray-900">{categoria.nome}</h4>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEditCategoria(categoria)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      disabled={loading}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategoria(categoria.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-500 mb-2">
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
              disabled={loading}
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
                <div key={subcategoria.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{subcategoria.nome}</h4>
                      <p className="text-sm text-gray-500">
                        Categoria: {categoria?.nome || 'N/A'}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditSubcategoria(subcategoria)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        disabled={loading}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubcategoria(subcategoria.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        disabled={loading}
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
                    setMessage(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2 inline" />
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCategoria}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </span>
                  )}
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
                    setMessage(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2 inline" />
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSubcategoria}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}