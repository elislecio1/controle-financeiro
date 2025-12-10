// Serviço de Tempo Real para Notificações e Sincronização
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { SheetData } from '../types'

export interface RealtimeNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  action?: {
    label: string
    callback: () => void
  }
}

export interface RealtimeStats {
  totalTransactions: number
  totalValue: number
  pendingTransactions: number
  overdueTransactions: number
  lastUpdate: Date
}

class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map()
  private listeners: Map<string, Set<(data: any) => void>> = new Map()
  private notifications: RealtimeNotification[] = []
  private stats: RealtimeStats | null = null

  constructor() {
    this.initializeRealtime()
  }

  // Inicializar funcionalidades de tempo real
  private async initializeRealtime() {
    try {
      console.log('🔄 Inicializando serviço de tempo real...')
      
      // Verificar se o usuário está autenticado
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        console.log('⚠️ Usuário não autenticado, aguardando login...')
        return
      }

      await this.subscribeToTransactions(session.user.id)
      await this.subscribeToNotifications(session.user.id)
      await this.subscribeToStats(session.user.id)
      
      console.log('✅ Serviço de tempo real inicializado')
    } catch (error) {
      console.error('❌ Erro ao inicializar tempo real:', error)
    }
  }

  // Subscrever a mudanças nas transações
  private async subscribeToTransactions(userId: string) {
    try {
      const channel = supabase
        .channel('transactions_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${userId}`
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            console.log('📊 Mudança detectada nas transações:', payload)
            this.handleTransactionChange(payload)
          }
        )
        .subscribe()

      this.channels.set('transactions', channel)
      console.log('✅ Inscrito em mudanças de transações')
    } catch (error) {
      console.error('❌ Erro ao subscrever transações:', error)
    }
  }

  // Subscrever a notificações do sistema
  private async subscribeToNotifications(userId: string) {
    try {
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            console.log('🔔 Nova notificação:', payload)
            this.handleNewNotification(payload.new)
          }
        )
        .subscribe()

      this.channels.set('notifications', channel)
      console.log('✅ Inscrito em notificações')
    } catch (error) {
      console.error('❌ Erro ao subscrever notificações:', error)
    }
  }

  // Subscrever a estatísticas em tempo real
  private async subscribeToStats(userId: string) {
    try {
      const channel = supabase
        .channel('stats')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${userId}`
          },
          () => {
            console.log('📈 Atualizando estatísticas...')
            this.updateStats(userId)
          }
        )
        .subscribe()

      this.channels.set('stats', channel)
      console.log('✅ Inscrito em atualizações de estatísticas')
    } catch (error) {
      console.error('❌ Erro ao subscrever estatísticas:', error)
    }
  }

  // Processar mudanças nas transações
  private handleTransactionChange(payload: RealtimePostgresChangesPayload<any>) {
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
        this.notifyListeners('transaction_created', {
          type: 'success',
          title: 'Nova Transação',
          message: `Transação "${newRecord.descricao}" foi criada`,
          data: newRecord
        })
        break

      case 'UPDATE':
        this.notifyListeners('transaction_updated', {
          type: 'info',
          title: 'Transação Atualizada',
          message: `Transação "${newRecord.descricao}" foi modificada`,
          data: { old: oldRecord, new: newRecord }
        })
        break

      case 'DELETE':
        this.notifyListeners('transaction_deleted', {
          type: 'warning',
          title: 'Transação Excluída',
          message: `Transação foi removida`,
          data: oldRecord
        })
        break
    }

    // Invalidar cache
    this.invalidateCache()
  }

  // Processar nova notificação
  private handleNewNotification(notification: any) {
    const realtimeNotification: RealtimeNotification = {
      id: notification.id,
      type: notification.type || 'info',
      title: notification.title,
      message: notification.message,
      timestamp: new Date(notification.created_at),
      read: false
    }

    this.notifications.unshift(realtimeNotification)
    this.notifyListeners('new_notification', realtimeNotification)

    // Mostrar notificação visual
    this.showBrowserNotification(realtimeNotification)
  }

  // Atualizar estatísticas
  private async updateStats(userId: string) {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('valor, status, vencimento')
        .eq('user_id', userId)

      if (error) {
        console.error('❌ Erro ao buscar estatísticas:', error)
        return
      }

      const now = new Date()
      const totalTransactions = transactions.length
      const totalValue = transactions.reduce((sum, t) => sum + Math.abs(t.valor), 0)
      const pendingTransactions = transactions.filter(t => t.status === 'pendente').length
      const overdueTransactions = transactions.filter(t => {
        if (t.status === 'pago') return false
        const vencimento = new Date(t.vencimento)
        return vencimento < now
      }).length

      this.stats = {
        totalTransactions,
        totalValue,
        pendingTransactions,
        overdueTransactions,
        lastUpdate: now
      }

      this.notifyListeners('stats_updated', this.stats)
    } catch (error) {
      console.error('❌ Erro ao atualizar estatísticas:', error)
    }
  }

  // Mostrar notificação do navegador
  private showBrowserNotification(notification: RealtimeNotification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      })
    }
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

  // Adicionar listener para eventos
  addListener(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    
    this.listeners.get(event)!.add(callback)

    // Retornar função de unsubscribe
    return () => {
      this.listeners.get(event)?.delete(callback)
    }
  }

  // Notificar listeners
  private notifyListeners(event: string, data: any) {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('❌ Erro ao executar listener:', error)
        }
      })
    }
  }

  // Invalidar cache
  private invalidateCache() {
    // Importar dinamicamente para evitar dependência circular
    import('./cacheService').then(({ cacheService }) => {
      cacheService.invalidateTable('transactions')
    })
  }

  // Obter notificações
  getNotifications(): RealtimeNotification[] {
    return [...this.notifications]
  }

  // Marcar notificação como lida
  markNotificationAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  // Limpar notificações lidas
  clearReadNotifications(): void {
    this.notifications = this.notifications.filter(n => !n.read)
  }

  // Obter estatísticas
  getStats(): RealtimeStats | null {
    return this.stats
  }

  // Enviar notificação personalizada
  async sendNotification(
    userId: string,
    type: RealtimeNotification['type'],
    title: string,
    message: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          read: false
        })

      if (error) {
        console.error('❌ Erro ao enviar notificação:', error)
        throw error
      }
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error)
      throw error
    }
  }

  // Desconectar todos os canais
  disconnect(): void {
    this.channels.forEach((channel, name) => {
      console.log(`🔌 Desconectando canal: ${name}`)
      supabase.removeChannel(channel)
    })
    this.channels.clear()
    this.listeners.clear()
  }

  // Reconectar após login
  async reconnect(userId: string): Promise<void> {
    this.disconnect()
    await this.initializeRealtime()
  }
}

// Instância singleton do serviço de tempo real
export const realtimeService = new RealtimeService()
export default realtimeService
