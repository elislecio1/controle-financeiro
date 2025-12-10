// Serviço de Relatórios Avançados
import { supabase } from './supabase'
import { SheetData } from '../types'

export interface ReportConfig {
  id: string
  name: string
  type: 'financial' | 'performance' | 'user_activity' | 'system_health'
  parameters: Record<string, any>
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    time: string
    enabled: boolean
  }
  recipients: string[]
  format: 'pdf' | 'excel' | 'csv' | 'json'
  created_at: string
  updated_at: string
}

export interface FinancialReport {
  period: {
    start: string
    end: string
  }
  summary: {
    total_income: number
    total_expenses: number
    net_balance: number
    transaction_count: number
  }
  categories: {
    name: string
    income: number
    expenses: number
    net: number
    percentage: number
  }[]
  trends: {
    daily_balance: { date: string; balance: number }[]
    monthly_comparison: { month: string; income: number; expenses: number }[]
  }
  top_transactions: {
    highest_income: SheetData[]
    highest_expenses: SheetData[]
    recent_transactions: SheetData[]
  }
  insights: {
    spending_patterns: string[]
    recommendations: string[]
    alerts: string[]
  }
}

export interface PerformanceReport {
  period: {
    start: string
    end: string
  }
  metrics: {
    page_load_times: { date: string; time: number }[]
    api_response_times: { date: string; time: number }[]
    error_rates: { date: string; rate: number }[]
    user_activity: { date: string; active_users: number }[]
  }
  system_health: {
    uptime_percentage: number
    average_response_time: number
    error_count: number
    critical_alerts: number
  }
  recommendations: string[]
}

export interface UserActivityReport {
  period: {
    start: string
    end: string
  }
  user_stats: {
    total_users: number
    active_users: number
    new_users: number
    inactive_users: number
  }
  activity_patterns: {
    login_times: { hour: number; count: number }[]
    feature_usage: { feature: string; count: number }[]
    device_types: { type: string; count: number }[]
  }
  engagement: {
    average_session_duration: number
    pages_per_session: number
    bounce_rate: number
  }
}

class ReportsService {
  private reportConfigs: ReportConfig[] = []
  private generatedReports: Map<string, any> = new Map()

  constructor() {
    this.initializeDefaultConfigs()
  }

  // Inicializar configurações padrão
  private initializeDefaultConfigs() {
    this.reportConfigs = [
      {
        id: 'monthly_financial',
        name: 'Relatório Financeiro Mensal',
        type: 'financial',
        parameters: {
          period: 'monthly',
          include_charts: true,
          include_insights: true
        },
        schedule: {
          frequency: 'monthly',
          time: '09:00',
          enabled: true
        },
        recipients: ['admin@example.com'],
        format: 'pdf',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'weekly_performance',
        name: 'Relatório de Performance Semanal',
        type: 'performance',
        parameters: {
          period: 'weekly',
          include_metrics: true,
          include_recommendations: true
        },
        schedule: {
          frequency: 'weekly',
          time: '08:00',
          enabled: true
        },
        recipients: ['admin@example.com'],
        format: 'excel',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  }

  // Gerar relatório financeiro
  async generateFinancialReport(
    userId: string, 
    startDate: string, 
    endDate: string,
    options: {
      includeCharts?: boolean
      includeInsights?: boolean
      categories?: string[]
    } = {}
  ): Promise<FinancialReport> {
    try {
      // Buscar transações do período
      const transactions = await this.getTransactionsInPeriod(userId, startDate, endDate)
      
      // Calcular resumo
      const summary = this.calculateFinancialSummary(transactions)
      
      // Analisar por categorias
      const categories = this.analyzeCategories(transactions)
      
      // Calcular tendências
      const trends = this.calculateTrends(transactions, startDate, endDate)
      
      // Identificar top transações
      const topTransactions = this.getTopTransactions(transactions)
      
      // Gerar insights
      const insights = options.includeInsights ? 
        this.generateFinancialInsights(transactions, summary, categories) : 
        { spending_patterns: [], recommendations: [], alerts: [] }

      return {
        period: { start: startDate, end: endDate },
        summary,
        categories,
        trends,
        top_transactions: topTransactions,
        insights
      }
    } catch (error) {
      console.error('❌ Erro ao gerar relatório financeiro:', error)
      throw error
    }
  }

  // Gerar relatório de performance
  async generatePerformanceReport(
    startDate: string, 
    endDate: string
  ): Promise<PerformanceReport> {
    try {
      // Buscar métricas de performance
      const metrics = await this.getPerformanceMetrics(startDate, endDate)
      
      // Calcular saúde do sistema
      const systemHealth = this.calculateSystemHealth(metrics)
      
      // Gerar recomendações
      const recommendations = this.generatePerformanceRecommendations(metrics, systemHealth)

      return {
        period: { start: startDate, end: endDate },
        metrics,
        system_health: systemHealth,
        recommendations
      }
    } catch (error) {
      console.error('❌ Erro ao gerar relatório de performance:', error)
      throw error
    }
  }

  // Gerar relatório de atividade do usuário
  async generateUserActivityReport(
    startDate: string, 
    endDate: string
  ): Promise<UserActivityReport> {
    try {
      // Buscar dados de atividade
      const activityData = await this.getUserActivityData(startDate, endDate)
      
      // Calcular estatísticas de usuários
      const userStats = this.calculateUserStats(activityData)
      
      // Analisar padrões de atividade
      const activityPatterns = this.analyzeActivityPatterns(activityData)
      
      // Calcular engajamento
      const engagement = this.calculateEngagement(activityData)

      return {
        period: { start: startDate, end: endDate },
        user_stats: userStats,
        activity_patterns: activityPatterns,
        engagement
      }
    } catch (error) {
      console.error('❌ Erro ao gerar relatório de atividade:', error)
      throw error
    }
  }

  // Buscar transações do período
  private async getTransactionsInPeriod(userId: string, startDate: string, endDate: string): Promise<SheetData[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('data', startDate)
        .lte('data', endDate)
        .order('data', { ascending: true })

      if (error) {
        console.error('❌ Erro ao buscar transações:', error)
        return []
      }

      // Converter para formato SheetData
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

  // Calcular resumo financeiro
  private calculateFinancialSummary(transactions: SheetData[]) {
    const income = transactions
      .filter(t => t.tipo === 'receita')
      .reduce((sum, t) => sum + t.valor, 0)
    
    const expenses = transactions
      .filter(t => t.tipo === 'despesa')
      .reduce((sum, t) => sum + Math.abs(t.valor), 0)
    
    const netBalance = income - expenses
    const transactionCount = transactions.length

    return {
      total_income: income,
      total_expenses: expenses,
      net_balance: netBalance,
      transaction_count: transactionCount
    }
  }

  // Analisar por categorias
  private analyzeCategories(transactions: SheetData[]) {
    const categoryMap = new Map<string, { income: number; expenses: number }>()

    transactions.forEach(transaction => {
      const category = transaction.categoria
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { income: 0, expenses: 0 })
      }

      const categoryData = categoryMap.get(category)!
      if (transaction.tipo === 'receita') {
        categoryData.income += transaction.valor
      } else {
        categoryData.expenses += Math.abs(transaction.valor)
      }
    })

    const totalExpenses = transactions
      .filter(t => t.tipo === 'despesa')
      .reduce((sum, t) => sum + Math.abs(t.valor), 0)

    return Array.from(categoryMap.entries()).map(([name, data]) => {
      const net = data.income - data.expenses
      const percentage = totalExpenses > 0 ? (data.expenses / totalExpenses) * 100 : 0

      return {
        name,
        income: data.income,
        expenses: data.expenses,
        net,
        percentage: Math.round(percentage * 100) / 100
      }
    }).sort((a, b) => b.expenses - a.expenses)
  }

  // Calcular tendências
  private calculateTrends(transactions: SheetData[], startDate: string, endDate: string) {
    // Agrupar por dia
    const dailyMap = new Map<string, { income: number; expenses: number }>()
    
    transactions.forEach(transaction => {
      const date = transaction.data
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { income: 0, expenses: 0 })
      }

      const dayData = dailyMap.get(date)!
      if (transaction.tipo === 'receita') {
        dayData.income += transaction.valor
      } else {
        dayData.expenses += Math.abs(transaction.valor)
      }
    })

    const dailyBalance = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        balance: data.income - data.expenses
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Calcular saldo acumulado
    let runningBalance = 0
    const dailyBalanceWithRunning = dailyBalance.map(day => {
      runningBalance += day.balance
      return { ...day, balance: runningBalance }
    })

    // Agrupar por mês
    const monthlyMap = new Map<string, { income: number; expenses: number }>()
    
    transactions.forEach(transaction => {
      const month = new Date(transaction.data).toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'long' 
      })
      
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { income: 0, expenses: 0 })
      }

      const monthData = monthlyMap.get(month)!
      if (transaction.tipo === 'receita') {
        monthData.income += transaction.valor
      } else {
        monthData.expenses += Math.abs(transaction.valor)
      }
    })

    const monthlyComparison = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

    return {
      daily_balance: dailyBalanceWithRunning,
      monthly_comparison: monthlyComparison
    }
  }

  // Obter top transações
  private getTopTransactions(transactions: SheetData[]) {
    const income = transactions
      .filter(t => t.tipo === 'receita')
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5)

    const expenses = transactions
      .filter(t => t.tipo === 'despesa')
      .sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor))
      .slice(0, 5)

    const recent = transactions
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 10)

    return {
      highest_income: income,
      highest_expenses: expenses,
      recent_transactions: recent
    }
  }

  // Gerar insights financeiros
  private generateFinancialInsights(
    transactions: SheetData[], 
    summary: any, 
    categories: any[]
  ) {
    const insights = {
      spending_patterns: [] as string[],
      recommendations: [] as string[],
      alerts: [] as string[]
    }

    // Padrões de gastos
    if (summary.net_balance < 0) {
      insights.spending_patterns.push('Gastos superam receitas no período')
    }

    const topCategory = categories[0]
    if (topCategory && topCategory.percentage > 50) {
      insights.spending_patterns.push(`${topCategory.name} representa ${topCategory.percentage}% dos gastos`)
    }

    // Recomendações
    if (summary.net_balance < 0) {
      insights.recommendations.push('Considere reduzir gastos ou aumentar receitas')
    }

    if (topCategory && topCategory.percentage > 40) {
      insights.recommendations.push(`Revise gastos em ${topCategory.name} - muito concentrado`)
    }

    // Alertas
    const overdueCount = transactions.filter(t => 
      t.status === 'vencido' && t.tipo === 'despesa'
    ).length

    if (overdueCount > 0) {
      insights.alerts.push(`${overdueCount} transações vencidas precisam de atenção`)
    }

    return insights
  }

  // Buscar métricas de performance
  private async getPerformanceMetrics(startDate: string, endDate: string) {
    // Simular métricas de performance
    // Em produção, isso viria do banco de dados
    return {
      page_load_times: [],
      api_response_times: [],
      error_rates: [],
      user_activity: []
    }
  }

  // Calcular saúde do sistema
  private calculateSystemHealth(metrics: any) {
    return {
      uptime_percentage: 99.9,
      average_response_time: 150,
      error_count: 0,
      critical_alerts: 0
    }
  }

  // Gerar recomendações de performance
  private generatePerformanceRecommendations(metrics: any, systemHealth: any) {
    const recommendations = []

    if (systemHealth.average_response_time > 1000) {
      recommendations.push('Considere otimizar consultas de banco de dados')
    }

    if (systemHealth.uptime_percentage < 99) {
      recommendations.push('Implementar monitoramento de disponibilidade')
    }

    return recommendations
  }

  // Buscar dados de atividade do usuário
  private async getUserActivityData(startDate: string, endDate: string) {
    // Simular dados de atividade
    return {
      users: [],
      sessions: [],
      activities: []
    }
  }

  // Calcular estatísticas de usuários
  private calculateUserStats(activityData: any) {
    return {
      total_users: 0,
      active_users: 0,
      new_users: 0,
      inactive_users: 0
    }
  }

  // Analisar padrões de atividade
  private analyzeActivityPatterns(activityData: any) {
    return {
      login_times: [],
      feature_usage: [],
      device_types: []
    }
  }

  // Calcular engajamento
  private calculateEngagement(activityData: any) {
    return {
      average_session_duration: 0,
      pages_per_session: 0,
      bounce_rate: 0
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
  async generateReport(
    type: 'financial' | 'performance' | 'user_activity',
    userId: string,
    startDate: string,
    endDate: string,
    options: any = {}
  ) {
    switch (type) {
      case 'financial':
        return await this.generateFinancialReport(userId, startDate, endDate, options)
      case 'performance':
        return await this.generatePerformanceReport(startDate, endDate)
      case 'user_activity':
        return await this.generateUserActivityReport(startDate, endDate)
      default:
        throw new Error('Tipo de relatório não suportado')
    }
  }

  getReportConfigs(): ReportConfig[] {
    return [...this.reportConfigs]
  }

  async scheduleReport(configId: string, enabled: boolean): Promise<void> {
    const config = this.reportConfigs.find(c => c.id === configId)
    if (config && config.schedule) {
      config.schedule.enabled = enabled
      console.log(`📊 Relatório ${configId} ${enabled ? 'agendado' : 'desagendado'}`)
    }
  }
}

// Instância singleton do serviço de relatórios
export const reportsService = new ReportsService()
export default reportsService
