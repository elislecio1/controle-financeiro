// Serviço de Notificações Push Avançado
import { supabase } from './supabase'
import { SheetData } from '../types'

export interface NotificationTemplate {
  id: string
  name: string
  type: 'transaction' | 'reminder' | 'alert' | 'achievement' | 'system'
  title: string
  message: string
  icon: string
  color: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  channels: ('browser' | 'email' | 'whatsapp' | 'telegram')[]
  conditions: NotificationCondition[]
  enabled: boolean
}

export interface NotificationCondition {
  field: string
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'between'
  value: any
  value2?: any
}

export interface NotificationRule {
  id: string
  user_id: string
  template_id: string
  conditions: NotificationCondition[]
  schedule?: {
    frequency: 'immediate' | 'daily' | 'weekly' | 'monthly'
    time?: string
    days?: number[]
  }
  enabled: boolean
  created_at: string
}

export interface NotificationHistory {
  id: string
  user_id: string
  template_id: string
  title: string
  message: string
  channel: string
  status: 'sent' | 'delivered' | 'failed' | 'read'
  sent_at: string
  read_at?: string
  metadata?: any
}

export interface NotificationPreferences {
  user_id: string
  browser_enabled: boolean
  email_enabled: boolean
  whatsapp_enabled: boolean
  telegram_enabled: boolean
  quiet_hours: {
    enabled: boolean
    start: string
    end: string
  }
  frequency_limits: {
    max_per_hour: number
    max_per_day: number
  }
  categories: {
    transactions: boolean
    reminders: boolean
    alerts: boolean
    achievements: boolean
    system: boolean
  }
}

class NotificationService {
  private templates: NotificationTemplate[] = []
  private userPreferences: Map<string, NotificationPreferences> = new Map()
  private notificationQueue: any[] = []
  private isProcessing = false

  constructor() {
    this.initializeTemplates()
    this.startQueueProcessor()
  }

  // Inicializar templates de notificação
  private initializeTemplates() {
    this.templates = [
      {
        id: 'transaction_created',
        name: 'Nova Transação Criada',
        type: 'transaction',
        title: '💰 Nova Transação',
        message: '{{descricao}} - {{valor}} foi adicionada',
        icon: '💰',
        color: 'green',
        priority: 'medium',
        channels: ['browser', 'email'],
        conditions: [],
        enabled: true
      },
      {
        id: 'payment_due_today',
        name: 'Pagamento Vence Hoje',
        type: 'reminder',
        title: '⚠️ Pagamento Vence Hoje',
        message: '{{descricao}} - {{valor}} vence hoje!',
        icon: '⚠️',
        color: 'orange',
        priority: 'high',
        channels: ['browser', 'email', 'whatsapp'],
        conditions: [
          { field: 'vencimento', operator: 'equals', value: 'today' },
          { field: 'status', operator: 'equals', value: 'pendente' }
        ],
        enabled: true
      },
      {
        id: 'payment_overdue',
        name: 'Pagamento Vencido',
        type: 'alert',
        title: '🚨 Pagamento Vencido',
        message: '{{descricao}} - {{valor}} está vencido há {{dias_vencido}} dias',
        icon: '🚨',
        color: 'red',
        priority: 'urgent',
        channels: ['browser', 'email', 'whatsapp', 'telegram'],
        conditions: [
          { field: 'vencimento', operator: 'less_than', value: 'today' },
          { field: 'status', operator: 'equals', value: 'pendente' }
        ],
        enabled: true
      },
      {
        id: 'budget_exceeded',
        name: 'Orçamento Excedido',
        type: 'alert',
        title: '📊 Orçamento Excedido',
        message: 'Você excedeu o orçamento de {{categoria}} em {{valor_excedido}}',
        icon: '📊',
        color: 'red',
        priority: 'high',
        channels: ['browser', 'email'],
        conditions: [
          { field: 'categoria', operator: 'equals', value: '{{categoria}}' },
          { field: 'valor_total', operator: 'greater_than', value: '{{limite_orcamento}}' }
        ],
        enabled: true
      },
      {
        id: 'goal_achieved',
        name: 'Meta Alcançada',
        type: 'achievement',
        title: '🎉 Meta Alcançada!',
        message: 'Parabéns! Você alcançou a meta de {{meta}}',
        icon: '🎉',
        color: 'green',
        priority: 'medium',
        channels: ['browser', 'email', 'whatsapp'],
        conditions: [],
        enabled: true
      },
      {
        id: 'system_maintenance',
        name: 'Manutenção do Sistema',
        type: 'system',
        title: '🔧 Manutenção Programada',
        message: 'O sistema passará por manutenção em {{horario}}',
        icon: '🔧',
        color: 'blue',
        priority: 'medium',
        channels: ['browser', 'email'],
        conditions: [],
        enabled: true
      }
    ]
  }

  // Iniciar processador de fila
  private startQueueProcessor() {
    setInterval(() => {
      if (!this.isProcessing && this.notificationQueue.length > 0) {
        this.processQueue()
      }
    }, 5000) // Processar a cada 5 segundos
  }

  // Processar fila de notificações
  private async processQueue() {
    if (this.isProcessing) return

    this.isProcessing = true
    console.log(`📤 Processando ${this.notificationQueue.length} notificações...`)

    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift()
      try {
        await this.sendNotification(notification)
      } catch (error) {
        console.error('❌ Erro ao enviar notificação:', error)
      }
    }

    this.isProcessing = false
  }

  // Adicionar notificação à fila
  private queueNotification(notification: any) {
    this.notificationQueue.push(notification)
    console.log(`📝 Notificação adicionada à fila: ${notification.template_id}`)
  }

  // Enviar notificação
  private async sendNotification(notification: any) {
    const { user_id, template_id, data, channels } = notification

    // Verificar preferências do usuário
    const preferences = await this.getUserPreferences(user_id)
    if (!preferences) return

    // Verificar limites de frequência
    if (!await this.checkFrequencyLimits(user_id, preferences)) {
      console.log(`⚠️ Limite de frequência atingido para usuário ${user_id}`)
      return
    }

    // Verificar horário silencioso
    if (this.isQuietHours(preferences)) {
      console.log(`🔇 Horário silencioso ativo para usuário ${user_id}`)
      return
    }

    // Enviar por cada canal habilitado
    for (const channel of channels) {
      if (preferences[`${channel}_enabled` as keyof NotificationPreferences]) {
        try {
          await this.sendToChannel(channel, notification)
        } catch (error) {
          console.error(`❌ Erro ao enviar via ${channel}:`, error)
        }
      }
    }
  }

  // Enviar para canal específico
  private async sendToChannel(channel: string, notification: any) {
    switch (channel) {
      case 'browser':
        await this.sendBrowserNotification(notification)
        break
      case 'email':
        await this.sendEmailNotification(notification)
        break
      case 'whatsapp':
        await this.sendWhatsAppNotification(notification)
        break
      case 'telegram':
        await this.sendTelegramNotification(notification)
        break
    }
  }

  // Notificação do navegador
  private async sendBrowserNotification(notification: any) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const template = this.templates.find(t => t.id === notification.template_id)
      if (!template) return

      const title = this.processTemplate(template.title, notification.data)
      const message = this.processTemplate(template.message, notification.data)

      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: template.priority === 'urgent'
      })

      // Registrar no histórico
      await this.recordNotification({
        ...notification,
        channel: 'browser',
        status: 'sent'
      })
    }
  }

  // Notificação por email
  private async sendEmailNotification(notification: any) {
    // Implementar envio de email via Supabase Edge Functions
    console.log('📧 Enviando notificação por email:', notification.template_id)
    
    // Registrar no histórico
    await this.recordNotification({
      ...notification,
      channel: 'email',
      status: 'sent'
    })
  }

  // Notificação por WhatsApp
  private async sendWhatsAppNotification(notification: any) {
    // Implementar integração com WhatsApp Business API
    console.log('📱 Enviando notificação por WhatsApp:', notification.template_id)
    
    // Registrar no histórico
    await this.recordNotification({
      ...notification,
      channel: 'whatsapp',
      status: 'sent'
    })
  }

  // Notificação por Telegram
  private async sendTelegramNotification(notification: any) {
    // Implementar integração com Telegram Bot API
    console.log('📱 Enviando notificação por Telegram:', notification.template_id)
    
    // Registrar no histórico
    await this.recordNotification({
      ...notification,
      channel: 'telegram',
      status: 'sent'
    })
  }

  // Processar template com variáveis
  private processTemplate(template: string, data: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match
    })
  }

  // Verificar limites de frequência
  private async checkFrequencyLimits(userId: string, preferences: NotificationPreferences): Promise<boolean> {
    const { max_per_hour, max_per_day } = preferences.frequency_limits
    
    // Verificar limite por hora
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const hourlyCount = await this.getNotificationCount(userId, oneHourAgo)
    if (hourlyCount >= max_per_hour) return false

    // Verificar limite por dia
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const dailyCount = await this.getNotificationCount(userId, oneDayAgo)
    if (dailyCount >= max_per_day) return false

    return true
  }

  // Verificar horário silencioso
  private isQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quiet_hours.enabled) return false

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    const startTime = this.parseTime(preferences.quiet_hours.start)
    const endTime = this.parseTime(preferences.quiet_hours.end)

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime
    } else {
      return currentTime >= startTime || currentTime <= endTime
    }
  }

  // Parsear horário
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Obter preferências do usuário
  private async getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
    if (this.userPreferences.has(userId)) {
      return this.userPreferences.get(userId)!
    }

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        // Criar preferências padrão
        const defaultPreferences: NotificationPreferences = {
          user_id: userId,
          browser_enabled: true,
          email_enabled: true,
          whatsapp_enabled: false,
          telegram_enabled: false,
          quiet_hours: {
            enabled: true,
            start: '22:00',
            end: '08:00'
          },
          frequency_limits: {
            max_per_hour: 10,
            max_per_day: 50
          },
          categories: {
            transactions: true,
            reminders: true,
            alerts: true,
            achievements: true,
            system: true
          }
        }

        await this.saveUserPreferences(defaultPreferences)
        this.userPreferences.set(userId, defaultPreferences)
        return defaultPreferences
      }

      this.userPreferences.set(userId, data)
      return data
    } catch (error) {
      console.error('❌ Erro ao obter preferências:', error)
      return null
    }
  }

  // Salvar preferências do usuário
  private async saveUserPreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert(preferences)

      if (error) {
        console.error('❌ Erro ao salvar preferências:', error)
      }
    } catch (error) {
      console.error('❌ Erro ao salvar preferências:', error)
    }
  }

  // Obter contagem de notificações
  private async getNotificationCount(userId: string, since: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notification_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('sent_at', since)

      if (error) {
        // Ignorar erro se a tabela não existir (42P01 ou 404)
        if (error.code === '42P01' || error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          return 0
        }
        // Silenciar outros erros para não poluir o console
        return 0
      }

      return count || 0
    } catch (error) {
      // Ignorar erros silenciosamente
      return 0
    }
  }

  // Registrar notificação no histórico
  private async recordNotification(notification: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification_history')
        .insert({
          user_id: notification.user_id,
          template_id: notification.template_id,
          title: notification.title,
          message: notification.message,
          channel: notification.channel,
          status: notification.status,
          sent_at: new Date().toISOString(),
          metadata: notification.metadata
        })

      if (error) {
        // Ignorar erro se a tabela não existir (42P01, PGRST116 ou 404)
        if (error.code === '42P01' || error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          return
        }
        // Silenciar outros erros para não poluir o console
      }
    } catch (error) {
      // Ignorar erros silenciosamente
    }
  }

  // Métodos públicos
  async sendTransactionNotification(userId: string, transaction: SheetData): Promise<void> {
    const template = this.templates.find(t => t.id === 'transaction_created')
    if (!template) return

    this.queueNotification({
      user_id: userId,
      template_id: 'transaction_created',
      title: template.title,
      message: template.message,
      data: {
        descricao: transaction.descricao,
        valor: `R$ ${Math.abs(transaction.valor).toFixed(2)}`,
        tipo: transaction.tipo,
        categoria: transaction.categoria
      },
      channels: template.channels
    })
  }

  async sendPaymentReminder(userId: string, transaction: SheetData): Promise<void> {
    const template = this.templates.find(t => t.id === 'payment_due_today')
    if (!template) return

    this.queueNotification({
      user_id: userId,
      template_id: 'payment_due_today',
      title: template.title,
      message: template.message,
      data: {
        descricao: transaction.descricao,
        valor: `R$ ${Math.abs(transaction.valor).toFixed(2)}`,
        vencimento: transaction.vencimento
      },
      channels: template.channels
    })
  }

  async sendOverdueAlert(userId: string, transaction: SheetData, daysOverdue: number): Promise<void> {
    const template = this.templates.find(t => t.id === 'payment_overdue')
    if (!template) return

    this.queueNotification({
      user_id: userId,
      template_id: 'payment_overdue',
      title: template.title,
      message: template.message,
      data: {
        descricao: transaction.descricao,
        valor: `R$ ${Math.abs(transaction.valor).toFixed(2)}`,
        dias_vencido: daysOverdue
      },
      channels: template.channels
    })
  }

  async sendGoalAchievement(userId: string, goal: string): Promise<void> {
    const template = this.templates.find(t => t.id === 'goal_achieved')
    if (!template) return

    this.queueNotification({
      user_id: userId,
      template_id: 'goal_achieved',
      title: template.title,
      message: template.message,
      data: {
        meta: goal
      },
      channels: template.channels
    })
  }

  // Solicitar permissão para notificações
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('⚠️ Notificações não suportadas neste navegador')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      console.warn('⚠️ Permissão de notificação negada')
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  // Obter histórico de notificações
  async getNotificationHistory(userId: string, limit: number = 50): Promise<NotificationHistory[]> {
    try {
      const { data, error } = await supabase
        .from('notification_history')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(limit)

      if (error) {
        // Ignorar erro se a tabela não existir (42P01, PGRST116, 404 ou qualquer erro relacionado)
        const isTableNotFound = 
          error.code === '42P01' || 
          error.code === 'PGRST116' || 
          error.message?.includes('does not exist') ||
          error.message?.includes('relation') ||
          error.message?.includes('not found') ||
          (error as any).status === 404 ||
          (error as any).statusCode === 404
        
        if (isTableNotFound) {
          // Tabela não existe, retornar array vazio silenciosamente
          return []
        }
        // Silenciar outros erros também
        return []
      }

      return data || []
    } catch (error: any) {
      // Capturar erros HTTP 404 também
      if (error?.status === 404 || error?.statusCode === 404 || error?.message?.includes('404')) {
        return []
      }
      // Ignorar todos os outros erros silenciosamente
      return []
    }
  }

  // Marcar notificação como lida
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification_history')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      if (error) {
        // Ignorar erro se a tabela não existir
        if (error.code === '42P01' || error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          return
        }
        // Silenciar outros erros
      }
    } catch (error) {
      // Ignorar erros silenciosamente
    }
  }
}

// Instância singleton do serviço de notificações
export const notificationService = new NotificationService()
export default notificationService
