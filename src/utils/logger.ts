/**
 * Sistema de Logs Centralizado
 * 
 * Fornece logging condicional baseado no ambiente (dev/prod)
 * e prepara integração futura com serviços externos de logs
 */

const isDev = import.meta.env.DEV
const isProd = import.meta.env.PROD

/**
 * Níveis de log disponíveis
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Interface para configuração de logs
 */
interface LogConfig {
  enableConsole: boolean
  enableRemote: boolean
  remoteEndpoint?: string
  logLevel: LogLevel
}

/**
 * Configuração padrão
 */
const defaultConfig: LogConfig = {
  enableConsole: true,
  enableRemote: false,
  logLevel: isDev ? LogLevel.DEBUG : LogLevel.INFO
}

/**
 * Formata mensagem de log com timestamp
 */
function formatLogMessage(level: LogLevel, ...args: any[]): string {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`
  return `${prefix} ${args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ')}`
}

/**
 * Envia log para serviço remoto (futuro)
 */
async function sendToRemote(level: LogLevel, message: string, data?: any): Promise<void> {
  if (!defaultConfig.enableRemote || !defaultConfig.remoteEndpoint) {
    return
  }

  try {
    // Preparar para integração futura com serviço de logs
    // Ex: Sentry, LogRocket, DataDog, etc.
    const logData = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    // TODO: Implementar envio real quando necessário
    // await fetch(defaultConfig.remoteEndpoint, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(logData)
    // })
  } catch (error) {
    // Silenciosamente falhar para não quebrar a aplicação
    console.error('Erro ao enviar log remoto:', error)
  }
}

/**
 * Verifica se o nível de log deve ser exibido
 */
function shouldLog(level: LogLevel): boolean {
  const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR]
  const currentLevelIndex = levels.indexOf(defaultConfig.logLevel)
  const messageLevelIndex = levels.indexOf(level)
  return messageLevelIndex >= currentLevelIndex
}

/**
 * Logger principal
 */
export const logger = {
  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug: (...args: any[]): void => {
    if (!isDev || !shouldLog(LogLevel.DEBUG)) return
    
    if (defaultConfig.enableConsole) {
      console.debug('🐛', ...args)
    }
    
    if (isProd) {
      const message = formatLogMessage(LogLevel.DEBUG, ...args)
      sendToRemote(LogLevel.DEBUG, message, args)
    }
  },

  /**
   * Log de informação
   */
  log: (...args: any[]): void => {
    if (!shouldLog(LogLevel.INFO)) return
    
    if (defaultConfig.enableConsole && isDev) {
      console.log('ℹ️', ...args)
    }
    
    if (isProd) {
      const message = formatLogMessage(LogLevel.INFO, ...args)
      sendToRemote(LogLevel.INFO, message, args)
    }
  },

  /**
   * Log de aviso
   */
  warn: (...args: any[]): void => {
    if (!shouldLog(LogLevel.WARN)) return
    
    if (defaultConfig.enableConsole) {
      console.warn('⚠️', ...args)
    }
    
    const message = formatLogMessage(LogLevel.WARN, ...args)
    sendToRemote(LogLevel.WARN, message, args)
  },

  /**
   * Log de erro (sempre exibido)
   */
  error: (...args: any[]): void => {
    if (!shouldLog(LogLevel.ERROR)) return
    
    if (defaultConfig.enableConsole) {
      console.error('❌', ...args)
    }
    
    const message = formatLogMessage(LogLevel.ERROR, ...args)
    sendToRemote(LogLevel.ERROR, message, args)
  },

  /**
   * Log de sucesso (apenas em desenvolvimento)
   */
  success: (...args: any[]): void => {
    if (!isDev || !shouldLog(LogLevel.INFO)) return
    
    if (defaultConfig.enableConsole) {
      console.log('✅', ...args)
    }
  },

  /**
   * Log de grupo (apenas em desenvolvimento)
   */
  group: (label: string, collapsed: boolean = false): void => {
    if (!isDev) return
    
    if (collapsed) {
      console.groupCollapsed(label)
    } else {
      console.group(label)
    }
  },

  /**
   * Fechar grupo de logs
   */
  groupEnd: (): void => {
    if (!isDev) return
    console.groupEnd()
  },

  /**
   * Log de tabela (apenas em desenvolvimento)
   */
  table: (data: any): void => {
    if (!isDev) return
    console.table(data)
  },

  /**
   * Configurar logger
   */
  configure: (config: Partial<LogConfig>): void => {
    Object.assign(defaultConfig, config)
  },

  /**
   * Obter configuração atual
   */
  getConfig: (): LogConfig => {
    return { ...defaultConfig }
  }
}

/**
 * Exportar por padrão
 */
export default logger

