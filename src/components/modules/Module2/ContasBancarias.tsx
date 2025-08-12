import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, X, CreditCard } from 'lucide-react'
import { supabaseService } from '../../../services/supabase'
import { ContaBancaria } from '../../../types'
import { formatarMoeda } from '../../../utils/formatters'

interface ContasBancariasProps {
  contas: ContaBancaria[]
  onContaChange: (contas: ContaBancaria[]) => void
}

// Interface para transações
interface Transaction {
  id: string
  conta: string
  valor: number
  tipo: 'receita' | 'despesa' | 'transferencia' | 'investimento'
  status: 'pago' | 'pendente' | 'vencido'
  vencimento: string
  dataPagamento?: string
}

export default function ContasBancarias({ contas, onContaChange }: ContasBancariasProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingConta, setEditingConta] = useState<ContaBancaria | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
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

  // Carregar transações para cálculo de saldos
  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      const data = await supabaseService.getData()
      setTransactions(data)
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
    }
  }

  // Função para calcular saldo real baseado nas transações pagas
  const calcularSaldoReal = (contaNome: string): number => {
    const transacoesConta = transactions.filter(t => 
      t.conta === contaNome && t.status === 'pago'
    )
    
    return transacoesConta.reduce((saldo, transacao) => {
      if (transacao.tipo === 'receita') {
        return saldo + transacao.valor
      } else if (transacao.tipo === 'despesa') {
        return saldo - transacao.valor
      } else if (transacao.tipo === 'transferencia') {
        // Para transferências, considerar entrada e saída
        return saldo
      }
      return saldo
    }, 0)
  }

  // Função para calcular saldo previsto até o final do mês
  const calcularSaldoPrevisto = (contaNome: string): number => {
    const hoje = new Date()
    const fimDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    const fimDoMesStr = fimDoMes.toLocaleDateString('pt-BR')
    
    const transacoesConta = transactions.filter(t => 
      t.conta === contaNome && 
      t.vencimento <= fimDoMesStr
    )
    
    return transacoesConta.reduce((saldo, transacao) => {
      if (transacao.tipo === 'receita') {
        return saldo + transacao.valor
      } else if (transacao.tipo === 'despesa') {
        return saldo - transacao.valor
      }
      return saldo
    }, 0)
  }

  const tiposConta = [
    { value: 'conta_corrente', label: 'Conta Corrente' },
    { value: 'poupanca', label: 'Poupança' },
    { value: 'investimento', label: 'Investimento' },
    { value: 'cartao_credito', label: 'Cartão de Crédito' },
    { value: 'cartao_debito', label: 'Cartão de Débito' }
  ]

  const bancos = [
    'Banco do Brasil', 'Itaú', 'Bradesco', 'Santander', 'Caixa Econômica',
    'Nubank', 'Inter', 'C6 Bank', 'Banco Original', 'Banco Neon',
    'Banco Next', 'Banco Modal', 'Banco Safra', 'Banco Votorantim',
    'Banco Bradesco BBI', 'Banco BTG Pactual', 'Banco Daycoval',
    'Banco Mercantil', 'Banco Pan', 'Banco Sofisa', 'Outro'
  ]

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
    setEditingConta(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome || !formData.banco) {
      setMessage('Nome da conta e banco são obrigatórios!')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      if (editingConta) {
        // Editar conta existente
        const result = await supabaseService.updateConta(editingConta.id, formData)
        if (result.success) {
          const updatedContas = contas.map(conta =>
            conta.id === editingConta.id
              ? { ...conta, ...formData }
              : conta
          )
          onContaChange(updatedContas)
          setMessage('Conta atualizada com sucesso!')
        } else {
          setMessage(result.message)
        }
      } else {
        // Adicionar nova conta
        const result = await supabaseService.saveConta(formData)
        if (result.success && result.data) {
          onContaChange([...contas, result.data])
          setMessage('Conta salva com sucesso!')
        } else {
          setMessage(result.message)
        }
      }

      clearForm()
      setShowForm(false)
    } catch (error) {
      setMessage('Erro ao processar conta: ' + (error as Error).message)
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
    setEditingConta(conta)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      setLoading(true)
      setMessage('')
      
      try {
        const result = await supabaseService.deleteConta(id)
        if (result.success) {
          const updatedContas = contas.filter(conta => conta.id !== id)
          onContaChange(updatedContas)
          setMessage('Conta excluída com sucesso!')
        } else {
          setMessage(result.message)
        }
      } catch (error) {
        setMessage('Erro ao excluir conta: ' + (error as Error).message)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleToggleStatus = async (id: string) => {
    setLoading(true)
    setMessage('')
    
    try {
      const conta = contas.find(c => c.id === id)
      if (conta) {
        const result = await supabaseService.updateConta(id, { ativo: !conta.ativo })
        if (result.success) {
          const updatedContas = contas.map(c =>
            c.id === id ? { ...c, ativo: !c.ativo } : c
          )
          onContaChange(updatedContas)
          setMessage('Status da conta atualizado com sucesso!')
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

  const getTipoLabel = (tipo: string) => {
    return tiposConta.find(t => t.value === tipo)?.label || tipo
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Contas Bancárias</h3>
                <p className="text-sm text-gray-500">
                  Gerencie suas contas bancárias, cartões e investimentos
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                clearForm()
                setShowForm(true)
              }}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
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
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-800">Processando...</span>
          </div>
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              {editingConta ? 'Editar Conta' : 'Nova Conta Bancária'}
            </h4>
            
                          <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Conta * <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Conta Principal"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo * <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => handleInputChange('tipo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {tiposConta.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banco * <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.banco}
                    onChange={(e) => handleInputChange('banco', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                    Agência
                  </label>
                  <input
                    type="text"
                    value={formData.agencia}
                    onChange={(e) => handleInputChange('agencia', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: 0001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número da Conta
                  </label>
                  <input
                    type="text"
                    value={formData.conta}
                    onChange={(e) => handleInputChange('conta', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: 12345-6"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Saldo Atual
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.saldo}
                    onChange={(e) => handleInputChange('saldo', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0,00"
                  />
                </div>

                {((formData.tipo as string) === 'cartao_credito' || (formData.tipo as string) === 'cartao_debito') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Limite do Cartão
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.limite}
                      onChange={(e) => handleInputChange('limite', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0,00"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => handleInputChange('ativo', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">
                  Conta ativa
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    clearForm()
                    setShowForm(false)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processando...' : (editingConta ? 'Atualizar' : 'Salvar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Contas */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Contas Cadastradas</h4>
          
          {contas.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma conta cadastrada</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comece adicionando sua primeira conta bancária.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
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
                      Saldo Real
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saldo Previsto
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
                  {contas.map((conta) => (
                    <tr key={conta.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{conta.nome}</div>
                        {conta.agencia && conta.conta && (
                          <div className="text-sm text-gray-500">
                            Ag: {conta.agencia} | Conta: {conta.conta}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {conta.banco}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {getTipoLabel(conta.tipo)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={calcularSaldoReal(conta.nome) >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatarMoeda(calcularSaldoReal(conta.nome))}
                        </span>
                        {conta.limite && conta.limite > 0 && (
                          <div className="text-xs text-gray-500">
                            Limite: {formatarMoeda(conta.limite)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={calcularSaldoPrevisto(conta.nome) >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatarMoeda(calcularSaldoPrevisto(conta.nome))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(conta.id)}
                          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                            conta.ativo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {conta.ativo ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Ativa
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Inativa
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
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

      {/* Resumo */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Resumo das Contas</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{contas.length}</div>
              <div className="text-sm text-gray-500">Total de Contas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatarMoeda(contas.reduce((sum, conta) => sum + calcularSaldoReal(conta.nome), 0))}
              </div>
              <div className="text-sm text-gray-500">Saldo Total Real</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatarMoeda(contas.reduce((sum, conta) => sum + calcularSaldoPrevisto(conta.nome), 0))}
              </div>
              <div className="text-sm text-gray-500">Saldo Total Previsto</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {contas.filter(c => c.tipo === 'cartao_credito' || c.tipo === 'cartao_debito').length}
              </div>
              <div className="text-sm text-gray-500">Cartões</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {contas.filter(c => c.ativo).length}
              </div>
              <div className="text-sm text-gray-500">Contas Ativas</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 