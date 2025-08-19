import React, { useState } from 'react'
import { User, Settings, LogOut, Shield, Bell, Palette, Globe } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { UserPreferences } from '../../types'

interface UserProfileProps {
  isOpen: boolean
  onClose: () => void
}

export const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const { user, profile, signOut, updateProfile, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    document: profile?.document || '',
    birth_date: profile?.birth_date || ''
  })
  const [preferences, setPreferences] = useState<UserPreferences>(
    profile?.preferences || {
      theme: 'light',
      currency: 'BRL',
      date_format: 'DD/MM/YYYY',
      language: 'pt-BR',
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      dashboard: {
        default_period: 'current_month',
        show_charts: true,
        show_stats: true
      }
    }
  )

  if (!isOpen) return null

  const handleSignOut = async () => {
    await signOut()
    onClose()
  }

  const handleSaveProfile = async () => {
    const result = await updateProfile(formData)
    if (result.success) {
      setIsEditing(false)
    }
  }

  const handleSavePreferences = async () => {
    const result = await updateProfile({ preferences })
    if (result.success) {
      // Preferences salvas
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador'
      case 'user': return 'Usuário'
      case 'viewer': return 'Visualizador'
      default: return 'Usuário'
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'user': return 'bg-blue-100 text-blue-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-semibold text-white">{profile?.name || user?.email}</h2>
                    <p className="text-blue-100">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(profile?.role || 'user')}`}>
                    {getRoleLabel(profile?.role || 'user')}
                  </span>
                  <button
                    onClick={onClose}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { id: 'profile', name: 'Perfil', icon: User },
                  { id: 'preferences', name: 'Preferências', icon: Settings },
                  { id: 'security', name: 'Segurança', icon: Shield }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Informações Pessoais</h3>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                    >
                      {isEditing ? 'Cancelar' : 'Editar'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome completo</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profile?.name || 'Não informado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <p className="text-gray-900">{user?.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {user?.email_confirmed_at ? '✅ Verificado' : '⚠️ Não verificado'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="(11) 99999-9999"
                        />
                      ) : (
                        <p className="text-gray-900">{profile?.phone || 'Não informado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Data de nascimento</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={formData.birth_date}
                          onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profile?.birth_date || 'Não informado'}</p>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Preferências do Sistema</h3>

                  {/* Tema */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Palette className="h-4 w-4 inline mr-2" />
                      Tema
                    </label>
                    <select
                      value={preferences.theme}
                      onChange={(e) => setPreferences({ ...preferences, theme: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="light">Claro</option>
                      <option value="dark">Escuro</option>
                      <option value="auto">Automático</option>
                    </select>
                  </div>

                  {/* Idioma */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Globe className="h-4 w-4 inline mr-2" />
                      Idioma
                    </label>
                    <select
                      value={preferences.language}
                      onChange={(e) => setPreferences({ ...preferences, language: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en-US">English (US)</option>
                      <option value="es-ES">Español</option>
                    </select>
                  </div>

                  {/* Moeda */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Moeda padrão</label>
                    <select
                      value={preferences.currency}
                      onChange={(e) => setPreferences({ ...preferences, currency: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="BRL">Real (R$)</option>
                      <option value="USD">Dólar ($)</option>
                      <option value="EUR">Euro (€)</option>
                    </select>
                  </div>

                  {/* Notificações */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      <Bell className="h-4 w-4 inline mr-2" />
                      Notificações
                    </label>
                    <div className="space-y-3">
                      {[
                        { key: 'email', label: 'Email' },
                        { key: 'push', label: 'Push (navegador)' },
                        { key: 'sms', label: 'SMS' }
                      ].map((item) => (
                        <label key={item.key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={preferences.notifications[item.key as keyof typeof preferences.notifications]}
                            onChange={(e) => setPreferences({
                              ...preferences,
                              notifications: {
                                ...preferences.notifications,
                                [item.key]: e.target.checked
                              }
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSavePreferences}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Salvando...' : 'Salvar Preferências'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Configurações de Segurança</h3>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Informações da Conta</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Último login:</strong> {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Não disponível'}</p>
                      <p><strong>Conta criada em:</strong> {new Date(user?.created_at || '').toLocaleString('pt-BR')}</p>
                      <p><strong>Nível de acesso:</strong> {getRoleLabel(profile?.role || 'user')}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Alterar senha</h4>
                          <p className="text-sm text-gray-600">Atualize sua senha para manter sua conta segura</p>
                        </div>
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </div>
                    </button>

                    <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Autenticação de dois fatores</h4>
                          <p className="text-sm text-gray-600">Adicione uma camada extra de segurança</p>
                        </div>
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Em breve</span>
                      </div>
                    </button>

                    <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Sessões ativas</h4>
                          <p className="text-sm text-gray-600">Gerencie dispositivos conectados à sua conta</p>
                        </div>
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Membro desde {new Date(user?.created_at || '').toLocaleDateString('pt-BR')}
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center text-red-600 hover:text-red-500 text-sm font-medium"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair da conta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
