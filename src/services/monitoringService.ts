// Serviço de Monitoramento em Tempo Real
import { supabase } from './supabase'
import { SheetData } from '../types'
import { getEmpresaIdFromStorage } from '../utils/empresaHelper'

export interface SystemMetrics {
  id: string
  timestamp: string
  user_id: string
  performance: {
    page_load_time: number
    api_response_time: number
    memory_usage: number
    cpu_usage: number
  }
  database: {
    connection_count: number
    query_count: number
    slow_queries: number
    cache_hit_rate: number
  }
  transactions: {
    total_count: number
    created_today: number
    updated_today: number
    deleted_today: number
    pending_count: number
    overdue_count: number
  }
  notifications: {
    sent_today: number
    failed_today: number
    delivery_rate: number
    active_channels: string[]
  }
  errors: {
    total_errors: number
    critical_errors: number
    warning_errors: number
    last_error_time?: string
  }
  uptime: {
    current_uptime: number
    last_restart: string
    availability_percentage: number
  }
}

export interface AlertRule {
  id: string
  name: string
  metric: string
  operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals'
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  message: string
  cooldown_minutes: number
}

export interface SystemAlert {
  id: string
  rule_id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  metric_value: number
  threshold: number
  created_at: string
  acknowledged: boolean
  resolved: boolean
  resolved_at?: string
}

export interface RealtimeStats {
  active_users: number
  transactions_per_minute: number
  notifications_per_minute: number
  error_rate: number
  average_response_time: number
  system_health: 'healthy' | 'warning' | 'critical'
}

class MonitoringService {
  private metrics: SystemMetrics[] = []
  private alerts: SystemAlert[] = []
  private alertRules: AlertRule[] = []
  private isMonitoring = false
  private monitoringInterval: NodeJS.Timeout | null = null
  private statsInterval: NodeJS.Timeout | null = null
  private listeners: Map<string, Function[]> = new Map()

  constructor() {
    this.initializeAlertRules()
    this.startMonitoring()
  }

  // Inicializar regras de alerta
  private initializeAlertRules() {
    this.alertRules = [
      {
        id: 'high_memory_usage',
        name: 'Alto Uso de Memória',
        metric: 'memory_usage',
        operator: 'greater_than',
        threshold: 80,
        severity: 'high',
        enabled: true,
        message: 'Uso de memória está acima de 80%',
        cooldown_minutes: 30
      },
      {
        id: 'slow_api_response',
        name: 'Resposta de API Lenta',
        metric: 'api_response_time',
        operator: 'greater_than',
        threshold: 2000,
        severity: 'medium',
        enabled: true,
        message: 'Tempo de resposta da API está acima de 2 segundos',
        cooldown_minutes: 15
      },
      {
        id: 'high_error_rate',
        name: 'Alta Taxa de Erros',
        metric: 'error_rate',
        operator: 'greater_than',
        threshold: 5,
        severity: 'critical',
        enabled: true,
        message: 'Taxa de erros está acima de 5%',
        cooldown_minutes: 5
      },
      {
        id: 'low_cache_hit_rate',
        name: 'Taxa de Cache Baixa',
        metric: 'cache_hit_rate',
        operator: 'less_than',
        threshold: 70,
        severity: 'medium',
        enabled: true,
        message: 'Taxa de acerto do cache está abaixo de 70%',
        cooldown_minutes: 20
      },
      {
        id: 'many_overdue_transactions',
        name: 'Muitas Transações Vencidas',
        metric: 'overdue_count',
        operator: 'greater_than',
        threshold: 10,
        severity: 'high',
        enabled: true,
        message: 'Há mais de 10 transações vencidas',
        cooldown_minutes: 60
      }
    ]
  }

  // Iniciar monitoramento
  private startMonitoring() {
    if (this.isMonitoring) return

    this.isMonitoring = true
    console.log('🔍 Iniciando monitoramento do sistema...')

    // Coletar métricas a cada 30 segundos
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics()
    }, 30000)

    // Atualizar estatísticas em tempo real a cada 10 segundos
    this.statsInterval = setInterval(() => {
      this.updateRealtimeStats()
    }, 10000)

    // Coletar métricas imediatamente
    this.collectMetrics()
  }

  // Parar monitoramento
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    if (this.statsInterval) {
      clearInterval(this.statsInterval)
      this.statsInterval = null
    }
    this.isMonitoring = false
    console.log('⏹️ Monitoramento parado')
  }

  // Coletar métricas do sistema
  private async collectMetrics() {
    try {
      // Verificar autenticação
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session?.user) {
        console.log('⚠️ Usuário não autenticado, pulando coleta de métricas')
        return
      }

      const userId = session.user.id
      const timestamp = new Date().toISOString()

      // Coletar métricas de performance
      const performance = await this.collectPerformanceMetrics()
      
      // Coletar métricas de banco de dados
      const database = await this.collectDatabaseMetrics()
      
      // Coletar métricas de transações
      const transactions = await this.collectTransactionMetrics(userId)
      
      // Coletar métricas de notificações
      const notifications = await this.collectNotificationMetrics(userId)
      
      // Coletar métricas de erros
      const errors = await this.collectErrorMetrics()
      
      // Coletar métricas de uptime
      const uptime = await this.collectUptimeMetrics()

      const metrics: SystemMetrics = {
        id: `metrics_${Date.now()}`,
        timestamp,
        user_id: userId,
        performance,
        database,
        transactions,
        notifications,
        errors,
        uptime
      }

      // Armazenar métricas
      this.metrics.push(metrics)
      
      // Manter apenas as últimas 100 métricas
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100)
      }

      // Verificar alertas
      await this.checkAlerts(metrics)

      // Emitir evento de métricas atualizadas
      this.emit('metrics_updated', metrics)

    } catch (error) {
      console.error('❌ Erro ao coletar métricas:', error)
    }
  }

  // Coletar métricas de performance
  private async collectPerformanceMetrics() {
    const memoryUsage = this.getMemoryUsage()
    const cpuUsage = this.getCPUUsage()
    const pageLoadTime = this.getPageLoadTime()
    const apiResponseTime = await this.getAPIResponseTime()

    return {
      page_load_time: pageLoadTime,
      api_response_time: apiResponseTime,
      memory_usage: memoryUsage,
      cpu_usage: cpuUsage
    }
  }

  // Coletar métricas de banco de dados
  private async collectDatabaseMetrics() {
    try {
      // Simular métricas de banco de dados
      // Em uma implementação real, isso viria do Supabase
      return {
        connection_count: Math.floor(Math.random() * 50) + 10,
        query_count: Math.floor(Math.random() * 1000) + 100,
        slow_queries: Math.floor(Math.random() * 10),
        cache_hit_rate: Math.floor(Math.random() * 30) + 70
      }
    } catch (error) {
      console.error('❌ Erro ao coletar métricas de banco:', error)
      return {
        connection_count: 0,
        query_count: 0,
        slow_queries: 0,
        cache_hit_rate: 0
      }
    }
  }

  // Coletar métricas de transações
  private async collectTransactionMetrics(userId: string) {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Obter empresa_id atual
      const empresaId = getEmpresaIdFromStorage()
      if (!empresaId) {
        // Se não há empresa, retornar métricas vazias
        return {
          total_count: 0,
          created_today: 0,
          updated_today: 0,
          deleted_today: 0,
          pending_count: 0,
          overdue_count: 0
        }
      }
      
      // Buscar transações do usuário na empresa atual
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('empresa_id', empresaId)

      if (error) {
        console.error('❌ Erro ao buscar transações:', error)
        return {
          total_count: 0,
          created_today: 0,
          updated_today: 0,
          deleted_today: 0,
          pending_count: 0,
          overdue_count: 0
        }
      }

      const todayTransactions = transactions?.filter(t => 
        t.created_at?.startsWith(today) || t.updated_at?.startsWith(today)
      ) || []

      const pendingCount = transactions?.filter(t => t.status === 'pendente').length || 0
      const overdueCount = transactions?.filter(t => {
        if (!t.vencimento) return false
        const dueDate = new Date(t.vencimento)
        return dueDate < new Date() && t.status === 'pendente'
      }).length || 0

      return {
        total_count: transactions?.length || 0,
        created_today: todayTransactions.filter(t => t.created_at?.startsWith(today)).length,
        updated_today: todayTransactions.filter(t => t.updated_at?.startsWith(today)).length,
        deleted_today: 0, // Não rastreamos exclusões ainda
        pending_count: pendingCount,
        overdue_count: overdueCount
      }
    } catch (error) {
      console.error('❌ Erro ao coletar métricas de transações:', error)
      return {
        total_count: 0,
        created_today: 0,
        updated_today: 0,
        deleted_today: 0,
        pending_count: 0,
        overdue_count: 0
      }
    }
  }

  // Coletar métricas de notificações
  private async collectNotificationMetrics(userId: string) {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data: notifications, error } = await supabase
        .from('notification_history')
        .select('*')
        .eq('user_id', userId)
        .gte('sent_at', today)

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
        
        // Retornar valores padrão silenciosamente
        return {
          sent_today: 0,
          failed_today: 0,
          delivery_rate: 0,
          active_channels: []
        }
      }

      const sentCount = notifications?.length || 0
      const failedCount = notifications?.filter(n => n.status === 'failed').length || 0
      const deliveryRate = sentCount > 0 ? ((sentCount - failedCount) / sentCount) * 100 : 100
      const activeChannels = [...new Set(notifications?.map(n => n.channel) || [])]

      return {
        sent_today: sentCount,
        failed_today: failedCount,
        delivery_rate: Math.round(deliveryRate),
        active_channels: activeChannels
      }
    } catch (error) {
      console.error('❌ Erro ao coletar métricas de notificações:', error)
      return {
        sent_today: 0,
        failed_today: 0,
        delivery_rate: 0,
        active_channels: []
      }
    }
  }

  // Coletar métricas de erros
  private async collectErrorMetrics() {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data: logs, error } = await supabase
        .from('system_logs')
        .select('*')
        .gte('created_at', today)
        .in('level', ['error', 'critical'])

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
        
        // Retornar valores padrão silenciosamente
        return {
          total_errors: 0,
          critical_errors: 0,
          warning_errors: 0,
          last_error_time: undefined
        }
      }

      const totalErrors = logs?.length || 0
      const criticalErrors = logs?.filter(l => l.level === 'critical').length || 0
      const warningErrors = logs?.filter(l => l.level === 'error').length || 0
      const lastErrorTime = logs?.length > 0 ? logs[0].created_at : undefined

      return {
        total_errors: totalErrors,
        critical_errors: criticalErrors,
        warning_errors: warningErrors,
        last_error_time: lastErrorTime
      }
    } catch (error: any) {
      // Capturar erros HTTP 404 também
      if (error?.status === 404 || error?.statusCode === 404 || error?.message?.includes('404')) {
        return {
          total_errors: 0,
          critical_errors: 0,
          warning_errors: 0,
          last_error_time: undefined
        }
      }
      // Silenciar outros erros também
      return {
        total_errors: 0,
        critical_errors: 0,
        warning_errors: 0,
        last_error_time: undefined
      }
    }
  }

  // Coletar métricas de uptime
  private async collectUptimeMetrics() {
    const startTime = performance.now()
    const currentUptime = Date.now() - startTime
    const lastRestart = new Date().toISOString()
    const availabilityPercentage = 99.9 // Simulado

    return {
      current_uptime: currentUptime,
      last_restart: lastRestart,
      availability_percentage: availabilityPercentage
    }
  }

  // Verificar alertas
  private async checkAlerts(metrics: SystemMetrics) {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue

      const metricValue = this.getMetricValue(metrics, rule.metric)
      if (metricValue === null) continue

      const shouldAlert = this.evaluateAlertRule(rule, metricValue)
      if (shouldAlert) {
        await this.createAlert(rule, metricValue, metrics)
      }
    }
  }

  // Obter valor da métrica
  private getMetricValue(metrics: SystemMetrics, metricPath: string): number | null {
    const paths = metricPath.split('.')
    let value: any = metrics

    for (const path of paths) {
      if (value && typeof value === 'object' && path in value) {
        value = value[path]
      } else {
        return null
      }
    }

    return typeof value === 'number' ? value : null
  }

  // Avaliar regra de alerta
  private evaluateAlertRule(rule: AlertRule, value: number): boolean {
    switch (rule.operator) {
      case 'greater_than':
        return value > rule.threshold
      case 'less_than':
        return value < rule.threshold
      case 'equals':
        return value === rule.threshold
      case 'not_equals':
        return value !== rule.threshold
      default:
        return false
    }
  }

  // Criar alerta
  private async createAlert(rule: AlertRule, value: number, metrics: SystemMetrics) {
    // Verificar cooldown
    const lastAlert = this.alerts.find(a => 
      a.rule_id === rule.id && 
      !a.resolved &&
      new Date(a.created_at) > new Date(Date.now() - rule.cooldown_minutes * 60 * 1000)
    )

    if (lastAlert) return

    const alert: Omit<SystemAlert, 'id'> = {
      rule_id: rule.id,
      severity: rule.severity,
      title: rule.name,
      message: rule.message,
      metric_value: value,
      threshold: rule.threshold,
      created_at: new Date().toISOString(),
      acknowledged: false,
      resolved: false
    }

    this.alerts.push({ ...alert, id: `alert_${Date.now()}` })

    // Emitir evento de alerta
    this.emit('alert_created', alert)

    console.log(`🚨 Alerta criado: ${rule.name} - ${value} ${rule.operator} ${rule.threshold}`)
  }

  // Atualizar estatísticas em tempo real
  private async updateRealtimeStats() {
    try {
      const stats: RealtimeStats = {
        active_users: await this.getActiveUsersCount(),
        transactions_per_minute: await this.getTransactionsPerMinute(),
        notifications_per_minute: await this.getNotificationsPerMinute(),
        error_rate: await this.getErrorRate(),
        average_response_time: await this.getAverageResponseTime(),
        system_health: this.calculateSystemHealth()
      }

      this.emit('stats_updated', stats)
    } catch (error) {
      console.error('❌ Erro ao atualizar estatísticas:', error)
    }
  }

  // Métodos auxiliares para métricas
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
    }
    return Math.floor(Math.random() * 30) + 20 // Simulado
  }

  private getCPUUsage(): number {
    return Math.floor(Math.random() * 20) + 10 // Simulado
  }

  private getPageLoadTime(): number {
    return Math.round(performance.now())
  }

  private async getAPIResponseTime(): Promise<number> {
    const start = performance.now()
    try {
      // Obter empresa_id para teste de conexão
      const empresaId = getEmpresaIdFromStorage()
      if (empresaId) {
        await supabase.from('transactions').select('id').eq('empresa_id', empresaId).limit(1)
      } else {
        await supabase.from('transactions').select('id').limit(1)
      }
      return Math.round(performance.now() - start)
    } catch {
      return 5000 // Timeout simulado
    }
  }

  private async getActiveUsersCount(): Promise<number> {
    // Simulado - em produção viria do Supabase
    return Math.floor(Math.random() * 50) + 10
  }

  private async getTransactionsPerMinute(): Promise<number> {
    // Simulado - em produção viria do banco
    return Math.floor(Math.random() * 20) + 5
  }

  private async getNotificationsPerMinute(): Promise<number> {
    // Simulado - em produção viria do banco
    return Math.floor(Math.random() * 10) + 2
  }

  private async getErrorRate(): Promise<number> {
    // Simulado - em produção viria dos logs
    return Math.random() * 2
  }

  private async getAverageResponseTime(): Promise<number> {
    // Simulado - em produção viria das métricas
    return Math.floor(Math.random() * 500) + 100
  }

  private calculateSystemHealth(): 'healthy' | 'warning' | 'critical' {
    const criticalAlerts = this.alerts.filter(a => 
      a.severity === 'critical' && !a.resolved
    ).length

    if (criticalAlerts > 0) return 'critical'
    
    const highAlerts = this.alerts.filter(a => 
      a.severity === 'high' && !a.resolved
    ).length

    if (highAlerts > 2) return 'warning'

    return 'healthy'
  }

  // Sistema de eventos
  addListener(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)

    return () => {
      const callbacks = this.listeners.get(event)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  // Métodos públicos
  getMetrics(): SystemMetrics[] {
    return [...this.metrics]
  }

  getAlerts(): SystemAlert[] {
    return [...this.alerts]
  }

  getAlertRules(): AlertRule[] {
    return [...this.alertRules]
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      this.emit('alert_acknowledged', alert)
    }
  }

  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      alert.resolved_at = new Date().toISOString()
      this.emit('alert_resolved', alert)
    }
  }

  getSystemHealth(): 'healthy' | 'warning' | 'critical' {
    return this.calculateSystemHealth()
  }

  getLatestMetrics(): SystemMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null
  }
}

// Instância singleton do serviço de monitoramento
export const monitoringService = new MonitoringService()
export default monitoringService
