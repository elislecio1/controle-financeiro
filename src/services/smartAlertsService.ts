// Serviço de Alertas Inteligentes
import { supabase } from './supabase'
import { SheetData } from '../types'
import { notificationService } from './notificationService'

export interface SmartAlert {
  id: string
  user_id: string
  type: 'payment_due' | 'payment_overdue' | 'budget_exceeded' | 'unusual_spending' | 'goal_achieved' | 'goal_at_risk'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  data: any
  created_at: string
  read: boolean
  action_required: boolean
  action_taken?: boolean
}

export interface AlertRule {
  id: string
  user_id: string
  name: string
  type: string
  conditions: any[]
  enabled: boolean
  notification_channels: string[]
  created_at: string
}

class SmartAlertsService {
  private alertRules: AlertRule[] = []
  private isProcessing = false

  constructor() {
    this.initializeDefaultRules()
    this.startAlertProcessor()
  }

  // Inicializar regras padrão
  private initializeDefaultRules() {
    this.alertRules = [
      {
        id: 'payment_due_today',
        user_id: 'default',
        name: 'Pagamento Vence Hoje',
        type: 'payment_due',
        conditions: [
          { field: 'vencimento', operator: 'equals', value: 'today' },
          { field: 'status', operator: 'equals', value: 'pendente' }
        ],
        enabled: true,
        notification_channels: ['browser', 'email'],
        created_at: new Date().toISOString()
      },
      {
        id: 'payment_overdue',
        user_id: 'default',
        name: 'Pagamento Vencido',
        type: 'payment_overdue',
        conditions: [
          { field: 'vencimento', operator: 'less_than', value: 'today' },
          { field: 'status', operator: 'equals', value: 'pendente' }
        ],
        enabled: true,
        notification_channels: ['browser', 'email', 'whatsapp'],
        created_at: new Date().toISOString()
      },
      {
        id: 'unusual_spending',
        user_id: 'default',
        name: 'Gasto Incomum',
        type: 'unusual_spending',
        conditions: [
          { field: 'valor', operator: 'greater_than', value: 'threshold' },
          { field: 'categoria', operator: 'equals', value: 'unusual' }
        ],
        enabled: true,
        notification_channels: ['browser', 'email'],
        created_at: new Date().toISOString()
      }
    ]
  }

  // Iniciar processador de alertas
  private startAlertProcessor() {
    // Processar alertas a cada 5 minutos
    setInterval(() => {
      if (!this.isProcessing) {
        this.processAlerts()
      }
    }, 5 * 60 * 1000)

    // Processar alertas imediatamente
    this.processAlerts()
  }

  // Processar alertas
  private async processAlerts() {
    if (this.isProcessing) return

    this.isProcessing = true
    console.log('🔍 Processando alertas inteligentes...')

    try {
      // Verificar autenticação
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session?.user) {
        console.log('⚠️ Usuário não autenticado, pulando processamento de alertas')
        return
      }

      // Buscar transações do usuário
      const transactions = await this.getUserTransactions(session.user.id)
      
      // Processar cada regra de alerta
      for (const rule of this.alertRules) {
        if (!rule.enabled) continue

        await this.processAlertRule(rule, transactions, session.user.id)
      }

      console.log('✅ Processamento de alertas concluído')
    } catch (error) {
      console.error('❌ Erro ao processar alertas:', error)
    } finally {
      this.isProcessing = false
    }
  }

  // Processar regra de alerta específica
  private async processAlertRule(rule: AlertRule, transactions: SheetData[], userId: string) {
    try {
      switch (rule.type) {
        case 'payment_due':
          await this.checkPaymentDue(transactions, userId)
          break
        case 'payment_overdue':
          await this.checkPaymentOverdue(transactions, userId)
          break
        case 'unusual_spending':
          await this.checkUnusualSpending(transactions, userId)
          break
        case 'budget_exceeded':
          await this.checkBudgetExceeded(transactions, userId)
          break
        case 'goal_achieved':
          await this.checkGoalAchieved(transactions, userId)
          break
        case 'goal_at_risk':
          await this.checkGoalAtRisk(transactions, userId)
          break
      }
    } catch (error) {
      console.error(`❌ Erro ao processar regra ${rule.name}:`, error)
    }
  }

  // Verificar pagamentos que vencem hoje
  private async checkPaymentDue(transactions: SheetData[], userId: string) {
    const today = new Date().toLocaleDateString('pt-BR')
    
    const dueToday = transactions.filter(transaction => {
      return transaction.vencimento === today && 
             transaction.status === 'pendente' &&
             transaction.tipo === 'despesa'
    })

    for (const transaction of dueToday) {
      // Verificar se já existe alerta para esta transação hoje
      const existingAlert = await this.getExistingAlert(userId, 'payment_due', transaction.id)
      if (existingAlert) continue

      // Criar alerta
      const alert: Omit<SmartAlert, 'id' | 'created_at'> = {
        user_id: userId,
        type: 'payment_due',
        title: '⚠️ Pagamento Vence Hoje',
        message: `${transaction.descricao} - R$ ${Math.abs(transaction.valor).toFixed(2)} vence hoje!`,
        priority: 'high',
        data: {
          transaction_id: transaction.id,
          descricao: transaction.descricao,
          valor: transaction.valor,
          vencimento: transaction.vencimento
        },
        read: false,
        action_required: true
      }

      await this.createAlert(alert)
      
      // Enviar notificação
      await notificationService.sendPaymentReminder(userId, transaction)
    }
  }

  // Verificar pagamentos vencidos
  private async checkPaymentOverdue(transactions: SheetData[], userId: string) {
    const today = new Date()
    
    const overdue = transactions.filter(transaction => {
      if (transaction.status === 'pago' || transaction.tipo !== 'despesa') return false
      
      const dueDate = this.parseBrazilianDate(transaction.vencimento)
      if (!dueDate) return false
      
      return dueDate < today
    })

    for (const transaction of overdue) {
      const daysOverdue = Math.ceil((today.getTime() - this.parseBrazilianDate(transaction.vencimento)!.getTime()) / (1000 * 60 * 60 * 24))
      
      // Verificar se já existe alerta para esta transação hoje
      const existingAlert = await this.getExistingAlert(userId, 'payment_overdue', transaction.id)
      if (existingAlert) continue

      // Criar alerta
      const alert: Omit<SmartAlert, 'id' | 'created_at'> = {
        user_id: userId,
        type: 'payment_overdue',
        title: '🚨 Pagamento Vencido',
        message: `${transaction.descricao} - R$ ${Math.abs(transaction.valor).toFixed(2)} está vencido há ${daysOverdue} dias`,
        priority: 'urgent',
        data: {
          transaction_id: transaction.id,
          descricao: transaction.descricao,
          valor: transaction.valor,
          vencimento: transaction.vencimento,
          dias_vencido: daysOverdue
        },
        read: false,
        action_required: true
      }

      await this.createAlert(alert)
      
      // Enviar notificação
      await notificationService.sendOverdueAlert(userId, transaction, daysOverdue)
    }
  }

  // Verificar gastos incomuns
  private async checkUnusualSpending(transactions: SheetData[], userId: string) {
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)

    const recentTransactions = transactions.filter(transaction => {
      const transactionDate = this.parseBrazilianDate(transaction.data)
      return transactionDate && transactionDate >= last30Days && transaction.tipo === 'despesa'
    })

    // Calcular média de gastos por categoria
    const categoryAverages = this.calculateCategoryAverages(recentTransactions)

    for (const transaction of recentTransactions) {
      const categoryAverage = categoryAverages[transaction.categoria] || 0
      const threshold = categoryAverage * 2 // 2x a média

      if (Math.abs(transaction.valor) > threshold) {
        // Verificar se já existe alerta para esta transação
        const existingAlert = await this.getExistingAlert(userId, 'unusual_spending', transaction.id)
        if (existingAlert) continue

        // Criar alerta
        const alert: Omit<SmartAlert, 'id' | 'created_at'> = {
          user_id: userId,
          type: 'unusual_spending',
          title: '📊 Gasto Incomum Detectado',
          message: `Gasto de R$ ${Math.abs(transaction.valor).toFixed(2)} em ${transaction.categoria} é ${(Math.abs(transaction.valor) / categoryAverage).toFixed(1)}x maior que a média`,
          priority: 'medium',
          data: {
            transaction_id: transaction.id,
            descricao: transaction.descricao,
            valor: transaction.valor,
            categoria: transaction.categoria,
            media_categoria: categoryAverage,
            multiplicador: Math.abs(transaction.valor) / categoryAverage
          },
          read: false,
          action_required: false
        }

        await this.createAlert(alert)
      }
    }
  }

  // Verificar orçamento excedido
  private async checkBudgetExceeded(transactions: SheetData[], userId: string) {
    // Implementar verificação de orçamento
    console.log('🔍 Verificando orçamentos...')
  }

  // Verificar meta alcançada
  private async checkGoalAchieved(transactions: SheetData[], userId: string) {
    // Implementar verificação de metas
    console.log('🔍 Verificando metas...')
  }

  // Verificar meta em risco
  private async checkGoalAtRisk(transactions: SheetData[], userId: string) {
    // Implementar verificação de metas em risco
    console.log('🔍 Verificando metas em risco...')
  }

  // Calcular médias por categoria
  private calculateCategoryAverages(transactions: SheetData[]): Record<string, number> {
    const categoryTotals: Record<string, { total: number; count: number }> = {}

    for (const transaction of transactions) {
      if (transaction.tipo === 'despesa') {
        if (!categoryTotals[transaction.categoria]) {
          categoryTotals[transaction.categoria] = { total: 0, count: 0 }
        }
        categoryTotals[transaction.categoria].total += Math.abs(transaction.valor)
        categoryTotals[transaction.categoria].count += 1
      }
    }

    const averages: Record<string, number> = {}
    for (const [category, data] of Object.entries(categoryTotals)) {
      averages[category] = data.total / data.count
    }

    return averages
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

  // Buscar transações do usuário
  private async getUserTransactions(userId: string): Promise<SheetData[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)

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

  // Verificar se já existe alerta
  private async getExistingAlert(userId: string, type: string, transactionId: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('smart_alerts')
        .select('id')
        .eq('user_id', userId)
        .eq('type', type)
        .eq('data->transaction_id', transactionId)
        .gte('created_at', today)
        .limit(1)

      if (error) {
        console.error('❌ Erro ao verificar alerta existente:', error)
        return false
      }

      return data && data.length > 0
    } catch (error) {
      console.error('❌ Erro ao verificar alerta existente:', error)
      return false
    }
  }

  // Criar alerta
  private async createAlert(alert: Omit<SmartAlert, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('smart_alerts')
        .insert({
          ...alert,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('❌ Erro ao criar alerta:', error)
      } else {
        console.log('✅ Alerta criado:', alert.title)
      }
    } catch (error) {
      console.error('❌ Erro ao criar alerta:', error)
    }
  }

  // Métodos públicos
  async getUserAlerts(userId: string, limit: number = 50): Promise<SmartAlert[]> {
    try {
      const { data, error } = await supabase
        .from('smart_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ Erro ao buscar alertas:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('❌ Erro ao buscar alertas:', error)
      return []
    }
  }

  async markAlertAsRead(alertId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('smart_alerts')
        .update({ read: true })
        .eq('id', alertId)

      if (error) {
        console.error('❌ Erro ao marcar alerta como lido:', error)
      }
    } catch (error) {
      console.error('❌ Erro ao marcar alerta como lido:', error)
    }
  }

  async markAlertActionTaken(alertId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('smart_alerts')
        .update({ action_taken: true })
        .eq('id', alertId)

      if (error) {
        console.error('❌ Erro ao marcar ação do alerta:', error)
      }
    } catch (error) {
      console.error('❌ Erro ao marcar ação do alerta:', error)
    }
  }

  // Forçar processamento de alertas
  async forceProcessAlerts(): Promise<void> {
    await this.processAlerts()
  }
}

// Instância singleton do serviço de alertas inteligentes
export const smartAlertsService = new SmartAlertsService()
export default smartAlertsService
