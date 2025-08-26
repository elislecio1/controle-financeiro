import React, { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react'
import { LoginCredentials } from '../../types'
import { useAuth } from '../../hooks/useAuth'

interface LoginFormProps {
  onToggleMode: () => void
  onForgotPassword: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode, onForgotPassword }) => {
  const { signIn, loading, error } = useAuth()
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [formErrors, setFormErrors] = useState<Partial<LoginCredentials>>({})

  const validateForm = (): boolean => {
    const errors: Partial<LoginCredentials> = {}

    if (!credentials.email) {
      errors.email = 'Email é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      errors.email = 'Email inválido'
    }

    if (!credentials.password) {
      errors.password = 'Senha é obrigatória'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const result = await signIn(credentials)
    if (!result.success && result.error) {
      console.error('Erro no login:', result.error)
    }
  }



  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }))
    // Limpar erro do campo quando usuário começar a digitar
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">💰 FinFlow Pro</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Entrar na sua conta</h2>
          <p className="text-gray-600">Gerencie suas finanças de forma inteligente</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={credentials.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="seu@email.com"
                disabled={loading}
              />
            </div>
            {formErrors.email && (
              <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Sua senha"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {formErrors.password && (
              <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-600">Lembrar-me</span>
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              disabled={loading}
            >
              Esqueci minha senha
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Entrando...
              </div>
            ) : (
              <div className="flex items-center">
                <LogIn className="h-4 w-4 mr-2" />
                Entrar
              </div>
            )}
          </button>
        </form>



        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{' '}
            <button
              onClick={onToggleMode}
              className="font-medium text-blue-600 hover:text-blue-500"
              disabled={loading}
            >
              Criar conta gratuita
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
