import React, { useState, useEffect } from 'react'
import { 
  Activity, 
  Clock, 
  User, 
  Filter, 
  RefreshCw, 
  Undo2, 
  Eye, 
  Download,
  Calendar,
  Search,
  BarChart3,
  Settings,
  Database,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { 
  logService, 
  TransactionLog, 
  SystemConfigLog, 
  ActivityLog, 
  LogStatistics,
  LogFilters 
} from '../services/logService'
import { useAuth } from '../hooks/useAuth'

interface SystemLogsProps {
  isOpen: boolean
  onClose: () => void
}

const SystemLogs: React.FC<SystemLogsProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState<'transactions' | 'configs' | 'activities' | 'statistics'>('transactions')
  const [loading, setLoading] = useState(false)
  const [transactionLogs, setTransactionLogs] = useState<TransactionLog[]>([])
  const [configLogs, setConfigLogs] = useState<SystemConfigLog[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [statistics, setStatistics] = useState<LogStatistics | null>(null)
  const [filters, setFilters] = useState<LogFilters>({
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date().toISOString(),
    limit: 50
  })
  const [selectedLog, setSelectedLog] = useState<TransactionLog | SystemConfigLog | null>(null)
  const [showLogDetails, setShowLogDetails] = useState(false)
  const [undoLoading, setUndoLoading] = useState<string | null>(null)

  // Verificar se o usuário é admin
  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    if (isOpen && isAdmin) {
      loadLogs()
    }
  }, [isOpen, isAdmin, activeTab, filters])

  const loadLogs = async () => {
    if (!isAdmin) return

    setLoading(true)
    try {
      switch (activeTab) {
        case 'transactions':
          const transactions = await logService.getTransactionLogs(filters)
          setTransactionLogs(transactions)
          break
        case 'configs':
          const configs = await logService.getSystemConfigLogs(filters)
          setConfigLogs(configs)
          break
        case 'activities':
          const activities = await logService.getActivityLogs(filters)
          setActivityLogs(activities)
          break
        case 'statistics':
          const stats = await logService.getLogStatistics(filters.start_date, filters.end_date)
          setStatistics(stats)
          break
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUndoAction = async (logId: string, logType: 'transaction' | 'config') => {
    if (!isAdmin) return

    setUndoLoading(logId)
    try {
      let success = false
      if (logType === 'transaction') {
        success = await logService.undoTransactionAction(logId)
      } else {
        success = await logService.undoConfigAction(logId)
      }

      if (success) {
        // Recarregar logs
        await loadLogs()
        alert('Ação desfeita com sucesso!')
      } else {
        alert('Erro ao desfazer ação')
      }
    } catch (error: any) {
      console.error('Erro ao desfazer ação:', error)
      alert(error.message || 'Erro ao desfazer ação')
    } finally {
      setUndoLoading(null)
    }
  }

  const handleFilterChange = (key: keyof LogFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleViewLogDetails = (log: TransactionLog | SystemConfigLog) => {
    setSelectedLog(log)
    setShowLogDetails(true)
  }

  const exportLogs = async () => {
    try {
      const allLogs = {
        transactions: await logService.getTransactionLogs({ ...filters, limit: 1000 }),
        configs: await logService.getSystemConfigLogs({ ...filters, limit: 1000 }),
        activities: await logService.getActivityLogs({ ...filters, limit: 1000 })
      }

      const dataStr = JSON.stringify(allLogs, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `system-logs-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao exportar logs:', error)
      alert('Erro ao exportar logs')
    }
  }

  if (!isOpen) return null

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Negado</h3>
            <p className="text-sm text-gray-500 mb-4">
              Apenas administradores podem acessar os logs do sistema.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-4 w-full max-w-7xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Sistema de Logs</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportLogs}
              className="flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>
            <button
              onClick={loadLogs}
              disabled={loading}
              className="flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'transactions', name: 'Transações', icon: FileText },
              { id: 'configs', name: 'Configurações', icon: Settings },
              { id: 'activities', name: 'Atividades', icon: Activity },
              { id: 'statistics', name: 'Estatísticas', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Filtros */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="datetime-local"
                value={filters.start_date?.slice(0, 16) || ''}
                onChange={(e) => handleFilterChange('start_date', e.target.value + ':00')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="datetime-local"
                value={filters.end_date?.slice(0, 16) || ''}
                onChange={(e) => handleFilterChange('end_date', e.target.value + ':00')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ação</label>
              <select
                value={filters.action_type || ''}
                onChange={(e) => handleFilterChange('action_type', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="create">Criar</option>
                <option value="update">Atualizar</option>
                <option value="delete">Excluir</option>
                <option value="mark_paid">Marcar como Pago</option>
                <option value="mark_unpaid">Desmarcar como Pago</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limite</label>
              <select
                value={filters.limit || 50}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mr-3" />
              <span className="text-gray-600">Carregando logs...</span>
            </div>
          )}

          {!loading && (
            <>
              {/* Logs de Transações */}
              {activeTab === 'transactions' && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Logs de Transações ({transactionLogs.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ação
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usuário
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Descrição
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data/Hora
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactionLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-lg mr-2">
                                  {logService.getActionIcon(log.action_type)}
                                </span>
                                <span className={`text-sm font-medium ${logService.getActionColor(log.action_type)}`}>
                                  {logService.getActionText(log.action_type)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {log.user_email}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                              {log.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {logService.formatDate(log.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {log.undone_at ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Desfeito
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Ativo
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleViewLogDetails(log)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Ver detalhes"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                {!log.undone_at && log.can_be_undone && (
                                  <button
                                    onClick={() => handleUndoAction(log.id, 'transaction')}
                                    disabled={undoLoading === log.id}
                                    className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                                    title="Desfazer ação"
                                  >
                                    {undoLoading === log.id ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Undo2 className="h-4 w-4" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Logs de Configuração */}
              {activeTab === 'configs' && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Logs de Configuração ({configLogs.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ação
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usuário
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Descrição
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data/Hora
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {configLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {log.config_type === 'categoria' ? 'Categoria' : 
                               log.config_type === 'conta_bancaria' ? 'Conta Bancária' : 
                               log.config_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-lg mr-2">
                                  {logService.getActionIcon(log.action_type)}
                                </span>
                                <span className={`text-sm font-medium ${logService.getActionColor(log.action_type)}`}>
                                  {logService.getActionText(log.action_type)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {log.user_email}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                              {log.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {logService.formatDate(log.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {log.undone_at ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Desfeito
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Ativo
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleViewLogDetails(log)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Ver detalhes"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                {!log.undone_at && log.can_be_undone && (
                                  <button
                                    onClick={() => handleUndoAction(log.id, 'config')}
                                    disabled={undoLoading === log.id}
                                    className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                                    title="Desfazer ação"
                                  >
                                    {undoLoading === log.id ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Undo2 className="h-4 w-4" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Estatísticas */}
              {activeTab === 'statistics' && statistics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Activity className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total de Ações</dt>
                            <dd className="text-lg font-medium text-gray-900">{statistics.total_actions}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <User className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Usuários Ativos</dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {Object.keys(statistics.actions_by_user).length}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <FileText className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Tipos de Ação</dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {Object.keys(statistics.actions_by_type).length}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Clock className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Período</dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {filters.start_date ? new Date(filters.start_date).toLocaleDateString('pt-BR') : 'N/A'}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal de Detalhes do Log */}
        {showLogDetails && selectedLog && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Detalhes do Log</h3>
                  <button
                    onClick={() => setShowLogDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Informações Gerais</h4>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">ID:</dt>
                        <dd className="text-sm text-gray-900">{selectedLog.id}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Usuário:</dt>
                        <dd className="text-sm text-gray-900">{selectedLog.user_email}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Data/Hora:</dt>
                        <dd className="text-sm text-gray-900">{logService.formatDate(selectedLog.created_at)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">IP:</dt>
                        <dd className="text-sm text-gray-900">{selectedLog.ip_address}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Valores</h4>
                    <div className="space-y-4">
                      {selectedLog.old_values && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 mb-1">Valores Anteriores:</dt>
                          <dd className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                            <pre className="whitespace-pre-wrap text-xs">
                              {JSON.stringify(selectedLog.old_values, null, 2)}
                            </pre>
                          </dd>
                        </div>
                      )}
                      {selectedLog.new_values && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 mb-1">Valores Novos:</dt>
                          <dd className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                            <pre className="whitespace-pre-wrap text-xs">
                              {JSON.stringify(selectedLog.new_values, null, 2)}
                            </pre>
                          </dd>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowLogDetails(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SystemLogs
