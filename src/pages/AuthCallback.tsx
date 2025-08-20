import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated, loading } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Processando autenticação...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Aguardar um pouco para o Supabase processar o token
        await new Promise(resolve => setTimeout(resolve, 2000))

        if (isAuthenticated) {
          setStatus('success')
          setMessage('Login realizado com sucesso!')
          
          // Redirecionar para o dashboard após 2 segundos
          setTimeout(() => {
            navigate('/')
          }, 2000)
        } else {
          setStatus('error')
          setMessage('Erro ao processar autenticação. Tente novamente.')
        }
      } catch (error) {
        console.error('Erro no callback:', error)
        setStatus('error')
        setMessage('Erro inesperado. Tente novamente.')
      }
    }

    handleCallback()
  }, [isAuthenticated, navigate])

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-600" />
      case 'error':
        return <AlertCircle className="h-12 w-12 text-red-600" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600'
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            {/* Logo */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
              <span className="text-2xl">💰</span>
            </div>

            {/* Status Icon */}
            <div className="flex justify-center mb-6">
              {getStatusIcon()}
            </div>

            {/* Title */}
            <h2 className={`text-2xl font-bold ${getStatusColor()} mb-4`}>
              {status === 'loading' && 'Processando...'}
              {status === 'success' && 'Sucesso!'}
              {status === 'error' && 'Erro'}
            </h2>

            {/* Message */}
            <p className="text-gray-600 mb-6">
              {message}
            </p>

            {/* Loading State */}
            {status === 'loading' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="animate-pulse space-y-2">
                    <div className="h-2 bg-gray-200 rounded w-32"></div>
                    <div className="h-2 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Aguarde enquanto processamos sua autenticação...
                </p>
              </div>
            )}

            {/* Success State */}
            {status === 'success' && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm">
                    Você será redirecionado automaticamente para o dashboard.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Ir para Dashboard
                </button>
              </div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">
                    Houve um problema ao processar sua autenticação.
                  </p>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Tentar Novamente
                  </button>
                  <button
                    onClick={() => navigate('/auth')}
                    className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Voltar ao Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            FinFlow Pro - Controle Financeiro
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthCallback
