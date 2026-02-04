// Serviço de IA para Análise Financeira
import { supabase } from './supabase'
import { SheetData } from '../types'

export interface FinancialPrediction {
  period: string
  predicted_income: number
  predicted_expenses: number
  predicted_balance: number
  confidence: number
  factors: string[]
  recommendations: string[]
}

export interface SpendingPattern {
  category: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'irregular'
  average_amount: number
  trend: 'increasing' | 'decreasing' | 'stable'
  confidence: number
  next_predicted_date?: string
  next_predicted_amount?: number
}

export interface AnomalyDetection {
  transaction_id: string
  type: 'unusual_amount' | 'unusual_category' | 'unusual_timing' | 'duplicate_risk'
  severity: 'low' | 'medium' | 'high'
  description: string
  confidence: number
  suggested_action: string
  original_value: any
  expected_value: any
}

export interface SmartRecommendation {
  id: string
  type: 'savings' | 'investment' | 'budget' | 'debt' | 'income' | 'expense_optimization'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  description: string
  potential_savings?: number
  potential_income?: number
  implementation_difficulty: 'easy' | 'medium' | 'hard'
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term'
  action_items: string[]
  success_probability: number
}

export interface CategorySuggestion {
  transaction_id: string
  description: string
  suggested_category: string
  confidence: number
  alternative_categories: { category: string; confidence: number }[]
  reasoning: string
}

export interface SentimentAnalysis {
  transaction_id: string
  description: string
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
  emotions: string[]
  keywords: string[]
  financial_impact: 'positive' | 'negative' | 'neutral'
}

export interface FinancialInsights {
  user_id: string
  period: string
  total_insights: number
  insights: {
    spending_behavior: string[]
    income_patterns: string[]
    risk_factors: string[]
    opportunities: string[]
    trends: string[]
  }
  overall_score: number
  recommendations_count: number
  generated_at: string
}

class AIFinancialService {
  private patterns: Map<string, SpendingPattern> = new Map()
  private anomalies: AnomalyDetection[] = []
  private recommendations: SmartRecommendation[] = []
  private isAnalyzing = false
  private analysisInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startPeriodicAnalysis()
  }

  // Iniciar análise periódica
  private startPeriodicAnalysis() {
    // Limpar intervalo anterior se existir
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval)
    }
    
    // Analisar dados a cada 6 horas
    this.analysisInterval = setInterval(() => {
      if (!this.isAnalyzing) {
        this.performComprehensiveAnalysis()
      }
    }, 6 * 60 * 60 * 1000)

    // Análise inicial
    this.performComprehensiveAnalysis()
  }

  // Parar análise periódica
  stopAnalysis() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval)
      this.analysisInterval = null
    }
    this.isAnalyzing = false
    console.log('⏹️ Análise de IA financeira parada')
  }

  // Realizar análise abrangente
  private async performComprehensiveAnalysis() {
    if (this.isAnalyzing) return

    this.isAnalyzing = true
    console.log('🧠 Iniciando análise de IA financeira...')

    try {
      // Verificar autenticação
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session?.user) {
        console.log('⚠️ Usuário não autenticado, pulando análise de IA')
        return
      }

      const userId = session.user.id
      
      // Buscar transações do usuário
      const transactions = await this.getUserTransactions(userId)
      
      if (transactions.length === 0) {
        console.log('📊 Nenhuma transação encontrada para análise')
        return
      }

      // Executar análises em paralelo
      await Promise.all([
        this.analyzeSpendingPatterns(transactions),
        this.detectAnomalies(transactions),
        this.generateRecommendations(transactions, userId),
        this.analyzeSentiment(transactions),
        this.suggestCategories(transactions)
      ])

      console.log('✅ Análise de IA concluída com sucesso')
    } catch (error) {
      console.error('❌ Erro na análise de IA:', error)
    } finally {
      this.isAnalyzing = false
    }
  }

  // Analisar padrões de gastos
  private async analyzeSpendingPatterns(transactions: SheetData[]): Promise<void> {
    console.log('🔍 Analisando padrões de gastos...')

    const categoryMap = new Map<string, SheetData[]>()
    
    // Agrupar por categoria
    transactions.forEach(transaction => {
      if (transaction.tipo === 'despesa') {
        const category = transaction.categoria
        if (!categoryMap.has(category)) {
          categoryMap.set(category, [])
        }
        categoryMap.get(category)!.push(transaction)
      }
    })

    // Analisar cada categoria
    for (const [category, categoryTransactions] of categoryMap) {
      const pattern = this.analyzeCategoryPattern(category, categoryTransactions)
      this.patterns.set(category, pattern)
    }
  }

  // Analisar padrão de uma categoria
  private analyzeCategoryPattern(category: string, transactions: SheetData[]): SpendingPattern {
    if (transactions.length === 0) {
      return {
        category,
        frequency: 'irregular',
        average_amount: 0,
        trend: 'stable',
        confidence: 0
      }
    }

    // Calcular frequência
    const frequency = this.calculateFrequency(transactions)
    
    // Calcular valor médio
    const amounts = transactions.map(t => Math.abs(t.valor))
    const averageAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length
    
    // Calcular tendência
    const trend = this.calculateTrend(transactions)
    
    // Calcular confiança
    const confidence = this.calculatePatternConfidence(transactions, frequency)
    
    // Prever próxima transação
    const nextPrediction = this.predictNextTransaction(transactions, frequency)

    return {
      category,
      frequency,
      average_amount: Math.round(averageAmount * 100) / 100,
      trend,
      confidence: Math.round(confidence * 100) / 100,
      next_predicted_date: nextPrediction?.date,
      next_predicted_amount: nextPrediction?.amount
    }
  }

  // Calcular frequência de transações
  private calculateFrequency(transactions: SheetData[]): 'daily' | 'weekly' | 'monthly' | 'irregular' {
    if (transactions.length < 2) return 'irregular'

    const dates = transactions
      .map(t => new Date(t.data))
      .sort((a, b) => a.getTime() - b.getTime())

    const intervals = []
    for (let i = 1; i < dates.length; i++) {
      const diff = dates[i].getTime() - dates[i - 1].getTime()
      intervals.push(diff / (1000 * 60 * 60 * 24)) // Converter para dias
    }

    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length

    if (averageInterval <= 1) return 'daily'
    if (averageInterval <= 7) return 'weekly'
    if (averageInterval <= 30) return 'monthly'
    return 'irregular'
  }

  // Calcular tendência
  private calculateTrend(transactions: SheetData[]): 'increasing' | 'decreasing' | 'stable' {
    if (transactions.length < 3) return 'stable'

    const amounts = transactions
      .map(t => Math.abs(t.valor))
      .sort((a, b) => new Date(transactions.find(t => Math.abs(t.valor) === a)!.data).getTime() - 
                      new Date(transactions.find(t => Math.abs(t.valor) === b)!.data).getTime())

    const firstHalf = amounts.slice(0, Math.floor(amounts.length / 2))
    const secondHalf = amounts.slice(Math.floor(amounts.length / 2))

    const firstAvg = firstHalf.reduce((sum, amount) => sum + amount, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, amount) => sum + amount, 0) / secondHalf.length

    const change = ((secondAvg - firstAvg) / firstAvg) * 100

    if (change > 10) return 'increasing'
    if (change < -10) return 'decreasing'
    return 'stable'
  }

  // Calcular confiança do padrão
  private calculatePatternConfidence(transactions: SheetData[], frequency: string): number {
    const count = transactions.length
    const frequencyScore = frequency === 'irregular' ? 0.3 : 0.8
    const countScore = Math.min(count / 10, 1) // Máximo 1.0 para 10+ transações
    const consistencyScore = this.calculateConsistency(transactions)

    return (frequencyScore + countScore + consistencyScore) / 3
  }

  // Calcular consistência
  private calculateConsistency(transactions: SheetData[]): number {
    if (transactions.length < 3) return 0.5

    const amounts = transactions.map(t => Math.abs(t.valor))
    const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length
    const standardDeviation = Math.sqrt(variance)
    const coefficientOfVariation = standardDeviation / mean

    // Menor coeficiente de variação = maior consistência
    return Math.max(0, 1 - coefficientOfVariation)
  }

  // Prever próxima transação
  private predictNextTransaction(transactions: SheetData[], frequency: string): { date: string; amount: number } | null {
    if (transactions.length < 2) return null

    const lastTransaction = transactions[transactions.length - 1]
    const lastDate = new Date(lastTransaction.data)
    const amounts = transactions.map(t => Math.abs(t.valor))
    const averageAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length

    let nextDate: Date
    switch (frequency) {
      case 'daily':
        nextDate = new Date(lastDate.getTime() + 24 * 60 * 60 * 1000)
        break
      case 'weekly':
        nextDate = new Date(lastDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        break
      case 'monthly':
        nextDate = new Date(lastDate.getTime() + 30 * 24 * 60 * 60 * 1000)
        break
      default:
        return null
    }

    return {
      date: nextDate.toLocaleDateString('pt-BR'),
      amount: Math.round(averageAmount * 100) / 100
    }
  }

  // Detectar anomalias
  private async detectAnomalies(transactions: SheetData[]): Promise<void> {
    console.log('🔍 Detectando anomalias...')

    this.anomalies = []

    for (const transaction of transactions) {
      // Detectar valor incomum
      const amountAnomaly = this.detectAmountAnomaly(transaction, transactions)
      if (amountAnomaly) {
        this.anomalies.push(amountAnomaly)
      }

      // Detectar categoria incomum
      const categoryAnomaly = this.detectCategoryAnomaly(transaction, transactions)
      if (categoryAnomaly) {
        this.anomalies.push(categoryAnomaly)
      }

      // Detectar timing incomum
      const timingAnomaly = this.detectTimingAnomaly(transaction, transactions)
      if (timingAnomaly) {
        this.anomalies.push(timingAnomaly)
      }

      // Detectar risco de duplicata
      const duplicateAnomaly = this.detectDuplicateRisk(transaction, transactions)
      if (duplicateAnomaly) {
        this.anomalies.push(duplicateAnomaly)
      }
    }
  }

  // Detectar anomalia de valor
  private detectAmountAnomaly(transaction: SheetData, allTransactions: SheetData[]): AnomalyDetection | null {
    if (transaction.tipo !== 'despesa') return null

    const categoryTransactions = allTransactions.filter(t => 
      t.categoria === transaction.categoria && t.tipo === 'despesa'
    )

    if (categoryTransactions.length < 3) return null

    const amounts = categoryTransactions.map(t => Math.abs(t.valor))
    const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length
    const standardDeviation = Math.sqrt(variance)

    const zScore = Math.abs(Math.abs(transaction.valor) - mean) / standardDeviation

    if (zScore > 2) {
      return {
        transaction_id: transaction.id,
        type: 'unusual_amount',
        severity: zScore > 3 ? 'high' : 'medium',
        description: `Valor ${Math.abs(transaction.valor)} é ${zScore.toFixed(1)}x o desvio padrão da categoria`,
        confidence: Math.min(zScore / 5, 1),
        suggested_action: 'Verificar se o valor está correto',
        original_value: transaction.valor,
        expected_value: mean
      }
    }

    return null
  }

  // Detectar anomalia de categoria
  private detectCategoryAnomaly(transaction: SheetData, allTransactions: SheetData[]): AnomalyDetection | null {
    // Implementar lógica de detecção de categoria incomum
    return null
  }

  // Detectar anomalia de timing
  private detectTimingAnomaly(transaction: SheetData, allTransactions: SheetData[]): AnomalyDetection | null {
    // Implementar lógica de detecção de timing incomum
    return null
  }

  // Detectar risco de duplicata
  private detectDuplicateRisk(transaction: SheetData, allTransactions: SheetData[]): AnomalyDetection | null {
    const similarTransactions = allTransactions.filter(t => 
      t.id !== transaction.id &&
      Math.abs(t.valor - transaction.valor) < 0.01 &&
      this.calculateSimilarity(t.descricao, transaction.descricao) > 0.8
    )

    if (similarTransactions.length > 0) {
      return {
        transaction_id: transaction.id,
        type: 'duplicate_risk',
        severity: 'medium',
        description: `Possível duplicata: ${similarTransactions.length} transação(ões) similar(es) encontrada(s)`,
        confidence: 0.8,
        suggested_action: 'Verificar se é uma transação duplicada',
        original_value: transaction,
        expected_value: similarTransactions[0]
      }
    }

    return null
  }

  // Calcular similaridade entre strings
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 1.0

    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  // Distância de Levenshtein
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  // Gerar recomendações inteligentes
  private async generateRecommendations(transactions: SheetData[], userId: string): Promise<void> {
    console.log('💡 Gerando recomendações inteligentes...')

    this.recommendations = []

    // Analisar padrões de gastos
    const spendingAnalysis = this.analyzeSpendingBehavior(transactions)
    
    // Gerar recomendações baseadas em padrões
    this.generateSpendingRecommendations(spendingAnalysis)
    
    // Gerar recomendações de economia
    this.generateSavingsRecommendations(transactions)
    
    // Gerar recomendações de investimento
    this.generateInvestmentRecommendations(transactions)
    
    // Gerar recomendações de orçamento
    this.generateBudgetRecommendations(transactions)
  }

  // Analisar comportamento de gastos
  private analyzeSpendingBehavior(transactions: SheetData[]): any {
    const expenses = transactions.filter(t => t.tipo === 'despesa')
    const income = transactions.filter(t => t.tipo === 'receita')
    
    const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.valor), 0)
    const totalIncome = income.reduce((sum, t) => sum + t.valor, 0)
    
    const categories = this.analyzeCategories(expenses)
    const trends = this.analyzeTrends(expenses)
    
    return {
      totalExpenses,
      totalIncome,
      netBalance: totalIncome - totalExpenses,
      categories,
      trends,
      expenseCount: expenses.length,
      incomeCount: income.length
    }
  }

  // Analisar categorias
  private analyzeCategories(expenses: SheetData[]): any[] {
    const categoryMap = new Map<string, { total: number; count: number }>()
    
    expenses.forEach(expense => {
      const category = expense.categoria
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { total: 0, count: 0 })
      }
      const data = categoryMap.get(category)!
      data.total += Math.abs(expense.valor)
      data.count += 1
    })

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      average: data.total / data.count,
      percentage: (data.total / expenses.reduce((sum, t) => sum + Math.abs(t.valor), 0)) * 100
    })).sort((a, b) => b.total - a.total)
  }

  // Analisar tendências
  private analyzeTrends(expenses: SheetData[]): any {
    const monthlyData = new Map<string, number>()
    
    expenses.forEach(expense => {
      const month = new Date(expense.data).toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'long' 
      })
      const current = monthlyData.get(month) || 0
      monthlyData.set(month, current + Math.abs(expense.valor))
    })

    const monthlyArray = Array.from(monthlyData.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())

    if (monthlyArray.length < 2) {
      return { trend: 'stable', change: 0 }
    }

    const firstMonth = monthlyArray[0][1]
    const lastMonth = monthlyArray[monthlyArray.length - 1][1]
    const change = ((lastMonth - firstMonth) / firstMonth) * 100

    return {
      trend: change > 10 ? 'increasing' : change < -10 ? 'decreasing' : 'stable',
      change: Math.round(change * 100) / 100,
      monthlyData: monthlyArray
    }
  }

  // Gerar recomendações de gastos
  private generateSpendingRecommendations(analysis: any): void {
    const { categories, trends, netBalance } = analysis

    // Recomendação para categoria com maior gasto
    if (categories.length > 0) {
      const topCategory = categories[0]
      if (topCategory.percentage > 40) {
        this.recommendations.push({
          id: `spending_${Date.now()}`,
          type: 'expense_optimization',
          priority: 'high',
          title: `Otimizar gastos em ${topCategory.category}`,
          description: `${topCategory.category} representa ${topCategory.percentage.toFixed(1)}% dos seus gastos. Considere revisar esta categoria.`,
          potential_savings: topCategory.total * 0.1, // 10% de economia potencial
          implementation_difficulty: 'medium',
          timeframe: 'short_term',
          action_items: [
            'Revisar transações desta categoria',
            'Identificar gastos desnecessários',
            'Procurar alternativas mais baratas'
          ],
          success_probability: 0.7
        })
      }
    }

    // Recomendação para tendência crescente
    if (trends.trend === 'increasing') {
      this.recommendations.push({
        id: `trend_${Date.now()}`,
        type: 'budget',
        priority: 'medium',
        title: 'Controlar tendência crescente de gastos',
        description: `Seus gastos aumentaram ${trends.change}% no período. Considere criar um orçamento.`,
        implementation_difficulty: 'easy',
        timeframe: 'immediate',
        action_items: [
          'Definir limites mensais por categoria',
          'Acompanhar gastos semanalmente',
          'Usar alertas de orçamento'
        ],
        success_probability: 0.8
      })
    }
  }

  // Gerar recomendações de economia
  private generateSavingsRecommendations(transactions: SheetData[]): void {
    const expenses = transactions.filter(t => t.tipo === 'despesa')
    const income = transactions.filter(t => t.tipo === 'receita')
    
    const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.valor), 0)
    const totalIncome = income.reduce((sum, t) => sum + t.valor, 0)
    const netBalance = totalIncome - totalExpenses

    if (netBalance > 0) {
      this.recommendations.push({
        id: `savings_${Date.now()}`,
        type: 'savings',
        priority: 'high',
        title: 'Aproveitar saldo positivo para poupança',
        description: `Você tem um saldo positivo de R$ ${netBalance.toFixed(2)}. Considere investir parte deste valor.`,
        potential_savings: netBalance * 0.5, // 50% do saldo
        implementation_difficulty: 'easy',
        timeframe: 'immediate',
        action_items: [
          'Abrir conta poupança',
          'Considerar investimentos de baixo risco',
          'Definir meta de economia mensal'
        ],
        success_probability: 0.9
      })
    }
  }

  // Gerar recomendações de investimento
  private generateInvestmentRecommendations(transactions: SheetData[]): void {
    // Implementar lógica de recomendações de investimento
  }

  // Gerar recomendações de orçamento
  private generateBudgetRecommendations(transactions: SheetData[]): void {
    // Implementar lógica de recomendações de orçamento
  }

  // Analisar sentimento
  private async analyzeSentiment(transactions: SheetData[]): Promise<void> {
    console.log('😊 Analisando sentimento das transações...')
    
    // Implementar análise de sentimento
    // Por enquanto, simular análise básica
  }

  // Sugerir categorias
  private async suggestCategories(transactions: SheetData[]): Promise<void> {
    console.log('🏷️ Sugerindo categorias...')
    
    // Implementar sugestão de categorias
    // Por enquanto, simular sugestões básicas
  }

  // Buscar transações do usuário
  private async getUserTransactions(userId: string): Promise<SheetData[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('data', { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar transações:', error)
        return []
      }

      return (data || []).map((item: any) => ({
        id: item.id.toString(),
        data: this.formatDateForDisplay(item.data),
        valor: parseFloat(item.valor) || 0,
        descricao: item.descricao,
        conta: item.conta || 'Conta Corrente',
        contaTransferencia: item.conta_transferencia,
        cartao: item.cartao,
        categoria: item.categoria || 'Outros',
        subcategoria: item.subcategoria,
        contato: item.contato,
        centro: item.centro,
        projeto: item.projeto,
        forma: item.forma || 'Dinheiro',
        numeroDocumento: item.numero_documento,
        observacoes: item.observacoes,
        dataCompetencia: this.formatDateForDisplay(item.data_competencia),
        tags: item.tags ? JSON.parse(item.tags) : [],
        status: item.status || this.calculateStatus(item.vencimento, item.data_pagamento),
        dataPagamento: this.formatDateForDisplay(item.data_pagamento) || '',
        vencimento: this.formatDateForDisplay(item.vencimento),
        empresa: item.empresa,
        tipo: item.tipo || 'despesa',
        parcela: item.parcela || '1',
        situacao: item.situacao || ''
      }))
    } catch (error) {
      console.error('❌ Erro ao buscar transações:', error)
      return []
    }
  }

  // Formatar data para exibição
  private formatDateForDisplay(dateStr: string): string {
    if (!dateStr) return ''
    
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('pt-BR')
    } catch {
      return dateStr
    }
  }

  // Calcular status
  private calculateStatus(vencimento: string, dataPagamento?: string | null): 'pago' | 'pendente' | 'vencido' {
    if (dataPagamento) return 'pago'
    
    const hoje = new Date()
    const dataVencimento = this.parseBrazilianDate(vencimento)
    
    if (!dataVencimento) return 'pendente'
    
    return dataVencimento < hoje ? 'vencido' : 'pendente'
  }

  // Parsear data brasileira
  private parseBrazilianDate(dateStr: string): Date | null {
    if (!dateStr) return null
    
    const parts = dateStr.split('/')
    if (parts.length !== 3) return null
    
    const day = parseInt(parts[0])
    const month = parseInt(parts[1]) - 1
    const year = parseInt(parts[2])
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null
    
    const date = new Date(year, month, day)
    if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
      return date
    }
    
    return null
  }

  // Métodos públicos
  async generateFinancialPrediction(userId: string, months: number = 3): Promise<FinancialPrediction> {
    const transactions = await this.getUserTransactions(userId)
    const expenses = transactions.filter(t => t.tipo === 'despesa')
    const income = transactions.filter(t => t.tipo === 'receita')
    
    // Calcular médias
    const avgExpenses = expenses.length > 0 ? 
      expenses.reduce((sum, t) => sum + Math.abs(t.valor), 0) / expenses.length : 0
    const avgIncome = income.length > 0 ? 
      income.reduce((sum, t) => sum + t.valor, 0) / income.length : 0
    
    // Aplicar tendências
    const trends = this.analyzeTrends(expenses)
    const trendFactor = trends.trend === 'increasing' ? 1.1 : trends.trend === 'decreasing' ? 0.9 : 1.0
    
    const predictedExpenses = avgExpenses * months * trendFactor
    const predictedIncome = avgIncome * months
    const predictedBalance = predictedIncome - predictedExpenses
    
    return {
      period: `${months} meses`,
      predicted_income: Math.round(predictedIncome * 100) / 100,
      predicted_expenses: Math.round(predictedExpenses * 100) / 100,
      predicted_balance: Math.round(predictedBalance * 100) / 100,
      confidence: 0.7,
      factors: [
        `Tendência: ${trends.trend}`,
        `Baseado em ${transactions.length} transações`,
        `Período de análise: ${months} meses`
      ],
      recommendations: this.generatePredictionRecommendations(predictedBalance, trends)
    }
  }

  // Gerar recomendações de previsão
  private generatePredictionRecommendations(balance: number, trends: any): string[] {
    const recommendations = []
    
    if (balance < 0) {
      recommendations.push('Considere reduzir gastos ou aumentar receitas')
    }
    
    if (trends.trend === 'increasing') {
      recommendations.push('Monitore a tendência crescente de gastos')
    }
    
    if (balance > 0) {
      recommendations.push('Aproveite o saldo positivo para investimentos')
    }
    
    return recommendations
  }

  getSpendingPatterns(): SpendingPattern[] {
    return Array.from(this.patterns.values())
  }

  getAnomalies(): AnomalyDetection[] {
    return [...this.anomalies]
  }

  getRecommendations(): SmartRecommendation[] {
    return [...this.recommendations]
  }

  async forceAnalysis(): Promise<void> {
    await this.performComprehensiveAnalysis()
  }
}

// Instância singleton do serviço de IA financeira
export const aiFinancialService = new AIFinancialService()
export default aiFinancialService
