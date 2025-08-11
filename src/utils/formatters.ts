// Utilitários para formatação de valores monetários brasileiros

/**
 * Formata um valor numérico para o formato de moeda brasileira
 * @param valor - Valor numérico (negativo para débitos)
 * @returns String formatada como "R$ 1.234,56" ou "- R$ 1.234,56"
 */
export const formatarMoeda = (valor: number): string => {
  const isNegativo = valor < 0
  const valorAbsoluto = Math.abs(valor)
  
  // Formata o valor absoluto
  const valorFormatado = valorAbsoluto.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  
  // Remove o "R$" padrão e adiciona o sinal negativo se necessário
  const valorSemSimbolo = valorFormatado.replace('R$', '').trim()
  
  if (isNegativo) {
    return `- R$ ${valorSemSimbolo}`
  }
  
  return `R$ ${valorSemSimbolo}`
}

/**
 * Formata um valor para exibição em tabelas (sem o símbolo R$)
 * @param valor - Valor numérico
 * @returns String formatada como "1.234,56" ou "- 1.234,56"
 */
export const formatarValorTabela = (valor: number): string => {
  const isNegativo = valor < 0
  const valorAbsoluto = Math.abs(valor)
  
  const valorFormatado = valorAbsoluto.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  
  if (isNegativo) {
    return `- ${valorFormatado}`
  }
  
  return valorFormatado
}

/**
 * Converte uma string de valor brasileiro para número
 * @param valorString - String no formato "1.234,56" ou "- 1.234,56"
 * @returns Número (negativo se a string tinha sinal negativo)
 */
export const parsearValorBrasileiro = (valorString: string): number => {
  if (!valorString) return 0
  
  // Remove espaços e símbolos de moeda
  let valor = valorString.replace(/[R$\s]/g, '')
  
  // Verifica se é negativo
  const isNegativo = valor.startsWith('-')
  if (isNegativo) {
    valor = valor.substring(1)
  }
  
  // Converte vírgula para ponto e remove pontos de milhares
  valor = valor.replace(/\./g, '').replace(',', '.')
  
  const numero = parseFloat(valor)
  
  return isNegativo ? -numero : numero
}

/**
 * Formata uma data para o formato brasileiro
 * @param data - Data (string ou Date)
 * @returns String no formato "DD/MM/AAAA"
 */
export const formatarData = (data: string | Date): string => {
  if (!data) return ''
  
  const date = typeof data === 'string' ? new Date(data) : data
  
  if (isNaN(date.getTime())) return ''
  
  const dia = date.getDate().toString().padStart(2, '0')
  const mes = (date.getMonth() + 1).toString().padStart(2, '0')
  const ano = date.getFullYear()
  
  return `${dia}/${mes}/${ano}`
}

/**
 * Converte uma data brasileira para Date
 * @param dataString - String no formato "DD/MM/AAAA"
 * @returns Date ou null se inválida
 */
export const parsearDataBrasileira = (dataString: string): Date | null => {
  if (!dataString) return null
  
  const partes = dataString.split('/')
  if (partes.length !== 3) return null
  
  const dia = parseInt(partes[0])
  const mes = parseInt(partes[1]) - 1
  const ano = parseInt(partes[2])
  
  if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return null
  
  const data = new Date(ano, mes, dia)
  
  // Verifica se a data é válida
  if (data.getDate() !== dia || data.getMonth() !== mes || data.getFullYear() !== ano) {
    return null
  }
  
  return data
}

/**
 * Formata um valor para exibição em cards do dashboard
 * @param valor - Valor numérico
 * @param compacto - Se true, usa formato compacto (ex: 1,2K)
 * @returns String formatada
 */
export const formatarValorCard = (valor: number, compacto: boolean = false): string => {
  if (compacto) {
    if (Math.abs(valor) >= 1000000) {
      return formatarMoeda(valor / 1000000) + 'M'
    } else if (Math.abs(valor) >= 1000) {
      return formatarMoeda(valor / 1000) + 'K'
    }
  }
  
  return formatarMoeda(valor)
}

/**
 * Aplica classe CSS baseada no valor (positivo/negativo)
 * @param valor - Valor numérico
 * @returns String com classes CSS
 */
export const getClasseValor = (valor: number): string => {
  if (valor > 0) {
    return 'text-green-600'
  } else if (valor < 0) {
    return 'text-red-600'
  }
  return 'text-gray-600'
} 