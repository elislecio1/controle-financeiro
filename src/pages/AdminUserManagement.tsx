import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Shield, User, Mail, Calendar, CheckCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../services/supabase'

interface AdminUser {
  id: string
  email: string
  email_confirmed_at: string | null
  created_at: string
  last_sign_in_at: string | null
  raw_user_meta_data: any
  role?: string
}

interface CreateUserData {
  email: string
  password: string
  name: string
  role: 'admin' | 'user' | 'viewer'
}

const AdminUserManagement: React.FC = () => {
  const { user, hasRole } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createUserData, setCreateUserData] = useState<CreateUserData>({
    email: '',
    password: '',
    name: '',
    role: 'user'
  })

  // Verificar se o usuário tem permissão de admin
  if (!hasRole('admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    )
  }

  // Carregar usuários
  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      // Tentar buscar via RPC primeiro (mais seguro)
      let data: AdminUser[] | null = null
      let error: any = null

      try {
        const result = await supabase.rpc('get_admin_users')
        data = result.data
        error = result.error
      } catch (rpcError) {
        console.warn('RPC get_admin_users não disponível, tentando método alternativo...', rpcError)
        error = rpcError
      }

      // Se RPC falhou, tentar buscar diretamente da tabela user_profiles
      if (error || !data) {
        console.log('Buscando usuários diretamente da tabela user_profiles...')
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (profilesError) {
          console.error('Erro ao carregar perfis:', profilesError)
          setError(`Erro ao carregar usuários: ${profilesError.message}`)
          return
        }

        // Buscar dados dos usuários do auth.users
        const userIds = profilesData?.map(p => p.user_id) || []
        const usersData: AdminUser[] = []

        // Para cada perfil, buscar dados do auth.users
        for (const profile of profilesData || []) {
          try {
            // Buscar email do auth.users via função admin (se disponível)
            // Ou usar o email do perfil se disponível
            usersData.push({
              id: profile.user_id,
              email: profile.email || 'email@não.disponível',
              email_confirmed_at: null,
              created_at: profile.created_at || new Date().toISOString(),
              last_sign_in_at: null,
              raw_user_meta_data: {
                name: profile.full_name || profile.name || 'Sem nome',
                full_name: profile.full_name || profile.name
              },
              role: profile.role || 'user'
            })
          } catch (err) {
            console.warn('Erro ao processar perfil:', err)
          }
        }

        setUsers(usersData)
      } else {
        setUsers(data || [])
      }
    } catch (err) {
      console.error('Erro inesperado:', err)
      setError(`Erro inesperado ao carregar usuários: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  // Criar usuário
  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setError(null)

      // Validar dados
      if (!createUserData.email || !createUserData.password || !createUserData.name) {
        setError('Todos os campos são obrigatórios')
        return
      }

      if (createUserData.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres')
        return
      }

      // Chamar função RPC para criar usuário
      const { data, error } = await supabase.rpc('create_admin_user', {
        user_email: createUserData.email,
        user_password: createUserData.password,
        user_name: createUserData.name,
        user_role: createUserData.role
      })

      if (error) {
        console.error('Erro ao criar usuário:', error)
        setError(error.message)
        return
      }

      // Limpar formulário e recarregar usuários
      setCreateUserData({
        email: '',
        password: '',
        name: '',
        role: 'user'
      })
      setShowCreateForm(false)
      await loadUsers()

      alert('Usuário criado com sucesso!')
    } catch (err) {
      console.error('Erro inesperado:', err)
      setError('Erro inesperado ao criar usuário')
    }
  }

  // Deletar usuário
  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Tem certeza que deseja deletar o usuário ${userEmail}? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      setError(null)

      // Tentar deletar via RPC primeiro
      let error: any = null
      
      try {
        const result = await supabase.rpc('delete_admin_user', {
          user_id: userId
        })
        error = result.error
      } catch (rpcError) {
        console.warn('RPC delete_admin_user não disponível, tentando método alternativo...', rpcError)
        // Fallback: deletar diretamente da tabela user_profiles
        const { error: deleteError } = await supabase
          .from('user_profiles')
          .delete()
          .eq('user_id', userId)
        
        error = deleteError
      }

      if (error) {
        console.error('Erro ao deletar usuário:', error)
        setError(error.message || 'Erro ao deletar usuário. Verifique se a função delete_admin_user existe no banco de dados.')
        return
      }

      await loadUsers()
      alert('Usuário deletado com sucesso!')
    } catch (err) {
      console.error('Erro inesperado:', err)
      setError('Erro inesperado ao deletar usuário')
    }
  }

  // Confirmar email do usuário (resolver status "Pendente")
  const confirmUserEmail = async (userId: string, userEmail: string) => {
    if (!confirm(`Deseja confirmar o email do usuário ${userEmail}?`)) {
      return
    }

    try {
      setError(null)

      // Tentar confirmar via RPC primeiro
      let error: any = null
      
      try {
        const result = await supabase.rpc('confirm_user_email', {
          target_user_id: userId
        })
        error = result.error
      } catch (rpcError) {
        console.warn('RPC confirm_user_email não disponível, tentando método alternativo...', rpcError)
        // Fallback: atualizar status no perfil
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('user_id', userId)
        
        error = updateError
      }

      if (error) {
        console.error('Erro ao confirmar email:', error)
        setError(error.message || 'Erro ao confirmar email. Para confirmar completamente, use o dashboard do Supabase.')
        return
      }

      await loadUsers()
      alert('Email confirmado com sucesso! Nota: Para confirmar completamente no auth.users, use o dashboard do Supabase.')
    } catch (err) {
      console.error('Erro inesperado:', err)
      setError('Erro inesperado ao confirmar email')
    }
  }

  // Editar usuário
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editFormData, setEditFormData] = useState({
    email: '',
    name: '',
    full_name: '',
    role: 'user' as 'admin' | 'user' | 'viewer'
  })

  const startEdit = (user: AdminUser) => {
    setEditingUser(user)
    setEditFormData({
      email: user.email,
      name: user.raw_user_meta_data?.name || user.raw_user_meta_data?.full_name || '',
      full_name: user.raw_user_meta_data?.full_name || user.raw_user_meta_data?.name || '',
      role: (user.role as any) || 'user'
    })
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setEditFormData({
      email: '',
      name: '',
      full_name: '',
      role: 'user'
    })
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingUser) return

    try {
      setError(null)

      // Tentar atualizar via RPC primeiro
      let error: any = null
      
      try {
        const result = await supabase.rpc('update_admin_user', {
          target_user_id: editingUser.id,
          new_email: editFormData.email || null,
          new_name: editFormData.name || null,
          new_full_name: editFormData.full_name || null,
          new_role: editFormData.role || null
        })
        error = result.error
      } catch (rpcError) {
        console.warn('RPC update_admin_user não disponível, tentando método alternativo...', rpcError)
        // Fallback: atualizar diretamente na tabela user_profiles
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            email: editFormData.email || undefined,
            name: editFormData.name || undefined,
            full_name: editFormData.full_name || undefined,
            role: editFormData.role,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', editingUser.id)
        
        error = updateError
      }

      if (error) {
        console.error('Erro ao atualizar usuário:', error)
        setError(error.message || 'Erro ao atualizar usuário')
        return
      }

      cancelEdit()
      await loadUsers()
      alert('Usuário atualizado com sucesso!')
    } catch (err) {
      console.error('Erro inesperado:', err)
      setError('Erro inesperado ao atualizar usuário')
    }
  }

  // Atualizar role do usuário
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      setError(null)

      // Tentar atualizar via RPC primeiro
      let error: any = null
      
      try {
        const result = await supabase.rpc('update_user_role', {
          user_id: userId,
          new_role: newRole
        })
        error = result.error
      } catch (rpcError) {
        console.warn('RPC update_user_role não disponível, tentando método alternativo...', rpcError)
        // Fallback: atualizar diretamente na tabela user_profiles
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ role: newRole, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
        
        error = updateError
      }

      if (error) {
        console.error('Erro ao atualizar role:', error)
        setError(error.message || 'Erro ao atualizar role')
        return
      }

      await loadUsers()
      alert('Role atualizada com sucesso!')
    } catch (err) {
      console.error('Erro inesperado:', err)
      setError('Erro inesperado ao atualizar role')
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Administração de Usuários</h1>
              <p className="mt-2 text-gray-600">Gerencie usuários do sistema</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Usuário
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Create User Form */}
        {showCreateForm && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Criar Novo Usuário</h2>
            <form onSubmit={createUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={createUserData.name}
                    onChange={(e) => setCreateUserData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome do usuário"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={createUserData.email}
                    onChange={(e) => setCreateUserData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={createUserData.password}
                    onChange={(e) => setCreateUserData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={createUserData.role}
                    onChange={(e) => setCreateUserData(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">Usuário</option>
                    <option value="admin">Administrador</option>
                    <option value="viewer">Visualizador</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Criar Usuário
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Usuário</h3>
                <form onSubmit={saveEdit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome do usuário"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={editFormData.full_name}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={editFormData.role}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, role: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="user">Usuário</option>
                      <option value="admin">Administrador</option>
                      <option value="viewer">Visualizador</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Usuários do Sistema</h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando usuários...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Último Login
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.raw_user_meta_data?.name || user.raw_user_meta_data?.full_name || 'Sem nome'}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.email_confirmed_at 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.email_confirmed_at ? 'Confirmado' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role || 'user'}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="user">Usuário</option>
                          <option value="admin">Administrador</option>
                          <option value="viewer">Visualizador</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_sign_in_at 
                          ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR')
                          : 'Nunca'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center space-x-2">
                          {!user.email_confirmed_at && (
                            <button
                              onClick={() => confirmUserEmail(user.id, user.email)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Confirmar email"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => startEdit(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar usuário"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteUser(user.id, user.email)}
                            className="text-red-600 hover:text-red-900"
                            title="Deletar usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminUserManagement
