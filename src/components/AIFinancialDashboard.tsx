// Dashboard de IA para Análise Financeira
import React, { useState, useEffect } from 'react'
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Target, 
  BarChart3, 
  PieChart, 
  LineChart,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  Zap,
  Eye,
  Filter
} from 'lucide-react'
import { 
  aiFinancialService, 
  FinancialPrediction, 
  SpendingPattern, 
  AnomalyDetection, 
  SmartRecommendation 
} from '../services/aiFinancialService'

interface AIFinancialDashboardProps {
  isOpen: boolean
  onClose: () => void
}

const AIFinancialDashboard: React.FC<AIFinancialDashboardProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'predictions' | 'patterns' | 'anomalies' | 'recommendations'>('overview')
  const [loading, setLoading] = useState(false)
  const [prediction, setPrediction] = useState<FinancialPrediction | null>(null)
  const [patterns, setPatterns] = useState<SpendingPattern[]>([])
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([])
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([])
  const [predictionMonths, setPredictionMonths] = useState(3)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  useEffect(() => {
    if (autoRefresh && isOpen) {
      const interval = setInterval(() => {
        loadData()
      }, 30000) // Atualizar a cada 30 segundos

      return () => clearInterval(interval)
    }
  }, [autoRefresh, isOpen])

  const loadData = async () => {
    setLoading(true)
    try {
      // Carregar dados em paralelo
      const [predictionData, patternsData, anomaliesData, recommendationsData] = await Promise.all([
        aiFinancialService.generateFinancialPrediction('current-user', predictionMonths),
        Promise.resolve(aiFinancialService.getSpendingPatterns()),
        Promise.resolve(aiFinancialService.getAnomalies()),
        Promise.resolve(aiFinancialService.getRecommendations())
      ])

      setPrediction(predictionData)
      setPatterns(patternsData)
      setAnomalies(anomaliesData)
      setRecommendations(recommendationsData)
    } catch (error) {
      console.error('Erro ao carregar dados de IA:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: 'low' | 'medium' | 'high' | 'urgent') => {
    switch (priority) {
      case 'low': return 'text-blue-600 bg-blue-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'urgent': return 'text-red-600 bg-red-100'
    }
  }

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
    }
  }

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'decreasing': return <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />
      case 'stable': return <BarChart3 className="h-4 w-4 text-blue-500" />
    }
  }

  const getFrequencyIcon = (frequency: 'daily' | 'weekly' | 'monthly' | 'irregular') => {
    switch (frequency) {
      case 'daily': return <Clock className="h-4 w-4 text-blue-500" />
      case 'weekly': return <Calendar className="h-4 w-4 text-green-500" />
      case 'monthly': return <Calendar className="h-4 w-4 text-purple-500" />
      case 'irregular': return <Zap className="h-4 w-4 text-orange-500" />
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-4 w-full max-w-7xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-purple-600" />
              <h3 className="text-xl font-semibold text-gray-900">
                Dashboard de IA Financeira
              </h3>
              <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                🤖 IA Ativa
              </div>
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
                className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Analisar
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
              { id: 'predictions', label: 'Previsões', icon: TrendingUp },
              { id: 'patterns', label: 'Padrões', icon: PieChart },
              { id: 'anomalies', label: 'Anomalias', icon: AlertTriangle },
              { id: 'recommendations', label: 'Recomendações', icon: Lightbulb }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-purple-600 shadow-sm'
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
              <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-3 text-gray-600">Analisando dados com IA...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Visão Geral */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Previsão Financeira */}
                  {prediction && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">Previsão {prediction.period}</h4>
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Receitas:</span>
                          <span className="font-semibold text-green-600">{formatCurrency(prediction.predicted_income)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Despesas:</span>
                          <span className="font-semibold text-red-600">{formatCurrency(prediction.predicted_expenses)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-sm font-medium text-gray-900">Saldo:</span>
                          <span className={`font-bold ${prediction.predicted_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(prediction.predicted_balance)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Confiança: {formatPercentage(prediction.confidence)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Padrões Detectados */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Padrões Detectados</h4>
                      <PieChart className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">{patterns.length}</div>
                    <div className="text-sm text-gray-600">Categorias analisadas</div>
                    <div className="mt-2 text-xs text-gray-500">
                      {patterns.filter(p => p.confidence > 0.7).length} com alta confiança
                    </div>
                  </div>

                  {/* Anomalias Encontradas */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Anomalias</h4>
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">{anomalies.length}</div>
                    <div className="text-sm text-gray-600">Transações suspeitas</div>
                    <div className="mt-2 text-xs text-gray-500">
                      {anomalies.filter(a => a.severity === 'high').length} de alta severidade
                    </div>
                  </div>

                  {/* Recomendações */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Recomendações</h4>
                      <Lightbulb className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">{recommendations.length}</div>
                    <div className="text-sm text-gray-600">Sugestões inteligentes</div>
                    <div className="mt-2 text-xs text-gray-500">
                      {recommendations.filter(r => r.priority === 'high').length} prioritárias
                    </div>
                  </div>
                </div>
              )}

              {/* Previsões */}
              {activeTab === 'predictions' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-semibold text-gray-900">Previsões Financeiras</h4>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Período:</label>
                        <select
                          value={predictionMonths}
                          onChange={(e) => setPredictionMonths(parseInt(e.target.value))}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                        >
                          <option value={1}>1 mês</option>
                          <option value={3}>3 meses</option>
                          <option value={6}>6 meses</option>
                          <option value={12}>12 meses</option>
                        </select>
                      </div>
                    </div>

                    {prediction ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(prediction.predicted_income)}
                          </div>
                          <div className="text-sm text-gray-600">Receitas Previstas</div>
                        </div>

                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <DollarSign className="h-8 w-8 text-red-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(prediction.predicted_expenses)}
                          </div>
                          <div className="text-sm text-gray-600">Despesas Previstas</div>
                        </div>

                        <div className={`text-center p-4 rounded-lg ${
                          prediction.predicted_balance >= 0 ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          <Target className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                          <div className={`text-2xl font-bold ${
                            prediction.predicted_balance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(prediction.predicted_balance)}
                          </div>
                          <div className="text-sm text-gray-600">Saldo Previsto</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>Nenhuma previsão disponível</p>
                      </div>
                    )}

                    {prediction && (
                      <div className="mt-6">
                        <h5 className="font-semibold text-gray-900 mb-3">Fatores Considerados</h5>
                        <div className="flex flex-wrap gap-2">
                          {prediction.factors.map((factor, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                            >
                              {factor}
                            </span>
                          ))}
                        </div>

                        <h5 className="font-semibold text-gray-900 mb-3 mt-4">Recomendações</h5>
                        <div className="space-y-2">
                          {prediction.recommendations.map((recommendation, index) => (
                            <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                              <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5" />
                              <span className="text-sm text-gray-700">{recommendation}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Padrões de Gastos */}
              {activeTab === 'patterns' && (
                <div className="space-y-4">
                  {patterns.length === 0 ? (
                    <div className="text-center py-12">
                      <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum padrão detectado ainda</p>
                    </div>
                  ) : (
                    patterns.map((pattern, index) => (
                      <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h4 className="text-lg font-semibold text-gray-900">{pattern.category}</h4>
                              <div className="flex items-center gap-2">
                                {getFrequencyIcon(pattern.frequency)}
                                <span className="text-sm text-gray-600 capitalize">{pattern.frequency}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {getTrendIcon(pattern.trend)}
                                <span className="text-sm text-gray-600 capitalize">{pattern.trend}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <div className="text-sm text-gray-600">Valor Médio</div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {formatCurrency(pattern.average_amount)}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">Confiança</div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {formatPercentage(pattern.confidence)}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">Próxima Previsão</div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {pattern.next_predicted_date ? (
                                    <>
                                      <div className="text-sm">{pattern.next_predicted_date}</div>
                                      <div className="text-xs text-gray-500">
                                        {formatCurrency(pattern.next_predicted_amount || 0)}
                                      </div>
                                    </>
                                  ) : (
                                    'N/A'
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${pattern.confidence * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Anomalias */}
              {activeTab === 'anomalies' && (
                <div className="space-y-4">
                  {anomalies.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-gray-600">Nenhuma anomalia detectada</p>
                    </div>
                  ) : (
                    anomalies.map((anomaly, index) => (
                      <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(anomaly.severity)}`}>
                                {anomaly.severity.toUpperCase()}
                              </div>
                              <span className="text-sm text-gray-600">ID: {anomaly.transaction_id}</span>
                              <span className="text-sm text-gray-600 capitalize">{anomaly.type.replace('_', ' ')}</span>
                            </div>

                            <h4 className="text-lg font-semibold text-gray-900 mb-2">{anomaly.description}</h4>
                            <p className="text-gray-600 mb-4">{anomaly.suggested_action}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm text-gray-600">Valor Original</div>
                                <div className="font-semibold text-gray-900">
                                  {typeof anomaly.original_value === 'number' 
                                    ? formatCurrency(anomaly.original_value)
                                    : JSON.stringify(anomaly.original_value)
                                  }
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">Valor Esperado</div>
                                <div className="font-semibold text-gray-900">
                                  {typeof anomaly.expected_value === 'number' 
                                    ? formatCurrency(anomaly.expected_value)
                                    : JSON.stringify(anomaly.expected_value)
                                  }
                                </div>
                              </div>
                            </div>

                            <div className="mt-4">
                              <div className="text-sm text-gray-600 mb-1">Confiança</div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-orange-600 h-2 rounded-full"
                                  style={{ width: `${anomaly.confidence * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Recomendações */}
              {activeTab === 'recommendations' && (
                <div className="space-y-4">
                  {recommendations.length === 0 ? (
                    <div className="text-center py-12">
                      <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhuma recomendação disponível</p>
                    </div>
                  ) : (
                    recommendations.map((recommendation, index) => (
                      <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h4 className="text-lg font-semibold text-gray-900">{recommendation.title}</h4>
                              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(recommendation.priority)}`}>
                                {recommendation.priority.toUpperCase()}
                              </div>
                              <div className="text-sm text-gray-600 capitalize">
                                {recommendation.type.replace('_', ' ')}
                              </div>
                            </div>

                            <p className="text-gray-600 mb-4">{recommendation.description}</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              {recommendation.potential_savings && (
                                <div>
                                  <div className="text-sm text-gray-600">Economia Potencial</div>
                                  <div className="text-lg font-semibold text-green-600">
                                    {formatCurrency(recommendation.potential_savings)}
                                  </div>
                                </div>
                              )}
                              {recommendation.potential_income && (
                                <div>
                                  <div className="text-sm text-gray-600">Renda Potencial</div>
                                  <div className="text-lg font-semibold text-blue-600">
                                    {formatCurrency(recommendation.potential_income)}
                                  </div>
                                </div>
                              )}
                              <div>
                                <div className="text-sm text-gray-600">Probabilidade de Sucesso</div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {formatPercentage(recommendation.success_probability)}
                                </div>
                              </div>
                            </div>

                            <div className="mb-4">
                              <div className="text-sm text-gray-600 mb-2">Itens de Ação</div>
                              <ul className="space-y-1">
                                {recommendation.action_items.map((item, itemIndex) => (
                                  <li key={itemIndex} className="flex items-center gap-2 text-sm text-gray-700">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>Dificuldade: {recommendation.implementation_difficulty}</span>
                              <span>Prazo: {recommendation.timeframe}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIFinancialDashboard
