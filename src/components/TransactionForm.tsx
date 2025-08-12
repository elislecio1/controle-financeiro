import React, { useState, useEffect } from 'react'
import { Save, Trash2, AlertCircle, CheckCircle, X, Edit } from 'lucide-react'
import { NewTransaction, Categoria, Subcategoria, ContaBancaria, SheetData } from '../types'
import { supabaseService } from '../services/supabase'
import { formatarMoeda, parsearValorBrasileiro, parsearDataBrasileira } from '../utils/formatters'

interface TransactionFormProps {
  onTransactionSaved: () => void
  categorias?: Categoria[]
  subcategorias?: Subcategoria[]
  contas?: ContaBancaria[]
  transactionToEdit?: SheetData | null
  onClose?: () => void
  isEditing?: boolean
}

export default function TransactionForm({ 
  onTransactionSaved, 
  categorias = [], 
  subcategorias = [], 
  contas = [],
  transactionToEdit = null,
  onClose,
  isEditing = false
}: TransactionFormProps) {
  const [formData, setFormData] = useState<NewTransaction>({
    data: '',
    valor: 0,
    descricao: '',
    conta: contas.length > 0 ? contas[0].nome : '',
    categoria: 'Outros',
    forma: 'Dinheiro',
    tipo: 'despesa',
    vencimento: '',
    parcelas: 1,
    contaTransferencia: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [valorDisplay, setValorDisplay] = useState<string>('') // Estado local para o valor exibido

  // Carregar dados da transação para edição
  useEffect(() => {
    if (transactionToEdit && isEditing) {
      setFormData({
        data: transactionToEdit.data || '',
        valor: Math.abs(transactionToEdit.valor),
        descricao: transactionToEdit.descricao || '',
        conta: transactionToEdit.conta || (contas.length > 0 ? contas[0].nome : ''),
        categoria: transactionToEdit.categoria || 'Outros',
        forma: transactionToEdit.forma || 'Dinheiro',
        tipo: transactionToEdit.tipo || 'despesa',
        vencimento: transactionToEdit.vencimento || '',
        parcelas: typeof transactionToEdit.parcela === 'number' ? transactionToEdit.parcela : 1,
        contaTransferencia: transactionToEdit.contaTransferencia || ''
      })
      setValorDisplay(formatarMoeda(Math.abs(transactionToEdit.valor)))
    }
  }, [transactionToEdit, isEditing, contas])

  const handleInputChange = (field: keyof NewTransaction, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Função para formatar data automaticamente
  const formatDate = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Aplica a máscara DD/MM/AAAA
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
    } else if (numbers.length <= 8) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
    }
  }

  // Função para formatar valor de exibição durante digitação
  const formatDisplayValue = (value: number): string => {
    if (value === 0) return ''
    
    // Formata como moeda brasileira
    return formatarMoeda(value)
  }

  // Função para formatar valor automaticamente
  const formatValue = (value: string): string => {
    // Remove tudo que não é número ou vírgula
    let numbers = value.replace(/[^\d,]/g, '')
    
    // Se não tem vírgula, permite digitação livre
    if (!numbers.includes(',')) {
      return numbers
    }
    
    // Se tem vírgula, mantém o formato
    return numbers
  }

  // Função para converter valor brasileiro para número - VERSÃO MELHORADA
  const parseValue = (valueString: string): number => {
    if (!valueString || valueString.trim() === '') return 0
    
    // Remove espaços e símbolos de moeda
    let valor = valueString.replace(/[R$\s]/g, '')
    
    // Verifica se é negativo
    const isNegativo = valor.startsWith('-')
    if (isNegativo) {
      valor = valor.substring(1)
    }
    
    // Tenta diferentes abordagens para converter
    let numero = 0
    
    // Abordagem 1: Se tem vírgula, trata como decimal brasileiro
    if (valor.includes(',')) {
      const parts = valor.split(',')
      if (parts.length === 2) {
        const integerPart = parts[0].replace(/\./g, '') // Remove pontos de milhares
        const decimalPart = parts[1].substring(0, 2) // Limita a 2 casas decimais
        const valorConvertido = integerPart + '.' + decimalPart
        numero = parseFloat(valorConvertido)
      }
    }
    // Abordagem 2: Se tem ponto, trata como decimal inglês
    else if (valor.includes('.')) {
      const parts = valor.split('.')
      if (parts.length === 2 && parts[1].length <= 2) {
        numero = parseFloat(valor)
      } else {
        // Múltiplos pontos = milhares, remove todos
        const valorLimpo = valor.replace(/\./g, '')
        numero = parseFloat(valorLimpo)
      }
    }
    // Abordagem 3: Apenas números
    else {
      numero = parseFloat(valor)
    }
    
    const resultado = isNaN(numero) ? 0 : (isNegativo ? -numero : numero)
    return resultado
  }

  // Função para formatar valor instantaneamente durante digitação - SEM ZEROS À ESQUERDA
  const formatCurrencyInput = (value: string): string => {
    if (!value) return ''
    
    // Remove tudo que não é número
    let cleanValue = value.replace(/[^\d]/g, '')
    
    // Se não tem dígitos, retorna vazio
    if (!cleanValue) return ''
    
    // Se tem apenas 1 dígito, formata como centavos (sem zero à esquerda)
    if (cleanValue.length === 1) {
      return `0,0${cleanValue}`
    }
    
    // Se tem 2 dígitos, formata como centavos (sem zero à esquerda)
    if (cleanValue.length === 2) {
      return `0,${cleanValue}`
    }
    
    // Se tem mais de 2 dígitos, formata com vírgula e pontos de milhares
    const integerPart = cleanValue.slice(0, -2)
    const decimalPart = cleanValue.slice(-2)
    
    // Remove zeros à esquerda da parte inteira
    const cleanIntegerPart = integerPart.replace(/^0+/, '') || '0'
    
    // Adiciona pontos de milhares a cada 3 dígitos
    const formattedInteger = cleanIntegerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    
    return `${formattedInteger},${decimalPart}`
  }

  // Função para lidar com mudanças no campo valor com formatação instantânea
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Formata o valor instantaneamente
    const formattedValue = formatCurrencyInput(inputValue)
    
    // Atualiza o estado de exibição com o valor formatado
    setValorDisplay(formattedValue)
    
    // Converte para número usando a função parseValue existente
    const valor = parseValue(formattedValue)
    
    // Atualiza o estado principal
    handleInputChange('valor', valor)
  }

  // Função para salvar transação (criar ou editar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.descricao.trim()) {
      setMessage({ type: 'error', text: 'Descrição é obrigatória' })
      return
    }

    if (!formData.data) {
      setMessage({ type: 'error', text: 'Data é obrigatória' })
      return
    }

    if (!formData.valor || formData.valor <= 0) {
      setMessage({ type: 'error', text: 'Valor deve ser maior que zero' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const valorFinal = formData.tipo === 'despesa' ? -Math.abs(formData.valor) : Math.abs(formData.valor)
      
      if (isEditing && transactionToEdit) {
        // Atualizar transação existente
        const updatedTransaction: SheetData = {
          ...transactionToEdit,
          data: formData.data,
          valor: valorFinal,
          descricao: formData.descricao,
          conta: formData.conta,
          categoria: formData.categoria,
          forma: formData.forma,
          tipo: formData.tipo,
          vencimento: formData.vencimento || formData.data,
          parcela: (formData.parcelas || 1).toString(),
          contaTransferencia: formData.contaTransferencia
        }
        
        await supabaseService.updateTransaction(transactionToEdit.id, updatedTransaction)
        setMessage({ type: 'success', text: 'Transação atualizada com sucesso!' })
      } else {
        // Criar nova transação
        const newTransaction: NewTransaction = {
          ...formData,
          valor: valorFinal
        }
        
        await supabaseService.saveTransaction(newTransaction)
        setMessage({ type: 'success', text: 'Transação salva com sucesso!' })
      }

      // Limpar formulário se não estiver editando
      if (!isEditing) {
        setFormData({
          data: '',
          valor: 0,
          descricao: '',
          conta: contas.length > 0 ? contas[0].nome : '',
          categoria: 'Outros',
          forma: 'Dinheiro',
          tipo: 'despesa',
          vencimento: '',
          parcelas: 1,
          contaTransferencia: ''
        })
        setValorDisplay('')
      }

      onTransactionSaved()
      
      // Fechar modal se estiver editando
      if (isEditing && onClose) {
        setTimeout(() => {
          onClose()
        }, 1500)
      }
    } catch (error: any) {
      console.error('Erro ao salvar transação:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Erro ao salvar transação. Tente novamente.' 
      })
    } finally {
      setLoading(false)
    }
  }

  // Função para limpar formulário
  const clearForm = () => {
    setFormData({
      data: '',
      valor: 0,
      descricao: '',
      conta: contas.length > 0 ? contas[0].nome : '',
      categoria: 'Outros',
      forma: 'Dinheiro',
      tipo: 'despesa',
      vencimento: '',
      parcelas: 1,
      contaTransferencia: ''
    })
    setValorDisplay('')
    setMessage(null)
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-medium text-gray-900">
            {isEditing ? 'Editar Transação' : 'Nova Transação'}
          </h3>
          {isEditing && onClose ? (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          ) : (
            <button
              onClick={clearForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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

          {/* Primeira linha - Data e Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data *
              </label>
              <input
                type="date"
                value={formData.data}
                onChange={(e) => handleInputChange('data', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor *
              </label>
              <input
                type="text"
                placeholder="0,00"
                value={valorDisplay}
                onChange={handleValorChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                required
              />
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                Digite valores como: 54,28 ou 15.587,26 ou 15587.26
              </p>
            </div>
          </div>

          {/* Segunda linha - Descrição e Conta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <input
                type="text"
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                placeholder="Ex: Salário, Aluguel, Supermercado"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conta *
              </label>
              <select
                value={formData.conta}
                onChange={(e) => handleInputChange('conta', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                required
              >
                {contas.map((conta) => (
                  <option key={conta.nome} value={conta.nome}>
                    {conta.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Terceira linha - Categoria e Forma de Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                value={formData.categoria}
                onChange={(e) => handleInputChange('categoria', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                required
              >
                {categorias.map((cat) => (
                  <option key={cat.nome} value={cat.nome}>
                    {cat.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forma de Pagamento *
              </label>
              <select
                value={formData.forma}
                onChange={(e) => handleInputChange('forma', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                required
              >
                <option value="Dinheiro">Dinheiro</option>
                <option value="PIX">PIX</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Transferência">Transferência</option>
                <option value="Boleto">Boleto</option>
              </select>
            </div>
          </div>

          {/* Quarta linha - Tipo e Data de Vencimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => handleInputChange('tipo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                required
              >
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Vencimento
              </label>
              <input
                type="date"
                value={formData.vencimento}
                onChange={(e) => handleInputChange('vencimento', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Quinta linha - Parcelas e Conta de Transferência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parcelas
              </label>
              <input
                type="number"
                min="1"
                value={formData.parcelas}
                onChange={(e) => handleInputChange('parcelas', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conta de Transferência
              </label>
              <select
                value={formData.contaTransferencia}
                onChange={(e) => handleInputChange('contaTransferencia', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              >
                <option value="">Selecione uma conta</option>
                {contas.map((conta) => (
                  <option key={conta.nome} value={conta.nome}>
                    {conta.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botões responsivos */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Save className="h-4 w-4 mr-2" />
                  Nova Transação
                </span>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => {
                // setShowForm(false) // This state variable is not defined in the original file
                clearForm()
              }}
              className="flex-1 sm:flex-none bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm sm:text-base"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 