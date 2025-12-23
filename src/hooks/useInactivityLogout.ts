import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import logger from '../utils/logger'

interface UseInactivityLogoutOptions {
  /** Tempo de inatividade em milissegundos antes de fazer logout (padrão: 30 minutos) */
  inactivityTimeout?: number
  /** Tempo em milissegundos antes de mostrar aviso (padrão: 5 minutos antes do logout) */
  warningTimeout?: number
  /** Se deve mostrar aviso antes de fazer logout (padrão: true) */
  showWarning?: boolean
  /** Callback chamado quando o aviso é exibido */
  onWarning?: (secondsRemaining: number) => void
  /** Callback chamado quando o logout é executado */
  onLogout?: () => void
}

/**
 * Hook para fazer logout automático por inatividade
 * 
 * @param options - Opções de configuração
 * @returns Objeto com estado do aviso e função para resetar o timer
 */
export const useInactivityLogout = (options: UseInactivityLogoutOptions = {}) => {
  const {
    inactivityTimeout = 30 * 60 * 1000, // 30 minutos
    warningTimeout = 5 * 60 * 1000, // 5 minutos antes do logout
    showWarning = true,
    onWarning,
    onLogout
  } = options

  const { isAuthenticated, signOut } = useAuth()
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  // Função para resetar os timers
  const resetTimers = useCallback(() => {
    const now = Date.now()
    lastActivityRef.current = now

    // Limpar timers existentes
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }

    // Esconder aviso se estiver visível
    setShowWarningModal(false)
    setSecondsRemaining(0)

    // Se não estiver autenticado, não criar timers
    if (!isAuthenticated) {
      return
    }

    // Timer para mostrar aviso
    if (showWarning) {
      const warningTime = inactivityTimeout - warningTimeout
      warningTimerRef.current = setTimeout(() => {
        const remaining = Math.floor(warningTimeout / 1000)
        setSecondsRemaining(remaining)
        setShowWarningModal(true)
        onWarning?.(remaining)

        // Iniciar countdown
        countdownIntervalRef.current = setInterval(() => {
          setSecondsRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(countdownIntervalRef.current!)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }, warningTime)
    }

    // Timer para fazer logout
    inactivityTimerRef.current = setTimeout(() => {
      logger.warn('Logout automático por inatividade')
      handleLogout()
    }, inactivityTimeout)
  }, [inactivityTimeout, warningTimeout, showWarning, isAuthenticated, onWarning])

  // Função para fazer logout
  const handleLogout = useCallback(async () => {
    // Limpar todos os timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }

    setShowWarningModal(false)
    onLogout?.()
    await signOut()
    window.location.href = '/'
  }, [signOut, onLogout])

  // Função para estender a sessão (quando o usuário clica em "Continuar")
  const extendSession = useCallback(() => {
    resetTimers()
  }, [resetTimers])

  // Detectar atividade do usuário
  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ]

    const handleActivity = () => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivityRef.current

      // Só resetar se passou pelo menos 1 segundo desde a última atividade
      // (evita resetar muito frequentemente)
      if (timeSinceLastActivity > 1000) {
        resetTimers()
      }
    }

    // Adicionar listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Iniciar timers
    resetTimers()

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current)
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [isAuthenticated, resetTimers])

  // Limpar timers quando desautenticar
  useEffect(() => {
    if (!isAuthenticated) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current)
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
      setShowWarningModal(false)
    }
  }, [isAuthenticated])

  return {
    showWarningModal,
    secondsRemaining,
    extendSession,
    resetTimers
  }
}

