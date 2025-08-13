import { useState, useEffect, useCallback } from 'react'
import { Alerta, ConfiguracaoAlerta } from '../types'
import { alertasService } from '../services/alertas'

export function useAlertas() {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoAlerta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar dados iniciais
  const carregarDados = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [alertasData, configsData] = await Promise.all([
        alertasService.getAlertas(),
        alertasService.getConfiguracoes()
      ])
      
      setAlertas(alertasData)
      setConfiguracoes(configsData)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar alertas')
      console.error('Erro ao carregar alertas:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Carregar dados ao montar o componente
  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Funções para gerenciar alertas
  const marcarComoLido = useCallback(async (id: string) => {
    try {
      const resultado = await alertasService.marcarComoLido(id)
      if (resultado.success) {
        setAlertas(prev => prev.map(a => 
          a.id === id ? { ...a, status: 'lido', dataLeitura: new Date().toISOString() } : a
        ))
        return { success: true }
      }
      return { success: false, message: resultado.message }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }, [])

  const arquivarAlerta = useCallback(async (id: string) => {
    try {
      const resultado = await alertasService.arquivarAlerta(id)
      if (resultado.success) {
        setAlertas(prev => prev.map(a => 
          a.id === id ? { ...a, status: 'arquivado' } : a
        ))
        return { success: true }
      }
      return { success: false, message: resultado.message }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }, [])

  const deletarAlerta = useCallback(async (id: string) => {
    try {
      const resultado = await alertasService.deletarAlerta(id)
      if (resultado.success) {
        setAlertas(prev => prev.filter(a => a.id !== id))
        return { success: true }
      }
      return { success: false, message: resultado.message }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }, [])

  // Funções para gerenciar configurações
  const salvarConfiguracao = useCallback(async (config: Omit<ConfiguracaoAlerta, 'id'>) => {
    try {
      const resultado = await alertasService.salvarConfiguracao(config)
      if (resultado.success && resultado.data) {
        setConfiguracoes(prev => [...prev, resultado.data!])
        return { success: true, data: resultado.data }
      }
      return { success: false, message: resultado.message }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }, [])

  const atualizarConfiguracao = useCallback(async (id: string, data: Partial<ConfiguracaoAlerta>) => {
    try {
      const resultado = await alertasService.atualizarConfiguracao(id, data)
      if (resultado.success) {
        setConfiguracoes(prev => prev.map(c => 
          c.id === id ? { ...c, ...data } : c
        ))
        return { success: true }
      }
      return { success: false, message: resultado.message }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }, [])

  const deletarConfiguracao = useCallback(async (id: string) => {
    try {
      const resultado = await alertasService.deletarConfiguracao(id)
      if (resultado.success) {
        setConfiguracoes(prev => prev.filter(c => c.id !== id))
        return { success: true }
      }
      return { success: false, message: resultado.message }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }, [])

  // Funções para verificações automáticas
  const executarVerificacoes = useCallback(async () => {
    try {
      const [vencimentos, metas, orcamentos, saldos] = await Promise.all([
        alertasService.verificarVencimentos(),
        alertasService.verificarMetas(),
        alertasService.verificarOrcamentos(),
        alertasService.verificarSaldos()
      ])
      
      const novosAlertas = [...vencimentos, ...metas, ...orcamentos, ...saldos]
      
      if (novosAlertas.length > 0) {
        setAlertas(prev => [...novosAlertas, ...prev])
      }
      
      return { success: true, alertas: novosAlertas }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }, [])

  // Filtros para alertas
  const alertasAtivos = alertas.filter(a => a.status === 'ativo')
  const alertasCriticos = alertas.filter(a => a.prioridade === 'critica' && a.status === 'ativo')
  const alertasAltos = alertas.filter(a => a.prioridade === 'alta' && a.status === 'ativo')
  const alertasMedios = alertas.filter(a => a.prioridade === 'media' && a.status === 'ativo')
  const alertasBaixos = alertas.filter(a => a.prioridade === 'baixa' && a.status === 'ativo')

  // Estatísticas
  const estatisticas = {
    total: alertas.length,
    ativos: alertasAtivos.length,
    criticos: alertasCriticos.length,
    altos: alertasAltos.length,
    medios: alertasMedios.length,
    baixos: alertasBaixos.length,
    lidos: alertas.filter(a => a.status === 'lido').length,
    arquivados: alertas.filter(a => a.status === 'arquivado').length
  }

  return {
    // Estado
    alertas,
    configuracoes,
    loading,
    error,
    
    // Funções
    carregarDados,
    marcarComoLido,
    arquivarAlerta,
    deletarAlerta,
    salvarConfiguracao,
    atualizarConfiguracao,
    deletarConfiguracao,
    executarVerificacoes,
    
    // Filtros
    alertasAtivos,
    alertasCriticos,
    alertasAltos,
    alertasMedios,
    alertasBaixos,
    
    // Estatísticas
    estatisticas
  }
}
