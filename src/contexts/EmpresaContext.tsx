import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { Empresa, EmpresaState } from '../types'
import { empresaService } from '../services/empresaService'

interface EmpresaContextType extends EmpresaState {
  setEmpresaAtual: (empresaId: string | null) => Promise<void>
  refreshEmpresas: () => Promise<void>
  criarEmpresa: (dados: {
    nome: string
    cnpj?: string
    razao_social?: string
    email?: string
    telefone?: string
  }) => Promise<{ success: boolean; empresa?: Empresa; error?: string }>
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined)

const STORAGE_KEY = 'empresa_atual_id'

interface EmpresaProviderProps {
  children: ReactNode
}

export const EmpresaProvider: React.FC<EmpresaProviderProps> = ({ children }) => {
  console.log('🔄 EmpresaProvider: Componente renderizado')
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empresaAtual, setEmpresaAtualState] = useState<Empresa | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  /**
   * Carregar empresas do usuário
   */
  const loadEmpresas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 EmpresaContext: Carregando empresas do usuário...')
      const empresasData = await empresaService.getEmpresasDoUsuario()
      console.log('✅ EmpresaContext: Empresas carregadas:', empresasData.length, empresasData)
      setEmpresas(empresasData)

      // Se não há empresas, limpar empresa atual
      if (empresasData.length === 0) {
        setEmpresaAtualState(null)
        localStorage.removeItem(STORAGE_KEY)
        setInitialized(true)
        return
      }

      // Se há apenas 1 empresa, selecionar automaticamente
      if (empresasData.length === 1) {
        await setEmpresaAtual(empresasData[0].id)
        setInitialized(true)
        return
      }

      // Se há múltiplas empresas, tentar restaurar última selecionada
      const ultimaEmpresaId = localStorage.getItem(STORAGE_KEY)
      if (ultimaEmpresaId) {
        // Verificar se a empresa ainda pertence ao usuário
        const empresaValida = empresasData.find(e => e.id === ultimaEmpresaId)
        if (empresaValida) {
          await setEmpresaAtual(ultimaEmpresaId)
          setInitialized(true)
          return
        } else {
          // Empresa não é mais válida, limpar storage
          localStorage.removeItem(STORAGE_KEY)
        }
      }

      // Se não há última selecionada válida, usar a primeira
      if (empresasData.length > 0) {
        await setEmpresaAtual(empresasData[0].id)
      }

      setInitialized(true)
    } catch (err: any) {
      console.error('❌ Erro ao carregar empresas:', err)
      setError(err.message || 'Erro ao carregar empresas')
      setEmpresas([])
      setEmpresaAtualState(null)
      setInitialized(true)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Definir empresa atual
   */
  const setEmpresaAtual = useCallback(async (empresaId: string | null) => {
    if (!empresaId) {
      setEmpresaAtualState(null)
      localStorage.removeItem(STORAGE_KEY)
      return
    }

    // Verificar se a empresa pertence ao usuário
    const empresa = empresas.find(e => e.id === empresaId)
    if (!empresa) {
      // Tentar buscar do servidor
      const empresaData = await empresaService.getEmpresaPorId(empresaId)
      if (!empresaData) {
        console.warn('⚠️ Empresa não encontrada ou sem acesso:', empresaId)
        // Limpar e recarregar
        await loadEmpresas()
        return
      }
      setEmpresaAtualState(empresaData)
      localStorage.setItem(STORAGE_KEY, empresaId)
      return
    }

    // Validar acesso
    const temAcesso = await empresaService.verificarAcesso(empresaId)
    if (!temAcesso) {
      console.warn('⚠️ Usuário não tem acesso à empresa:', empresaId)
      // Limpar e recarregar
      await loadEmpresas()
      return
    }

    setEmpresaAtualState(empresa)
    localStorage.setItem(STORAGE_KEY, empresaId)
  }, [empresas, loadEmpresas])

  /**
   * Recarregar empresas
   */
  const refreshEmpresas = useCallback(async () => {
    await loadEmpresas()
  }, [loadEmpresas])

  /**
   * Criar nova empresa
   */
  const criarEmpresa = useCallback(async (dados: {
    nome: string
    cnpj?: string
    razao_social?: string
    email?: string
    telefone?: string
  }) => {
    try {
      const result = await empresaService.createEmpresa(dados)
      if (result.success && result.empresa) {
        // Recarregar empresas
        await loadEmpresas()
        // Selecionar a nova empresa automaticamente
        if (result.empresa) {
          await setEmpresaAtual(result.empresa.id)
        }
      }
      return result
    } catch (err: any) {
      console.error('❌ Erro ao criar empresa:', err)
      return { success: false, error: err.message || 'Erro ao criar empresa' }
    }
  }, [loadEmpresas, setEmpresaAtual])

  // Carregar empresas na inicialização
  useEffect(() => {
    console.log('🔄 EmpresaContext: useEffect disparado, carregando empresas...')
    loadEmpresas()
  }, [loadEmpresas])

  const value: EmpresaContextType = {
    empresas,
    empresaAtual,
    loading,
    error,
    initialized,
    setEmpresaAtual,
    refreshEmpresas,
    criarEmpresa
  }

  return (
    <EmpresaContext.Provider value={value}>
      {children}
    </EmpresaContext.Provider>
  )
}

export const useEmpresa = (): EmpresaContextType => {
  const context = useContext(EmpresaContext)
  if (context === undefined) {
    throw new Error('useEmpresa deve ser usado dentro de um EmpresaProvider')
  }
  return context
}
