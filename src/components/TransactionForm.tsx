import React, { useState } from 'react'
import { Save, Trash2, AlertCircle, CheckCircle } from 'lucide-react'
import { NewTransaction, Categoria, Subcategoria, ContaBancaria } from '../types'
import { supabaseService } from '../services/supabase'
import { formatarMoeda, parsearValorBrasileiro, parsearDataBrasileira } from '../utils/formatters'

interface TransactionFormProps {
  onTransactionSaved: () => void
  categorias?: Categoria[]
  subcategorias?: Subcategoria[]
  contas?: ContaBancaria[]
}

export default function TransactionForm({ onTransactionSaved, categorias = [], subcategorias = [], contas = [] }: TransactionFormProps) {
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

  // Função para formatar valor automaticamente durante digitação
  const formatCurrencyInput = (value: string): string => {
    if (!value) return ''
    
    // Remove tudo que não é número, vírgula ou ponto
    let cleanValue = value.replace(/[^\d,.]/g, '')
    
    // Se não tem vírgula nem ponto, permite digitação livre
    if (!cleanValue.includes(',') && !cleanValue.includes('.')) {
      return cleanValue
    }
    
    // Se tem vírgula, trata como formato brasileiro
    if (cleanValue.includes(',')) {
      const parts = cleanValue.split(',')
      if (parts.length === 2) {
        const integerPart = parts[0].replace(/\./g, '') // Remove pontos de milhares
        const decimalPart = parts[1].substring(0, 2) // Limita a 2 casas decimais
        
        // Formata com pontos de milhares
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        
        return `${formattedInteger},${decimalPart}`
      }
      return cleanValue
    }
    
    // Se tem ponto, verifica se é decimal ou milhares
    if (cleanValue.includes('.')) {
      const parts = cleanValue.split('.')
      
      // Se tem mais de 2 partes, é formato inglês (ex: 15.587.26)
      if (parts.length > 2) {
        // Remove todos os pontos e adiciona vírgula antes dos últimos 2 dígitos
        const allDigits = parts.join('')
        if (allDigits.length >= 2) {
          const integerPart = allDigits.slice(0, -2)
          const decimalPart = allDigits.slice(-2)
          
          // Formata com pontos de milhares
          const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
          
          return `${formattedInteger},${decimalPart}`
        }
      }
      
      // Se tem apenas 1 ponto, pode ser decimal inglês
      if (parts.length === 2 && parts[1].length <= 2) {
        // Converte para formato brasileiro
        const integerPart = parts[0].replace(/\./g, '')
        const decimalPart = parts[1]
        
        // Formata com pontos de milhares
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        
        return `${formattedInteger},${decimalPart}`
      }
    }
    
    return cleanValue
  }

  // Função para lidar com mudanças no campo valor com formatação automática
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Formata o valor para exibição
    const formattedValue = formatCurrencyInput(inputValue)
    
    // Atualiza o input com o valor formatado
    e.target.value = formattedValue
    
    // Converte para número usando a função parseValue existente
    const valor = parseValue(formattedValue)
    
    // Atualiza o estado
    handleInputChange('valor', valor)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.descricao || !formData.valor || !formData.data) {
      setMessage({ type: 'error', text: 'Por favor, preencha todos os campos obrigatórios.' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      console.log('💾 Salvando transação no Supabase...')
      
      const result = await supabaseService.saveTransaction(formData)
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        clearForm()
        onTransactionSaved() // Notifica o componente pai para atualizar os dados
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch (error: any) {
      console.error('❌ Erro ao salvar transação:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Erro ao salvar transação. Tente novamente.' 
      })
    } finally {
      setLoading(false)
    }
  }

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
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Nova Transação</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Campos obrigatórios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Data/Vencimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Vencimento * <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="DD/MM/AAAA"
                value={formData.data}
                onChange={(e) => {
                  const formattedDate = formatDate(e.target.value)
                  handleInputChange('data', formattedDate)
                  handleInputChange('vencimento', formattedDate)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

                         {/* Valor - COM FORMATAÇÃO AUTOMÁTICA */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Valor * <span className="text-red-500">*</span>
               </label>
               <input
                 type="text"
                 placeholder="0,00"
                 value={formData.valor ? formatCurrencyInput(formData.valor.toString()) : ''}
                 onChange={handleValorChange}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                 required
               />
               <p className="mt-1 text-sm text-gray-500">
                 Digite valores como: 54,28 ou 15.587,26 ou 15587.26
               </p>
             </div>

            {/* Tipo */}
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
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
                <option value="transferencia">Transferência</option>
                <option value="investimento">Investimento</option>
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição * <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Descrição da transação"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Campos opcionais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Conta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Conta</label>
              <select
                value={formData.conta}
                onChange={(e) => handleInputChange('conta', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione uma conta</option>
                {contas.map((conta) => (
                  <option key={conta.id} value={conta.nome}>
                    {conta.nome} - {conta.banco}
                  </option>
                ))}
              </select>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
              <select
                value={formData.categoria}
                onChange={(e) => handleInputChange('categoria', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione uma categoria</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.nome}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Forma de Pagamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
              <select
                value={formData.forma}
                onChange={(e) => handleInputChange('forma', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Dinheiro">Dinheiro</option>
                <option value="PIX">PIX</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Boleto">Boleto</option>
                <option value="Transferência">Transferência</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            {/* Vencimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vencimento</label>
              <input
                type="text"
                placeholder="DD/MM/AAAA"
                value={formData.vencimento}
                onChange={(e) => handleInputChange('vencimento', formatDate(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Conta de Transferência - aparece apenas quando tipo é transferencia */}
            {formData.tipo === 'transferencia' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Conta de Destino</label>
                <select
                  value={formData.contaTransferencia || ''}
                  onChange={(e) => handleInputChange('contaTransferencia', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione a conta de destino</option>
                  {contas.map((conta) => (
                    <option key={conta.id} value={conta.nome}>
                      {conta.nome} - {conta.banco}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Parcelas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Parcelas</label>
              <input
                type="number"
                min="1"
                max="60"
                value={formData.parcelas}
                onChange={(e) => handleInputChange('parcelas', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Contato */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contato</label>
              <input
                type="text"
                placeholder="Nome do contato"
                value={formData.contato || ''}
                onChange={(e) => handleInputChange('contato', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
            <textarea
              placeholder="Observações adicionais"
              value={formData.observacoes || ''}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={clearForm}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <Trash2 className="h-4 w-4 mr-2 inline" />
              Limpar
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2 inline" />
              {loading ? 'Salvando...' : 'Salvar Transação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 