import React, { useEffect, useState } from 'react'
import { X, AlertTriangle, CheckCircle, Info, Bell } from 'lucide-react'
import { Alerta } from '../types'

interface ToastNotificationProps {
  alerta: Alerta
  onClose: () => void
  autoClose?: boolean
  duration?: number
}

export default function ToastNotification({ 
  alerta, 
  onClose, 
  autoClose = true, 
  duration = 5000 
}: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (!autoClose) return

    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Aguarda a animação terminar
    }, duration)

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) return 0
        return prev - (100 / (duration / 100))
      })
    }, 100)

    return () => {
      clearTimeout(timer)
      clearInterval(progressTimer)
    }
  }, [autoClose, duration, onClose])

  const getIcone = () => {
    switch (alerta.prioridade) {
      case 'critica':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'alta':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case 'media':
        return <Info className="h-5 w-5 text-yellow-500" />
      case 'baixa':
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getCorFundo = () => {
    switch (alerta.prioridade) {
      case 'critica':
        return 'bg-red-50 border-red-200'
      case 'alta':
        return 'bg-orange-50 border-orange-200'
      case 'media':
        return 'bg-yellow-50 border-yellow-200'
      case 'baixa':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getCorTexto = () => {
    switch (alerta.prioridade) {
      case 'critica':
        return 'text-red-800'
      case 'alta':
        return 'text-orange-800'
      case 'media':
        return 'text-yellow-800'
      case 'baixa':
        return 'text-blue-800'
      default:
        return 'text-gray-800'
    }
  }

  const getCorBorda = () => {
    switch (alerta.prioridade) {
      case 'critica':
        return 'border-red-300'
      case 'alta':
        return 'border-orange-300'
      case 'media':
        return 'border-yellow-300'
      case 'baixa':
        return 'border-blue-300'
      default:
        return 'border-gray-300'
    }
  }

  if (!isVisible) return null

  return (
    <div className={`max-w-sm w-full animate-slide-in`}>
      <div className={`${getCorFundo()} border ${getCorBorda()} rounded-lg shadow-lg overflow-hidden`}>
        {/* Barra de progresso */}
        {autoClose && (
          <div className="h-1 bg-gray-200">
            <div 
              className={`h-full transition-all duration-100 ${
                alerta.prioridade === 'critica' ? 'bg-red-500' :
                alerta.prioridade === 'alta' ? 'bg-orange-500' :
                alerta.prioridade === 'media' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              {getIcone()}
            </div>
            
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <h4 className={`text-sm font-medium ${getCorTexto()}`}>
                  {alerta.titulo}
                </h4>
                <button
                  onClick={() => {
                    setIsVisible(false)
                    setTimeout(onClose, 300)
                  }}
                  className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <p className={`mt-1 text-sm ${getCorTexto()}`}>
                {alerta.mensagem}
              </p>
              
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    alerta.prioridade === 'critica' ? 'bg-red-100 text-red-800' :
                    alerta.prioridade === 'alta' ? 'bg-orange-100 text-orange-800' :
                    alerta.prioridade === 'media' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alerta.prioridade.toUpperCase()}
                  </span>
                  
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    alerta.tipo === 'vencimento' ? 'bg-purple-100 text-purple-800' :
                    alerta.tipo === 'meta' ? 'bg-green-100 text-green-800' :
                    alerta.tipo === 'orcamento' ? 'bg-yellow-100 text-yellow-800' :
                    alerta.tipo === 'saldo' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {alerta.tipo.toUpperCase()}
                  </span>
                </div>
                
                <span className="text-xs text-gray-500">
                  {new Date(alerta.dataCriacao).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente para gerenciar múltiplas notificações
interface ToastContainerProps {
  alertas: Alerta[]
  onClose: (id: string) => void
}

export function ToastContainer({ alertas, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-3 max-h-[80vh] overflow-y-auto pr-4">
      {alertas.map((alerta, index) => (
        <div 
          key={alerta.id}
          className="animate-toast-stack"
          style={{ 
            animationDelay: `${index * 150}ms`,
            zIndex: 1000 - index
          }}
        >
          <ToastNotification
            alerta={alerta}
            onClose={() => onClose(alerta.id)}
            autoClose={alerta.prioridade !== 'critica'} // Alertas críticos não fecham automaticamente
            duration={alerta.prioridade === 'critica' ? 0 : 15000} // Aumentado o tempo para 15 segundos
          />
        </div>
      ))}
    </div>
  )
}
