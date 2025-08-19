import { useState, useEffect } from 'react'
import { AuthState } from '../types'
import { authService } from '../services/auth'

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(authService.getAuthState())

  useEffect(() => {
    // Subscrever às mudanças de autenticação
    const unsubscribe = authService.subscribe((newState) => {
      setAuthState(newState)
    })

    // Cleanup na desmontagem
    return unsubscribe
  }, [])

  return {
    // Estado
    ...authState,
    
    // Métodos de autenticação
    signIn: authService.signIn.bind(authService),
    signUp: authService.signUp.bind(authService),
    signOut: authService.signOut.bind(authService),
    signInWithGoogle: authService.signInWithGoogle.bind(authService),
    resetPassword: authService.resetPassword.bind(authService),
    updatePassword: authService.updatePassword.bind(authService),
    updateProfile: authService.updateProfile.bind(authService),
    
    // Utilitários
    hasRole: (role: string) => authState.profile?.role === role,
    hasPermission: (permission: string) => {
      // Implementar lógica de permissões baseada no role
      const userRole = authState.profile?.role
      if (userRole === 'admin') return true
      if (userRole === 'user' && ['read', 'write'].includes(permission)) return true
      if (userRole === 'viewer' && permission === 'read') return true
      return false
    }
  }
}
