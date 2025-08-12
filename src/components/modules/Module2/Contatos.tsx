import React, { useState, useEffect } from 'react'
import { Save, Trash2, Edit, Plus, Search, X, AlertCircle, CheckCircle } from 'lucide-react'
import { Contato } from '../../../types'
import { supabaseService } from '../../../services/supabase'

interface ContatosProps {
  onContatoSaved?: () => void
}

export default function Contatos({ onContatoSaved }: ContatosProps) {
  const [contatos, setContatos] = useState<Contato[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingContato, setEditingContato] = useState<Contato | null>(null)
  
  const [formData, setFormData] = useState<Omit<Contato, 'id'>>({
    nome: '',
    tipo: 'cliente',
    email: '',
    telefone: '',
    cpfCnpj: '',
    endereco: '',
    observacoes: '',
    ativo: true
  })

  // Carregar contatos
  const loadContatos = async () => {
    setLoading(true)
    try {
      const data = await supabaseService.getContatos()
      setContatos(data)
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
      setMessage({ type: 'error', text: 'Erro ao carregar contatos' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContatos()
  }, [])

  // Filtrar contatos por busca
  const filteredContatos = contatos.filter(contato =>
    contato.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contato.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contato.cpfCnpj?.includes(searchTerm)
  )

  // Salvar contato
  const handleSaveContato = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome.trim()) {
      setMessage({ type: 'error', text: 'Nome é obrigatório' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      if (editingContato) {
        // Atualizar contato existente
        const result = await supabaseService.updateContato(editingContato.id, formData)
        if (result.success) {
          setMessage({ type: 'success', text: result.message })
          setEditingContato(null)
          setShowForm(false)
          loadContatos()
          if (onContatoSaved) onContatoSaved()
        } else {
          setMessage({ type: 'error', text: result.message })
        }
      } else {
        // Criar novo contato
        const result = await supabaseService.saveContato(formData)
        if (result.success) {
          setMessage({ type: 'success', text: result.message })
          setShowForm(false)
          loadContatos()
          if (onContatoSaved) onContatoSaved()
        } else {
          setMessage({ type: 'error', text: result.message })
        }
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar contato' })
    } finally {
      setLoading(false)
    }
  }

  // Editar contato
  const handleEdit = (contato: Contato) => {
    setEditingContato(contato)
    setFormData({
      nome: contato.nome,
      tipo: contato.tipo,
      email: contato.email || '',
      telefone: contato.telefone || '',
      cpfCnpj: contato.cpfCnpj || '',
      endereco: contato.endereco || '',
      observacoes: contato.observacoes || '',
      ativo: contato.ativo
    })
    setShowForm(true)
  }

  // Deletar contato
  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este contato?')) {
      return
    }

    setLoading(true)
    try {
      const result = await supabaseService.deleteContato(id)
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        loadContatos()
        if (onContatoSaved) onContatoSaved()
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao deletar contato' })
    } finally {
      setLoading(false)
    }
  }

  // Limpar formulário
  const clearForm = () => {
    setFormData({
      nome: '',
      tipo: 'cliente',
      email: '',
      telefone: '',
      cpfCnpj: '',
      endereco: '',
      observacoes: '',
      ativo: true
    })
    setEditingContato(null)
    setShowForm(false)
    setMessage(null)
  }

  // Formatar CPF/CNPJ
  const formatCpfCnpj = (value: string): string => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      // CPF: 000.000.000-00
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else {
      // CNPJ: 00.000.000/0000-00
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
  }

  // Formatar telefone
  const formatTelefone = (value: string): string => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contatos</h2>
          <p className="text-gray-600">Gerencie seus clientes e fornecedores</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Contato
        </button>
      </div>

      {/* Mensagem de status */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            {message.text}
          </div>
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {editingContato ? 'Editar Contato' : 'Novo Contato'}
            </h3>
            <button
              onClick={clearForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSaveContato} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="cliente">Cliente</option>
                  <option value="fornecedor">Fornecedor</option>
                  <option value="parceiro">Parceiro</option>
                  <option value="funcionario">Funcionário</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: formatTelefone(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPF/CNPJ
              </label>
              <input
                type="text"
                value={formData.cpfCnpj}
                onChange={(e) => setFormData({ ...formData, cpfCnpj: formatCpfCnpj(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço
              </label>
              <textarea
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="ativo"
                checked={formData.ativo}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">
                Ativo
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {editingContato ? 'Atualizar' : 'Salvar'}
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={clearForm}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Buscar contatos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Lista de contatos */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPF/CNPJ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredContatos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'Nenhum contato encontrado' : 'Nenhum contato cadastrado'}
                  </td>
                </tr>
              ) : (
                filteredContatos.map((contato) => (
                  <tr key={contato.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{contato.nome}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        contato.tipo === 'cliente' ? 'bg-green-100 text-green-800' :
                        contato.tipo === 'fornecedor' ? 'bg-blue-100 text-blue-800' :
                        contato.tipo === 'parceiro' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {contato.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contato.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contato.telefone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contato.cpfCnpj || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        contato.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {contato.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(contato)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(contato.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
