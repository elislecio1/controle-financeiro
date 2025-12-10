import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, DollarSign, Activity, Database, Settings, RefreshCw, Calendar, Filter, Search, Plus, Download, Upload, CheckCircle, XCircle, Trash2, Edit, Bell, User, Shield, Clock, Brain } from 'lucide-react'
import { SheetData, Categoria, Subcategoria, CentroCusto, Meta, Orcamento, Investimento, ContaBancaria, CartaoCredito, Contato, Alerta } from './types'
import { supabaseService } from './services/supabase'
import TransactionForm from './components/TransactionForm'
import Module2 from './components/modules/Module2/Module2'
import Module3 from './components/modules/Module3/Module3'
import Module4 from './components/modules/Module4/Module4'
import TransactionsModule from './components/modules/TransactionsModule/TransactionsModule'
import DataImport from './components/DataImport'
import SistemaAlertas from './components/SistemaAlertas'
import IntegracoesBancarias from './components/IntegracoesBancarias'
import { OFXImporter } from './components/OFXImporter'
import { ToastContainer } from './components/ToastNotification'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { UserProfile } from './components/auth/UserProfile'
import SystemLogs from './components/SystemLogs'
import { useAuth } from './hooks/useAuth'
import { formatarMoeda, formatarValorTabela, getClasseValor } from './utils/formatters'
import AnalisesFinanceiras from './components/modules/TransactionsModule/AnalisesFinanceiras'
import { realtimeService } from './services/realtimeService'
import { backupService } from './services/backupService'
import { notificationService } from './services/notificationService'
import NotificationSettings from './components/NotificationSettings'
import { monitoringService } from './services/monitoringService'
import MonitoringDashboard from './components/MonitoringDashboard'
import { aiFinancialService } from './services/aiFinancialService'
import AIFinancialDashboard from './components/AIFinancialDashboard'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

function App() {
  const navigate = useNavigate()
  const { user, profile, isAuthenticated } = useAuth()
  
  // Log temporário para verificar configuração do Supabase
  console.log('🔧 Verificando configuração do Supabase:')
  console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
  console.log('Anon Key configurada:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
  console.log('Configuração válida:', import.meta.env.VITE_SUPABASE_URL !== 'https://your-project.supabase.co' && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your-anon-key')
  const [data, setData] = useState<SheetData[]>([])
  const [filteredData, setFilteredData] = useState<SheetData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('geral')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<{ success?: boolean; message?: string }>({})
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  
  // Estados para perfil do usuário
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSystemLogs, setShowSystemLogs] = useState(false)
  
  // Novos estados para filtros de período
  const [periodFilter, setPeriodFilter] = useState<string>('all')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [showCustomPeriod, setShowCustomPeriod] = useState(false)
  
  // Estado para filtro de conta bancária
  const [contaFilter, setContaFilter] = useState<string>('todas')

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  // Estados para Módulo 2
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([])
  const [metas, setMetas] = useState<Meta[]>([])
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [contas, setContas] = useState<ContaBancaria[]>([])
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([])
  const [contatos, setContatos] = useState<Contato[]>([])

  // Estados para Módulo 3
  const [investimentos, setInvestimentos] = useState<Investimento[]>([])

  // Estados para Módulo 4
  const [relatorios, setRelatorios] = useState<any[]>([])

  // Estados para Sistema de Alertas
  const [showAlertasModal, setShowAlertasModal] = useState(false)
  const [alertasAtivos, setAlertasAtivos] = useState<Alerta[]>([])

  // Estados para Importação OFX
  const [showOFXModal, setShowOFXModal] = useState(false)

  // Estados para ordenação e confirmação de pagamento
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<SheetData | null>(null)
  const [paymentDate, setPaymentDate] = useState<string>('')

  // Novos estados para filtros de transações
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [filterTipo, setFilterTipo] = useState<string>('todos')
  const [filterStatus, setFilterStatus] = useState<string>('todos')

  // Estados para edição de transações
  const [showEditModal, setShowEditModal] = useState(false)
  const [transactionToEdit, setTransactionToEdit] = useState<SheetData | null>(null)

  // Estados para tempo real
  const [realtimeNotifications, setRealtimeNotifications] = useState<any[]>([])
  const [realtimeStats, setRealtimeStats] = useState<any>(null)

  // Estados para notificações
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const [notificationHistory, setNotificationHistory] = useState<any[]>([])

  // Estados para monitoramento
  const [showMonitoringDashboard, setShowMonitoringDashboard] = useState(false)

  // Estados para IA financeira
  const [showAIFinancialDashboard, setShowAIFinancialDashboard] = useState(false)

  // Função para formatar data automaticamente
  const formatDateInput = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Aplica a máscara DD/MM/AAAA
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
    } else if (numbers.length <= 8) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Carregando dados do Supabase...')
      
      // Carregar dados principais
      const cloudData = await supabaseService.getData()
      console.log('✅ Dados carregados com sucesso:', cloudData.length, 'registros')
      setData(cloudData)
      
      // Carregar alertas ativos e executar verificações automáticas
      try {
        const { alertasService } = await import('./services/alertas')
        
        // Executar verificações automáticas para gerar alertas
        console.log('🔍 Executando verificações automáticas...')
        const [vencimentos, metas, orcamentos, saldos] = await Promise.all([
          alertasService.verificarVencimentos(),
          alertasService.verificarMetas(),
          alertasService.verificarOrcamentos(),
          alertasService.verificarSaldos()
        ])
        
        // Combinar todos os alertas gerados
        const todosAlertas = [...vencimentos, ...metas, ...orcamentos, ...saldos]
        console.log('✅ Verificações concluídas. Alertas gerados:', todosAlertas.length)
        
        // Atualizar alertas ativos
        setAlertasAtivos(todosAlertas)
      } catch (error) {
        console.log('⚠️ Erro ao executar verificações:', error)
      }
      
      // Ordenar dados por data de vencimento por padrão
      const sortedData = [...cloudData].sort((a, b) => {
        const aDate = new Date(a.vencimento.split('/').reverse().join('-'))
        const bDate = new Date(b.vencimento.split('/').reverse().join('-'))
        return aDate.getTime() - bDate.getTime()
      })
      
      setFilteredData(sortedData)
      setSortConfig({ key: 'vencimento', direction: 'asc' })
      
      // Carregar dados do Módulo 2
      const categoriasData = await supabaseService.getCategorias()
      const subcategoriasData = await supabaseService.getSubcategorias()
      const contasData = await supabaseService.getContas()
      const cartoesData = await supabaseService.getCartoes()
      const contatosData = await supabaseService.getContatos()
      const centrosCustoData = await supabaseService.getCentrosCusto()
      
      setCategorias(categoriasData)
      setSubcategorias(subcategoriasData)
      setContas(contasData)
      setCartoes(cartoesData)
      setContatos(contatosData)
      setCentrosCusto(centrosCustoData)
      
      // Carregar dados do Módulo 3
      const investimentosData = await supabaseService.getInvestimentos()
      setInvestimentos(investimentosData)

      // Carregar dados do Módulo 4
      // Por enquanto usando dados mock, será implementado posteriormente
      setRelatorios([])
      
      setLastUpdate(new Date())
      // Reset period filters when data is loaded
      setPeriodFilter('all')
      setActiveFilter(null)
      setCustomStartDate('')
      setCustomEndDate('')
      setShowCustomPeriod(false)
      resetPagination()
      // Mostra feedback positivo
      setConnectionStatus({ success: true, message: 'Dados carregados com sucesso!' })
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setConnectionStatus({})
      }, 5000)
    } catch (error: any) {
      console.error('❌ Erro ao carregar dados:', error)
      
      // Verificar se é erro de configuração do Supabase
      if (error.message && error.message.includes('Supabase não configurado')) {
        setConnectionStatus({ 
          success: false, 
          message: '⚠️ Supabase não configurado. Configure as variáveis de ambiente para conectar ao banco de dados.' 
        })
      } else {
        setConnectionStatus({ 
          success: false, 
          message: error.message || 'Erro ao carregar dados do banco. Tente novamente.' 
        })
      }
      
      // Não define dados simulados, mantém arrays vazios
      setData([])
      setFilteredData([])
      setCategorias([])
      setSubcategorias([])
      setContas([])
      setCartoes([])
      setContatos([])
      setCentrosCusto([])
      setInvestimentos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    
    // Configurar listeners de tempo real
    if (isAuthenticated && user) {
      console.log('🔄 Configurando listeners de tempo real...')
      
      // Listener para mudanças nas transações
      const unsubscribeTransactions = realtimeService.addListener('transaction_created', (data) => {
        console.log('📊 Nova transação criada:', data)
        setConnectionStatus({ success: true, message: data.message })
        
        // Enviar notificação
        if (data.data) {
          notificationService.sendTransactionNotification(user.id, data.data)
        }
        
        loadData() // Recarregar dados
      })

      const unsubscribeUpdates = realtimeService.addListener('transaction_updated', (data) => {
        console.log('📊 Transação atualizada:', data)
        setConnectionStatus({ success: true, message: data.message })
        loadData() // Recarregar dados
      })

      const unsubscribeDeletes = realtimeService.addListener('transaction_deleted', (data) => {
        console.log('📊 Transação excluída:', data)
        setConnectionStatus({ success: true, message: data.message })
        loadData() // Recarregar dados
      })

      // Listener para notificações
      const unsubscribeNotifications = realtimeService.addListener('new_notification', (notification) => {
        console.log('🔔 Nova notificação:', notification)
        setRealtimeNotifications(prev => [notification, ...prev])
      })

      // Listener para estatísticas
      const unsubscribeStats = realtimeService.addListener('stats_updated', (stats) => {
        console.log('📈 Estatísticas atualizadas:', stats)
        setRealtimeStats(stats)
      })

      // Solicitar permissão para notificações do navegador
      realtimeService.requestNotificationPermission()

      // Configurar backup automático
      backupService.scheduleAutomaticBackup()

      // Cleanup
      return () => {
        unsubscribeTransactions()
        unsubscribeUpdates()
        unsubscribeDeletes()
        unsubscribeNotifications()
        unsubscribeStats()
      }
    }
  }, [isAuthenticated, user])

  // Fechar menu do usuário quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.user-menu-container')) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // useEffect para aplicar filtros de busca, tipo e status
  useEffect(() => {
    // Aplicar todos os filtros combinados
    applyCombinedFilters(periodFilter, contaFilter)
    setCurrentPage(1) // Reset para primeira página quando aplicar filtros
  }, [data, searchTerm, filterTipo, filterStatus, periodFilter, contaFilter])

  // Função para recarregar dados quando uma transação é salva
  const handleTransactionSaved = () => {
    loadData()
  }

  // Função para recarregar categorias e subcategorias
  const handleCategoriaSaved = async () => {
    console.log('🔄 handleCategoriaSaved: Iniciando recarregamento de categorias...')
    try {
      console.log('🔄 Carregando categorias...')
      const categoriasData = await supabaseService.getCategorias()
      console.log('✅ Categorias carregadas:', categoriasData.length)
      
      console.log('🔄 Carregando subcategorias...')
      const subcategoriasData = await supabaseService.getSubcategorias()
      console.log('✅ Subcategorias carregadas:', subcategoriasData.length)
      
      console.log('🔄 Atualizando estado das categorias...')
      setCategorias(categoriasData)
      setSubcategorias(subcategoriasData)
      console.log('✅ Estado das categorias atualizado com sucesso')
    } catch (error) {
      console.error('❌ Erro ao recarregar categorias:', error)
    }
  }

  const handleSubcategoriaSaved = async () => {
    try {
      const subcategoriasData = await supabaseService.getSubcategorias()
      setSubcategorias(subcategoriasData)
    } catch (error) {
      console.error('Erro ao recarregar subcategorias:', error)
    }
  }

  // Função para exportar dados
  const handleExportData = async () => {
    try {
      const jsonData = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dashboard-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setConnectionStatus({ success: true, message: 'Dados exportados com sucesso!' })
    } catch (error: any) {
      console.error('❌ Erro ao exportar dados:', error)
      setConnectionStatus({ 
        success: false, 
        message: 'Erro ao exportar dados. Tente novamente.' 
      })
    }
  }

  // Função para importar dados
  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const importedData = JSON.parse(text)
      
      if (Array.isArray(importedData)) {
        setData(importedData)
        setFilteredData(importedData)
        setConnectionStatus({ success: true, message: 'Dados importados com sucesso!' })
      } else {
        throw new Error('Formato de arquivo inválido')
      }
    } catch (error: any) {
      console.error('❌ Erro ao importar dados:', error)
      setConnectionStatus({ 
        success: false, 
        message: 'Erro ao importar dados. Verifique o formato do arquivo.' 
      })
    }
  }

  // Função para parsear data brasileira (DD/MM/YYYY)
  const parseBrazilianDate = (dateStr: string): Date | null => {
    if (!dateStr) return null
    
    const parts = dateStr.split('/')
    if (parts.length !== 3) return null
    
    const day = parseInt(parts[0])
    const month = parseInt(parts[1]) - 1
    const year = parseInt(parts[2])
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null
    
    const data = new Date(year, month, day)
    if (data.getFullYear() === year && data.getMonth() === month && data.getDate() === day) {
      return data
    }
    
    return null
  }

  // Função para verificar se uma data está em um período
  const isDateInPeriod = (dateStr: string, startDate: Date, endDate: Date): boolean => {
    const date = parseBrazilianDate(dateStr)
    if (!date) return false
    return date >= startDate && date <= endDate
  }

  // Função para obter datas de um período
  const getPeriodDates = (period: string): { start: Date; end: Date } | null => {
    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = hoje.getMonth()
    
    switch (period) {
      case 'current_month':
        return {
          start: new Date(ano, mes, 1),
          end: new Date(ano, mes + 1, 0)
        }
      case 'last_month':
        return {
          start: new Date(ano, mes - 1, 1),
          end: new Date(ano, mes, 0)
        }
      case 'current_year':
        return {
          start: new Date(ano, 0, 1),
          end: new Date(ano, 11, 31)
        }
      case 'last_year':
        return {
          start: new Date(ano - 1, 0, 1),
          end: new Date(ano - 1, 11, 31)
        }
      default:
        return null
    }
  }

  // Função para resetar paginação
  const resetPagination = () => {
    setCurrentPage(1)
  }

  // Função para ir para uma página específica
  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  // Função para aplicar filtro
  const applyFilter = (filterType: string | null) => {
    setActiveFilter(filterType)
    setCurrentPage(1)
    
    if (!filterType) {
      setFilteredData(data)
      return
    }
    
    const filtered = data.filter(item => {
      switch (filterType) {
        case 'receita':
          return item.tipo === 'receita'
        case 'despesa':
          return item.tipo === 'despesa'
        case 'pago':
          return item.status === 'pago'
        case 'pendente':
          return item.status === 'pendente'
        case 'vencido':
          return item.status === 'vencido'
        case 'pago_hoje':
          const hojePago = new Date().toLocaleDateString('pt-BR')
          return item.dataPagamento === hojePago
        case 'vencendo_hoje':
          if (item.status === 'pago') return false
          
          // Usar a mesma lógica inteligente do sistema de alertas
          const dataVencimento = parseBrazilianDate(item.vencimento)
          if (!dataVencimento) return false
          
          const hojeVenc = new Date()
          const hojeStr = hojeVenc.toLocaleDateString('pt-BR')
          const vencimentoStr = dataVencimento.toLocaleDateString('pt-BR')
          
          return vencimentoStr === hojeStr
        case 'vencendo_amanha':
          if (item.status === 'pago') return false
          
          const dataVencimentoAmanha = parseBrazilianDate(item.vencimento)
          if (!dataVencimentoAmanha) return false
          
          const hojeAmanha = new Date()
          const amanha = new Date(hojeAmanha)
          amanha.setDate(hojeAmanha.getDate() + 1)
          
          const amanhaStr = amanha.toLocaleDateString('pt-BR')
          const vencimentoAmanhaStr = dataVencimentoAmanha.toLocaleDateString('pt-BR')
          
          return vencimentoAmanhaStr === amanhaStr
        default:
          return true
      }
    })
    
    setFilteredData(filtered)
  }

  // Função para aplicar filtro de período
  const applyPeriodFilter = (period: string) => {
    setPeriodFilter(period)
    setCurrentPage(1)
    
    // Aplicar filtros combinados
    applyCombinedFilters(period, contaFilter)
  }

  // Função para aplicar filtros combinados
  const applyCombinedFilters = (period: string, conta: string) => {
    let filtered = [...data]
    
    // Aplicar filtro de período
    if (period !== 'all') {
      const periodDates = getPeriodDates(period)
      if (periodDates) {
        filtered = filtered.filter(item => 
          isDateInPeriod(item.vencimento, periodDates.start, periodDates.end)
        )
      }
    }
    
    // Aplicar filtro de conta bancária
    if (conta !== 'todas') {
      filtered = filtered.filter(item => item.conta === conta)
    }
    
    // Aplicar filtro de busca
    if (searchTerm.trim()) {
      filtered = filtered.filter(item =>
        item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subcategoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.conta.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Aplicar filtro de tipo
    if (filterTipo && filterTipo !== 'todos') {
      filtered = filtered.filter(item => item.tipo === filterTipo)
    }
    
    // Aplicar filtro de status
    if (filterStatus && filterStatus !== 'todos') {
      filtered = filtered.filter(item => item.status === filterStatus)
    }
    
    setFilteredData(filtered)
  }

  // Função para aplicar filtro de período customizado
  const applyCustomPeriodFilter = () => {
    if (!customStartDate || !customEndDate) {
      setConnectionStatus({ 
        success: false, 
        message: 'Por favor, preencha as datas de início e fim.' 
      })
      return
    }
    
    const startDate = parseBrazilianDate(customStartDate)
    const endDate = parseBrazilianDate(customEndDate)
    
    if (!startDate || !endDate) {
      setConnectionStatus({ 
        success: false, 
        message: 'Por favor, use o formato DD/MM/AAAA para as datas.' 
      })
      return
    }
    
    if (startDate > endDate) {
      setConnectionStatus({ 
        success: false, 
        message: 'A data de início deve ser anterior à data de fim.' 
      })
      return
    }
    
    // Aplicar filtro customizado combinado com filtro de conta
    let filtered = data.filter(item => 
      isDateInPeriod(item.vencimento, startDate, endDate)
    )
    
    // Aplicar filtro de conta se estiver ativo
    if (contaFilter !== 'todas') {
      filtered = filtered.filter(item => item.conta === contaFilter)
    }
    
    setFilteredData(filtered)
    setCurrentPage(1)
    setConnectionStatus({ success: true, message: 'Filtro customizado aplicado com sucesso!' })
  }

  // Função para aplicar filtro de conta bancária
  const applyContaFilter = (conta: string) => {
    setContaFilter(conta)
    
    // Aplicar filtros combinados
    applyCombinedFilters(periodFilter, conta)
    
    resetPagination()
    setConnectionStatus({ success: true, message: `Filtro de conta: ${conta === 'todas' ? 'Todas as contas' : conta}` })
  }

  // Função para limpar todos os filtros
  const clearAllFilters = () => {
    setPeriodFilter('all')
    setContaFilter('todas')
    setCustomStartDate('')
    setCustomEndDate('')
    setShowCustomPeriod(false)
    setActiveFilter(null)
    setSearchTerm('')
    setFilterTipo('todos')
    setFilterStatus('todos')
    setFilteredData(data)
    setCurrentPage(1)
    setConnectionStatus({ success: true, message: 'Todos os filtros foram limpos!' })
  }

  // Função para obter o banco de uma conta
  const getBancoConta = (contaNome: string): string => {
    const conta = contas.find(c => c.nome === contaNome)
    return conta?.banco || '-'
  }

  // Função para atualizar dados
  const handleRefresh = async () => {
    await loadData()
  }

  // Função para testar conexão
  const handleTestConnection = async () => {
    try {
      setLoading(true)
      const result = await supabaseService.testConnection()
      
      if (result.success) {
        setConnectionStatus({ 
          success: true, 
          message: result.message 
        })
      } else {
        setConnectionStatus({ 
          success: false, 
          message: result.message 
        })
      }
    } catch (error: any) {
      setConnectionStatus({ 
        success: false, 
        message: error.message || 'Erro ao testar conexão' 
      })
    } finally {
      setLoading(false)
    }
  }

  // Função para criar backup manual
  const handleCreateBackup = async () => {
    try {
      setLoading(true)
      const result = await backupService.createBackup('manual')
      
      if (result.success) {
        setConnectionStatus({ 
          success: true, 
          message: `Backup criado com sucesso! ID: ${result.backupId}` 
        })
      } else {
        setConnectionStatus({ 
          success: false, 
          message: result.error || 'Erro ao criar backup' 
        })
      }
    } catch (error: any) {
      setConnectionStatus({ 
        success: false, 
        message: error.message || 'Erro ao criar backup' 
      })
    } finally {
      setLoading(false)
    }
  }

  // Função para ordenação
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    
    setSortConfig({ key, direction })
    
    const sortedData = [...filteredData].sort((a, b) => {
      let aValue: any = a[key as keyof SheetData]
      let bValue: any = b[key as keyof SheetData]
      
      // Tratamento especial para valores numéricos
      if (key === 'valor') {
        aValue = Math.abs(aValue)
        bValue = Math.abs(bValue)
      }
      
      // Tratamento especial para datas (data e vencimento)
      if (key === 'data' || key === 'vencimento') {
        aValue = new Date(aValue.split('/').reverse().join('-'))
        bValue = new Date(bValue.split('/').reverse().join('-'))
      }
      
      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1
      }
      return 0
    })
    
    setFilteredData(sortedData)
    resetPagination()
  }

  // Função para confirmar pagamento
  const handleConfirmPayment = (transaction: SheetData) => {
    console.log('🔵 handleConfirmPayment chamado para:', transaction)
    setSelectedTransaction(transaction)
    setPaymentDate(new Date().toISOString().split('T')[0]) // Data atual
    setShowPaymentModal(true)
    console.log('🔵 Modal de pagamento aberto')
  }

  // Função para salvar pagamento
  const handleSavePayment = async () => {
    console.log('🔵 handleSavePayment chamado')
    if (!selectedTransaction || !paymentDate) {
      console.log('❌ Dados insuficientes:', { selectedTransaction, paymentDate })
      return
    }
    
    try {
      console.log('🔵 Iniciando salvamento do pagamento...')
      
      // Converter data ISO para formato brasileiro
      const converterDataParaBrasileiro = (dataISO: string): string => {
        if (!dataISO) return ''
        const data = new Date(dataISO)
        if (isNaN(data.getTime())) return dataISO
        return data.toLocaleDateString('pt-BR')
      }
      
      const updatedTransaction: SheetData = {
        ...selectedTransaction,
        status: 'pago' as const,
        dataPagamento: converterDataParaBrasileiro(paymentDate),
        situacao: 'pago' // Adicionar também o campo situacao
      }
      
      console.log('🔵 Transação atualizada:', updatedTransaction)
      
      // Atualizar no Supabase
      await supabaseService.updateTransaction(selectedTransaction.id, updatedTransaction)
      console.log('✅ Transação atualizada no Supabase')
      
      // Atualizar dados locais
      const updatedData = data.map(item => 
        item.id === selectedTransaction.id ? updatedTransaction : item
      )
      setData(updatedData)
      setFilteredData(updatedData)
      
      setShowPaymentModal(false)
      setSelectedTransaction(null)
      setPaymentDate('')
      
      setConnectionStatus({ 
        success: true, 
        message: 'Pagamento confirmado com sucesso!' 
      })
      
      console.log('✅ Pagamento confirmado com sucesso')
    } catch (error: any) {
      console.error('❌ Erro ao confirmar pagamento:', error)
      setConnectionStatus({ 
        success: false, 
        message: error.message || 'Erro ao confirmar pagamento' 
      })
    }
  }

  // Função para desmarcar como pago
  const handleUnmarkAsPaid = async (transaction: SheetData) => {
    if (!window.confirm('Tem certeza que deseja desmarcar este lançamento como pago?')) {
      return
    }
    
    try {
      const updatedTransaction: SheetData = {
        ...transaction,
        status: 'pendente' as const,
        dataPagamento: undefined,
        situacao: 'pendente' // Adicionar também o campo situacao
      }
      
      // Atualizar no Supabase
      await supabaseService.updateTransaction(transaction.id, updatedTransaction)
      
      // Atualizar dados locais
      const updatedData = data.map(item => 
        item.id === transaction.id ? updatedTransaction : item
      )
      setData(updatedData)
      setFilteredData(updatedData)
      
      setConnectionStatus({ 
        success: true, 
        message: 'Lançamento desmarcado como pago!' 
      })
    } catch (error: any) {
      setConnectionStatus({ 
        success: false, 
        message: error.message || 'Erro ao desmarcar pagamento' 
      })
    }
  }

  // Função para excluir transação
  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) {
      return
    }

    try {
      await supabaseService.deleteTransaction(id)
      setData(data.filter(item => item.id !== id))
      setFilteredData(filteredData.filter(item => item.id !== id))
      setConnectionStatus({ success: true, message: 'Transação excluída com sucesso!' })
    } catch (error: any) {
      setConnectionStatus({ 
        success: false, 
        message: error.message || 'Erro ao excluir transação' 
      })
    }
  }

  // Função para abrir modal de edição
  const handleEdit = (transaction: SheetData) => {
    setTransactionToEdit(transaction)
    setShowEditModal(true)
  }

  // Função para fechar modal de edição
  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setTransactionToEdit(null)
  }

  // Cálculos para estatísticas
  const totalReceitas = filteredData.filter(item => item.tipo === 'receita').reduce((sum, item) => sum + Math.abs(item.valor), 0)
  const totalDespesas = filteredData.filter(item => item.tipo === 'despesa').reduce((sum, item) => sum + Math.abs(item.valor), 0)
  const saldo = filteredData.reduce((sum, item) => sum + item.valor, 0) // Soma todos os valores (negativos para despesas)
  const totalPago = filteredData.filter(item => item.status === 'pago').reduce((sum, item) => sum + Math.abs(item.valor), 0)
  const totalPendente = filteredData.filter(item => item.status === 'pendente').reduce((sum, item) => sum + Math.abs(item.valor), 0)
  const totalVencido = filteredData.filter(item => item.status === 'vencido').reduce((sum, item) => sum + Math.abs(item.valor), 0)
  
  // Cálculo para "Pago Hoje" - transações pagas hoje
  const hoje = new Date().toLocaleDateString('pt-BR')
  const totalPagoHoje = filteredData.filter(item => 
    item.status === 'pago' && item.dataPagamento === hoje
  ).reduce((sum, item) => sum + Math.abs(item.valor), 0)
  
  // Cálculo para "Vencendo Hoje" - transações que vencem hoje e ainda não foram pagas
  const totalVencendoHoje = filteredData.filter(item => {
    if (item.status === 'pago') return false
    
    // Usar a mesma lógica inteligente do sistema de alertas
    const dataVencimento = parseBrazilianDate(item.vencimento)
    if (!dataVencimento) return false
    
    const hoje = new Date()
    const hojeStr = hoje.toLocaleDateString('pt-BR')
    const vencimentoStr = dataVencimento.toLocaleDateString('pt-BR')
    
    // Debug: Log para verificar as datas
    console.log(`🔍 Verificando vencimento: ${item.descricao} - Vencimento: ${item.vencimento} (${vencimentoStr}) vs Hoje: ${hojeStr}`)
    
    const isVencendoHoje = vencimentoStr === hojeStr
    if (isVencendoHoje) {
      console.log(`✅ Encontrado vencendo hoje: ${item.descricao} - R$ ${Math.abs(item.valor)}`)
    }
    
    return isVencendoHoje
  }).reduce((sum, item) => sum + Math.abs(item.valor), 0)
  
  console.log(`💰 Total vencendo hoje: R$ ${totalVencendoHoje}`)

  // Cálculo para "Vencendo Amanhã" - transações que vencem amanhã e ainda não foram pagas
  const totalVencendoAmanha = filteredData.filter(item => {
    if (item.status === 'pago') return false
    
    const dataVencimento = parseBrazilianDate(item.vencimento)
    if (!dataVencimento) return false
    
    const hoje = new Date()
    const amanha = new Date(hoje)
    amanha.setDate(hoje.getDate() + 1)
    
    const amanhaStr = amanha.toLocaleDateString('pt-BR')
    const vencimentoStr = dataVencimento.toLocaleDateString('pt-BR')
    
    const isVencendoAmanha = vencimentoStr === amanhaStr
    if (isVencendoAmanha) {
      console.log(`✅ Encontrado vencendo amanhã: ${item.descricao} - R$ ${Math.abs(item.valor)}`)
    }
    
    return isVencendoAmanha
  }).reduce((sum, item) => sum + Math.abs(item.valor), 0)
  
  console.log(`💰 Total vencendo amanhã: R$ ${totalVencendoAmanha}`)

  // Dados para gráficos
  const chartData = filteredData.reduce((acc: any[], item) => {
    const mes = item.data.split('/')[1] + '/' + item.data.split('/')[2]
    const existing = acc.find(d => d.mes === mes)
    
    if (existing) {
      existing[item.status] = (existing[item.status] || 0) + Math.abs(item.valor)
    } else {
      acc.push({
        mes,
        pago: item.status === 'pago' ? Math.abs(item.valor) : 0,
        pendente: item.status === 'pendente' ? Math.abs(item.valor) : 0,
        vencido: item.status === 'vencido' ? Math.abs(item.valor) : 0
      })
    }
    
    return acc
  }, [])

  const pieData = [
    { name: 'Pago', value: totalPago },
    { name: 'Pendente', value: totalPendente },
    { name: 'Vencido', value: totalVencido }
  ].filter(item => item.value > 0)

  // Dados paginados
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = filteredData.slice(startIndex, endIndex)
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  // Cálculo separado de despesas e receitas de todas as transações filtradas (não apenas da página atual)
  const despesasExibidas = filteredData
    .filter(item => item.tipo === 'despesa')
    .reduce((sum, item) => sum + Math.abs(item.valor), 0)
  
  const receitasExibidas = filteredData
    .filter(item => item.tipo === 'receita')
    .reduce((sum, item) => sum + Math.abs(item.valor), 0)
  
  const totalExibido = receitasExibidas - despesasExibidas

  // Cálculo separado de despesas e receitas de todas as transações filtradas
  const despesasGeral = filteredData
    .filter(item => item.tipo === 'despesa')
    .reduce((sum, item) => sum + Math.abs(item.valor), 0)
  
  const receitasGeral = filteredData
    .filter(item => item.tipo === 'receita')
    .reduce((sum, item) => sum + Math.abs(item.valor), 0)
  
  const totalGeral = receitasGeral - despesasGeral

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">💰 NeoFIN</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleTestConnection}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                <Database className="h-4 w-4 mr-2" />
                Testar Conexão
              </button>
              
              <button
                onClick={handleRefresh}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </button>
              
              <button
                onClick={handleCreateBackup}
                className="flex items-center px-3 py-2 text-sm font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200"
              >
                <Database className="h-4 w-4 mr-2" />
                Backup
              </button>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportData}
                  className="flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </button>
                
                                 <label className="flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 cursor-pointer">
                   <Upload className="h-4 w-4 mr-2" />
                   Importar
                   <input
                     type="file"
                     accept=".json"
                     onChange={handleImportData}
                     className="hidden"
                   />
                 </label>
                 
                 <button
                   onClick={() => setShowOFXModal(true)}
                   className="flex items-center px-3 py-2 text-sm font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200"
                 >
                   <Upload className="h-4 w-4 mr-2" />
                   Importar OFX
                 </button>
              </div>
              
              {/* Botão do usuário */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{profile?.name || user?.email}</p>
                  <p className="text-xs text-gray-500">{profile?.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
                </div>
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Avatar" 
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </button>
                  
                                     {/* Menu dropdown para administradores */}
                   {profile?.role === 'admin' && showUserMenu && (
                     <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                       <button
                         onClick={() => {
                           setShowUserMenu(false)
                           navigate('/admin/users')
                         }}
                         className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                       >
                         <Users className="h-4 w-4 mr-2" />
                         Gestão de Usuários
                       </button>
                       <button
                         onClick={() => {
                           setShowUserMenu(false)
                           navigate('/admin/user-management')
                         }}
                         className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                       >
                         <Shield className="h-4 w-4 mr-2" />
                         Administração de Usuários
                       </button>
                       <button
                         onClick={() => {
                           setShowUserMenu(false)
                           setShowSystemLogs(true)
                         }}
                         className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                       >
                         <Activity className="h-4 w-4 mr-2" />
                         Logs do Sistema
                       </button>
                       <button
                         onClick={() => {
                           setShowUserMenu(false)
                           setShowUserProfile(true)
                         }}
                         className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                       >
                         <User className="h-4 w-4 mr-2" />
                         Meu Perfil
                       </button>
                       <button
                         onClick={() => {
                           setShowUserMenu(false)
                           setShowNotificationSettings(true)
                         }}
                         className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                       >
                         <Bell className="h-4 w-4 mr-2" />
                         Notificações
                       </button>
                       <button
                         onClick={() => {
                           setShowUserMenu(false)
                           setShowMonitoringDashboard(true)
                         }}
                         className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                       >
                         <Activity className="h-4 w-4 mr-2" />
                         Monitoramento
                       </button>
                       <button
                         onClick={() => {
                           setShowUserMenu(false)
                           setShowAIFinancialDashboard(true)
                         }}
                         className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                       >
                         <Brain className="h-4 w-4 mr-2" />
                         IA Financeira
                       </button>
                     </div>
                   )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
                      { id: 'geral', name: 'Visão Geral', icon: TrendingUp },
        { id: 'analytics', name: 'Análises', icon: Activity },
                    { id: 'transactions', name: 'Transações', icon: Plus },
            { id: 'module2', name: 'Organização e Planejamento', icon: Settings },
            { id: 'module3', name: 'Recursos Avançados', icon: TrendingUp },
            { id: 'module4', name: 'Relatórios e Análises', icon: BarChart },
            { id: 'import', name: 'Importação de Dados', icon: Upload },
            { id: 'alertas', name: 'Sistema de Alertas', icon: Bell },
            { id: 'integracoes', name: 'Integrações', icon: Database }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Status Message */}
        {connectionStatus.message && (
          <div className={`mb-4 p-4 rounded-md relative ${
            connectionStatus.success 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <span>{connectionStatus.message}</span>
              <button
                onClick={() => setConnectionStatus({})}
                className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Carregando dados...</span>
          </div>
        )}

        {/* General Dashboard */}
        {activeTab === 'geral' && !loading && (
          <div className="space-y-8">
            {/* Filtro de Conta Bancária - NO TOPO */}
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  Filtro por Conta Bancária
                </h3>
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpar Filtros
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 min-w-[120px]">
                  Selecione a Conta:
                </label>
                <select
                  value={contaFilter}
                  onChange={(e) => applyContaFilter(e.target.value)}
                  className="flex-1 max-w-md px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                >
                  <option value="todas">Todas as Contas</option>
                  {contas.map(conta => (
                    <option key={conta.nome} value={conta.nome}>
                      {conta.nome} - {conta.banco}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Indicador de Filtros Ativos */}
            {(periodFilter !== 'all' || contaFilter !== 'todas' || activeFilter) && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Filtros Ativos:</span>
                  </div>
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Limpar Todos
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {periodFilter !== 'all' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Período: {periodFilter === 'current_month' ? 'Mês Atual' : 
                                periodFilter === 'last_month' ? 'Mês Anterior' :
                                periodFilter === 'current_year' ? 'Ano Atual' :
                                periodFilter === 'last_year' ? 'Ano Anterior' : periodFilter}
                    </span>
                  )}
                  {contaFilter !== 'todas' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Conta: {contaFilter}
                    </span>
                  )}
                  {activeFilter && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      activeFilter === 'receita' ? 'bg-green-100 text-green-800' :
                      activeFilter === 'despesa' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {activeFilter === 'receita' ? 'Receitas' :
                       activeFilter === 'despesa' ? 'Despesas' :
                       activeFilter === 'pago' ? 'Pago' :
                       activeFilter === 'pendente' ? 'Pendente' :
                       activeFilter === 'vencido' ? 'Vencido' :
                       activeFilter === 'pago_hoje' ? 'Pago Hoje' :
                       activeFilter === 'vencendo_hoje' ? 'Vencendo Hoje' : activeFilter}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Filtros de Período */}
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Filtros de Período
                </h3>
              </div>
                
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { value: 'all', label: 'Todos os Períodos', icon: '📅' },
                  { value: 'current_month', label: 'Mês Atual', icon: '📆' },
                  { value: 'last_month', label: 'Mês Anterior', icon: '📅' },
                  { value: 'current_year', label: 'Ano Atual', icon: '📊' },
                  { value: 'last_year', label: 'Ano Anterior', icon: '📈' }
                ].map((period) => (
                  <button
                    key={period.value}
                    onClick={() => applyPeriodFilter(period.value)}
                    className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      periodFilter === period.value
                        ? 'bg-purple-600 text-white shadow-lg transform scale-105'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg">{period.icon}</span>
                      <span className="text-xs">{period.label}</span>
                    </div>
                  </button>
                ))}
                
                <button
                  onClick={() => setShowCustomPeriod(!showCustomPeriod)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    showCustomPeriod
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg">⚙️</span>
                    <span className="text-xs">Customizado</span>
                  </div>
                </button>
              </div>

              {showCustomPeriod && (
                <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    Período Personalizado
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
                      <input
                        type="text"
                        placeholder="DD/MM/AAAA"
                        value={customStartDate}
                        onChange={(e) => {
                          const formatted = formatDateInput(e.target.value)
                          setCustomStartDate(formatted)
                        }}
                        onFocus={(e) => e.target.select()}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
                      <input
                        type="text"
                        placeholder="DD/MM/AAAA"
                        value={customEndDate}
                        onChange={(e) => {
                          const formatted = formatDateInput(e.target.value)
                          setCustomEndDate(formatted)
                        }}
                        onFocus={(e) => e.target.select()}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <button
                      onClick={applyCustomPeriodFilter}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md hover:shadow-lg"
                    >
                      Aplicar Filtro
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Cards - Depois dos Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <button
                onClick={() => applyFilter('receita')}
                className={`bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100 ${
                  activeFilter === 'receita' ? 'ring-4 ring-green-200 shadow-green-200' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-shrink-0">
                      <div className="p-3 bg-green-100 rounded-full">
                        <TrendingUp className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    <div className="text-right">
                      <dt className="text-sm font-medium text-gray-500 truncate">Receitas</dt>
                      <dd className="text-2xl font-bold text-gray-900">{formatarMoeda(totalReceitas)}</dd>
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => applyFilter('despesa')}
                className={`bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100 ${
                  activeFilter === 'despesa' ? 'ring-4 ring-red-200 shadow-red-200' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-shrink-0">
                      <div className="p-3 bg-red-100 rounded-full">
                        <Activity className="h-8 w-8 text-red-600" />
                      </div>
                    </div>
                    <div className="text-right">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Despesas</dt>
                        <dd className="text-2xl font-bold text-gray-900">{formatarMoeda(totalDespesas)}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </button>

              <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-shrink-0">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <DollarSign className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                    <div className="text-right">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Saldo</dt>
                        <dd className={`text-2xl font-bold ${getClasseValor(saldo)}`}>
                          {formatarMoeda(saldo)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => applyFilter('vencendo_amanha')}
                className={`bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100 ${
                  activeFilter === 'vencendo_amanha' ? 'ring-4 ring-indigo-200 shadow-indigo-200' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-shrink-0">
                      <div className="p-3 bg-indigo-100 rounded-full">
                        <Calendar className="h-8 w-8 text-indigo-600" />
                      </div>
                    </div>
                    <div className="text-right">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Vencendo Amanhã</dt>
                        <dd className="text-2xl font-bold text-indigo-600">{formatarMoeda(totalVencendoAmanha)}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Filter Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { label: 'Total Pago', value: totalPago, color: 'green', filter: 'pago', icon: CheckCircle },
                { label: 'Total Pendente', value: totalPendente, color: 'yellow', filter: 'pendente', icon: Clock },
                { label: 'Total Vencido', value: totalVencido, color: 'red', filter: 'vencido', icon: XCircle },
                { label: 'Pago Hoje', value: totalPagoHoje, color: 'blue', filter: 'pago_hoje', icon: CheckCircle },
                { label: 'Vencendo Hoje', value: totalVencendoHoje, color: 'orange', filter: 'vencendo_hoje', icon: Calendar }
              ].map((card) => (
                <button
                  key={card.filter}
                  onClick={() => applyFilter(card.filter)}
                  className={`bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100 ${
                    activeFilter === card.filter ? `ring-4 ring-${card.color}-200 shadow-${card.color}-200` : ''
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-shrink-0">
                        <div className={`p-3 bg-${card.color}-50 rounded-full`}>
                          <card.icon className={`h-8 w-8 text-${card.color}-600`} />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-500">{card.label}</div>
                        <div className={`text-2xl font-bold text-${card.color}-600`}>
                          {formatarMoeda(card.value)}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Line Chart */}
              <div className="bg-white shadow-lg rounded-xl border border-gray-100">
                <div className="px-6 py-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Evolução por Status
                  </h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="mes" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="pago" stroke="#10B981" name="Pago" strokeWidth={3} />
                      <Line type="monotone" dataKey="pendente" stroke="#F59E0B" name="Pendente" strokeWidth={3} />
                      <Line type="monotone" dataKey="vencido" stroke="#EF4444" name="Vencido" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="bg-white shadow-lg rounded-xl border border-gray-100">
                <div className="px-6 py-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <BarChart className="h-5 w-5 text-purple-600" />
                    Distribuição por Status
                  </h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}



        {activeTab === 'analytics' && (
          <AnalisesFinanceiras 
            data={data}
            onDataChange={setData}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsModule
            data={data}
            categorias={categorias}
            subcategorias={subcategorias}
            centrosCusto={centrosCusto}
            metas={metas}
            orcamentos={orcamentos}
            contas={contas}
            cartoes={cartoes}
            onDataChange={setData}
            onCategoriaChange={setCategorias}
            onSubcategoriaChange={setSubcategorias}
            onCentroCustoChange={setCentrosCusto}
            onMetaChange={setMetas}
            onOrcamentoChange={setOrcamentos}
            onContaChange={setContas}
            onCartaoChange={setCartoes}
          />
        )}

        {activeTab === 'module2' && (
          <Module2
            categorias={categorias}
            subcategorias={subcategorias}
            centrosCusto={centrosCusto}
            metas={metas}
            orcamentos={orcamentos}
            contas={contas}
            cartoes={cartoes}
            onCategoriaChange={setCategorias}
            onSubcategoriaChange={setSubcategorias}
            onCentroCustoChange={setCentrosCusto}
            onMetaChange={setMetas}
            onOrcamentoChange={setOrcamentos}
            onContaChange={setContas}
            onCartaoChange={setCartoes}
            onCategoriaSaved={handleCategoriaSaved}
            onSubcategoriaSaved={handleSubcategoriaSaved}
          />
        )}

        {activeTab === 'module3' && (
          <Module3
            investimentos={investimentos}
            onInvestimentoChange={setInvestimentos}
          />
        )}

        {activeTab === 'module4' && (
          <Module4
            data={data}
            categorias={categorias}
            centrosCusto={centrosCusto}
          />
        )}

        {activeTab === 'import' && (
          <DataImport />
        )}

        {activeTab === 'alertas' && (
          <SistemaAlertas />
        )}

        {activeTab === 'integracoes' && (
          <IntegracoesBancarias />
        )}

        {/* Container de Notificações Toast */}
        <ToastContainer 
          alertas={alertasAtivos}
          onClose={(id) => {
            setAlertasAtivos(prev => prev.filter(a => a.id !== id))
          }}
        />

        {/* Modal de Edição de Transação */}
        {showEditModal && transactionToEdit && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-4 w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <TransactionForm 
                  onTransactionSaved={handleTransactionSaved}
                  categorias={categorias}
                  subcategorias={subcategorias}
                  contas={contas}
                  transactionToEdit={transactionToEdit}
                  onClose={handleCloseEditModal}
                  isEditing={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Pagamento */}
        {showPaymentModal && selectedTransaction && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Confirmar Pagamento
                </h3>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Descrição:</strong> {selectedTransaction.descricao}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Valor:</strong> {formatarValorTabela(selectedTransaction.valor)}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Vencimento:</strong> {selectedTransaction.vencimento}
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data do Pagamento
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowPaymentModal(false)
                      setSelectedTransaction(null)
                      setPaymentDate('')
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSavePayment}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Confirmar Pagamento
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Importação OFX */}
        {showOFXModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-4 w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Importação de Arquivo OFX
                  </h3>
                  <button
                    onClick={() => setShowOFXModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>
                <OFXImporter 
                  onImportComplete={(result) => {
                    console.log('Importação OFX concluída:', result);
                    if (result.success) {
                      loadData(); // Recarregar dados após importação
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal do Perfil do Usuário */}
        <UserProfile 
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
        />

        {/* Modal dos Logs do Sistema */}
        <SystemLogs
          isOpen={showSystemLogs}
          onClose={() => setShowSystemLogs(false)}
        />

        {/* Modal de Configurações de Notificações */}
        <NotificationSettings
          isOpen={showNotificationSettings}
          onClose={() => setShowNotificationSettings(false)}
        />

        {/* Dashboard de Monitoramento */}
        <MonitoringDashboard
          isOpen={showMonitoringDashboard}
          onClose={() => setShowMonitoringDashboard(false)}
        />

        {/* Dashboard de IA Financeira */}
        <AIFinancialDashboard
          isOpen={showAIFinancialDashboard}
          onClose={() => setShowAIFinancialDashboard(false)}
        />
      </main>
    </div>
  )
}

// Componente App protegido por autenticação
const ProtectedApp: React.FC = () => {
  return (
    <ProtectedRoute requiredRole="user">
      <App />
    </ProtectedRoute>
  )
}

export default ProtectedApp 