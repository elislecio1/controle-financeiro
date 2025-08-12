import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, X, Check, AlertCircle } from 'lucide-react'
import { Contato } from '../types'
import { supabaseService } from '../services/supabase'

interface ContatoSelectorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function ContatoSelector({ value, onChange, placeholder = "Selecione um contato", className = "" }: ContatoSelectorProps) {
  const [contatos, setContatos] = useState<Contato[]>([])
  const [filteredContatos, setFilteredContatos] = useState<Contato[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [showQuickForm, setShowQuickForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [quickFormData, setQuickFormData] = useState({
    nome: '',
    tipo: 'cliente' as 'cliente' | 'fornecedor',
    email: '',
    telefone: ''
  })

  // Carregar contatos
  const loadContatos = async () => {
    try {
      const data = await supabaseService.getContatos()
      setContatos(data)
      setFilteredContatos(data)
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
    }
  }

  useEffect(() => {
    loadContatos()
  }, [])

  // Filtrar contatos baseado na busca
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredContatos(contatos)
    } else {
      const filtered = contatos.filter(contato =>
        contato.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contato.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contato.cpfCnpj?.includes(searchTerm)
      )
      setFilteredContatos(filtered)
    }
  }, [searchTerm, contatos])

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowQuickForm(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Salvar contato rápido
  const handleSaveQuickContato = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!quickFormData.nome.trim()) {
      setMessage({ type: 'error', text: 'Nome é obrigatório' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const result = await supabaseService.saveContato({
        ...quickFormData,
        cpfCnpj: '',
        endereco: '',
        observacoes: '',
        ativo: true
      })

      if (result.success && result.data) {
        setMessage({ type: 'success', text: 'Contato salvo com sucesso!' })
        
        // Adicionar à lista e selecionar
        const newContato = result.data
        setContatos(prev => [...prev, newContato])
        onChange(newContato.nome)
        
        // Limpar formulário e fechar
        setQuickFormData({
          nome: '',
          tipo: 'cliente',
          email: '',
          telefone: ''
        })
        setShowQuickForm(false)
        setIsOpen(false)
        setSearchTerm('')
        
        setTimeout(() => setMessage(null), 2000)
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar contato' })
    } finally {
      setLoading(false)
    }
  }

  // Selecionar contato
  const handleSelectContato = (contato: Contato) => {
    onChange(contato.nome)
    setIsOpen(false)
    setSearchTerm('')
  }

  // Obter contato selecionado
  const selectedContato = contatos.find(c => c.nome === value)

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Campo de entrada */}
      <div
        className={`relative cursor-pointer ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          readOnly
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Busca */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar contatos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Mensagem de status */}
          {message && (
            <div className={`p-2 mx-3 mt-2 rounded-md text-sm ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {message.text}
              </div>
            </div>
          )}

          {/* Lista de contatos */}
          <div className="max-h-48 overflow-y-auto">
            {filteredContatos.length === 0 ? (
              <div className="p-3 text-center text-gray-500">
                {searchTerm ? 'Nenhum contato encontrado' : 'Nenhum contato cadastrado'}
              </div>
            ) : (
              filteredContatos.map((contato) => (
                <div
                  key={contato.id}
                  onClick={() => handleSelectContato(contato)}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{contato.nome}</div>
                    <div className="text-sm text-gray-500">
                      {contato.email && `${contato.email} • `}
                      {contato.tipo}
                    </div>
                  </div>
                  {selectedContato?.id === contato.id && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Botão para adicionar novo */}
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={() => setShowQuickForm(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
            >
              <Plus className="h-4 w-4" />
              Cadastrar novo contato
            </button>
          </div>
        </div>
      )}

      {/* Formulário rápido */}
      {showQuickForm && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Novo Contato</h3>
            <button
              onClick={() => setShowQuickForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSaveQuickContato} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <input
                type="text"
                value={quickFormData.nome}
                onChange={(e) => setQuickFormData({ ...quickFormData, nome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={quickFormData.tipo}
                  onChange={(e) => setQuickFormData({ ...quickFormData, tipo: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="cliente">Cliente</option>
                  <option value="fornecedor">Fornecedor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={quickFormData.email}
                  onChange={(e) => setQuickFormData({ ...quickFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={quickFormData.telefone}
                onChange={(e) => setQuickFormData({ ...quickFormData, telefone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
              
              <button
                type="button"
                onClick={() => setShowQuickForm(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
