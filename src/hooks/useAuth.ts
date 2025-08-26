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

  // Função para verificar se o usuário tem o role necessário ou superior
  const hasRole = (requiredRole: string): boolean => {
    const userRole = authState.profile?.role
    
    if (!userRole) return false
    
    // Hierarquia de roles: admin > user > viewer
    const roleHierarchy = {
      'admin': 3,
      'user': 2,
      'viewer': 1
    }
    
    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0
    
    return userLevel >= requiredLevel
  }

  return {
    // Estado
    ...authState,
    
    // Métodos de autenticação
    signIn: authService.signIn.bind(authService),
    signUp: authService.signUp.bind(authService),
    signOut: authService.signOut.bind(authService),

    resetPassword: authService.resetPassword.bind(authService),
    updatePassword: authService.updatePassword.bind(authService),
    updateProfile: authService.updateProfile.bind(authService),
    
    // Utilitários
    hasRole,
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
