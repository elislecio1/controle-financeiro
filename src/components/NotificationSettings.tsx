// Componente de Configurações de Notificações
import React, { useState, useEffect } from 'react'
import { Bell, Settings, Save, RefreshCw, CheckCircle, XCircle, Clock, Shield } from 'lucide-react'
import { notificationService } from '../services/notificationService'
import { NotificationPreferences } from '../services/notificationService'

interface NotificationSettingsProps {
  isOpen: boolean
  onClose: () => void
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ isOpen, onClose }) => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadPreferences()
    }
  }, [isOpen])

  const loadPreferences = async () => {
    setLoading(true)
    try {
      // Simular carregamento das preferências
      // Em uma implementação real, isso viria do backend
      const defaultPreferences: NotificationPreferences = {
        user_id: 'current-user',
        browser_enabled: true,
        email_enabled: true,
        whatsapp_enabled: false,
        telegram_enabled: false,
        quiet_hours: {
          enabled: true,
          start: '22:00',
          end: '08:00'
        },
        frequency_limits: {
          max_per_hour: 10,
          max_per_day: 50
        },
        categories: {
          transactions: true,
          reminders: true,
          alerts: true,
          achievements: true,
          system: true
        }
      }
      setPreferences(defaultPreferences)
    } catch (error) {
      console.error('Erro ao carregar preferências:', error)
      setMessage({ type: 'error', text: 'Erro ao carregar configurações' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!preferences) return

    setSaving(true)
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Erro ao salvar preferências:', error)
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' })
    } finally {
      setSaving(false)
    }
  }

  const handleChannelToggle = (channel: keyof NotificationPreferences) => {
    if (!preferences) return

    setPreferences({
      ...preferences,
      [channel]: !preferences[channel]
    })
  }

  const handleCategoryToggle = (category: keyof NotificationPreferences['categories']) => {
    if (!preferences) return

    setPreferences({
      ...preferences,
      categories: {
        ...preferences.categories,
        [category]: !preferences.categories[category]
      }
    })
  }

  const handleQuietHoursToggle = () => {
    if (!preferences) return

    setPreferences({
      ...preferences,
      quiet_hours: {
        ...preferences.quiet_hours,
        enabled: !preferences.quiet_hours.enabled
      }
    })
  }

  const handleTimeChange = (field: 'start' | 'end', value: string) => {
    if (!preferences) return

    setPreferences({
      ...preferences,
      quiet_hours: {
        ...preferences.quiet_hours,
        [field]: value
      }
    })
  }

  const handleFrequencyChange = (field: 'max_per_hour' | 'max_per_day', value: number) => {
    if (!preferences) return

    setPreferences({
      ...preferences,
      frequency_limits: {
        ...preferences.frequency_limits,
        [field]: value
      }
    })
  }

  const testNotification = async () => {
    try {
      await notificationService.requestNotificationPermission()
      setMessage({ type: 'success', text: 'Notificação de teste enviada!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao enviar notificação de teste' })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-4 w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">
                Configurações de Notificações
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-4 p-4 rounded-md flex items-center gap-2 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Carregando configurações...</span>
            </div>
          ) : preferences ? (
            <div className="space-y-8">
              {/* Canais de Notificação */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  Canais de Notificação
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'browser_enabled', label: 'Notificações do Navegador', icon: '🌐' },
                    { key: 'email_enabled', label: 'Email', icon: '📧' },
                    { key: 'whatsapp_enabled', label: 'WhatsApp', icon: '📱' },
                    { key: 'telegram_enabled', label: 'Telegram', icon: '📱' }
                  ].map((channel) => (
                    <label key={channel.key} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences[channel.key as keyof NotificationPreferences] as boolean}
                        onChange={() => handleChannelToggle(channel.key as keyof NotificationPreferences)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-lg">{channel.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{channel.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Categorias de Notificação */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-green-600" />
                  Tipos de Notificação
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'transactions', label: 'Transações', icon: '💰' },
                    { key: 'reminders', label: 'Lembretes', icon: '⏰' },
                    { key: 'alerts', label: 'Alertas', icon: '⚠️' },
                    { key: 'achievements', label: 'Conquistas', icon: '🎉' },
                    { key: 'system', label: 'Sistema', icon: '🔧' }
                  ].map((category) => (
                    <label key={category.key} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.categories[category.key as keyof NotificationPreferences['categories']]}
                        onChange={() => handleCategoryToggle(category.key as keyof NotificationPreferences['categories'])}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-lg">{category.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{category.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Horário Silencioso */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  Horário Silencioso
                </h4>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.quiet_hours.enabled}
                      onChange={handleQuietHoursToggle}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Ativar horário silencioso</span>
                  </label>

                  {preferences.quiet_hours.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Início
                        </label>
                        <input
                          type="time"
                          value={preferences.quiet_hours.start}
                          onChange={(e) => handleTimeChange('start', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fim
                        </label>
                        <input
                          type="time"
                          value={preferences.quiet_hours.end}
                          onChange={(e) => handleTimeChange('end', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Limites de Frequência */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-600" />
                  Limites de Frequência
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máximo por hora
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={preferences.frequency_limits.max_per_hour}
                      onChange={(e) => handleFrequencyChange('max_per_hour', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máximo por dia
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={preferences.frequency_limits.max_per_day}
                      onChange={(e) => handleFrequencyChange('max_per_day', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Teste de Notificação */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Teste de Notificação
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Teste se as notificações estão funcionando corretamente
                </p>
                <button
                  onClick={testNotification}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Enviar Notificação de Teste
                </button>
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default NotificationSettings
