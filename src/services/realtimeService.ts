/**
 * Serviço de Tempo Real usando Supabase Realtime
 * 
 * Fornece sincronização automática de dados entre múltiplos usuários
 * sem necessidade de atualizar a página manualmente
 */

import { supabase } from './supabase'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import logger from '../utils/logger'

export interface RealtimeNotification {
  id: string
  type: 'transaction_created' | 'transaction_updated' | 'transaction_deleted'
  message: string
  data?: any
  timestamp: Date
}

type RealtimeListener = (data: any) => void
type ListenerMap = Map<string, Set<RealtimeListener>>

class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map()
  private listeners: ListenerMap = new Map()
  private isInitialized = false

  /**
   * Inicializar serviço de tempo real
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.debug('RealtimeService já está inicializado')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        logger.warn('Usuário não autenticado. Realtime não será inicializado.')
        return
      }

      logger.debug('Inicializando RealtimeService para usuário:', session.user.id)
      
      await this.subscribeToTransactions(session.user.id)
      
      this.isInitialized = true
      logger.success('RealtimeService inicializado com sucesso')
    } catch (error) {
      logger.error('Erro ao inicializar RealtimeService:', error)
      throw error
    }
  }

  /**
   * Subscrever a mudanças na tabela transactions
   */
  private async subscribeToTransactions(userId: string): Promise<void> {
    try {
      // Remover canal existente se houver
      const existingChannel = this.channels.get('transactions')
      if (existingChannel) {
        await supabase.removeChannel(existingChannel)
      }

      // Criar novo canal
      const channel = supabase
        .channel('transactions_changes', {
          config: {
            broadcast: { self: true },
            presence: { key: userId }
          }
        })
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${userId}`
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            logger.debug('Mudança detectada nas transações:', payload.eventType)
            this.handleTransactionChange(payload)
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logger.success('Inscrito em mudanças de transações')
          } else if (status === 'CHANNEL_ERROR') {
            logger.error('Erro ao se inscrever no canal de transações')
          } else {
            logger.debug('Status do canal:', status)
          }
        })

      this.channels.set('transactions', channel)
    } catch (error) {
      logger.error('Erro ao subscrever transações:', error)
      throw error
    }
  }

  /**
   * Processar mudanças nas transações
   */
  private handleTransactionChange(payload: RealtimePostgresChangesPayload<any>): void {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload

      let notification: RealtimeNotification
      let listenerType: string

      switch (eventType) {
        case 'INSERT':
          notification = {
            id: newRecord.id,
            type: 'transaction_created',
            message: 'Nova transação criada',
            data: newRecord,
            timestamp: new Date()
          }
          listenerType = 'transaction_created'
          logger.debug('Nova transação criada:', newRecord)
          break

        case 'UPDATE':
          notification = {
            id: newRecord.id,
            type: 'transaction_updated',
            message: 'Transação atualizada',
            data: { new: newRecord, old: oldRecord },
            timestamp: new Date()
          }
          listenerType = 'transaction_updated'
          logger.debug('Transação atualizada:', { new: newRecord, old: oldRecord })
          break

        case 'DELETE':
          notification = {
            id: oldRecord.id,
            type: 'transaction_deleted',
            message: 'Transação excluída',
            data: oldRecord,
            timestamp: new Date()
          }
          listenerType = 'transaction_deleted'
          logger.debug('Transação excluída:', oldRecord)
          break

        default:
          logger.warn('Tipo de evento desconhecido:', eventType)
          return
      }

      // Notificar todos os listeners
      this.notifyListeners(listenerType, notification)
    } catch (error) {
      logger.error('Erro ao processar mudança de transação:', error)
    }
  }

  /**
   * Adicionar listener para eventos
   */
  addListener(eventType: string, callback: RealtimeListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }

    const listeners = this.listeners.get(eventType)!
    listeners.add(callback)

    logger.debug(`Listener adicionado para evento: ${eventType}`)

    // Retornar função de unsubscribe
    return () => {
      listeners.delete(callback)
      if (listeners.size === 0) {
        this.listeners.delete(eventType)
      }
      logger.debug(`Listener removido para evento: ${eventType}`)
    }
  }

  /**
   * Notificar todos os listeners de um evento
   */
  private notifyListeners(eventType: string, data: any): void {
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          logger.error(`Erro ao executar listener para ${eventType}:`, error)
        }
      })
    }
  }

  /**
   * Desconectar todos os canais
   */
  async disconnect(): Promise<void> {
    logger.debug('Desconectando RealtimeService...')
    
    for (const [name, channel] of this.channels.entries()) {
      try {
        await supabase.removeChannel(channel)
        logger.debug(`Canal ${name} removido`)
      } catch (error) {
        logger.error(`Erro ao remover canal ${name}:`, error)
      }
    }

    this.channels.clear()
    this.listeners.clear()
    this.isInitialized = false
    
    logger.success('RealtimeService desconectado')
  }

  /**
   * Reconectar (útil após logout/login)
   */
  async reconnect(): Promise<void> {
    await this.disconnect()
    await this.initialize()
  }

  /**
   * Verificar se está conectado
   */
  isConnected(): boolean {
    return this.isInitialized && this.channels.size > 0
  }
}

// Exportar instância singleton
export const realtimeService = new RealtimeService()
export default realtimeService

