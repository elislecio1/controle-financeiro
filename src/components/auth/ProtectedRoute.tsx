import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { AuthContainer } from './AuthContainer'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'user' | 'viewer'
  fallback?: React.ReactElement
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = 'user',
  fallback 
}) => {
  const { isAuthenticated, loading, user, profile, hasRole } = useAuth()

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">💰 FinFlow Pro</h2>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Se não autenticado, mostrar tela de login
  if (!isAuthenticated || !user) {
    return <AuthContainer />
  }

  // Se não tem o papel necessário, mostrar acesso negado
  if (!hasRole(requiredRole)) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar esta área.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Seu nível de acesso: <span className="font-medium">{profile?.role || 'Não definido'}</span><br />
            Nível necessário: <span className="font-medium">{requiredRole}</span>
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Recarregar página
          </button>
        </div>
      </div>
    )
  }

  // Se tudo OK, mostrar o conteúdo protegido
  return <>{children}</>
}

// Componente para verificar permissões específicas
interface RequirePermissionProps {
  permission: string
  children: React.ReactNode
  fallback?: React.ReactElement
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({ 
  permission, 
  children, 
  fallback 
}) => {
  const { hasPermission } = useAuth()

  if (!hasPermission(permission)) {
    return fallback || null
  }

  return <>{children}</>
}

// HOC para proteger componentes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: 'admin' | 'user' | 'viewer'
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}
