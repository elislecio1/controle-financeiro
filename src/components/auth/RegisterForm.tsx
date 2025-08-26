import React, { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, User, UserPlus } from 'lucide-react'
import { RegisterCredentials } from '../../types'
import { useAuth } from '../../hooks/useAuth'

interface RegisterFormProps {
  onToggleMode: () => void
  onSuccess: () => void
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleMode, onSuccess }) => {
  const { signUp, loading, error } = useAuth()
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formErrors, setFormErrors] = useState<Partial<RegisterCredentials>>({})
  const [acceptTerms, setAcceptTerms] = useState(false)

  const validateForm = (): boolean => {
    const errors: Partial<RegisterCredentials> = {}

    if (!credentials.name.trim()) {
      errors.name = 'Nome é obrigatório'
    } else if (credentials.name.trim().length < 2) {
      errors.name = 'Nome deve ter pelo menos 2 caracteres'
    }

    if (!credentials.email) {
      errors.email = 'Email é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      errors.email = 'Email inválido'
    }

    if (!credentials.password) {
      errors.password = 'Senha é obrigatória'
    } else if (credentials.password.length < 6) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(credentials.password)) {
      errors.password = 'Senha deve ter pelo menos uma letra maiúscula e uma minúscula'
    }

    if (!credentials.confirmPassword) {
      errors.confirmPassword = 'Confirmação de senha é obrigatória'
    } else if (credentials.password !== credentials.confirmPassword) {
      errors.confirmPassword = 'Senhas não coincidem'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    if (!acceptTerms) {
      alert('Você deve aceitar os termos de uso para continuar')
      return
    }

    const result = await signUp(credentials)
    if (result.success) {
      onSuccess()
    } else if (result.error) {
      console.error('Erro no registro:', result.error)
    }
  }



  const handleInputChange = (field: keyof RegisterCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }))
    // Limpar erro do campo quando usuário começar a digitar
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 6) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(credentials.password)
  const strengthLabels = ['Muito fraca', 'Fraca', 'Regular', 'Boa', 'Forte']
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">💰 FinFlow Pro</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Criar sua conta</h2>
          <p className="text-gray-600">Comece a gerenciar suas finanças hoje mesmo</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nome completo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="name"
                type="text"
                value={credentials.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Seu nome completo"
                disabled={loading}
              />
            </div>
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
            )}
          </div>

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
                placeholder="Crie uma senha forte"
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
            {credentials.password && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength > 0 ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
                      }`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">
                    {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : ''}
                  </span>
                </div>
              </div>
            )}
            {formErrors.password && (
              <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={credentials.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Confirme sua senha"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {formErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
            )}
          </div>

          <div className="flex items-start">
            <input
              id="terms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
              disabled={loading}
            />
            <label htmlFor="terms" className="ml-3 text-sm text-gray-600">
              Eu aceito os{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">
                termos de uso
              </a>{' '}
              e a{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">
                política de privacidade
              </a>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !acceptTerms}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Criando conta...
              </div>
            ) : (
              <div className="flex items-center">
                <UserPlus className="h-4 w-4 mr-2" />
                Criar conta gratuita
              </div>
            )}
          </button>
        </form>



        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <button
              onClick={onToggleMode}
              className="font-medium text-blue-600 hover:text-blue-500"
              disabled={loading}
            >
              Entrar agora
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
