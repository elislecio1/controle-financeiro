import { supabase } from './supabase'

export interface ActivityLog {
  id: string
  user_id: string
  user_email: string
  action_type: string
  table_name: string
  record_id: string
  old_values: any
  new_values: any
  description: string
  ip_address: string
  user_agent: string
  created_at: string
  can_be_undone: boolean
  undone_at: string | null
  undone_by: string | null
  metadata: any
}

export interface TransactionLog {
  id: string
  user_id: string
  user_email: string
  transaction_id: string
  action_type: 'create' | 'update' | 'delete' | 'mark_paid' | 'mark_unpaid'
  old_status: string
  new_status: string
  old_values: any
  new_values: any
  description: string
  ip_address: string
  created_at: string
  can_be_undone: boolean
  undone_at: string | null
  undone_by: string | null
}

export interface SystemConfigLog {
  id: string
  user_id: string
  user_email: string
  config_type: string
  action_type: 'create' | 'update' | 'delete'
  old_values: any
  new_values: any
  description: string
  ip_address: string
  created_at: string
  can_be_undone: boolean
  undone_at: string | null
  undone_by: string | null
}

export interface LogStatistics {
  total_actions: number
  actions_by_type: Record<string, number>
  actions_by_user: Record<string, number>
  recent_activity: Array<{
    user_email: string
    action_type: string
    description: string
    created_at: string
  }>
}

export interface LogFilters {
  start_date?: string
  end_date?: string
  user_id?: string
  action_type?: string
  config_type?: string
  table_name?: string
  limit?: number
  offset?: number
}

class LogService {
  // Obter logs de transações
  async getTransactionLogs(filters: LogFilters = {}): Promise<TransactionLog[]> {
    try {
      let query = supabase
        .from('transaction_logs')
        .select('*')
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date)
      }
      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date)
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id)
      }
      if (filters.action_type) {
        query = query.eq('action_type', filters.action_type)
      }
      if (filters.limit) {
        query = query.limit(filters.limit)
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar logs de transações:', error)
        throw new Error('Erro ao buscar logs de transações')
      }

      return data || []
    } catch (error) {
      console.error('Erro no LogService.getTransactionLogs:', error)
      throw error
    }
  }

  // Obter logs de configuração do sistema
  async getSystemConfigLogs(filters: LogFilters = {}): Promise<SystemConfigLog[]> {
    try {
      let query = supabase
        .from('system_config_logs')
        .select('*')
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date)
      }
      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date)
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id)
      }
      if (filters.action_type) {
        query = query.eq('action_type', filters.action_type)
      }
      if (filters.config_type) {
        query = query.eq('config_type', filters.config_type)
      }
      if (filters.limit) {
        query = query.limit(filters.limit)
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar logs de configuração:', error)
        throw new Error('Erro ao buscar logs de configuração')
      }

      return data || []
    } catch (error) {
      console.error('Erro no LogService.getSystemConfigLogs:', error)
      throw error
    }
  }

  // Obter logs de atividades gerais
  async getActivityLogs(filters: LogFilters = {}): Promise<ActivityLog[]> {
    try {
      let query = supabase
        .from('user_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date)
      }
      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date)
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id)
      }
      if (filters.action_type) {
        query = query.eq('action_type', filters.action_type)
      }
      if (filters.table_name) {
        query = query.eq('table_name', filters.table_name)
      }
      if (filters.limit) {
        query = query.limit(filters.limit)
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar logs de atividades:', error)
        throw new Error('Erro ao buscar logs de atividades')
      }

      return data || []
    } catch (error) {
      console.error('Erro no LogService.getActivityLogs:', error)
      throw error
    }
  }

  // Obter estatísticas de logs
  async getLogStatistics(startDate?: string, endDate?: string): Promise<LogStatistics> {
    try {
      const { data, error } = await supabase
        .rpc('get_log_statistics', {
          start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: endDate || new Date().toISOString()
        })

      if (error) {
        console.error('Erro ao buscar estatísticas de logs:', error)
        throw new Error('Erro ao buscar estatísticas de logs')
      }

      return data || {
        total_actions: 0,
        actions_by_type: {},
        actions_by_user: {},
        recent_activity: []
      }
    } catch (error) {
      console.error('Erro no LogService.getLogStatistics:', error)
      throw error
    }
  }

  // Desfazer ação de transação (apenas para admins)
  async undoTransactionAction(logId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('undo_transaction_action', { log_id: logId })

      if (error) {
        console.error('Erro ao desfazer ação de transação:', error)
        throw new Error(error.message || 'Erro ao desfazer ação')
      }

      return data || false
    } catch (error) {
      console.error('Erro no LogService.undoTransactionAction:', error)
      throw error
    }
  }

  // Desfazer ação de configuração (apenas para admins)
  async undoConfigAction(logId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('undo_config_action', { log_id: logId })

      if (error) {
        console.error('Erro ao desfazer ação de configuração:', error)
        throw new Error(error.message || 'Erro ao desfazer ação')
      }

      return data || false
    } catch (error) {
      console.error('Erro no LogService.undoConfigAction:', error)
      throw error
    }
  }

  // Registrar log manual (para ações que não são capturadas por triggers)
  async logManualActivity(
    actionType: string,
    tableName: string,
    recordId: string,
    description: string,
    oldValues?: any,
    newValues?: any,
    metadata?: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_activity_logs')
        .insert({
          action_type: actionType,
          table_name: tableName,
          record_id: recordId,
          description,
          old_values: oldValues,
          new_values: newValues,
          metadata,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent
        })

      if (error) {
        console.error('Erro ao registrar log manual:', error)
        throw new Error('Erro ao registrar log')
      }
    } catch (error) {
      console.error('Erro no LogService.logManualActivity:', error)
      throw error
    }
  }

  // Obter IP do cliente (simulado para frontend)
  private async getClientIP(): Promise<string> {
    try {
      // Em produção, isso seria obtido do backend
      // Por enquanto, retornamos um valor simulado
      return '127.0.0.1'
    } catch (error) {
      return 'unknown'
    }
  }

  // Obter logs por usuário específico
  async getUserLogs(userId: string, filters: LogFilters = {}): Promise<{
    transactions: TransactionLog[]
    configs: SystemConfigLog[]
    activities: ActivityLog[]
  }> {
    try {
      const [transactions, configs, activities] = await Promise.all([
        this.getTransactionLogs({ ...filters, user_id: userId }),
        this.getSystemConfigLogs({ ...filters, user_id: userId }),
        this.getActivityLogs({ ...filters, user_id: userId })
      ])

      return {
        transactions,
        configs,
        activities
      }
    } catch (error) {
      console.error('Erro no LogService.getUserLogs:', error)
      throw error
    }
  }

  // Obter logs recentes (últimas 24 horas)
  async getRecentLogs(): Promise<{
    transactions: TransactionLog[]
    configs: SystemConfigLog[]
  }> {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      
      const [transactions, configs] = await Promise.all([
        this.getTransactionLogs({ 
          start_date: yesterday, 
          limit: 50 
        }),
        this.getSystemConfigLogs({ 
          start_date: yesterday, 
          limit: 50 
        })
      ])

      return {
        transactions,
        configs
      }
    } catch (error) {
      console.error('Erro no LogService.getRecentLogs:', error)
      throw error
    }
  }

  // Verificar se o usuário atual é admin
  async isCurrentUserAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      return profile?.role === 'admin'
    } catch (error) {
      console.error('Erro ao verificar se usuário é admin:', error)
      return false
    }
  }

  // Formatar data para exibição
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return dateString
    }
  }

  // Obter ícone para tipo de ação
  getActionIcon(actionType: string): string {
    switch (actionType) {
      case 'create':
        return '➕'
      case 'update':
        return '✏️'
      case 'delete':
        return '🗑️'
      case 'mark_paid':
        return '✅'
      case 'mark_unpaid':
        return '❌'
      default:
        return '📝'
    }
  }

  // Obter cor para tipo de ação
  getActionColor(actionType: string): string {
    switch (actionType) {
      case 'create':
        return 'text-green-600'
      case 'update':
        return 'text-blue-600'
      case 'delete':
        return 'text-red-600'
      case 'mark_paid':
        return 'text-green-600'
      case 'mark_unpaid':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  // Obter texto descritivo para tipo de ação
  getActionText(actionType: string): string {
    switch (actionType) {
      case 'create':
        return 'Criado'
      case 'update':
        return 'Atualizado'
      case 'delete':
        return 'Excluído'
      case 'mark_paid':
        return 'Marcado como pago'
      case 'mark_unpaid':
        return 'Desmarcado como pago'
      default:
        return actionType
    }
  }
}

export const logService = new LogService()
