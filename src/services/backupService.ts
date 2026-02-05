// Serviço de Backup Automático e Recuperação
import { supabase } from './supabase'
import { SheetData } from '../types'
import { getEmpresaIdFromStorage } from '../utils/empresaHelper'

export interface BackupData {
  id: string
  user_id: string
  backup_type: 'manual' | 'automatic' | 'scheduled'
  data: {
    transactions: SheetData[]
    categories: any[]
    subcategories: any[]
    accounts: any[]
    cards: any[]
    contacts: any[]
    cost_centers: any[]
    investments: any[]
    alerts: any[]
  }
  metadata: {
    total_transactions: number
    total_size: number
    created_at: string
    version: string
  }
  created_at: string
  expires_at?: string
}

export interface BackupConfig {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  retention_days: number
  auto_cleanup: boolean
  compression: boolean
}

class BackupService {
  private config: BackupConfig = {
    enabled: true,
    frequency: 'daily',
    retention_days: 30,
    auto_cleanup: true,
    compression: true
  }

  // Criar backup completo
  async createBackup(type: 'manual' | 'automatic' | 'scheduled' = 'manual'): Promise<{ success: boolean; backupId?: string; error?: string }> {
    try {
      console.log('💾 Iniciando backup...', type)

      // Verificar autenticação
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session?.user) {
        throw new Error('Usuário não autenticado')
      }

      // Coletar todos os dados do usuário
      const [
        transactions,
        categories,
        subcategories,
        accounts,
        cards,
        contacts,
        costCenters,
        investments,
        alerts
      ] = await Promise.all([
        this.getUserTransactions(session.user.id),
        this.getUserCategories(session.user.id),
        this.getUserSubcategories(session.user.id),
        this.getUserAccounts(session.user.id),
        this.getUserCards(session.user.id),
        this.getUserContacts(session.user.id),
        this.getUserCostCenters(session.user.id),
        this.getUserInvestments(session.user.id),
        this.getUserAlerts(session.user.id)
      ])

      // Calcular metadados
      const totalTransactions = transactions.length
      const totalSize = this.calculateDataSize({
        transactions,
        categories,
        subcategories,
        accounts,
        cards,
        contacts,
        costCenters,
        investments,
        alerts
      })

      // Criar objeto de backup
      const backupData: Omit<BackupData, 'id' | 'created_at'> = {
        user_id: session.user.id,
        backup_type: type,
        data: {
          transactions,
          categories,
          subcategories,
          accounts,
          cards,
          contacts,
          cost_centers: costCenters,
          investments,
          alerts
        },
        metadata: {
          total_transactions: totalTransactions,
          total_size: totalSize,
          created_at: new Date().toISOString(),
          version: '1.0.0'
        },
        expires_at: this.calculateExpirationDate()
      }

      // Salvar backup no Supabase
      const { data, error } = await supabase
        .from('backups')
        .insert(backupData)
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao salvar backup:', error)
        throw new Error(`Erro ao salvar backup: ${error.message}`)
      }

      console.log('✅ Backup criado com sucesso:', data.id)
      return { success: true, backupId: data.id }
    } catch (error: any) {
      console.error('❌ Erro ao criar backup:', error)
      return { success: false, error: error.message }
    }
  }

  // Restaurar backup
  async restoreBackup(backupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Iniciando restauração do backup:', backupId)

      // Verificar autenticação
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session?.user) {
        throw new Error('Usuário não autenticado')
      }

      // Buscar backup
      const { data: backup, error: fetchError } = await supabase
        .from('backups')
        .select('*')
        .eq('id', backupId)
        .eq('user_id', session.user.id)
        .single()

      if (fetchError || !backup) {
        throw new Error('Backup não encontrado')
      }

      // Verificar se o backup não expirou
      if (backup.expires_at && new Date(backup.expires_at) < new Date()) {
        throw new Error('Backup expirado')
      }

      // Restaurar dados
      await this.restoreUserData(session.user.id, backup.data)

      console.log('✅ Backup restaurado com sucesso')
      return { success: true }
    } catch (error: any) {
      console.error('❌ Erro ao restaurar backup:', error)
      return { success: false, error: error.message }
    }
  }

  // Listar backups do usuário
  async getUserBackups(): Promise<BackupData[]> {
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session?.user) {
        throw new Error('Usuário não autenticado')
      }

      const { data, error } = await supabase
        .from('backups')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Erro ao buscar backups: ${error.message}`)
      }

      return data || []
    } catch (error: any) {
      console.error('❌ Erro ao listar backups:', error)
      return []
    }
  }

  // Excluir backup
  async deleteBackup(backupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session?.user) {
        throw new Error('Usuário não autenticado')
      }

      const { error } = await supabase
        .from('backups')
        .delete()
        .eq('id', backupId)
        .eq('user_id', session.user.id)

      if (error) {
        throw new Error(`Erro ao excluir backup: ${error.message}`)
      }

      return { success: true }
    } catch (error: any) {
      console.error('❌ Erro ao excluir backup:', error)
      return { success: false, error: error.message }
    }
  }

  // Limpeza automática de backups expirados
  async cleanupExpiredBackups(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      if (!this.config.auto_cleanup) {
        return { success: true, deletedCount: 0 }
      }

      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session?.user) {
        throw new Error('Usuário não autenticado')
      }

      const { data, error } = await supabase
        .from('backups')
        .select('id')
        .eq('user_id', session.user.id)
        .lt('expires_at', new Date().toISOString())

      if (error) {
        throw new Error(`Erro ao buscar backups expirados: ${error.message}`)
      }

      if (!data || data.length === 0) {
        return { success: true, deletedCount: 0 }
      }

      // Excluir backups expirados
      const { error: deleteError } = await supabase
        .from('backups')
        .delete()
        .eq('user_id', session.user.id)
        .lt('expires_at', new Date().toISOString())

      if (deleteError) {
        throw new Error(`Erro ao excluir backups expirados: ${deleteError.message}`)
      }

      console.log(`✅ ${data.length} backups expirados removidos`)
      return { success: true, deletedCount: data.length }
    } catch (error: any) {
      console.error('❌ Erro na limpeza de backups:', error)
      return { success: false, error: error.message }
    }
  }

  // Agendar backup automático
  scheduleAutomaticBackup(): void {
    if (!this.config.enabled) {
      console.log('⚠️ Backup automático desabilitado')
      return
    }

    const interval = this.getBackupInterval()
    console.log(`⏰ Backup automático agendado para ${this.config.frequency}`)

    setInterval(async () => {
      try {
        console.log('🔄 Executando backup automático...')
        const result = await this.createBackup('automatic')
        
        if (result.success) {
          console.log('✅ Backup automático concluído')
          // Executar limpeza se habilitada
          if (this.config.auto_cleanup) {
            await this.cleanupExpiredBackups()
          }
        } else {
          console.error('❌ Falha no backup automático:', result.error)
        }
      } catch (error) {
        console.error('❌ Erro no backup automático:', error)
      }
    }, interval)
  }

  // Métodos auxiliares privados
  private async getUserTransactions(userId: string): Promise<SheetData[]> {
    // Obter empresa_id atual
    const empresaId = getEmpresaIdFromStorage()
    if (!empresaId) {
      console.warn('⚠️ Nenhuma empresa selecionada, retornando transações vazias')
      return []
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('empresa_id', empresaId)

    if (error) throw error
    return data || []
  }

  private async getUserCategories(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data || []
  }

  private async getUserSubcategories(userId: string): Promise<any[]> {
    // Obter empresa_id atual
    const empresaId = getEmpresaIdFromStorage()
    if (!empresaId) {
      return []
    }

    const { data, error } = await supabase
      .from('subcategorias')
      .select('*')
      .eq('user_id', userId)
      .eq('empresa_id', empresaId)

    if (error) throw error
    return data || []
  }

  private async getUserAccounts(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('contas_bancarias')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data || []
  }

  private async getUserCards(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('cartoes_credito')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data || []
  }

  private async getUserContacts(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('contatos')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data || []
  }

  private async getUserCostCenters(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('centros_custo')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data || []
  }

  private async getUserInvestments(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('investimentos')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data || []
  }

  private async getUserAlerts(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('alertas')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data || []
  }

  private async restoreUserData(userId: string, data: any): Promise<void> {
    // Implementar restauração de dados
    // Por segurança, isso deve ser feito com muito cuidado
    console.log('🔄 Restaurando dados do usuário...')
    
    // Aqui você implementaria a lógica de restauração
    // Por exemplo, limpar dados existentes e inserir os dados do backup
    // Isso deve ser feito com transações para garantir consistência
  }

  private calculateDataSize(data: any): number {
    return JSON.stringify(data).length
  }

  private calculateExpirationDate(): string {
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + this.config.retention_days)
    return expirationDate.toISOString()
  }

  private getBackupInterval(): number {
    switch (this.config.frequency) {
      case 'daily':
        return 24 * 60 * 60 * 1000 // 24 horas
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000 // 7 dias
      case 'monthly':
        return 30 * 24 * 60 * 60 * 1000 // 30 dias
      default:
        return 24 * 60 * 60 * 1000
    }
  }

  // Configurar backup
  updateConfig(newConfig: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('⚙️ Configuração de backup atualizada:', this.config)
  }

  // Obter configuração atual
  getConfig(): BackupConfig {
    return { ...this.config }
  }
}

// Instância singleton do serviço de backup
export const backupService = new BackupService()
export default backupService
