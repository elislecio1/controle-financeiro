import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { supabaseService } from '../../../services/supabase'

interface ContaBancaria {
  id: string
  nome: string
  tipo: 'conta_corrente' | 'poupanca' | 'investimento' | 'cartao_credito' | 'cartao_debito'
  banco: string
  agencia?: string
  conta?: string
  saldo: number
  limite?: number
  ativo: boolean
}

export default function ContasBancarias() {
  const [contas, setContas] = useState<ContaBancaria[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'conta_corrente' as 'conta_corrente' | 'poupanca' | 'investimento' | 'cartao_credito' | 'cartao_debito',
    banco: '',
    agencia: '',
    conta: '',
    saldo: 0,
    limite: 0,
    ativo: true
  })

  useEffect(() => {
    loadContas()
  }, [])

  const loadContas = async () => {
    setLoading(true)
    try {
      // Mock data por enquanto
      const mockContas: ContaBancaria[] = [
        {
          id: '1',
          nome: 'Conta Corrente Principal',
          tipo: 'conta_corrente',
          banco: 'Banco do Brasil',
          agencia: '1234',
          conta: '12345-6',
          saldo: 5000,
          ativo: true
        },
        {
          id: '2',
          nome: 'Conta Poupança',
          tipo: 'poupanca',
          banco: 'Banco do Brasil',
          agencia: '1234',
          conta: '12345-6',
          saldo: 15000,
          ativo: true
        },
        {
          id: '3',
          nome: 'Cartão de Crédito',
          tipo: 'cartao_credito',
          banco: 'Nubank',
          limite: 5000,
          saldo: 0,
          ativo: true
        }
      ]
      setContas(mockContas)
    } catch (error) {
      console.error('Erro ao carregar contas:', error)
      setMessage({ type: 'error', text: 'Erro ao carregar contas bancárias' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome || !formData.banco) {
      setMessage({ type: 'error', text: 'Por favor, preencha os campos obrigatórios.' })
      return
    }

    setLoading(true)
    try {
      if (editingId) {
        // Atualizar conta existente
        const updatedContas = contas.map(conta => 
          conta.id === editingId 
            ? { ...conta, ...formData }
            : conta
        )
        setContas(updatedContas)
        setMessage({ type: 'success', text: 'Conta atualizada com sucesso!' })
      } else {
        // Adicionar nova conta
        const novaConta: ContaBancaria = {
          id: Date.now().toString(),
          ...formData
        }
        setContas([...contas, novaConta])
        setMessage({ type: 'success', text: 'Conta adicionada com sucesso!' })
      }
      
      clearForm()
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar conta bancária' })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (conta: ContaBancaria) => {
    setFormData({
      nome: conta.nome,
      tipo: conta.tipo as 'conta_corrente' | 'poupanca' | 'investimento' | 'cartao_credito' | 'cartao_debito',
      banco: conta.banco,
      agencia: conta.agencia || '',
      conta: conta.conta || '',
      saldo: conta.saldo,
      limite: conta.limite || 0,
      ativo: conta.ativo
    })
    setEditingId(conta.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conta?')) {
      return
    }

    try {
      const updatedContas = contas.filter(conta => conta.id !== id)
      setContas(updatedContas)
      setMessage({ type: 'success', text: 'Conta excluída com sucesso!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao excluir conta' })
    }
  }

  const clearForm = () => {
    setFormData({
      nome: '',
      tipo: 'conta_corrente' as 'conta_corrente' | 'poupanca' | 'investimento' | 'cartao_credito' | 'cartao_debito',
      banco: '',
      agencia: '',
      conta: '',
      saldo: 0,
      limite: 0,
      ativo: true
    })
    setEditingId(null)
    setShowForm(false)
  }

  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Contas Bancárias</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </button>
      </div>

      {/* Mensagem */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">
              {editingId ? 'Editar Conta' : 'Nova Conta Bancária'}
            </h3>
            <button
              onClick={clearForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Conta *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="conta_corrente">Conta Corrente</option>
                  <option value="poupanca">Poupança</option>
                  <option value="investimento">Investimento</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banco *
                </label>
                <input
                  type="text"
                  value={formData.banco}
                  onChange={(e) => setFormData({...formData, banco: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agência
                </label>
                <input
                  type="text"
                  value={formData.agencia}
                  onChange={(e) => setFormData({...formData, agencia: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conta
                </label>
                <input
                  type="text"
                  value={formData.conta}
                  onChange={(e) => setFormData({...formData, conta: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saldo Atual
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.saldo}
                  onChange={(e) => setFormData({...formData, saldo: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {((formData.tipo as string) === 'cartao_credito' || (formData.tipo as string) === 'cartao_debito') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Limite
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.limite}
                    onChange={(e) => setFormData({...formData, limite: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="ativo"
                checked={formData.ativo}
                onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">
                Conta ativa
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={clearForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2 inline" />
                {loading ? 'Salvando...' : (editingId ? 'Atualizar' : 'Salvar')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Contas */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Contas Cadastradas</h3>
          
          {loading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : contas.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Nenhuma conta cadastrada</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Banco
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saldo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contas.map((conta) => (
                    <tr key={conta.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{conta.nome}</div>
                        {conta.agencia && conta.conta && (
                          <div className="text-sm text-gray-500">
                            {conta.agencia} / {conta.conta}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {conta.banco}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          conta.tipo === 'conta_corrente' ? 'bg-blue-100 text-blue-800' :
                          conta.tipo === 'poupanca' ? 'bg-green-100 text-green-800' :
                          conta.tipo === 'investimento' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {conta.tipo === 'conta_corrente' ? 'Corrente' :
                           conta.tipo === 'poupanca' ? 'Poupança' :
                           conta.tipo === 'investimento' ? 'Investimento' :
                           conta.tipo === 'cartao_credito' ? 'Cartão Crédito' :
                           'Cartão Débito'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatarMoeda(conta.saldo)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          conta.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {conta.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(conta)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(conta.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 