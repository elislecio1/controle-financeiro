// Dashboard de Monitoramento em Tempo Real
import React, { useState, useEffect } from 'react'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Eye, 
  RefreshCw, 
  Server, 
  TrendingUp, 
  Users,
  Bell,
  Zap,
  Shield,
  BarChart3,
  PieChart,
  LineChart,
  X
} from 'lucide-react'
import { monitoringService, SystemMetrics, SystemAlert, RealtimeStats } from '../services/monitoringService'

interface MonitoringDashboardProps {
  isOpen: boolean
  onClose: () => void
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ isOpen, onClose }) => {
  const [metrics, setMetrics] = useState<SystemMetrics[]>([])
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'metrics' | 'alerts' | 'performance'>('overview')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadData()
      setupRealtimeListeners()
    }

    return () => {
      // Cleanup listeners
    }
  }, [isOpen])

  const loadData = async () => {
    setLoading(true)
    try {
      const currentMetrics = monitoringService.getMetrics()
      const currentAlerts = monitoringService.getAlerts()
      
      setMetrics(currentMetrics)
      setAlerts(currentAlerts)
    } catch (error) {
      console.error('Erro ao carregar dados de monitoramento:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeListeners = () => {
    // Listener para métricas atualizadas
    const unsubscribeMetrics = monitoringService.addListener('metrics_updated', (newMetrics: SystemMetrics) => {
      setMetrics(prev => [...prev.slice(-99), newMetrics])
    })

    // Listener para alertas
    const unsubscribeAlerts = monitoringService.addListener('alert_created', (newAlert: SystemAlert) => {
      setAlerts(prev => [newAlert, ...prev])
    })

    // Listener para estatísticas em tempo real
    const unsubscribeStats = monitoringService.addListener('stats_updated', (stats: RealtimeStats) => {
      setRealtimeStats(stats)
    })

    return () => {
      unsubscribeMetrics()
      unsubscribeAlerts()
      unsubscribeStats()
    }
  }

  const getHealthColor = (health: 'healthy' | 'warning' | 'critical') => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
    }
  }

  const getHealthIcon = (health: 'healthy' | 'warning' | 'critical') => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-5 w-5" />
      case 'warning': return <AlertTriangle className="h-5 w-5" />
      case 'critical': return <AlertTriangle className="h-5 w-5" />
    }
  }

  const getSeverityColor = (severity: 'low' | 'medium' | 'high' | 'critical') => {
    switch (severity) {
      case 'low': return 'text-blue-600 bg-blue-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'critical': return 'text-red-600 bg-red-100'
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatUptime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-4 w-full max-w-7xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">
                Dashboard de Monitoramento
              </h3>
              {realtimeStats && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getHealthColor(realtimeStats.system_health)}`}>
                  {getHealthIcon(realtimeStats.system_health)}
                  {realtimeStats.system_health === 'healthy' ? 'Saudável' : 
                   realtimeStats.system_health === 'warning' ? 'Atenção' : 'Crítico'}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto Refresh
              </button>
              <button
                onClick={loadData}
                disabled={loading}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
              { id: 'metrics', label: 'Métricas', icon: LineChart },
              { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
              { id: 'performance', label: 'Performance', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Carregando dados...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Visão Geral */}
              {selectedTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Estatísticas em Tempo Real */}
                  {realtimeStats && (
                    <>
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                            <p className="text-2xl font-bold text-gray-900">{realtimeStats.active_users}</p>
                          </div>
                          <Users className="h-8 w-8 text-blue-600" />
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Transações/min</p>
                            <p className="text-2xl font-bold text-gray-900">{realtimeStats.transactions_per_minute}</p>
                          </div>
                          <Activity className="h-8 w-8 text-green-600" />
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Notificações/min</p>
                            <p className="text-2xl font-bold text-gray-900">{realtimeStats.notifications_per_minute}</p>
                          </div>
                          <Bell className="h-8 w-8 text-purple-600" />
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Taxa de Erro</p>
                            <p className="text-2xl font-bold text-gray-900">{realtimeStats.error_rate.toFixed(2)}%</p>
                          </div>
                          <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Métricas de Sistema */}
                  {metrics.length > 0 && (
                    <>
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Uso de Memória</p>
                            <p className="text-2xl font-bold text-gray-900">{metrics[metrics.length - 1]?.performance.memory_usage}%</p>
                          </div>
                          <Server className="h-8 w-8 text-orange-600" />
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Tempo de Resposta</p>
                            <p className="text-2xl font-bold text-gray-900">{metrics[metrics.length - 1]?.performance.api_response_time}ms</p>
                          </div>
                          <Zap className="h-8 w-8 text-yellow-600" />
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
                            <p className="text-2xl font-bold text-gray-900">{metrics[metrics.length - 1]?.database.cache_hit_rate}%</p>
                          </div>
                          <Database className="h-8 w-8 text-indigo-600" />
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Uptime</p>
                            <p className="text-2xl font-bold text-gray-900">{formatUptime(metrics[metrics.length - 1]?.uptime.current_uptime || 0)}</p>
                          </div>
                          <Clock className="h-8 w-8 text-green-600" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Métricas Detalhadas */}
              {selectedTab === 'metrics' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Métricas de Performance</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {metrics.length > 0 && (
                        <>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Tempo de Carregamento</p>
                            <p className="text-xl font-bold text-gray-900">{metrics[metrics.length - 1]?.performance.page_load_time}ms</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Resposta da API</p>
                            <p className="text-xl font-bold text-gray-900">{metrics[metrics.length - 1]?.performance.api_response_time}ms</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Uso de Memória</p>
                            <p className="text-xl font-bold text-gray-900">{metrics[metrics.length - 1]?.performance.memory_usage}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Uso de CPU</p>
                            <p className="text-xl font-bold text-gray-900">{metrics[metrics.length - 1]?.performance.cpu_usage}%</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Métricas de Banco de Dados</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {metrics.length > 0 && (
                        <>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Conexões</p>
                            <p className="text-xl font-bold text-gray-900">{metrics[metrics.length - 1]?.database.connection_count}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Queries</p>
                            <p className="text-xl font-bold text-gray-900">{metrics[metrics.length - 1]?.database.query_count}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Queries Lentas</p>
                            <p className="text-xl font-bold text-gray-900">{metrics[metrics.length - 1]?.database.slow_queries}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Cache Hit Rate</p>
                            <p className="text-xl font-bold text-gray-900">{metrics[metrics.length - 1]?.database.cache_hit_rate}%</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Alertas */}
              {selectedTab === 'alerts' && (
                <div className="space-y-4">
                  {alerts.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-gray-600">Nenhum alerta ativo no momento</p>
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div key={alert.id} className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
                              <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">{alert.title}</h4>
                              <p className="text-gray-600 mt-1">{alert.message}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span>Valor: {alert.metric_value}</span>
                                <span>Limite: {alert.threshold}</span>
                                <span>{new Date(alert.created_at).toLocaleString('pt-BR')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!alert.acknowledged && (
                              <button
                                onClick={() => monitoringService.acknowledgeAlert(alert.id)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                              >
                                Reconhecer
                              </button>
                            )}
                            {!alert.resolved && (
                              <button
                                onClick={() => monitoringService.resolveAlert(alert.id)}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                              >
                                Resolver
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Performance */}
              {selectedTab === 'performance' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Gráficos de Performance</h4>
                    <div className="text-center py-12 text-gray-500">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                      <p>Gráficos de performance serão implementados em breve</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MonitoringDashboard
