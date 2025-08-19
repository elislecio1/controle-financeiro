import React, { useState } from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'

type AuthMode = 'login' | 'register' | 'forgot-password' | 'success'

export const AuthContainer: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login')

  const handleToggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
  }

  const handleForgotPassword = () => {
    setMode('forgot-password')
  }

  const handleBackToLogin = () => {
    setMode('login')
  }

  const handleSuccess = () => {
    setMode('success')
  }

  const renderContent = () => {
    switch (mode) {
      case 'login':
        return (
          <LoginForm 
            onToggleMode={handleToggleMode}
            onForgotPassword={handleForgotPassword}
          />
        )
      
      case 'register':
        return (
          <RegisterForm 
            onToggleMode={handleToggleMode}
            onSuccess={handleSuccess}
          />
        )
      
      case 'forgot-password':
        return (
          <ForgotPasswordForm 
            onBack={handleBackToLogin}
            onSuccess={handleBackToLogin}
          />
        )
      
      case 'success':
        return (
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Conta criada com sucesso!</h2>
                <p className="text-gray-600 mb-6">
                  Verifique seu email para ativar sua conta e fazer o primeiro login.
                </p>
                <button
                  onClick={handleBackToLogin}
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Ir para login
                </button>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {renderContent()}
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2024 FinFlow Pro. Todos os direitos reservados.
          </p>
          <div className="mt-2 space-x-4">
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">
              Termos de Uso
            </a>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">
              Privacidade
            </a>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">
              Suporte
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
