import React, { useState, useEffect } from 'react'
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Archive, 
  Trash2, 
  Settings, 
  Plus, 
  Filter,
  Clock,
  DollarSign,
  Target,
  CreditCard,
  Eye,
  EyeOff,
  X
} from 'lucide-react'
import { Alerta, ConfiguracaoAlerta, Notificacao } from '../types'
import { alertasService } from '../services/alertas'

interface SistemaAlertasProps {
  onClose?: () => void
}

export default function SistemaAlertas({ onClose }: SistemaAlertasProps) {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoAlerta[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'alertas' | 'configuracoes' | 'verificacoes'>('alertas')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'lido' | 'arquivado'>('todos')
  const [filtroPrioridade, setFiltroPrioridade] = useState<'todas' | 'baixa' | 'media' | 'alta' | 'critica'>('todas')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'vencimento' | 'meta' | 'orcamento' | 'saldo' | 'personalizado'>('todos')
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [configToEdit, setConfigToEdit] = useState<ConfiguracaoAlerta | null>(null)
  const [showVerificacaoModal, setShowVerificacaoModal] = useState(false)
  const [verificacaoResultado, setVerificacaoResultado] = useState<Alerta[]>([])
  const [mensagemFeedback, setMensagemFeedback] = useState<{ tipo: 'sucesso' | 'erro', texto: string } | null>(null)

  // Estados para nova configuração
  const [novaConfig, setNovaConfig] = useState<Omit<ConfiguracaoAlerta, 'id'>>({
    tipo: 'vencimento',
    ativo: true,
    diasAntes: 3,
    categorias: [],
    contas: [],
    horarioNotificacao: '09:00',
    frequencia: 'diario',
    canais: ['dashboard']
  })

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      const [alertasData, configsData] = await Promise.all([
        alertasService.getAlertas(),
        alertasService.getConfiguracoes()
      ])
      
      setAlertas(alertasData)
      setConfiguracoes(configsData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar alertas baseado nos filtros ativos
  const alertasFiltrados = alertas.filter(alerta => {
    if (filtroStatus !== 'todos' && alerta.status !== filtroStatus) return false
    if (filtroPrioridade !== 'todas' && alerta.prioridade !== filtroPrioridade) return false
    if (filtroTipo !== 'todos' && alerta.tipo !== filtroTipo) return false
    return true
  })

  // Contadores para estatísticas
  const totalAlertas = alertas.length
  const alertasAtivos = alertas.filter(a => a.status === 'ativo').length
  const alertasCriticos = alertas.filter(a => a.prioridade === 'critica' && a.status === 'ativo').length
  const alertasAltos = alertas.filter(a => a.prioridade === 'alta' && a.status === 'ativo').length

  // Funções para gerenciar alertas
  const marcarComoLido = async (id: string) => {
    try {
      const resultado = await alertasService.marcarComoLido(id)
      if (resultado.success) {
        setAlertas(prev => prev.map(a => 
          a.id === id ? { ...a, status: 'lido', dataLeitura: new Date().toISOString() } : a
        ))
      }
    } catch (error) {
      console.error('Erro ao marcar como lido:', error)
    }
  }

  const arquivarAlerta = async (id: string) => {
    try {
      const resultado = await alertasService.arquivarAlerta(id)
      if (resultado.success) {
        setAlertas(prev => prev.map(a => 
          a.id === id ? { ...a, status: 'arquivado' } : a
        ))
      }
    } catch (error) {
      console.error('Erro ao arquivar alerta:', error)
    }
  }

  const deletarAlerta = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este alerta?')) return
    
    try {
      const resultado = await alertasService.deletarAlerta(id)
      if (resultado.success) {
        setAlertas(prev => prev.filter(a => a.id !== id))
      }
    } catch (error) {
      console.error('Erro ao deletar alerta:', error)
    }
  }

  // Funções para gerenciar configurações
  const salvarConfiguracao = async () => {
    try {
      if (configToEdit) {
        const resultado = await alertasService.atualizarConfiguracao(configToEdit.id, novaConfig)
        if (resultado.success) {
          setConfiguracoes(prev => prev.map(c => 
            c.id === configToEdit.id ? { ...c, ...novaConfig } : c
          ))
          setShowConfigModal(false)
          setConfigToEdit(null)
          resetarFormulario()
          setMensagemFeedback({ tipo: 'sucesso', texto: 'Configuração atualizada com sucesso!' })
        } else {
          setMensagemFeedback({ tipo: 'erro', texto: resultado.message })
        }
      } else {
        const resultado = await alertasService.salvarConfiguracao(novaConfig)
        if (resultado.success && resultado.data) {
          setConfiguracoes(prev => [...prev, resultado.data!])
          setShowConfigModal(false)
          resetarFormulario()
          setMensagemFeedback({ tipo: 'sucesso', texto: 'Configuração salva com sucesso!' })
        } else {
          setMensagemFeedback({ tipo: 'erro', texto: resultado.message })
        }
      }
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => setMensagemFeedback(null), 3000)
    } catch (error) {
      console.error('Erro ao salvar configuração:', error)
      setMensagemFeedback({ tipo: 'erro', texto: 'Erro ao salvar configuração' })
      setTimeout(() => setMensagemFeedback(null), 3000)
    }
  }

  const editarConfiguracao = (config: ConfiguracaoAlerta) => {
    setConfigToEdit(config)
    setNovaConfig({
      tipo: config.tipo,
      ativo: config.ativo,
      diasAntes: config.diasAntes,
      categorias: config.categorias || [],
      contas: config.contas || [],
      horarioNotificacao: config.horarioNotificacao,
      frequencia: config.frequencia,
      canais: config.canais
    })
    setShowConfigModal(true)
  }

  const deletarConfiguracao = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta configuração?')) return
    
    try {
      const resultado = await alertasService.deletarConfiguracao(id)
      if (resultado.success) {
        setConfiguracoes(prev => prev.filter(c => c.id !== id))
      }
    } catch (error) {
      console.error('Erro ao deletar configuração:', error)
    }
  }

  const resetarFormulario = () => {
    setNovaConfig({
      tipo: 'vencimento',
      ativo: true,
      diasAntes: 3,
      categorias: [],
      contas: [],
      horarioNotificacao: '09:00',
      frequencia: 'diario',
      canais: ['dashboard']
    })
    setConfigToEdit(null)
  }

  // Funções para verificações automáticas
  const executarVerificacoes = async () => {
    try {
      setShowVerificacaoModal(true)
      setVerificacaoResultado([])
      
      const [vencimentos, metas, orcamentos, saldos] = await Promise.all([
        alertasService.verificarVencimentos(),
        alertasService.verificarMetas(),
        alertasService.verificarOrcamentos(),
        alertasService.verificarSaldos()
      ])
      
      const todosAlertas = [...vencimentos, ...metas, ...orcamentos, ...saldos]
      setVerificacaoResultado(todosAlertas)
      
      // Adicionar novos alertas à lista
      if (todosAlertas.length > 0) {
        setAlertas(prev => [...todosAlertas, ...prev])
      }
    } catch (error) {
      console.error('Erro ao executar verificações:', error)
    }
  }

  // Função para obter ícone baseado no tipo de alerta
  const getIconeTipo = (tipo: string) => {
    switch (tipo) {
      case 'vencimento': return <Clock className="h-5 w-5" />
      case 'meta': return <Target className="h-5 w-5" />
      case 'orcamento': return <DollarSign className="h-5 w-5" />
      case 'saldo': return <CreditCard className="h-5 w-5" />
      default: return <AlertTriangle className="h-5 w-5" />
    }
  }

  // Função para obter cor baseada na prioridade
  const getCorPrioridade = (prioridade: string) => {
    switch (prioridade) {
      case 'critica': return 'bg-red-100 text-red-800 border-red-200'
      case 'alta': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'baixa': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Função para obter cor baseada no status
  const getCorStatus = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800 border-green-200'
      case 'lido': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'arquivado': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Carregando sistema de alertas...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <Bell className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900">Sistema de Alertas</h2>
                <p className="text-sm text-gray-500">Gerencie notificações e configurações de alertas</p>
              </div>
            </div>
            
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Mensagem de Feedback */}
          {mensagemFeedback && (
            <div className={`mb-4 p-4 rounded-md ${
              mensagemFeedback.tipo === 'sucesso' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-center">
                {mensagemFeedback.tipo === 'sucesso' ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <AlertTriangle className="h-5 w-5 mr-2" />
                )}
                <span className="text-sm font-medium">{mensagemFeedback.texto}</span>
              </div>
            </div>
          )}

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Bell className="h-5 w-5 text-gray-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total</p>
                  <p className="text-lg font-semibold text-gray-900">{totalAlertas}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-500">Críticos</p>
                  <p className="text-lg font-semibold text-red-900">{alertasCriticos}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-orange-500">Altos</p>
                  <p className="text-lg font-semibold text-orange-900">{alertasAltos}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Eye className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-500">Ativos</p>
                  <p className="text-lg font-semibold text-green-900">{alertasAtivos}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de Navegação */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'alertas', name: 'Alertas', count: alertas.length },
              { id: 'configuracoes', name: 'Configurações', count: configuracoes.length },
              { id: 'verificacoes', name: 'Verificações', count: 0 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
                {tab.count > 0 && (
                  <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium ${
                    activeTab === tab.id ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-900'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Alertas */}
          {activeTab === 'alertas' && (
            <div className="space-y-4">
              {/* Filtros */}
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="todos">Todos</option>
                    <option value="ativo">Ativo</option>
                    <option value="lido">Lido</option>
                    <option value="arquivado">Arquivado</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                  <select
                    value={filtroPrioridade}
                    onChange={(e) => setFiltroPrioridade(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="todas">Todas</option>
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="todos">Todos</option>
                    <option value="vencimento">Vencimento</option>
                    <option value="meta">Meta</option>
                    <option value="orcamento">Orçamento</option>
                    <option value="saldo">Saldo</option>
                    <option value="personalizado">Personalizado</option>
                  </select>
                </div>
              </div>

              {/* Lista de Alertas */}
              <div className="space-y-3">
                {alertasFiltrados.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p>Nenhum alerta encontrado</p>
                  </div>
                ) : (
                  alertasFiltrados.map((alerta) => (
                    <div
                      key={alerta.id}
                      className={`border rounded-lg p-4 ${
                        alerta.status === 'ativo' ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {getIconeTipo(alerta.tipo)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-sm font-medium text-gray-900">{alerta.titulo}</h3>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getCorPrioridade(alerta.prioridade)}`}>
                                {alerta.prioridade.toUpperCase()}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getCorStatus(alerta.status)}`}>
                                {alerta.status === 'ativo' ? 'ATIVO' : alerta.status === 'lido' ? 'LIDO' : 'ARQUIVADO'}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">{alerta.mensagem}</p>
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Criado: {new Date(alerta.dataCriacao).toLocaleDateString('pt-BR')}</span>
                              {alerta.dataVencimento && (
                                <span>Vence: {alerta.dataVencimento}</span>
                              )}
                              {alerta.categoria && (
                                <span>Categoria: {alerta.categoria}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {alerta.status === 'ativo' && (
                            <>
                              <button
                                onClick={() => marcarComoLido(alerta.id)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Marcar como lido"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => arquivarAlerta(alerta.id)}
                                className="text-gray-600 hover:text-gray-900 p-1"
                                title="Arquivar"
                              >
                                <Archive className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={() => deletarAlerta(alerta.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab: Configurações */}
          {activeTab === 'configuracoes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Configurações de Alertas</h3>
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Configuração
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {configuracoes.map((config) => (
                  <div key={config.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getIconeTipo(config.tipo)}
                        <span className="text-sm font-medium text-gray-900">{config.tipo}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => editarConfiguracao(config)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Editar"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deletarConfiguracao(config.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          config.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {config.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      
                      {config.diasAntes && (
                        <div className="flex items-center justify-between">
                          <span>Dias antes:</span>
                          <span className="font-medium">{config.diasAntes}</span>
                        </div>
                      )}
                      
                      {config.valorMinimo && (
                        <div className="flex items-center justify-between">
                          <span>Valor mínimo:</span>
                          <span className="font-medium">R$ {config.valorMinimo.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span>Frequência:</span>
                        <span className="font-medium">{config.frequencia}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span>Horário:</span>
                        <span className="font-medium">{config.horarioNotificacao}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Verificações */}
          {activeTab === 'verificacoes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Verificações Automáticas</h3>
                <button
                  onClick={executarVerificacoes}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Executar Verificações
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Verificações Disponíveis:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>Vencimentos próximos</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span>Metas em risco</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-yellow-500" />
                    <span>Orçamentos próximos do limite</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-red-500" />
                    <span>Saldos baixos</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Configuração */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {configToEdit ? 'Editar Configuração' : 'Nova Configuração'}
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Alerta</label>
                    <select
                      value={novaConfig.tipo}
                      onChange={(e) => setNovaConfig(prev => ({ ...prev, tipo: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="vencimento">Vencimento</option>
                      <option value="meta">Meta</option>
                      <option value="orcamento">Orçamento</option>
                      <option value="saldo">Saldo</option>
                      <option value="personalizado">Personalizado</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={novaConfig.ativo}
                        onChange={(e) => setNovaConfig(prev => ({ ...prev, ativo: e.target.checked }))}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Ativo</span>
                    </div>
                  </div>
                </div>

                {novaConfig.tipo === 'vencimento' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dias antes do vencimento</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={novaConfig.diasAntes || 3}
                      onChange={(e) => setNovaConfig(prev => ({ ...prev, diasAntes: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}

                {novaConfig.tipo === 'saldo' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor mínimo (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={novaConfig.valorMinimo || 0}
                      onChange={(e) => setNovaConfig(prev => ({ ...prev, valorMinimo: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}

                {novaConfig.tipo === 'meta' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Percentual mínimo (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={novaConfig.percentualMeta || 80}
                      onChange={(e) => setNovaConfig(prev => ({ ...prev, percentualMeta: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequência</label>
                    <select
                      value={novaConfig.frequencia}
                      onChange={(e) => setNovaConfig(prev => ({ ...prev, frequencia: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="diario">Diário</option>
                      <option value="semanal">Semanal</option>
                      <option value="mensal">Mensal</option>
                      <option value="personalizado">Personalizado</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                    <input
                      type="time"
                      value={novaConfig.horarioNotificacao}
                      onChange={(e) => setNovaConfig(prev => ({ ...prev, horarioNotificacao: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Canais de Notificação</label>
                  <div className="flex flex-wrap gap-2">
                    {['dashboard', 'email', 'push', 'sms'].map((canal) => (
                      <label key={canal} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={novaConfig.canais.includes(canal as any)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNovaConfig(prev => ({
                                ...prev,
                                canais: [...prev.canais, canal as any]
                              }))
                            } else {
                              setNovaConfig(prev => ({
                                ...prev,
                                canais: prev.canais.filter(c => c !== canal)
                              }))
                            }
                          }}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">{canal}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowConfigModal(false)
                    resetarFormulario()
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarConfiguracao}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  {configToEdit ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Resultado das Verificações */}
      {showVerificacaoModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Resultado das Verificações</h3>
              
              {verificacaoResultado.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-300 mb-4" />
                  <p>Nenhum alerta foi gerado nas verificações</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {verificacaoResultado.map((alerta) => (
                    <div key={alerta.id} className="border rounded-lg p-4 bg-green-50">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getIconeTipo(alerta.tipo)}
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{alerta.titulo}</h4>
                          <p className="text-sm text-gray-600 mt-1">{alerta.mensagem}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCorPrioridade(alerta.prioridade)}`}>
                              {alerta.prioridade.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(alerta.dataCriacao).toLocaleString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowVerificacaoModal(false)}
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
  )
}
