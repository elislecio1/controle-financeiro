import React from 'react'

interface InactivityWarningProps {
  /** Segundos restantes antes do logout */
  secondsRemaining: number
  /** Função chamada quando o usuário clica em "Continuar" */
  onExtendSession: () => void
  /** Função chamada quando o usuário clica em "Sair" */
  onLogout: () => void
}

/**
 * Componente que exibe aviso de inatividade antes do logout automático
 */
export const InactivityWarning: React.FC<InactivityWarningProps> = ({
  secondsRemaining,
  onExtendSession,
  onLogout
}) => {
  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="ml-3 text-lg font-medium text-gray-900">
            Sessão expirando
          </h3>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Você ficou inativo por um período. Sua sessão será encerrada automaticamente em:
          </p>
          <div className="mt-3 text-center">
            <span className="text-3xl font-bold text-red-600">{timeString}</span>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onExtendSession}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Continuar
          </button>
          <button
            onClick={onLogout}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Sair agora
          </button>
        </div>
      </div>
    </div>
  )
}

