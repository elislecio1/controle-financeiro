import React, { useState } from 'react'
import { CreditCard, Plus, Edit, Trash2, Eye, EyeOff, Calendar } from 'lucide-react'
import { CartaoCredito, ContaBancaria } from '../../../types'
import { supabaseService } from '../../../services/supabase'

interface CartoesCreditoProps {
  cartoes: CartaoCredito[]
  contas: ContaBancaria[]
  onCartaoChange: (cartoes: CartaoCredito[]) => void
}

export default function CartoesCredito({ cartoes, contas, onCartaoChange }: CartoesCreditoProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingCartao, setEditingCartao] = useState<CartaoCredito | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    nome: '',
    banco: '',
    limite: 0,
    vencimento: 10,
    contaId: '',
    ativo: true
  })

  const bancos = [
    'Banco do Brasil', 'Itaú', 'Bradesco', 'Santander', 'Caixa Econômica',
    'Nubank', 'Inter', 'C6 Bank', 'Banco Original', 'Banco Neon',
    'Banco Next', 'Banco Modal', 'Banco Safra', 'Banco Votorantim',
    'Banco Bradesco BBI', 'Banco BTG Pactual', 'Banco Daycoval',
    'Banco Mercantil', 'Banco Pan', 'Banco Sofisa', 'Outro'
  ]

  const diasVencimento = Array.from({ length: 31 }, (_, i) => i + 1)

  const contasVinculaveis = contas.filter(conta => 
    conta.tipo === 'conta_corrente' || conta.tipo === 'poupanca'
  )

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const clearForm = () => {
    setFormData({
      nome: '',
      banco: '',
      limite: 0,
      vencimento: 10,
      contaId: '',
      ativo: true
    })
    setEditingCartao(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome || !formData.banco) {
      setMessage('Nome do cartão e banco são obrigatórios!')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      if (editingCartao) {
        // Editar cartão existente
        const result = await supabaseService.updateCartao(editingCartao.id, formData)
        if (result.success) {
          const updatedCartoes = cartoes.map(cartao =>
            cartao.id === editingCartao.id
              ? { ...cartao, ...formData }
              : cartao
          )
          onCartaoChange(updatedCartoes)
          setMessage('Cartão atualizado com sucesso!')
        } else {
          setMessage(result.message)
        }
      } else {
        // Adicionar novo cartão
        const result = await supabaseService.saveCartao(formData)
        if (result.success && result.data) {
          onCartaoChange([...cartoes, result.data])
          setMessage('Cartão salvo com sucesso!')
        } else {
          setMessage(result.message)
        }
      }

      clearForm()
      setShowForm(false)
    } catch (error) {
      setMessage('Erro ao processar cartão: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (cartao: CartaoCredito) => {
    setFormData({
      nome: cartao.nome,
      banco: cartao.banco,
      limite: cartao.limite,
      vencimento: cartao.vencimento,
      contaId: cartao.contaId,
      ativo: cartao.ativo
    })
    setEditingCartao(cartao)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cartão?')) {
      setLoading(true)
      setMessage('')
      
      try {
        const result = await supabaseService.deleteCartao(id)
        if (result.success) {
          const updatedCartoes = cartoes.filter(cartao => cartao.id !== id)
          onCartaoChange(updatedCartoes)
          setMessage('Cartão excluído com sucesso!')
        } else {
          setMessage(result.message)
        }
      } catch (error) {
        setMessage('Erro ao excluir cartão: ' + (error as Error).message)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleToggleStatus = async (id: string) => {
    setLoading(true)
    setMessage('')
    
    try {
      const cartao = cartoes.find(c => c.id === id)
      if (cartao) {
        const result = await supabaseService.updateCartao(id, { ativo: !cartao.ativo })
        if (result.success) {
          const updatedCartoes = cartoes.map(c =>
            c.id === id ? { ...c, ativo: !c.ativo } : c
          )
          onCartaoChange(updatedCartoes)
          setMessage('Status do cartão atualizado com sucesso!')
        } else {
          setMessage(result.message)
        }
      }
    } catch (error) {
      setMessage('Erro ao atualizar status: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const getContaNome = (contaId: string) => {
    const conta = contas.find(c => c.id === contaId)
    return conta ? conta.nome : 'Não vinculado'
  }

  const getProximoVencimento = (diaVencimento: number) => {
    const hoje = new Date()
    const proximoVencimento = new Date(hoje.getFullYear(), hoje.getMonth(), diaVencimento)
    
    // Se já passou o vencimento deste mês, vai para o próximo mês
    if (proximoVencimento < hoje) {
      proximoVencimento.setMonth(proximoVencimento.getMonth() + 1)
    }
    
    return proximoVencimento.toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Cartões de Crédito</h3>
                <p className="text-sm text-gray-500">
                  Gerencie seus cartões de crédito e limites
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                clearForm()
                setShowForm(true)
              }}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Cartão
            </button>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.includes('sucesso') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
            <span className="text-purple-800">Processando...</span>
          </div>
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              {editingCartao ? 'Editar Cartão' : 'Novo Cartão de Crédito'}
            </h4>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Cartão * <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Ex: Nubank Rewards"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banco * <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.banco}
                    onChange={(e) => handleInputChange('banco', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    required
                  >
                    <option value="">Selecione o banco</option>
                    {bancos.map(banco => (
                      <option key={banco} value={banco}>
                        {banco}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limite do Cartão
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.limite}
                    onChange={(e) => handleInputChange('limite', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dia do Vencimento
                  </label>
                  <select
                    value={formData.vencimento}
                    onChange={(e) => handleInputChange('vencimento', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  >
                    {diasVencimento.map(dia => (
                      <option key={dia} value={dia}>
                        {dia}º dia do mês
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conta Vinculada
                  </label>
                  <select
                    value={formData.contaId}
                    onChange={(e) => handleInputChange('contaId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Não vincular a conta</option>
                    {contasVinculaveis.map(conta => (
                      <option key={conta.id} value={conta.id}>
                        {conta.nome} - {conta.banco}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => handleInputChange('ativo', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">
                  Cartão ativo
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    clearForm()
                    setShowForm(false)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processando...' : (editingCartao ? 'Atualizar' : 'Salvar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Cartões */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Cartões Cadastrados</h4>
          
          {cartoes.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum cartão cadastrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comece adicionando seu primeiro cartão de crédito.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cartão
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Banco
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Limite
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conta Vinculada
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
                  {cartoes.map((cartao) => (
                    <tr key={cartao.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{cartao.nome}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cartao.banco}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatarMoeda(cartao.limite)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {cartao.vencimento}º dia
                        </div>
                        <div className="text-xs text-gray-500">
                          Próximo: {getProximoVencimento(cartao.vencimento)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getContaNome(cartao.contaId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(cartao.id)}
                          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                            cartao.ativo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {cartao.ativo ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Inativo
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(cartao)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cartao.id)}
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

      {/* Resumo */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Resumo dos Cartões</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{cartoes.length}</div>
              <div className="text-sm text-gray-500">Total de Cartões</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatarMoeda(cartoes.reduce((sum, cartao) => sum + cartao.limite, 0))}
              </div>
              <div className="text-sm text-gray-500">Limite Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {cartoes.filter(c => c.contaId).length}
              </div>
              <div className="text-sm text-gray-500">Vinculados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {cartoes.filter(c => c.ativo).length}
              </div>
              <div className="text-sm text-gray-500">Cartões Ativos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 