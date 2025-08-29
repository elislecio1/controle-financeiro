import React, { useState } from 'react'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import { ResetPasswordRequest } from '../../types'
import { useAuth } from '../../hooks/useAuth'

interface ForgotPasswordFormProps {
  onBack: () => void
  onSuccess: () => void
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack, onSuccess }) => {
  const { resetPassword, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError('Email é obrigatório')
      return false
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email inválido')
      return false
    }
    setEmailError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateEmail(email)) return

    const request: ResetPasswordRequest = { email }
    const result = await resetPassword(request)
    
    if (result.success) {
      setIsSubmitted(true)
      setTimeout(() => {
        onSuccess()
      }, 3000)
    }
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (emailError) {
      setEmailError('')
    }
  }

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <Send className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Email enviado!</h2>
            <p className="text-gray-600 mb-6">
              Enviamos um link de recuperação para <strong>{email}</strong>
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                <strong>Verifique sua caixa de entrada</strong><br />
                Se não encontrar o email, verifique a pasta de spam ou lixo eletrônico.
              </p>
            </div>
            <button
              onClick={onBack}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">💰 NeoFIN</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Recuperar senha</h2>
          <p className="text-gray-600">
            Digite seu email e enviaremos um link para redefinir sua senha
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email da conta
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  emailError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="seu@email.com"
                disabled={loading}
              />
            </div>
            {emailError && (
              <p className="mt-1 text-sm text-red-600">{emailError}</p>
            )}
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </div>
              ) : (
                <div className="flex items-center">
                  <Send className="h-4 w-4 mr-2" />
                  Enviar link de recuperação
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao login
            </button>
          </div>
        </form>

        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Dicas de segurança:</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• O link de recuperação expira em 24 horas</li>
            <li>• Use uma senha forte com pelo menos 6 caracteres</li>
            <li>• Não compartilhe sua nova senha com ninguém</li>
            <li>• Se não solicitou esta recuperação, ignore este email</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
