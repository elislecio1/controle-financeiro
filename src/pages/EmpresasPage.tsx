import React, { useState } from 'react'
import { Building2, Plus, Edit, Trash2, Users, CheckCircle, XCircle } from 'lucide-react'
import { useEmpresa } from '../hooks/useEmpresa'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export const EmpresasPage: React.FC = () => {
  const { empresas, empresaAtual, loading, error, criarEmpresa, setEmpresaAtual, refreshEmpresas } = useEmpresa()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    razao_social: '',
    email: '',
    telefone: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const handleCreateEmpresa = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setCreateError(null)

    if (!formData.nome.trim()) {
      setCreateError('Nome da empresa é obrigatório')
      setSubmitting(false)
      return
    }

    try {
      const result = await criarEmpresa({
        nome: formData.nome.trim(),
        cnpj: formData.cnpj.trim() || undefined,
        razao_social: formData.razao_social.trim() || undefined,
        email: formData.email.trim() || undefined,
        telefone: formData.telefone.trim() || undefined
      })

      if (result.success) {
        setShowCreateModal(false)
        setFormData({ nome: '', cnpj: '', razao_social: '', email: '', telefone: '' })
        // A empresa já foi selecionada automaticamente pelo contexto
        navigate('/')
      } else {
        setCreateError(result.error || 'Erro ao criar empresa')
      }
    } catch (err: any) {
      setCreateError(err.message || 'Erro inesperado ao criar empresa')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSelectEmpresa = async (empresaId: string) => {
    await setEmpresaAtual(empresaId)
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando empresas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Building2 className="h-6 w-6 mr-2 text-blue-600" />
                Minhas Empresas
              </h1>
              <p className="text-gray-600 mt-1">Gerencie suas empresas e alterne entre elas</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Empresa
            </button>
          </div>
        </div>

        {/* Lista de Empresas */}
        {empresas.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma empresa encontrada</h2>
            <p className="text-gray-600 mb-6">Crie sua primeira empresa para começar a usar o sistema</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Empresa
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {empresas.map((empresa) => (
              <div
                key={empresa.id}
                className={`bg-white rounded-lg shadow p-6 cursor-pointer transition-all hover:shadow-md ${
                  empresa.id === empresaAtual?.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleSelectEmpresa(empresa.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <Building2 className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">{empresa.nome}</h3>
                  </div>
                  {empresa.id === empresaAtual?.id && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Ativa
                    </span>
                  )}
                </div>
                
                {empresa.cnpj && (
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">CNPJ:</span> {empresa.cnpj}
                  </p>
                )}
                {empresa.razao_social && (
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Razão Social:</span> {empresa.razao_social}
                  </p>
                )}
                {empresa.email && (
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Email:</span> {empresa.email}
                  </p>
                )}
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectEmpresa(empresa.id)
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    {empresa.id === empresaAtual?.id ? 'Empresa Ativa' : 'Selecionar Empresa'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Criação */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Criar Nova Empresa</h2>
                
                <form onSubmit={handleCreateEmpresa}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome da Empresa <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: Minha Empresa LTDA"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CNPJ
                      </label>
                      <input
                        type="text"
                        value={formData.cnpj}
                        onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="00.000.000/0000-00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Razão Social
                      </label>
                      <input
                        type="text"
                        value={formData.razao_social}
                        onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Razão Social Completa"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="contato@empresa.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefone
                      </label>
                      <input
                        type="text"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  {createError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{createError}</p>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false)
                        setFormData({ nome: '', cnpj: '', razao_social: '', email: '', telefone: '' })
                        setCreateError(null)
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      disabled={submitting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={submitting}
                    >
                      {submitting ? 'Criando...' : 'Criar Empresa'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
