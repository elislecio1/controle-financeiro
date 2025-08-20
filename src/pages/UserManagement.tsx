import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { 
  UserPlus, 
  Users, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Mail, 
  Shield, 
  User, 
  Eye,
  Plus,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Settings,
  Calendar,
  AlertTriangle,
  Info
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

// Configurações do Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

interface UserData {
  id: string
  email: string
  name: string
  role: 'admin' | 'user' | 'viewer'
  created_at: string
  last_sign_in_at?: string
  email_confirmed_at?: string
  avatar_url?: string
  status: 'active' | 'pending' | 'inactive'
}

interface InviteData {
  id: string
  email: string
  name: string
  role: 'admin' | 'user' | 'viewer'
  invited_by: string
  invited_at: string
  expires_at: string
  status: 'pending' | 'accepted' | 'expired'
  token: string
}

export const UserManagement: React.FC = () => {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [invites, setInvites] = useState<InviteData[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'users' | 'invites'>('users')
  const [showInviteDetails, setShowInviteDetails] = useState(false)
  const [selectedInvite, setSelectedInvite] = useState<InviteData | null>(null)

  // Estados para formulário de convite
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'user' as 'admin' | 'user' | 'viewer'
  })

  // Estados para formulário de edição
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'user' as 'admin' | 'user' | 'viewer',
    status: 'active' as 'active' | 'inactive'
  })

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/')
      return
    }
    loadUsers()
    loadInvites()
  }, [profile, navigate])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      // Buscar usuários do Supabase Auth
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) throw authError

      // Buscar perfis dos usuários
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')

      if (profilesError) throw profilesError

      // Combinar dados
      const usersData: UserData[] = authUsers.users.map((authUser: any) => {
        const profile = profiles?.find((p: any) => p.user_id === authUser.id)
        return {
          id: authUser.id,
          email: authUser.email || '',
          name: profile?.name || authUser.user_metadata?.name || 'Sem nome',
          role: profile?.role || 'user',
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at,
          email_confirmed_at: authUser.email_confirmed_at,
          avatar_url: authUser.user_metadata?.avatar_url,
          status: authUser.email_confirmed_at ? 'active' : 'pending'
        }
      })

      setUsers(usersData)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadInvites = async () => {
    try {
      console.log('📋 Carregando convites...')
      
      const { data: invitesData, error } = await supabase
        .from('user_invites')
        .select(`
          *,
          invited_by_user:user_profiles!user_invites_invited_by_fkey(name, email)
        `)
        .order('invited_at', { ascending: false })

      if (error) {
        console.error('❌ Erro ao carregar convites:', error)
        return
      }

      console.log('✅ Convites carregados:', invitesData?.length || 0)
      setInvites(invitesData || [])
    } catch (error) {
      console.error('❌ Erro ao carregar convites:', error)
    }
  }

  const handleInviteUser = async () => {
    try {
      if (!inviteForm.email || !inviteForm.name) {
        alert('Preencha todos os campos obrigatórios')
        return
      }

      console.log('📧 Convidando usuário:', inviteForm)
      
      // Criar convite usando a função SQL
      const { data: inviteData, error: inviteError } = await supabase
        .rpc('create_user_invite', {
          p_email: inviteForm.email,
          p_name: inviteForm.name,
          p_role: inviteForm.role,
          p_expires_in_days: 7
        })

      if (inviteError) {
        console.error('❌ Erro ao criar convite:', inviteError)
        alert(`Erro ao criar convite: ${inviteError.message}`)
        return
      }

      console.log('✅ Convite criado com sucesso:', inviteData)

      // Buscar dados do convite criado
      const { data: invite, error: fetchError } = await supabase
        .from('user_invites')
        .select('*')
        .eq('id', inviteData)
        .single()

      if (fetchError) {
        console.error('❌ Erro ao buscar convite:', fetchError)
        alert('Convite criado mas erro ao buscar dados')
        return
      }

      // Enviar e-mail de convite
      try {
        const { EmailService } = await import('../services/email')
        const emailResult = await EmailService.sendInviteEmail(invite)
        
        if (emailResult.success) {
          alert(`✅ Convite enviado com sucesso para ${inviteForm.email}`)
        } else {
          console.warn('⚠️ Erro ao enviar e-mail, mas convite foi criado:', emailResult.error)
          alert(`Convite criado mas erro ao enviar e-mail: ${emailResult.error}`)
        }
             } catch (emailError: any) {
         console.error('❌ Erro ao enviar e-mail:', emailError)
         alert(`Convite criado mas erro ao enviar e-mail: ${emailError.message || 'Erro desconhecido'}`)
       }
      
      setShowInviteModal(false)
      setInviteForm({ email: '', name: '', role: 'user' })
      
      // Recarregar lista de convites
      await loadInvites()
         } catch (error: any) {
       console.error('❌ Erro ao convidar usuário:', error)
       alert(`Erro ao convidar usuário: ${error.message || 'Erro desconhecido'}`)
     }
  }

  const handleEditUser = async () => {
    try {
      if (!selectedUser) return

      // Atualizar perfil do usuário
      const { error } = await supabase
        .from('user_profiles')
        .update({
          name: editForm.name,
          role: editForm.role,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', selectedUser.id)

      if (error) throw error

      setShowEditModal(false)
      setSelectedUser(null)
      
      // Recarregar lista
      await loadUsers()
    } catch (error) {
      console.error('Erro ao editar usuário:', error)
      alert('Erro ao editar usuário')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return

    try {
      // Excluir usuário do Supabase Auth
      const { error } = await supabase.auth.admin.deleteUser(userId)
      
      if (error) throw error

      // Recarregar lista
      await loadUsers()
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      alert('Erro ao excluir usuário')
    }
  }

  const handleResendInvite = async (invite: InviteData) => {
    try {
      console.log('📧 Reenviando convite para:', invite.email)
      
      // Enviar e-mail de convite
      const { EmailService } = await import('../services/email')
      const emailResult = await EmailService.sendInviteEmail(invite)
      
      if (emailResult.success) {
        alert(`✅ Convite reenviado com sucesso para ${invite.email}`)
      } else {
        console.warn('⚠️ Erro ao reenviar e-mail:', emailResult.error)
        alert(`Erro ao reenviar e-mail: ${emailResult.error}`)
      }
    } catch (error: any) {
      console.error('❌ Erro ao reenviar convite:', error)
      alert(`Erro ao reenviar convite: ${error.message || 'Erro desconhecido'}`)
    }
  }

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este convite?')) return

    try {
      console.log('❌ Cancelando convite:', inviteId)
      
      // Cancelar convite usando a função SQL
      const { error } = await supabase
        .rpc('cancel_user_invite', {
          p_invite_id: inviteId
        })

      if (error) {
        console.error('❌ Erro ao cancelar convite:', error)
        alert(`Erro ao cancelar convite: ${error.message}`)
        return
      }

      console.log('✅ Convite cancelado com sucesso')
      alert('Convite cancelado com sucesso')
      
      // Recarregar lista de convites
      await loadInvites()
    } catch (error: any) {
      console.error('❌ Erro ao cancelar convite:', error)
      alert(`Erro ao cancelar convite: ${error.message || 'Erro desconhecido'}`)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4 text-red-600" />
      case 'user': return <User className="h-4 w-4 text-blue-600" />
      case 'viewer': return <Eye className="h-4 w-4 text-gray-600" />
      default: return <User className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'inactive': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta área.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
                <p className="text-sm text-gray-500">Gerencie usuários da empresa</p>
              </div>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Convidar Usuário</span>
            </button>
          </div>
        </div>
      </div>

             {/* Content */}
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         {/* Tabs */}
         <div className="bg-white rounded-lg shadow mb-6">
           <div className="border-b border-gray-200">
             <nav className="-mb-px flex space-x-8 px-6">
               <button
                 onClick={() => setActiveTab('users')}
                 className={`py-4 px-1 border-b-2 font-medium text-sm ${
                   activeTab === 'users'
                     ? 'border-blue-500 text-blue-600'
                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                 }`}
               >
                 <Users className="h-4 w-4 inline mr-2" />
                 Usuários ({users.length})
               </button>
               <button
                 onClick={() => setActiveTab('invites')}
                 className={`py-4 px-1 border-b-2 font-medium text-sm ${
                   activeTab === 'invites'
                     ? 'border-blue-500 text-blue-600'
                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                 }`}
               >
                 <Mail className="h-4 w-4 inline mr-2" />
                 Convites ({invites.length})
               </button>
             </nav>
           </div>
         </div>

         {/* Filters - Only show for users tab */}
         {activeTab === 'users' && (
           <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Função
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas as funções</option>
                <option value="admin">Administrador</option>
                <option value="user">Usuário</option>
                <option value="viewer">Visualizador</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="pending">Pendente</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterRole('all')
                  setFilterStatus('all')
                }}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                Limpar Filtros
              </button>
            </div>
                     </div>
         </div>
         )}

         {/* Users Tab Content */}
         {activeTab === 'users' && (
           <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
           <div className="px-6 py-4 border-b border-gray-200">
             <h3 className="text-lg font-medium text-gray-900">
               Usuários ({filteredUsers.length})
             </h3>
           </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Carregando usuários...</p>
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
                      Função
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Último Acesso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.avatar_url ? (
                              <img
                                className="h-10 w-10 rounded-full"
                                src={user.avatar_url}
                                alt=""
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getRoleIcon(user.role)}
                          <span className="ml-2 text-sm text-gray-900 capitalize">
                            {user.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(user.status)}
                          <span className="ml-2 text-sm text-gray-900 capitalize">
                            {user.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_sign_in_at 
                          ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR')
                          : 'Nunca acessou'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setEditForm({
                                name: user.name,
                                role: user.role,
                                status: user.status === 'pending' ? 'active' : user.status
                              })
                              setShowEditModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {user.id !== profile?.user_id && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
                                )}
          </div>
         )}

                  {/* Invites Tab Content */}
         {activeTab === 'invites' && (
           <div className="space-y-6">
             {/* Statistics Cards */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div className="bg-white rounded-lg shadow p-4">
                 <div className="flex items-center">
                   <div className="p-2 bg-blue-100 rounded-lg">
                     <Mail className="h-6 w-6 text-blue-600" />
                   </div>
                   <div className="ml-4">
                     <p className="text-sm font-medium text-gray-600">Total</p>
                     <p className="text-2xl font-bold text-gray-900">{invites.length}</p>
                   </div>
                 </div>
               </div>

               <div className="bg-white rounded-lg shadow p-4">
                 <div className="flex items-center">
                   <div className="p-2 bg-yellow-100 rounded-lg">
                     <Clock className="h-6 w-6 text-yellow-600" />
                   </div>
                   <div className="ml-4">
                     <p className="text-sm font-medium text-gray-600">Pendentes</p>
                     <p className="text-2xl font-bold text-gray-900">
                       {invites.filter(i => i.status === 'pending').length}
                     </p>
                   </div>
                 </div>
               </div>

               <div className="bg-white rounded-lg shadow p-4">
                 <div className="flex items-center">
                   <div className="p-2 bg-green-100 rounded-lg">
                     <CheckCircle className="h-6 w-6 text-green-600" />
                   </div>
                   <div className="ml-4">
                     <p className="text-sm font-medium text-gray-600">Aceitos</p>
                     <p className="text-2xl font-bold text-gray-900">
                       {invites.filter(i => i.status === 'accepted').length}
                     </p>
                   </div>
                 </div>
               </div>

               <div className="bg-white rounded-lg shadow p-4">
                 <div className="flex items-center">
                   <div className="p-2 bg-red-100 rounded-lg">
                     <XCircle className="h-6 w-6 text-red-600" />
                   </div>
                   <div className="ml-4">
                     <p className="text-sm font-medium text-gray-600">Expirados</p>
                     <p className="text-2xl font-bold text-gray-900">
                       {invites.filter(i => i.status === 'expired').length}
                     </p>
                   </div>
                 </div>
               </div>
             </div>

             {/* Invites List */}
             <div className="bg-white rounded-lg shadow overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-200">
                 <h3 className="text-lg font-medium text-gray-900">
                   Convites Enviados ({invites.length})
                 </h3>
               </div>

           {invites.length === 0 ? (
             <div className="p-6 text-center">
               <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
               <p className="text-gray-500">Nenhum convite enviado ainda</p>
               <p className="text-sm text-gray-400">Os convites aparecerão aqui após serem enviados</p>
             </div>
           ) : (
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-gray-50">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Convidado
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Função
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Status
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Enviado em
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Expira em
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Ações
                     </th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {invites.map((invite) => (
                     <tr key={invite.id} className="hover:bg-gray-50">
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div>
                           <div className="text-sm font-medium text-gray-900">
                             {invite.name}
                           </div>
                           <div className="text-sm text-gray-500">
                             {invite.email}
                           </div>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center">
                           {getRoleIcon(invite.role)}
                           <span className="ml-2 text-sm text-gray-900 capitalize">
                             {invite.role}
                           </span>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center">
                           {invite.status === 'pending' && (
                             <Clock className="h-4 w-4 text-yellow-600" />
                           )}
                           {invite.status === 'accepted' && (
                             <CheckCircle className="h-4 w-4 text-green-600" />
                           )}
                           {invite.status === 'expired' && (
                             <XCircle className="h-4 w-4 text-red-600" />
                           )}
                           <span className="ml-2 text-sm text-gray-900 capitalize">
                             {invite.status === 'pending' ? 'Pendente' : 
                              invite.status === 'accepted' ? 'Aceito' : 'Expirado'}
                           </span>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         {new Date(invite.invited_at).toLocaleDateString('pt-BR')}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                       </td>
                                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedInvite(invite)
                                setShowInviteDetails(true)
                              }}
                              className="text-gray-600 hover:text-gray-900"
                              title="Ver detalhes"
                            >
                              <Info className="h-4 w-4" />
                            </button>
                            {invite.status === 'pending' && (
                              <button
                                onClick={() => handleResendInvite(invite)}
                                className="text-blue-600 hover:text-blue-900 flex items-center"
                                title="Reenviar convite"
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Reenviar
                              </button>
                            )}
                            {invite.status === 'expired' && (
                              <button
                                onClick={() => handleResendInvite(invite)}
                                className="text-orange-600 hover:text-orange-900 flex items-center"
                                title="Renovar convite"
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Renovar
                              </button>
                            )}
                            <button
                              onClick={() => handleCancelInvite(invite.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Cancelar convite"
                            >
                              <XCircle className="h-4 w-4" />
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

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Convidar Novo Usuário
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({...inviteForm, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome do usuário"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@empresa.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Função
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({...inviteForm, role: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">Usuário</option>
                    <option value="viewer">Visualizador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleInviteUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Enviar Convite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

             {/* Invite Details Modal */}
       {showInviteDetails && selectedInvite && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-medium text-gray-900">
                   Detalhes do Convite
                 </h3>
                 <button
                   onClick={() => setShowInviteDetails(false)}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <XCircle className="h-5 w-5" />
                 </button>
               </div>
               
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Nome
                   </label>
                   <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                     {selectedInvite.name}
                   </p>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Email
                   </label>
                   <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                     {selectedInvite.email}
                   </p>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Função
                   </label>
                   <div className="flex items-center bg-gray-50 p-2 rounded">
                     {getRoleIcon(selectedInvite.role)}
                     <span className="ml-2 text-sm text-gray-900 capitalize">
                       {selectedInvite.role}
                     </span>
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Status
                   </label>
                   <div className="flex items-center bg-gray-50 p-2 rounded">
                     {selectedInvite.status === 'pending' && (
                       <Clock className="h-4 w-4 text-yellow-600" />
                     )}
                     {selectedInvite.status === 'accepted' && (
                       <CheckCircle className="h-4 w-4 text-green-600" />
                     )}
                     {selectedInvite.status === 'expired' && (
                       <XCircle className="h-4 w-4 text-red-600" />
                     )}
                     <span className="ml-2 text-sm text-gray-900 capitalize">
                       {selectedInvite.status === 'pending' ? 'Pendente' : 
                        selectedInvite.status === 'accepted' ? 'Aceito' : 'Expirado'}
                     </span>
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Enviado em
                   </label>
                   <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                     {new Date(selectedInvite.invited_at).toLocaleString('pt-BR')}
                   </p>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Expira em
                   </label>
                   <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                     {new Date(selectedInvite.expires_at).toLocaleString('pt-BR')}
                   </p>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Token
                   </label>
                   <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded break-all">
                     {selectedInvite.token}
                   </p>
                 </div>
               </div>

               <div className="flex justify-end space-x-3 mt-6">
                 <button
                   onClick={() => setShowInviteDetails(false)}
                   className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                 >
                   Fechar
                 </button>
                 {selectedInvite.status === 'pending' && (
                   <button
                     onClick={() => {
                       handleResendInvite(selectedInvite)
                       setShowInviteDetails(false)
                     }}
                     className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                   >
                     <RefreshCw className="h-4 w-4 mr-1" />
                     Reenviar
                   </button>
                 )}
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Edit Modal */}
       {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Editar Usuário
              </h3>
              
                             <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Nome Completo
                   </label>
                   <input
                     type="text"
                     value={editForm.name}
                     onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                     className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Email
                   </label>
                   <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                     {selectedUser.email}
                   </p>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Função
                   </label>
                   <select
                     value={editForm.role}
                     onChange={(e) => setEditForm({...editForm, role: e.target.value as any})}
                     className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                   >
                     <option value="viewer">Visualizador (Apenas visualização)</option>
                     <option value="user">Usuário (Edição básica)</option>
                     <option value="admin">Administrador (Acesso total)</option>
                   </select>
                   <p className="text-xs text-gray-500 mt-1">
                     {editForm.role === 'viewer' && 'Pode apenas visualizar dados'}
                     {editForm.role === 'user' && 'Pode editar transações e configurações básicas'}
                     {editForm.role === 'admin' && 'Acesso completo ao sistema, incluindo gestão de usuários'}
                   </p>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Status
                   </label>
                   <select
                     value={editForm.status}
                     onChange={(e) => setEditForm({...editForm, status: e.target.value as any})}
                     className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                   >
                     <option value="active">Ativo (Acesso permitido)</option>
                     <option value="inactive">Inativo (Acesso bloqueado)</option>
                   </select>
                 </div>

                 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                   <div className="flex items-start">
                     <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2" />
                     <div className="text-sm text-yellow-800">
                       <p className="font-medium">Permissões por Função:</p>
                       <ul className="mt-1 space-y-1">
                         <li>• <strong>Visualizador:</strong> Apenas visualização de dados</li>
                         <li>• <strong>Usuário:</strong> Pode editar transações e configurações</li>
                         <li>• <strong>Administrador:</strong> Acesso total ao sistema</li>
                       </ul>
                     </div>
                   </div>
                 </div>
               </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEditUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
