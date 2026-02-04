import { supabase } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { SheetData } from '../types'

export interface RealtimeSubscription {
  channel: RealtimeChannel
  unsubscribe: () => void
}

/**
 * Serviço para gerenciar subscriptions Realtime do Supabase
 * Permite atualizações em tempo real para todos os usuários da empresa
 */
class RealtimeService {
  private subscriptions: Map<string, RealtimeSubscription> = new Map()
  private callbacks: Map<string, Set<(data: any) => void>> = new Map()

  /**
   * Inscrever-se em mudanças na tabela transactions
   * @param onInsert Callback quando uma transação é inserida
   * @param onUpdate Callback quando uma transação é atualizada
   * @param onDelete Callback quando uma transação é deletada
   * @returns Função para cancelar a subscription
   */
  subscribeToTransactions(
    onInsert?: (newTransaction: SheetData) => void,
    onUpdate?: (updatedTransaction: SheetData) => void,
    onDelete?: (deletedId: string) => void
  ): () => void {
    const channelName = 'transactions-changes'
    
    // Se já existe subscription, reutilizar
    if (this.subscriptions.has(channelName)) {
      const existing = this.subscriptions.get(channelName)!
      
      // Adicionar callbacks
      if (onInsert) {
        if (!this.callbacks.has(`${channelName}:insert`)) {
          this.callbacks.set(`${channelName}:insert`, new Set())
        }
        this.callbacks.get(`${channelName}:insert`)!.add(onInsert)
      }
      if (onUpdate) {
        if (!this.callbacks.has(`${channelName}:update`)) {
          this.callbacks.set(`${channelName}:update`, new Set())
        }
        this.callbacks.get(`${channelName}:update`)!.add(onUpdate)
      }
      if (onDelete) {
        if (!this.callbacks.has(`${channelName}:delete`)) {
          this.callbacks.set(`${channelName}:delete`, new Set())
        }
        this.callbacks.get(`${channelName}:delete`)!.add(onDelete)
      }
      
      return () => {
        // Remover callbacks específicos
        if (onInsert) {
          this.callbacks.get(`${channelName}:insert`)?.delete(onInsert)
        }
        if (onUpdate) {
          this.callbacks.get(`${channelName}:update`)?.delete(onUpdate)
        }
        if (onDelete) {
          this.callbacks.get(`${channelName}:delete`)?.delete(onDelete)
        }
      }
    }

    // Criar nova subscription
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('🆕 Nova transação inserida:', payload.new)
          const newTransaction = this.mapTransactionToSheetData(payload.new as any)
          
          // Executar todos os callbacks de insert
          this.callbacks.get(`${channelName}:insert`)?.forEach(callback => {
            try {
              callback(newTransaction)
            } catch (error) {
              console.error('❌ Erro ao executar callback de insert:', error)
            }
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('🔄 Transação atualizada:', payload.new)
          const updatedTransaction = this.mapTransactionToSheetData(payload.new as any)
          
          // Executar todos os callbacks de update
          this.callbacks.get(`${channelName}:update`)?.forEach(callback => {
            try {
              callback(updatedTransaction)
            } catch (error) {
              console.error('❌ Erro ao executar callback de update:', error)
            }
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('🗑️ Transação deletada:', payload.old)
          const deletedId = String((payload.old as any).id)
          
          // Executar todos os callbacks de delete
          this.callbacks.get(`${channelName}:delete`)?.forEach(callback => {
            try {
              callback(deletedId)
            } catch (error) {
              console.error('❌ Erro ao executar callback de delete:', error)
            }
          })
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da subscription transactions:', status)
      })

    // Armazenar callbacks
    if (onInsert) {
      if (!this.callbacks.has(`${channelName}:insert`)) {
        this.callbacks.set(`${channelName}:insert`, new Set())
      }
      this.callbacks.get(`${channelName}:insert`)!.add(onInsert)
    }
    if (onUpdate) {
      if (!this.callbacks.has(`${channelName}:update`)) {
        this.callbacks.set(`${channelName}:update`, new Set())
      }
      this.callbacks.get(`${channelName}:update`)!.add(onUpdate)
    }
    if (onDelete) {
      if (!this.callbacks.has(`${channelName}:delete`)) {
        this.callbacks.set(`${channelName}:delete`, new Set())
      }
      this.callbacks.get(`${channelName}:delete`)!.add(onDelete)
    }

    // Armazenar subscription
    this.subscriptions.set(channelName, {
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel)
        this.subscriptions.delete(channelName)
        this.callbacks.delete(`${channelName}:insert`)
        this.callbacks.delete(`${channelName}:update`)
        this.callbacks.delete(`${channelName}:delete`)
      }
    })

    // Retornar função para cancelar apenas estes callbacks
    return () => {
      if (onInsert) {
        this.callbacks.get(`${channelName}:insert`)?.delete(onInsert)
      }
      if (onUpdate) {
        this.callbacks.get(`${channelName}:update`)?.delete(onUpdate)
      }
      if (onDelete) {
        this.callbacks.get(`${channelName}:delete`)?.delete(onDelete)
      }
      
      // Se não há mais callbacks, remover subscription
      const hasCallbacks = 
        (this.callbacks.get(`${channelName}:insert`)?.size ?? 0) > 0 ||
        (this.callbacks.get(`${channelName}:update`)?.size ?? 0) > 0 ||
        (this.callbacks.get(`${channelName}:delete`)?.size ?? 0) > 0
      
      if (!hasCallbacks) {
        const sub = this.subscriptions.get(channelName)
        if (sub) {
          sub.unsubscribe()
        }
      }
    }
  }

  /**
   * Inscrever-se em mudanças em outras tabelas (categorias, contas, etc.)
   */
  subscribeToTable(
    tableName: string,
    onInsert?: (newRecord: any) => void,
    onUpdate?: (updatedRecord: any) => void,
    onDelete?: (deletedId: string) => void
  ): () => void {
    const channelName = `${tableName}-changes`
    
    // Se já existe subscription, reutilizar
    if (this.subscriptions.has(channelName)) {
      const existing = this.subscriptions.get(channelName)!
      
      // Adicionar callbacks
      if (onInsert) {
        if (!this.callbacks.has(`${channelName}:insert`)) {
          this.callbacks.set(`${channelName}:insert`, new Set())
        }
        this.callbacks.get(`${channelName}:insert`)!.add(onInsert)
      }
      if (onUpdate) {
        if (!this.callbacks.has(`${channelName}:update`)) {
          this.callbacks.set(`${channelName}:update`, new Set())
        }
        this.callbacks.get(`${channelName}:update`)!.add(onUpdate)
      }
      if (onDelete) {
        if (!this.callbacks.has(`${channelName}:delete`)) {
          this.callbacks.set(`${channelName}:delete`, new Set())
        }
        this.callbacks.get(`${channelName}:delete`)!.add(onDelete)
      }
      
      return () => {
        if (onInsert) {
          this.callbacks.get(`${channelName}:insert`)?.delete(onInsert)
        }
        if (onUpdate) {
          this.callbacks.get(`${channelName}:update`)?.delete(onUpdate)
        }
        if (onDelete) {
          this.callbacks.get(`${channelName}:delete`)?.delete(onDelete)
        }
      }
    }

    // Criar nova subscription
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tableName
        },
        (payload) => {
          console.log(`🆕 Novo registro inserido em ${tableName}:`, payload.new)
          this.callbacks.get(`${channelName}:insert`)?.forEach(callback => {
            try {
              callback(payload.new)
            } catch (error) {
              console.error('❌ Erro ao executar callback:', error)
            }
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: tableName
        },
        (payload) => {
          console.log(`🔄 Registro atualizado em ${tableName}:`, payload.new)
          this.callbacks.get(`${channelName}:update`)?.forEach(callback => {
            try {
              callback(payload.new)
            } catch (error) {
              console.error('❌ Erro ao executar callback:', error)
            }
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: tableName
        },
        (payload) => {
          console.log(`🗑️ Registro deletado em ${tableName}:`, payload.old)
          const deletedId = String((payload.old as any).id)
          this.callbacks.get(`${channelName}:delete`)?.forEach(callback => {
            try {
              callback(deletedId)
            } catch (error) {
              console.error('❌ Erro ao executar callback:', error)
            }
          })
        }
      )
      .subscribe((status) => {
        console.log(`📡 Status da subscription ${tableName}:`, status)
      })

    // Armazenar callbacks
    if (onInsert) {
      if (!this.callbacks.has(`${channelName}:insert`)) {
        this.callbacks.set(`${channelName}:insert`, new Set())
      }
      this.callbacks.get(`${channelName}:insert`)!.add(onInsert)
    }
    if (onUpdate) {
      if (!this.callbacks.has(`${channelName}:update`)) {
        this.callbacks.set(`${channelName}:update`, new Set())
      }
      this.callbacks.get(`${channelName}:update`)!.add(onUpdate)
    }
    if (onDelete) {
      if (!this.callbacks.has(`${channelName}:delete`)) {
        this.callbacks.set(`${channelName}:delete`, new Set())
      }
      this.callbacks.get(`${channelName}:delete`)!.add(onDelete)
    }

    // Armazenar subscription
    this.subscriptions.set(channelName, {
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel)
        this.subscriptions.delete(channelName)
        this.callbacks.delete(`${channelName}:insert`)
        this.callbacks.delete(`${channelName}:update`)
        this.callbacks.delete(`${channelName}:delete`)
      }
    })

    // Retornar função para cancelar
    return () => {
      if (onInsert) {
        this.callbacks.get(`${channelName}:insert`)?.delete(onInsert)
      }
      if (onUpdate) {
        this.callbacks.get(`${channelName}:update`)?.delete(onUpdate)
      }
      if (onDelete) {
        this.callbacks.get(`${channelName}:delete`)?.delete(onDelete)
      }
      
      // Se não há mais callbacks, remover subscription
      const hasCallbacks = 
        (this.callbacks.get(`${channelName}:insert`)?.size ?? 0) > 0 ||
        (this.callbacks.get(`${channelName}:update`)?.size ?? 0) > 0 ||
        (this.callbacks.get(`${channelName}:delete`)?.size ?? 0) > 0
      
      if (!hasCallbacks) {
        const sub = this.subscriptions.get(channelName)
        if (sub) {
          sub.unsubscribe()
        }
      }
    }
  }

  /**
   * Converter dados do banco para formato SheetData
   */
  private mapTransactionToSheetData(item: any): SheetData {
    const formatDateForDisplay = (dateValue: any): string => {
      if (!dateValue) return ''
      if (typeof dateValue === 'string') {
        // Se já está no formato DD/MM/AAAA, retornar como está
        if (dateValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          return dateValue
        }
        // Se está no formato ISO, converter
        try {
          const date = new Date(dateValue)
          if (isNaN(date.getTime())) return ''
          const day = String(date.getDate()).padStart(2, '0')
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const year = date.getFullYear()
          return `${day}/${month}/${year}`
        } catch {
          return ''
        }
      }
      return ''
    }

    const parseValue = (value: any): number => {
      if (typeof value === 'string') {
        return parseFloat(value.replace(/[^\d,-]/g, '').replace(',', '.')) || 0
      }
      return parseFloat(value) || 0
    }

    return {
      id: String(item.id),
      data: formatDateForDisplay(item.data),
      valor: parseValue(item.valor),
      descricao: String(item.descricao),
      conta: String(item.conta || 'Conta Corrente'),
      contaTransferencia: item.conta_transferencia ? String(item.conta_transferencia) : undefined,
      cartao: item.cartao ? String(item.cartao) : undefined,
      categoria: String(item.categoria || 'Outros'),
      subcategoria: item.subcategoria ? String(item.subcategoria) : undefined,
      contato: item.contato ? String(item.contato) : undefined,
      centro: item.centro ? String(item.centro) : undefined,
      projeto: item.projeto ? String(item.projeto) : undefined,
      forma: String(item.forma || 'Dinheiro'),
      numeroDocumento: item.numero_documento ? String(item.numero_documento) : undefined,
      observacoes: item.observacoes ? String(item.observacoes) : undefined,
      dataCompetencia: formatDateForDisplay(item.data_competencia),
      tags: item.tags ? (typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags) : [],
      status: item.status ? String(item.status) as 'pago' | 'pendente' | 'vencido' : 'pendente',
      dataPagamento: formatDateForDisplay(item.data_pagamento) || '',
      vencimento: formatDateForDisplay(item.vencimento),
      empresa: item.empresa ? String(item.empresa) : undefined,
      tipo: String(item.tipo || 'despesa') as 'receita' | 'despesa' | 'transferencia' | 'investimento',
      parcela: item.parcela ? String(item.parcela) : '1',
      situacao: item.situacao ? String(item.situacao) : ''
    }
  }

  /**
   * Desinscrever-se de todas as subscriptions
   */
  unsubscribeAll(): void {
    console.log('🔌 Desinscrevendo de todas as subscriptions...')
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe()
    })
    this.subscriptions.clear()
    this.callbacks.clear()
  }

  /**
   * Verificar status das subscriptions
   */
  getSubscriptionsStatus(): { channelName: string; status: string }[] {
    return Array.from(this.subscriptions.entries()).map(([name, sub]) => ({
      channelName: name,
      status: sub.channel.state
    }))
  }
}

export const realtimeService = new RealtimeService()
