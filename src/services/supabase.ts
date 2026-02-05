import { createClient } from '@supabase/supabase-js'
import { SheetData, NewTransaction, Categoria, Subcategoria, Investimento, ContaBancaria, CartaoCredito, Contato, CentroCusto } from '../types'
import { formatarMoeda, formatarData, parsearDataBrasileira, parsearValorBrasileiro } from '../utils/formatters'
import { logService } from './logService'
import { cacheService } from './cacheService'
import { getEmpresaIdFromStorage, getEmpresaIdOrThrow } from '../utils/empresaHelper'

// Configurações do Supabase - SEGURANÇA CRÍTICA
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Verificar se as configurações são válidas
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('❌ SUPABASE NÃO CONFIGURADO!\n\nConfigure as variáveis de ambiente:\n- VITE_SUPABASE_URL\n- VITE_SUPABASE_ANON_KEY\n\nCrie um arquivo .env na raiz do projeto com estas variáveis.')
}

// Verificar se não são valores padrão
if (SUPABASE_URL === 'https://your-project-id.supabase.co' || 
    SUPABASE_ANON_KEY === 'your-anon-key' ||
    SUPABASE_URL.includes('your-project') ||
    SUPABASE_ANON_KEY.includes('your-anon')) {
  throw new Error('❌ CONFIGURAÇÃO INVÁLIDA!\n\nSubstitua os valores padrão pelas credenciais reais do seu projeto Supabase.')
}

// Criar uma única instância do cliente Supabase
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storageKey: 'controle-financeiro-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'controle-financeiro-app'
    }
  }
})

// Exportar a única instância
export const supabase = supabaseClient

// Função para verificar se o usuário está autenticado
const ensureAuthenticated = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session) {
    throw new Error('Usuário não autenticado')
  }
  return session.user
}

// Função para adicionar user_id automaticamente nas operações
const addUserIdToData = async (data: any) => {
  const user = await ensureAuthenticated()
  return { ...data, user_id: user.id }
}

// Sistema operando apenas com dados reais - sem dados simulados

// Sistema operando apenas com dados reais - sem dados simulados

// Sistema operando apenas com dados reais - sem dados simulados

export interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilterOptions {
  search?: string
  tipo?: 'receita' | 'despesa' | 'transferencia' | 'investimento'
  categoria?: string
  conta?: string
  status?: 'pago' | 'pendente' | 'vencido'
  dataInicio?: string
  dataFim?: string
  valorMin?: number
  valorMax?: number
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface SupabaseService {
  readonly supabase: any
  getData(): Promise<SheetData[]>
  getDataPaginated(options?: PaginationOptions): Promise<PaginatedResult<SheetData>>
  searchTransactions(filters: FilterOptions, pagination?: PaginationOptions): Promise<PaginatedResult<SheetData>>
  saveTransaction(transaction: NewTransaction): Promise<{ success: boolean; message: string; data?: SheetData }>
  updateTransaction(id: string, data: Partial<SheetData>): Promise<{ success: boolean; message: string }>
  deleteTransaction(id: string): Promise<{ success: boolean; message: string }>
  testConnection(): Promise<{ success: boolean; message: string; data?: any }>
  
  // Métodos para Módulo 2
  getCategorias(): Promise<Categoria[]>
  saveCategoria(categoria: Omit<Categoria, 'id'>): Promise<{ success: boolean; message: string; data?: Categoria }>
  updateCategoria(id: string, data: Partial<Categoria>): Promise<{ success: boolean; message: string }>
  deleteCategoria(id: string): Promise<{ success: boolean; message: string }>
  
  getSubcategorias(): Promise<Subcategoria[]>
  saveSubcategoria(subcategoria: Omit<Subcategoria, 'id'>): Promise<{ success: boolean; message: string; data?: Subcategoria }>
  updateSubcategoria(id: string, data: Partial<Subcategoria>): Promise<{ success: boolean; message: string }>
  deleteSubcategoria(id: string): Promise<{ success: boolean; message: string }>

  // Métodos para Módulo 3
  getInvestimentos(): Promise<Investimento[]>
  saveInvestimento(investimento: Omit<Investimento, 'id'>): Promise<{ success: boolean; message: string; data?: Investimento }>
  updateInvestimento(id: string, data: Partial<Investimento>): Promise<{ success: boolean; message: string }>
  deleteInvestimento(id: string): Promise<{ success: boolean; message: string }>

  // Métodos para Contas Bancárias e Cartões de Crédito
  getContas(): Promise<ContaBancaria[]>
  saveConta(conta: Omit<ContaBancaria, 'id'>): Promise<{ success: boolean; message: string; data?: ContaBancaria }>
  updateConta(id: string, data: Partial<ContaBancaria>): Promise<{ success: boolean; message: string }>
  deleteConta(id: string): Promise<{ success: boolean; message: string }>

  getCartoes(): Promise<CartaoCredito[]>
  saveCartao(cartao: Omit<CartaoCredito, 'id'>): Promise<{ success: boolean; message: string; data?: CartaoCredito }>
  updateCartao(id: string, data: Partial<CartaoCredito>): Promise<{ success: boolean; message: string }>
  deleteCartao(id: string): Promise<{ success: boolean; message: string }>

  // Métodos para Contatos
  getContatos(): Promise<Contato[]>
  saveContato(contato: Omit<Contato, 'id'>): Promise<{ success: boolean; message: string; data?: Contato }>
  updateContato(id: string, data: Partial<Contato>): Promise<{ success: boolean; message: string }>
  deleteContato(id: string): Promise<{ success: boolean; message: string }>

  // Métodos para Centros de Custo
  getCentrosCusto(): Promise<CentroCusto[]>
  saveCentroCusto(centro: Omit<CentroCusto, 'id'>): Promise<{ success: boolean; message: string; data?: CentroCusto }>
  updateCentroCusto(id: string, data: Partial<CentroCusto>): Promise<{ success: boolean; message: string }>
  deleteCentroCusto(id: string): Promise<{ success: boolean; message: string }>
}

class SupabaseServiceImpl implements SupabaseService {
  private readonly TABLE_NAME = 'transactions'
  
  get supabase() {
    return supabase
  }

  async getData(): Promise<SheetData[]> {
    try {
      // Verificar se o Supabase está configurado
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('❌ Supabase não configurado. Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY')
      }
      
      // Verificar autenticação primeiro
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError) {
        console.error('❌ Erro de autenticação:', authError)
        throw new Error(`Erro de autenticação: ${authError.message}`)
      }

      if (!session?.user) {
        throw new Error('❌ Usuário não autenticado. Faça login para acessar os dados.')
      }

      // Usar cache para melhorar performance
      // Obter empresa_id para cache
      const empresaId = getEmpresaIdFromStorage()
      if (!empresaId) {
        throw new Error('Nenhuma empresa selecionada. Selecione uma empresa para continuar.')
      }
      
      // Cache inclui empresa_id para isolamento
      const cacheKey = `transactions:${session.user.id}:${empresaId}`
      const cachedData = cacheService.get<SheetData[]>(cacheKey)
      
      if (cachedData) {
        console.log('✅ Dados carregados do cache:', cachedData.length, 'registros')
        return cachedData
      }
      
      console.log('🔍 Conectando com Supabase...')
      
      // Testar conexão primeiro
      const { data: testData, error: testError } = await supabase
        .from(this.TABLE_NAME)
        .select('count')
        .limit(1)

      if (testError) {
        console.error('❌ Erro na conexão com Supabase:', testError)
        throw new Error(`Erro na conexão: ${testError.message}`)
      }

      // Obter empresa_id atual
      const empresaId = getEmpresaIdFromStorage()
      if (!empresaId) {
        throw new Error('Nenhuma empresa selecionada. Selecione uma empresa para continuar.')
      }

      // RLS (Row Level Security) filtra automaticamente, mas adicionamos filtro explícito por segurança
      // - Transações próprias do usuário
      // - Transações da mesma empresa (se participa da empresa)
      // - Todas as transações se for admin
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('empresa_id', empresaId)
        .order('data', { ascending: true })

      if (error) {
        console.error('❌ Erro ao buscar dados:', error)
        throw new Error(`Erro ao buscar dados: ${error.message}`)
      }

      console.log('✅ Dados carregados com sucesso:', data?.length || 0, 'registros')
      
      // Converter dados do Supabase para o formato SheetData
      const sheetData: SheetData[] = (data || []).map((item: any) => ({
        id: item.id.toString(),
        data: this.formatDateForDisplay(item.data),
        valor: this.parseValue(item.valor), // Converte para negativo se necessário
        descricao: item.descricao,
        conta: item.conta || 'Conta Corrente',
        contaTransferencia: item.conta_transferencia,
        cartao: item.cartao,
        categoria: item.categoria || 'Outros',
        subcategoria: item.subcategoria,
        contato: item.contato,
        centro: item.centro,
        projeto: item.projeto,
        forma: item.forma || 'Dinheiro',
        numeroDocumento: item.numero_documento,
        observacoes: item.observacoes,
        dataCompetencia: this.formatDateForDisplay(item.data_competencia),
        tags: item.tags ? JSON.parse(item.tags) : [],
        status: item.status || this.calculateStatus(item.vencimento, item.data_pagamento), // Usar status do banco primeiro
        dataPagamento: this.formatDateForDisplay(item.data_pagamento) || '',
        vencimento: this.formatDateForDisplay(item.vencimento),
        empresa: item.empresa,
        tipo: item.tipo || 'despesa',
        parcela: item.parcela || '1',
        situacao: item.situacao || ''
      }))

      // Armazenar no cache por 5 minutos
      cacheService.set(cacheKey, sheetData, 5 * 60 * 1000)
      
      return sheetData
    } catch (error: any) {
      console.error('❌ Erro ao carregar dados:', error)
      throw error
    }
  }

  // Método otimizado com paginação
  async getDataPaginated(options: PaginationOptions = {}): Promise<PaginatedResult<SheetData>> {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = 'data',
        sortOrder = 'desc'
      } = options

      // Verificar autenticação
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session?.user) {
        throw new Error('❌ Usuário não autenticado')
      }

      // Obter empresa_id
      const empresaId = getEmpresaIdFromStorage()
      if (!empresaId) {
        throw new Error('Nenhuma empresa selecionada. Selecione uma empresa para continuar.')
      }

      // Usar cache para contagem total (inclui empresa_id)
      const countCacheKey = `transactions_count:${session.user.id}:${empresaId}`
      let totalCount = cacheService.get<number>(countCacheKey)

      if (totalCount === null) {
        // RLS filtra automaticamente, mas adicionamos filtro explícito por segurança
        const { count, error: countError } = await supabase
          .from(this.TABLE_NAME)
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresaId)

        if (countError) {
          console.error('❌ Erro ao contar registros:', countError)
          totalCount = 0
        } else {
          totalCount = count || 0
          cacheService.set(countCacheKey, totalCount, 2 * 60 * 1000) // 2 minutos
        }
      }

      // Calcular offset
      const offset = (page - 1) * limit
      const totalPages = Math.ceil(totalCount / limit)

      // Cache inclui empresa_id para isolamento
      const cacheKey = `transactions_paginated:${session.user.id}:${empresaId}:${page}:${limit}:${sortBy}:${sortOrder}`
      const cachedData = cacheService.get<SheetData[]>(cacheKey)

      if (cachedData) {
        console.log('✅ Dados paginados carregados do cache')
        return {
          data: cachedData,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      }

      // Buscar dados paginados
      // RLS filtra automaticamente, mas adicionamos filtro explícito por segurança
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('empresa_id', empresaId)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('❌ Erro ao buscar dados paginados:', error)
        throw new Error(`Erro ao buscar dados: ${error.message}`)
      }

      // Converter dados
      const sheetData: SheetData[] = (data || []).map((item: any) => ({
        id: item.id.toString(),
        data: this.formatDateForDisplay(item.data),
        valor: this.parseValue(item.valor),
        descricao: item.descricao,
        conta: item.conta || 'Conta Corrente',
        contaTransferencia: item.conta_transferencia,
        cartao: item.cartao,
        categoria: item.categoria || 'Outros',
        subcategoria: item.subcategoria,
        contato: item.contato,
        centro: item.centro,
        projeto: item.projeto,
        forma: item.forma || 'Dinheiro',
        numeroDocumento: item.numero_documento,
        observacoes: item.observacoes,
        dataCompetencia: this.formatDateForDisplay(item.data_competencia),
        tags: item.tags ? JSON.parse(item.tags) : [],
        status: item.status || this.calculateStatus(item.vencimento, item.data_pagamento),
        dataPagamento: this.formatDateForDisplay(item.data_pagamento) || '',
        vencimento: this.formatDateForDisplay(item.vencimento),
        empresa: item.empresa,
        tipo: item.tipo || 'despesa',
        parcela: item.parcela || '1',
        situacao: item.situacao || ''
      }))

      // Armazenar no cache por 3 minutos
      cacheService.set(cacheKey, sheetData, 3 * 60 * 1000)

      console.log(`✅ Dados paginados carregados: página ${page}/${totalPages} (${sheetData.length} registros)`)

      return {
        data: sheetData,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar dados paginados:', error)
      throw error
    }
  }

  // Busca otimizada com filtros
  async searchTransactions(filters: FilterOptions, pagination: PaginationOptions = {}): Promise<PaginatedResult<SheetData>> {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = 'data',
        sortOrder = 'desc'
      } = pagination

      // Verificar autenticação
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session?.user) {
        throw new Error('❌ Usuário não autenticado')
      }

      // Obter empresa_id
      const empresaId = getEmpresaIdFromStorage()
      if (!empresaId) {
        throw new Error('Nenhuma empresa selecionada. Selecione uma empresa para continuar.')
      }

      // Construir query base
      // RLS filtra automaticamente, mas adicionamos filtro explícito por segurança
      let query = supabase
        .from(this.TABLE_NAME)
        .select('*', { count: 'exact' })
        .eq('empresa_id', empresaId)

      // Aplicar filtros
      if (filters.search) {
        query = query.or(`descricao.ilike.%${filters.search}%,observacoes.ilike.%${filters.search}%,numero_documento.ilike.%${filters.search}%`)
      }

      if (filters.tipo) {
        query = query.eq('tipo', filters.tipo)
      }

      if (filters.categoria) {
        query = query.eq('categoria', filters.categoria)
      }

      if (filters.conta) {
        query = query.eq('conta', filters.conta)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.dataInicio) {
        query = query.gte('data', filters.dataInicio)
      }

      if (filters.dataFim) {
        query = query.lte('data', filters.dataFim)
      }

      if (filters.valorMin !== undefined) {
        query = query.gte('valor', filters.valorMin)
      }

      if (filters.valorMax !== undefined) {
        query = query.lte('valor', filters.valorMax)
      }

      // Aplicar ordenação
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Aplicar paginação
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      // Executar query
      const { data, error, count } = await query

      if (error) {
        console.error('❌ Erro na busca de transações:', error)
        throw new Error(`Erro na busca: ${error.message}`)
      }

      // Converter dados
      const sheetData: SheetData[] = (data || []).map((item: any) => ({
        id: item.id.toString(),
        data: this.formatDateForDisplay(item.data),
        valor: this.parseValue(item.valor),
        descricao: item.descricao,
        conta: item.conta || 'Conta Corrente',
        contaTransferencia: item.conta_transferencia,
        cartao: item.cartao,
        categoria: item.categoria || 'Outros',
        subcategoria: item.subcategoria,
        contato: item.contato,
        centro: item.centro,
        projeto: item.projeto,
        forma: item.forma || 'Dinheiro',
        numeroDocumento: item.numero_documento,
        observacoes: item.observacoes,
        dataCompetencia: this.formatDateForDisplay(item.data_competencia),
        tags: item.tags ? JSON.parse(item.tags) : [],
        status: item.status || this.calculateStatus(item.vencimento, item.data_pagamento),
        dataPagamento: this.formatDateForDisplay(item.data_pagamento) || '',
        vencimento: this.formatDateForDisplay(item.vencimento),
        empresa: item.empresa,
        tipo: item.tipo || 'despesa',
        parcela: item.parcela || '1',
        situacao: item.situacao || ''
      }))

      const totalCount = count || 0
      const totalPages = Math.ceil(totalCount / limit)

      console.log(`✅ Busca concluída: ${sheetData.length} resultados de ${totalCount} total`)

      return {
        data: sheetData,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    } catch (error: any) {
      console.error('❌ Erro na busca de transações:', error)
      throw error
    }
  }

  async saveTransaction(transaction: NewTransaction, ignoreSimilarCheck: boolean = false): Promise<{ success: boolean; message: string; data?: SheetData }> {
    try {
      console.log('💾 Salvando transação no Supabase...')
      console.log('📋 Dados recebidos:', transaction)
      
      // Verificar autenticação
      console.log('🔐 Verificando autenticação...')
      const user = await ensureAuthenticated()
      console.log('✅ Autenticação verificada')
      
      // Validação robusta de campos obrigatórios
      const validationErrors = this.validateTransaction(transaction)
      if (validationErrors.length > 0) {
        throw new Error(`Dados inválidos: ${validationErrors.join(', ')}`)
      }
      console.log('✅ Validação de campos concluída')

      // Verificar se já existe transação similar (apenas se não estiver ignorando)
      if (!ignoreSimilarCheck) {
        console.log('🔍 Verificando transação similar...')
        const transacaoSimilar = await this.checkSimilarTransaction(transaction)
        if (transacaoSimilar) {
          console.log('⚠️ Transação similar encontrada:', transacaoSimilar)
          return {
            success: false,
            message: `Já existe uma transação similar: ${transacaoSimilar.descricao} - ${formatarMoeda(transacaoSimilar.valor)} em ${transacaoSimilar.data}. Deseja cadastrar mesmo assim?`,
            data: transacaoSimilar
          }
        }
        console.log('✅ Nenhuma transação similar encontrada')
      } else {
        console.log('⚠️ Ignorando verificação de transação similar')
      }
      
      // Obter empresa_id
      const empresaId = getEmpresaIdFromStorage()
      if (!empresaId) {
        throw new Error('Nenhuma empresa selecionada. Selecione uma empresa para continuar.')
      }

      // Criar transação principal com user_id e empresa_id
      console.log('👤 Adicionando user_id e empresa_id aos dados...')
      const transactionData = await addUserIdToData({
        data: transaction.data, // Manter formato original (DD/MM/AAAA)
        valor: transaction.valor, // Mantém negativo para despesas
        descricao: transaction.descricao,
        conta: transaction.conta,
        conta_transferencia: transaction.contaTransferencia,
        cartao: transaction.cartao,
        categoria: transaction.categoria,
        subcategoria: transaction.subcategoria,
        contato: transaction.contato,
        centro: transaction.centro,
        projeto: transaction.projeto,
        forma: transaction.forma,
        numero_documento: transaction.numeroDocumento,
        observacoes: transaction.observacoes,
        data_competencia: transaction.dataCompetencia || null,
        tags: transaction.tags ? JSON.stringify(transaction.tags) : null,
        tipo: transaction.tipo,
        vencimento: transaction.vencimento || transaction.data, // Manter formato original (DD/MM/AAAA)
        situacao: '',
        data_pagamento: null,
        empresa_id: empresaId, // Adicionar empresa_id
        created_at: new Date().toISOString()
      })
      console.log('✅ User_id adicionado, dados preparados:', transactionData)

      // Se for transferência, criar duas transações (débito e crédito)
      if (transaction.tipo === 'transferencia' && transaction.contaTransferencia) {
        console.log('🔄 Processando transferência...')
        // Transação de débito (saída da conta origem)
        const debitTransaction = {
          ...transactionData,
          valor: -Math.abs(transaction.valor), // Garante que seja negativo
          descricao: `Transferência: ${transaction.descricao} → ${transaction.contaTransferencia}`,
          conta: transaction.conta,
          tipo: 'transferencia'
        }

        // Transação de crédito (entrada na conta destino)
        const creditTransaction = {
          ...transactionData,
          valor: Math.abs(transaction.valor), // Garante que seja positivo
          descricao: `Transferência: ${transaction.descricao} ← ${transaction.conta}`,
          conta: transaction.contaTransferencia,
          tipo: 'transferencia'
        }

        // Salvar ambas as transações
        console.log('🔄 Salvando transação de débito:', debitTransaction)
        console.log('🔄 Salvando transação de crédito:', creditTransaction)
        
        const { data: transferData, error: transferError } = await supabase
          .from(this.TABLE_NAME)
          .insert([debitTransaction, creditTransaction])
          .select()

        if (transferError) {
          console.error('❌ Erro ao salvar transferência:', transferError)
          throw new Error(`Erro ao salvar transferência: ${transferError.message}`)
        }

        console.log('✅ Transferência salva com sucesso!')
        console.log('📊 Dados retornados:', transferData)
        
        const savedData = transferData?.[0]
        console.log('📋 Dados salvos (primeira transação):', savedData)
        
        const sheetData: SheetData | undefined = savedData ? {
          id: String(savedData.id),
          data: this.formatDateForDisplay(String(savedData.data)),
          valor: this.parseValue(Number(savedData.valor)),
          descricao: String(savedData.descricao),
          conta: String(savedData.conta),
          contaTransferencia: savedData.conta_transferencia ? String(savedData.conta_transferencia) : undefined,
          cartao: savedData.cartao ? String(savedData.cartao) : undefined,
          categoria: String(savedData.categoria),
          subcategoria: savedData.subcategoria ? String(savedData.subcategoria) : undefined,
          contato: savedData.contato ? String(savedData.contato) : undefined,
          centro: savedData.centro ? String(savedData.centro) : undefined,
          projeto: savedData.projeto ? String(savedData.projeto) : undefined,
          forma: String(savedData.forma),
          numeroDocumento: savedData.numero_documento ? String(savedData.numero_documento) : undefined,
          observacoes: savedData.observacoes ? String(savedData.observacoes) : undefined,
          dataCompetencia: savedData.data_competencia ? this.formatDateForDisplay(String(savedData.data_competencia)) : undefined,
          tags: savedData.tags ? JSON.parse(String(savedData.tags)) : undefined,
          tipo: String(savedData.tipo) as 'receita' | 'despesa' | 'transferencia' | 'investimento',
          vencimento: this.formatDateForDisplay(String(savedData.vencimento)),
          status: savedData.status ? String(savedData.status) as 'pago' | 'pendente' | 'vencido' : this.calculateStatus(String(savedData.vencimento), savedData.data_pagamento ? String(savedData.data_pagamento) : undefined),
          dataPagamento: savedData.data_pagamento ? this.formatDateForDisplay(String(savedData.data_pagamento)) : undefined,
          empresa: savedData.empresa ? String(savedData.empresa) : undefined,
          parcela: savedData.parcela ? String(savedData.parcela) : undefined,
          situacao: savedData.situacao ? String(savedData.situacao) : undefined
        } : undefined

        return {
          success: true,
          message: 'Transferência realizada com sucesso!',
          data: sheetData
        }
      }

      console.log('💾 Inserindo transação no banco...')
      
      // Tentar salvar com retry automático
      const { data, error } = await this.retryOperation(async () => {
        return await supabase
          .from(this.TABLE_NAME)
          .insert([transactionData])
          .select()
      }, 3)

      if (error) {
        console.error('❌ Erro ao salvar transação:', error)
        throw new Error(`Erro ao salvar transação: ${error.message}`)
      }
      console.log('✅ Transação inserida no banco com sucesso!')
      console.log('📊 Dados retornados do banco:', data)

      // Se há múltiplas parcelas, criar transações adicionais
      if (transaction.parcelas && transaction.parcelas > 1) {
        const parcelTransactions = []
        
        for (let i = 2; i <= transaction.parcelas; i++) {
          const nextDate = this.calculateNextDate(transaction.data, i - 1)
          parcelTransactions.push({
            ...transactionData,
            data: nextDate,
            vencimento: nextDate,
            parcela: `${i}/${transaction.parcelas}`,
            created_at: new Date().toISOString()
          })
        }

        if (parcelTransactions.length > 0) {
          const { error: parcelError } = await supabase
            .from(this.TABLE_NAME)
            .insert(parcelTransactions)

          if (parcelError) {
            console.error('❌ Erro ao salvar parcelas:', parcelError)
            throw new Error(`Erro ao salvar parcelas: ${parcelError.message}`)
          }
        }
      }

      console.log('✅ Transação salva com sucesso!')
      
      const savedData = data?.[0]
      
      // Registrar log de auditoria
      try {
        await logService.logManualActivity(
          'create',
          'transactions',
          savedData?.id || 'unknown',
          `Transação criada: ${transaction.descricao} - ${formatarMoeda(transaction.valor)}`,
          null,
          transaction,
          { 
            tipo: transaction.tipo,
            parcelas: transaction.parcelas,
            conta: transaction.conta
          }
        )
      } catch (logError) {
        console.warn('⚠️ Erro ao registrar log de auditoria:', logError)
      }

      // Invalidar cache de transações
      cacheService.invalidateTable('transactions')
      const sheetData: SheetData | undefined = savedData ? {
        id: String(savedData.id),
        data: this.formatDateForDisplay(String(savedData.data)),
        valor: this.parseValue(Number(savedData.valor)),
        descricao: String(savedData.descricao),
        conta: String(savedData.conta),
        contaTransferencia: savedData.conta_transferencia ? String(savedData.conta_transferencia) : undefined,
        cartao: savedData.cartao ? String(savedData.cartao) : undefined,
        categoria: String(savedData.categoria),
        subcategoria: savedData.subcategoria ? String(savedData.subcategoria) : undefined,
        contato: savedData.contato ? String(savedData.contato) : undefined,
        centro: savedData.centro ? String(savedData.centro) : undefined,
        projeto: savedData.projeto ? String(savedData.projeto) : undefined,
        forma: String(savedData.forma),
        numeroDocumento: savedData.numero_documento ? String(savedData.numero_documento) : undefined,
        observacoes: savedData.observacoes ? String(savedData.observacoes) : undefined,
        dataCompetencia: this.formatDateForDisplay(String(savedData.data_competencia)),
        tags: savedData.tags ? JSON.parse(String(savedData.tags)) : [],
        status: savedData.status ? String(savedData.status) as 'pago' | 'pendente' | 'vencido' : this.calculateStatus(String(savedData.vencimento), savedData.data_pagamento ? String(savedData.data_pagamento) : undefined),
        dataPagamento: savedData.data_pagamento ? String(savedData.data_pagamento) : '',
        vencimento: this.formatDateForDisplay(String(savedData.vencimento)),
        empresa: savedData.empresa ? String(savedData.empresa) : undefined,
        tipo: String(savedData.tipo) as 'receita' | 'despesa' | 'transferencia' | 'investimento',
        parcela: savedData.parcela ? String(savedData.parcela) : '1',
        situacao: savedData.situacao ? String(savedData.situacao) : ''
      } : undefined

      return {
        success: true,
        message: `Transação salva com sucesso! ${transaction.parcelas && transaction.parcelas > 1 ? `(${transaction.parcelas} parcelas criadas)` : ''}`,
        data: sheetData
      }
    } catch (error: any) {
      console.error('❌ Erro ao salvar transação:', error)
      return {
        success: false,
        message: error.message || 'Erro ao salvar transação. Tente novamente.'
      }
    }
  }

  async updateTransaction(id: string, data: Partial<SheetData>): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 Atualizando transação...')
      
      const updateData: any = {}
      
      if (data.data) updateData.data = data.data
      if (data.valor !== undefined) updateData.valor = data.valor
      if (data.descricao) updateData.descricao = data.descricao
      if (data.conta) updateData.conta = data.conta
      if (data.contaTransferencia !== undefined) updateData.conta_transferencia = data.contaTransferencia
      if (data.cartao !== undefined) updateData.cartao = data.cartao
      if (data.categoria) updateData.categoria = data.categoria
      if (data.subcategoria !== undefined) updateData.subcategoria = data.subcategoria
      if (data.contato !== undefined) updateData.contato = data.contato
      if (data.centro !== undefined) updateData.centro = data.centro
      if (data.projeto !== undefined) updateData.projeto = data.projeto
      if (data.forma) updateData.forma = data.forma
      if (data.numeroDocumento !== undefined) updateData.numero_documento = data.numeroDocumento
      if (data.observacoes !== undefined) updateData.observacoes = data.observacoes
      if (data.dataCompetencia !== undefined) updateData.data_competencia = data.dataCompetencia || null
      if (data.tags !== undefined) updateData.tags = data.tags ? JSON.stringify(data.tags) : null
      if (data.tipo) updateData.tipo = data.tipo
      if (data.vencimento) updateData.vencimento = data.vencimento
      if (data.status !== undefined) updateData.status = data.status
      if (data.situacao !== undefined) updateData.situacao = data.situacao
      if (data.dataPagamento !== undefined) updateData.data_pagamento = data.dataPagamento || null
      
      updateData.updated_at = new Date().toISOString()

      const { error } = await supabase
        .from(this.TABLE_NAME)
        .update(updateData)
        .eq('id', id)

      if (error) {
        console.error('❌ Erro ao atualizar transação:', error)
        throw new Error(`Erro ao atualizar transação: ${error.message}`)
      }

      console.log('✅ Transação atualizada com sucesso!')
      
      // Registrar log de auditoria
      try {
        await logService.logManualActivity(
          'update',
          'transactions',
          id,
          `Transação atualizada: ${data.descricao || 'ID ' + id}`,
          null, // oldValues seria obtido antes da atualização
          data,
          { 
            campos_alterados: Object.keys(data),
            timestamp: new Date().toISOString()
          }
        )
      } catch (logError) {
        console.warn('⚠️ Erro ao registrar log de auditoria:', logError)
      }

      // Invalidar cache de transações
      cacheService.invalidateTable('transactions')
      
      return {
        success: true,
        message: 'Transação atualizada com sucesso!'
      }
    } catch (error: any) {
      console.error('❌ Erro ao atualizar transação:', error)
      return {
        success: false,
        message: error.message || 'Erro ao atualizar transação. Tente novamente.'
      }
    }
  }

  async deleteTransaction(id: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🗑️ Excluindo transação...')
      
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', id)

      if (error) {
        console.error('❌ Erro ao excluir transação:', error)
        throw new Error(`Erro ao excluir transação: ${error.message}`)
      }

      console.log('✅ Transação excluída com sucesso!')
      
      // Registrar log de auditoria
      try {
        await logService.logManualActivity(
          'delete',
          'transactions',
          id,
          `Transação excluída: ID ${id}`,
          null, // oldValues seria obtido antes da exclusão
          null,
          { 
            timestamp: new Date().toISOString(),
            acao: 'exclusao_permanente'
          }
        )
      } catch (logError) {
        console.warn('⚠️ Erro ao registrar log de auditoria:', logError)
      }

      // Invalidar cache de transações
      cacheService.invalidateTable('transactions')
      
      return {
        success: true,
        message: 'Transação excluída com sucesso!'
      }
    } catch (error: any) {
      console.error('❌ Erro ao excluir transação:', error)
      return {
        success: false,
        message: error.message || 'Erro ao excluir transação. Tente novamente.'
      }
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Verificar se o Supabase está configurado
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return {
          success: false,
          message: '❌ Supabase não configurado. Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY',
          data: { 
            mode: 'error',
            error: 'missing_config'
          }
        }
      }
      
      console.log('🔍 Testando conexão com Supabase...')
      
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('count')
        .limit(1)

      if (error) {
        console.error('❌ Erro na conexão:', error)
        return {
          success: false,
          message: `Erro na conexão: ${error.message}`
        }
      }

      console.log('✅ Conexão com Supabase estabelecida com sucesso!')
      return {
        success: true,
        message: 'Conexão com Supabase estabelecida com sucesso!',
        data: { connected: true, table: this.TABLE_NAME }
      }
    } catch (error: any) {
      console.error('❌ Erro ao testar conexão:', error)
      return {
        success: false,
        message: error.message || 'Erro ao testar conexão com Supabase'
      }
    }
  }

  // Métodos auxiliares
  private parseValue(value: any): number {
    if (typeof value === 'string') {
      return parsearValorBrasileiro(value)
    }
    return parseFloat(value) || 0
  }

  // Validação robusta de transação
  private validateTransaction(transaction: NewTransaction): string[] {
    const errors: string[] = []

    // Validar campos obrigatórios
    if (!transaction.descricao || transaction.descricao.trim().length === 0) {
      errors.push('Descrição é obrigatória')
    }

    if (!transaction.valor || isNaN(Number(transaction.valor))) {
      errors.push('Valor deve ser um número válido')
    }

    if (!transaction.data || transaction.data.trim().length === 0) {
      errors.push('Data é obrigatória')
    }

    // Validar formato da data
    if (transaction.data && !this.isValidDate(transaction.data)) {
      errors.push('Data deve estar no formato DD/MM/AAAA')
    }

    // Validar valor mínimo
    if (transaction.valor && Math.abs(Number(transaction.valor)) < 0.01) {
      errors.push('Valor deve ser maior que R$ 0,01')
    }

    // Validar descrição (mínimo 3 caracteres)
    if (transaction.descricao && transaction.descricao.trim().length < 3) {
      errors.push('Descrição deve ter pelo menos 3 caracteres')
    }

    // Validar parcelas
    if (transaction.parcelas && (transaction.parcelas < 1 || transaction.parcelas > 999)) {
      errors.push('Número de parcelas deve estar entre 1 e 999')
    }

    return errors
  }

  // Validar formato de data brasileira
  private isValidDate(dateString: string): boolean {
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/
    const match = dateString.match(dateRegex)
    
    if (!match) return false
    
    const [, day, month, year] = match
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    
    return date.getDate() === parseInt(day) && 
           date.getMonth() === parseInt(month) - 1 && 
           date.getFullYear() === parseInt(year)
  }

  // Retry automático para operações que podem falhar
  private async retryOperation<T>(
    operation: () => Promise<T>, 
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentativa ${attempt}/${maxRetries}...`)
        const result = await operation()
        console.log(`✅ Operação bem-sucedida na tentativa ${attempt}`)
        return result
      } catch (error) {
        lastError = error
        console.warn(`⚠️ Tentativa ${attempt} falhou:`, error)
        
        if (attempt < maxRetries) {
          console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          delay *= 2 // Exponential backoff
        }
      }
    }
    
    console.error(`❌ Todas as ${maxRetries} tentativas falharam`)
    throw lastError
  }

  private calculateStatus(vencimento: string, dataPagamento?: string | null): 'pago' | 'pendente' | 'vencido' {
    if (dataPagamento) return 'pago'
    
    const hoje = new Date()
    let dataVencimento: Date | null
    
    // Se a data está no formato ISO (YYYY-MM-DD), converte para Date
    if (vencimento.includes('-')) {
      dataVencimento = new Date(vencimento)
    } else {
      dataVencimento = parsearDataBrasileira(vencimento)
    }
    
    if (!dataVencimento || isNaN(dataVencimento.getTime())) return 'pendente'
    
    if (dataVencimento < hoje) return 'vencido'
    return 'pendente'
  }

  private calculateNextDate(dataInicial: string, mesesAdicionais: number): string {
    // Se a data está no formato ISO (YYYY-MM-DD), converte para Date
    let data: Date | null
    if (dataInicial.includes('-')) {
      data = new Date(dataInicial)
    } else {
      data = parsearDataBrasileira(dataInicial)
    }
    
    if (!data || isNaN(data.getTime())) return dataInicial
    
    data.setMonth(data.getMonth() + mesesAdicionais)
    return data.toISOString().split('T')[0] // Retorna YYYY-MM-DD
  }

  private formatDateForDisplay(dateValue: any): string {
    if (!dateValue) return ''
    
    // Se já é uma string, retorna como está (assumindo formato DD/MM/AAAA)
    if (typeof dateValue === 'string') {
      return dateValue
    }
    
    // Se é uma data ISO ou Date object, converte para DD/MM/AAAA
    try {
      const date = new Date(dateValue)
      if (isNaN(date.getTime())) return ''
      
      return formatarData(date)
    } catch (error) {
      return ''
    }
  }

  private convertToISODate(dateStr: string): string {
    if (!dateStr) return ''
    
    // Retorna a data como está, pois o banco espera DD/MM/AAAA
    return dateStr
  }

  private async checkSimilarTransaction(transaction: NewTransaction): Promise<SheetData | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('descricao', transaction.descricao)
        .eq('valor', transaction.valor)
        .eq('data', transaction.data) // Manter formato original
        .limit(1)

      if (error || !data || data.length === 0) {
        return null
      }

      const item = data[0]
      return {
        id: String(item.id),
        data: this.formatDateForDisplay(String(item.data)),
        valor: this.parseValue(Number(item.valor)),
        descricao: String(item.descricao),
        conta: String(item.conta),
        categoria: String(item.categoria),
        forma: String(item.forma),
        tipo: String(item.tipo) as 'receita' | 'despesa' | 'transferencia' | 'investimento',
        status: item.status ? String(item.status) as 'pago' | 'pendente' | 'vencido' : this.calculateStatus(String(item.vencimento), item.data_pagamento ? String(item.data_pagamento) : undefined),
        vencimento: this.formatDateForDisplay(String(item.vencimento)),
        dataPagamento: item.data_pagamento ? this.formatDateForDisplay(String(item.data_pagamento)) : '',
        parcela: item.parcela ? String(item.parcela) : '1',
        situacao: item.situacao ? String(item.situacao) : ''
      }
    } catch (error) {
      return null
    }
  }

  // Métodos para Categorias
  async getCategorias(): Promise<Categoria[]> {
    try {
      // Verificar se o Supabase está configurado
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('❌ Supabase não configurado. Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY')
      }
      
      // Obter empresa_id
      const empresaId = getEmpresaIdFromStorage()
      if (!empresaId) {
        throw new Error('Nenhuma empresa selecionada. Selecione uma empresa para continuar.')
      }
      
      console.log('🔍 Buscando categorias no Supabase...')
      
      // Buscar categorias da empresa (incluindo inativas para debug)
      let query = supabase
        .from('categorias')
        .select('*')
        .eq('empresa_id', empresaId)
      
      // Se a coluna 'ativo' existir, filtrar por ela, senão trazer todas
      const { data, error } = await query
        .eq('ativo', true)
        .order('nome')

      if (error) {
        console.error('❌ Erro ao buscar categorias:', error)
        throw new Error(`Erro ao buscar categorias: ${error.message}`)
      }

             console.log('✅ Categorias carregadas:', data?.length || 0, 'registros')
       
       // Converter dados unknown para Categoria[]
       const categoriasMapeadas: Categoria[] = (data || []).map(item => ({
         id: String(item.id),
         nome: String(item.nome),
         tipo: String(item.tipo) as 'receita' | 'despesa',
         cor: String(item.cor),
         ativo: Boolean(item.ativo)
       }))
       
       return categoriasMapeadas
    } catch (error) {
      console.error('❌ Erro ao buscar categorias:', error)
      throw error
    }
  }

  async saveCategoria(categoria: Omit<Categoria, 'id'>): Promise<{ success: boolean; message: string; data?: Categoria }> {
    try {
      // Obter empresa_id
      const empresaId = getEmpresaIdFromStorage()
      if (!empresaId) {
        return { success: false, message: 'Nenhuma empresa selecionada. Selecione uma empresa para continuar.' }
      }

      console.log('💾 Salvando categoria no Supabase...')
      
      const { data, error } = await supabase
        .from('categorias')
        .insert([{ ...categoria, empresa_id: empresaId }])
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao salvar categoria:', error)
        return {
          success: false,
          message: 'Erro ao salvar categoria: ' + error.message
        }
      }

             console.log('✅ Categoria salva com sucesso')
       
       // Converter dados unknown para Categoria
       const categoriaMapeada: Categoria = {
         id: String(data.id),
         nome: String(data.nome),
         tipo: String(data.tipo) as 'receita' | 'despesa',
         cor: String(data.cor),
         ativo: Boolean(data.ativo)
       }
       
       return {
         success: true,
         message: 'Categoria salva com sucesso!',
         data: categoriaMapeada
       }
    } catch (error: any) {
      console.error('❌ Erro ao salvar categoria:', error)
      return {
        success: false,
        message: 'Erro ao salvar categoria: ' + error.message
      }
    }
  }

  async updateCategoria(id: string, data: Partial<Categoria>): Promise<{ success: boolean; message: string }> {
    try {
      // Obter empresa_id para validação
      const empresaId = getEmpresaIdFromStorage()
      if (!empresaId) {
        return { success: false, message: 'Nenhuma empresa selecionada. Selecione uma empresa para continuar.' }
      }

      // Validar que a categoria pertence à empresa
      const { data: categoria, error: checkError } = await supabase
        .from('categorias')
        .select('empresa_id')
        .eq('id', id)
        .single()

      if (checkError || !categoria || categoria.empresa_id !== empresaId) {
        return { success: false, message: 'Categoria não encontrada ou sem acesso.' }
      }

      const { error } = await supabase
        .from('categorias')
        .update(data)
        .eq('id', id)
        .eq('empresa_id', empresaId)

      if (error) {
        return {
          success: false,
          message: 'Erro ao atualizar categoria: ' + error.message
        }
      }

      return {
        success: true,
        message: 'Categoria atualizada com sucesso!'
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao atualizar categoria: ' + error.message
      }
    }
  }

  async deleteCategoria(id: string): Promise<{ success: boolean; message: string }> {
    try {
      // Obter empresa_id para validação
      const empresaId = getEmpresaIdFromStorage()
      if (!empresaId) {
        return { success: false, message: 'Nenhuma empresa selecionada. Selecione uma empresa para continuar.' }
      }

      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id)
        .eq('empresa_id', empresaId)

      if (error) {
        return {
          success: false,
          message: 'Erro ao deletar categoria: ' + error.message
        }
      }

      return {
        success: true,
        message: 'Categoria deletada com sucesso!'
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao deletar categoria: ' + error.message
      }
    }
  }

  // Métodos para Subcategorias
  async getSubcategorias(): Promise<Subcategoria[]> {
    try {
      // Se o Supabase não estiver configurado, retornar erro
      if (SUPABASE_URL === 'https://your-project.supabase.co' || SUPABASE_ANON_KEY === 'your-anon-key') {
        console.error('❌ Supabase não configurado')
        throw new Error('Supabase não configurado. Configure as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.')
      }
      
      // Obter empresa_id
      const empresaId = getEmpresaIdFromStorage()
      if (!empresaId) {
        throw new Error('Nenhuma empresa selecionada. Selecione uma empresa para continuar.')
      }
      
      console.log('🔍 Buscando subcategorias no Supabase...')
      
      const { data, error } = await supabase
        .from('subcategorias')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .order('nome')

      if (error) {
        console.error('❌ Erro ao buscar subcategorias:', error)
        throw new Error(`Erro ao buscar subcategorias: ${error.message}`)
      }

      console.log('✅ Subcategorias carregadas:', data?.length || 0, 'registros')
      
             // Mapear categoria_id para categoriaId (formato TypeScript)
       const mappedData: Subcategoria[] = (data || []).map(item => ({
         id: String(item.id),
         nome: String(item.nome),
         categoriaId: String(item.categoria_id),
         ativo: Boolean(item.ativo)
       }))
      
      return mappedData
    } catch (error) {
      console.error('❌ Erro ao buscar subcategorias:', error)
      throw error
    }
  }

  async saveSubcategoria(subcategoria: Omit<Subcategoria, 'id'>): Promise<{ success: boolean; message: string; data?: Subcategoria }> {
    try {
      // Obter empresa_id
      const empresaId = getEmpresaIdFromStorage()
      if (!empresaId) {
        return { success: false, message: 'Nenhuma empresa selecionada. Selecione uma empresa para continuar.' }
      }

      console.log('💾 Salvando subcategoria no Supabase...')
      
      // Mapear categoriaId para categoria_id (schema do banco)
      const subcategoriaData = {
        nome: subcategoria.nome,
        categoria_id: subcategoria.categoriaId,
        empresa_id: empresaId,
        ativo: subcategoria.ativo
      }
      
      const { data, error } = await supabase
        .from('subcategorias')
        .insert([subcategoriaData])
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao salvar subcategoria:', error)
        return {
          success: false,
          message: 'Erro ao salvar subcategoria: ' + error.message
        }
      }

      console.log('✅ Subcategoria salva com sucesso')
      
             // Mapear de volta para o formato TypeScript
       const mappedData: Subcategoria = {
         id: String(data.id),
         nome: String(data.nome),
         categoriaId: String(data.categoria_id),
         ativo: Boolean(data.ativo)
       }
      
      return {
        success: true,
        message: 'Subcategoria salva com sucesso!',
        data: mappedData
      }
    } catch (error: any) {
      console.error('❌ Erro ao salvar subcategoria:', error)
      return {
        success: false,
        message: 'Erro ao salvar subcategoria: ' + error.message
      }
    }
  }

  async updateSubcategoria(id: string, data: Partial<Subcategoria>): Promise<{ success: boolean; message: string }> {
    try {
      // Mapear categoriaId para categoria_id se presente
      const updateData: any = {}
      if (data.nome !== undefined) updateData.nome = data.nome
      if (data.categoriaId !== undefined) updateData.categoria_id = data.categoriaId
      if (data.ativo !== undefined) updateData.ativo = data.ativo
      
      const { error } = await supabase
        .from('subcategorias')
        .update(updateData)
        .eq('id', id)

      if (error) {
        return {
          success: false,
          message: 'Erro ao atualizar subcategoria: ' + error.message
        }
      }

      return {
        success: true,
        message: 'Subcategoria atualizada com sucesso!'
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao atualizar subcategoria: ' + error.message
      }
    }
  }

  async deleteSubcategoria(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('subcategorias')
        .delete()
        .eq('id', id)

      if (error) {
        return {
          success: false,
          message: 'Erro ao deletar subcategoria: ' + error.message
        }
      }

      return {
        success: true,
        message: 'Subcategoria deletada com sucesso!'
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao deletar subcategoria: ' + error.message
      }
    }
  }

  // Métodos para Investimentos
  async getInvestimentos(): Promise<Investimento[]> {
    try {
      // Se o Supabase não estiver configurado, retornar erro
      if (SUPABASE_URL === 'https://your-project.supabase.co' || SUPABASE_ANON_KEY === 'your-anon-key') {
        console.error('❌ Supabase não configurado')
        throw new Error('Supabase não configurado. Configure as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.')
      }
      
      // Obter empresa_id
      const empresaId = getEmpresaIdFromStorage()
      if (!empresaId) {
        throw new Error('Nenhuma empresa selecionada. Selecione uma empresa para continuar.')
      }
      
      console.log('🔍 Buscando investimentos no Supabase...')
      
      const { data, error } = await supabase
        .from('investimentos')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .order('nome')

      if (error) {
        console.error('❌ Erro ao buscar investimentos:', error)
        throw new Error(`Erro ao buscar investimentos: ${error.message}`)
      }

             console.log('✅ Investimentos carregados:', data?.length || 0, 'registros')
       
       // Converter dados unknown para Investimento[]
       const investimentosMapeados: Investimento[] = (data || []).map(item => ({
         id: String(item.id),
         nome: String(item.nome),
         tipo: String(item.tipo) as 'acao' | 'fiis' | 'etfs' | 'cdb' | 'lci' | 'lca' | 'poupanca' | 'outros',
         valor: Number(item.valor),
         quantidade: Number(item.quantidade),
         precoMedio: Number(item.preco_medio),
         dataCompra: String(item.data_compra),
         instituicao: String(item.instituicao),
         observacoes: String(item.observacoes || ''),
         ativo: Boolean(item.ativo),
         dataCriacao: String(item.data_criacao)
       }))
       
       return investimentosMapeados
    } catch (error) {
      console.error('❌ Erro ao buscar investimentos:', error)
      throw error
    }
  }

  async saveInvestimento(investimento: Omit<Investimento, 'id'>): Promise<{ success: boolean; message: string; data?: Investimento }> {
    try {
      // Obter empresa_id
      const empresaId = getEmpresaIdFromStorage()
      if (!empresaId) {
        return { success: false, message: 'Nenhuma empresa selecionada. Selecione uma empresa para continuar.' }
      }

      console.log('💾 Salvando investimento no Supabase...')
      
      const { data, error } = await supabase
        .from('investimentos')
        .insert([{ ...investimento, empresa_id: empresaId }])
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao salvar investimento:', error)
        return {
          success: false,
          message: 'Erro ao salvar investimento: ' + error.message
        }
      }

             console.log('✅ Investimento salvo com sucesso')
       
       // Converter dados unknown para Investimento
       const investimentoMapeado: Investimento = {
         id: String(data.id),
         nome: String(data.nome),
         tipo: String(data.tipo) as 'acao' | 'fiis' | 'etfs' | 'cdb' | 'lci' | 'lca' | 'poupanca' | 'outros',
         valor: Number(data.valor),
         quantidade: Number(data.quantidade),
         precoMedio: Number(data.preco_medio),
         dataCompra: String(data.data_compra),
         instituicao: String(data.instituicao),
         observacoes: String(data.observacoes || ''),
         ativo: Boolean(data.ativo),
         dataCriacao: String(data.data_criacao)
       }
       
       return {
         success: true,
         message: 'Investimento salvo com sucesso!',
         data: investimentoMapeado
       }
    } catch (error: any) {
      console.error('❌ Erro ao salvar investimento:', error)
      return {
        success: false,
        message: 'Erro ao salvar investimento: ' + error.message
      }
    }
  }

  async updateInvestimento(id: string, data: Partial<Investimento>): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('investimentos')
        .update(data)
        .eq('id', id)

      if (error) {
        return {
          success: false,
          message: 'Erro ao atualizar investimento: ' + error.message
        }
      }

      return {
        success: true,
        message: 'Investimento atualizado com sucesso!'
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao atualizar investimento: ' + error.message
      }
    }
  }

  async deleteInvestimento(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('investimentos')
        .delete()
        .eq('id', id)

      if (error) {
        return {
          success: false,
          message: 'Erro ao deletar investimento: ' + error.message
        }
      }

      return {
        success: true,
        message: 'Investimento deletado com sucesso!'
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao deletar investimento: ' + error.message
      }
    }
  }

  // Métodos para Contas Bancárias
  async getContas(): Promise<ContaBancaria[]> {
    try {
      // Se o Supabase não estiver configurado, retornar erro
      if (SUPABASE_URL === 'https://your-project.supabase.co' || SUPABASE_ANON_KEY === 'your-anon-key') {
        console.error('❌ Supabase não configurado')
        throw new Error('Supabase não configurado. Configure as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.')
      }
      
      console.log('📊 Buscando contas bancárias no Supabase...')
      
      // Primeiro, buscar TODAS as contas para diagnóstico
      const { data: todasContas, error: errorTodas } = await supabase
        .from('contas_bancarias')
        .select('*')
        .order('nome')

      if (errorTodas) {
        console.error('❌ Erro ao buscar todas as contas bancárias:', errorTodas)
        throw new Error(`Erro ao buscar contas bancárias: ${errorTodas.message}`)
      }

      console.log('📊 Total de contas no banco:', todasContas?.length || 0)
      console.log('📊 Contas ativas:', todasContas?.filter(c => c.ativo === true).length || 0)
      console.log('📊 Contas inativas:', todasContas?.filter(c => c.ativo === false).length || 0)
      console.log('📊 Contas sem status (ativo = NULL):', todasContas?.filter(c => c.ativo === null || c.ativo === undefined).length || 0)
      
      // Agora filtrar apenas as ativas
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('*')
        .eq('ativo', true)
        .order('nome')

      if (error) {
        console.error('❌ Erro ao buscar contas bancárias ativas:', error)
        // Se houver erro, tentar buscar todas (sem filtro de ativo)
        console.warn('⚠️ Tentando buscar todas as contas (sem filtro de ativo)...')
        const { data: dataFallback, error: errorFallback } = await supabase
          .from('contas_bancarias')
          .select('*')
          .order('nome')
        
        if (errorFallback) {
          throw new Error(`Erro ao buscar contas bancárias: ${errorFallback.message}`)
        }
        
        console.log('✅ Contas bancárias carregadas (fallback):', dataFallback?.length || 0, 'registros')
        const contasMapeadasFallback: ContaBancaria[] = (dataFallback || []).map(item => ({
          id: String(item.id),
          nome: String(item.nome),
          tipo: String(item.tipo) as 'conta_corrente' | 'poupanca' | 'investimento' | 'cartao_credito' | 'cartao_debito',
          banco: String(item.banco),
          agencia: String(item.agencia),
          conta: String(item.conta),
          saldo: Number(item.saldo),
          limite: Number(item.limite),
          ativo: Boolean(item.ativo ?? true) // Se NULL, considerar como true
        }))
        return contasMapeadasFallback
      }

      console.log('✅ Contas bancárias ativas carregadas:', data?.length || 0, 'registros')
       
       // Converter dados unknown para ContaBancaria[]
       const contasMapeadas: ContaBancaria[] = (data || []).map(item => ({
         id: String(item.id),
         nome: String(item.nome),
         tipo: String(item.tipo) as 'conta_corrente' | 'poupanca' | 'investimento' | 'cartao_credito' | 'cartao_debito',
         banco: String(item.banco),
         agencia: String(item.agencia),
         conta: String(item.conta),
         saldo: Number(item.saldo),
         limite: Number(item.limite),
         ativo: Boolean(item.ativo)
       }))
       
       return contasMapeadas
    } catch (error) {
      console.error('❌ Erro ao buscar contas bancárias:', error)
      throw error
    }
  }

  async saveConta(conta: Omit<ContaBancaria, 'id'>): Promise<{ success: boolean; message: string; data?: ContaBancaria }> {
    try {
      console.log('💾 Salvando conta bancária no Supabase...')
      
      const { data, error } = await supabase
        .from('contas_bancarias')
        .insert([conta])
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao salvar conta bancária:', error)
        return {
          success: false,
          message: 'Erro ao salvar conta bancária: ' + error.message
        }
      }

      console.log('✅ Conta bancária salva com sucesso')
      return {
        success: true,
        message: 'Conta bancária salva com sucesso!',
        data: data as unknown as ContaBancaria
      }
    } catch (error: any) {
      console.error('❌ Erro ao salvar conta bancária:', error)
      return {
        success: false,
        message: 'Erro ao salvar conta bancária: ' + error.message
      }
    }
  }

  async updateConta(id: string, data: Partial<ContaBancaria>): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('contas_bancarias')
        .update(data)
        .eq('id', id)

      if (error) {
        return {
          success: false,
          message: 'Erro ao atualizar conta bancária: ' + error.message
        }
      }

      return {
        success: true,
        message: 'Conta bancária atualizada com sucesso!'
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao atualizar conta bancária: ' + error.message
      }
    }
  }

  async deleteConta(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('contas_bancarias')
        .delete()
        .eq('id', id)

      if (error) {
        return {
          success: false,
          message: 'Erro ao deletar conta bancária: ' + error.message
        }
      }

      return {
        success: true,
        message: 'Conta bancária deletada com sucesso!'
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao deletar conta bancária: ' + error.message
      }
    }
  }

  // Métodos para Cartões de Crédito
  async getCartoes(): Promise<CartaoCredito[]> {
    try {
      // Se o Supabase não estiver configurado, retornar erro
      if (SUPABASE_URL === 'https://your-project.supabase.co' || SUPABASE_ANON_KEY === 'your-anon-key') {
        console.error('❌ Supabase não configurado')
        throw new Error('Supabase não configurado. Configure as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.')
      }
      
      console.log('💳 Buscando cartões de crédito no Supabase...')
      
      const { data, error } = await supabase
        .from('cartoes_credito')
        .select('*')
        .eq('ativo', true)
        .order('nome')

      if (error) {
        console.error('❌ Erro ao buscar cartões de crédito:', error)
        throw new Error(`Erro ao buscar cartões de crédito: ${error.message}`)
      }

      console.log('✅ Cartões de crédito carregados:', data?.length || 0, 'registros')
      return (data as unknown as CartaoCredito[]) || []
    } catch (error) {
      console.error('❌ Erro ao buscar cartões de crédito:', error)
      throw error
    }
  }

  async saveCartao(cartao: Omit<CartaoCredito, 'id'>): Promise<{ success: boolean; message: string; data?: CartaoCredito }> {
    try {
      console.log('💾 Salvando cartão de crédito no Supabase...')
      
      const { data, error } = await supabase
        .from('cartoes_credito')
        .insert([cartao])
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao salvar cartão de crédito:', error)
        return {
          success: false,
          message: 'Erro ao salvar cartão de crédito: ' + error.message
        }
      }

      console.log('✅ Cartão de crédito salvo com sucesso')
      return {
        success: true,
        message: 'Cartão de crédito salvo com sucesso!',
        data: data as unknown as CartaoCredito
      }
    } catch (error: any) {
      console.error('❌ Erro ao salvar cartão de crédito:', error)
      return {
        success: false,
        message: 'Erro ao salvar cartão de crédito: ' + error.message
      }
    }
  }

  async updateCartao(id: string, data: Partial<CartaoCredito>): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('cartoes_credito')
        .update(data)
        .eq('id', id)

      if (error) {
        return {
          success: false,
          message: 'Erro ao atualizar cartão de crédito: ' + error.message
        }
      }

      return {
        success: true,
        message: 'Cartão de crédito atualizado com sucesso!'
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao atualizar cartão de crédito: ' + error.message
      }
    }
  }

  async deleteCartao(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('cartoes_credito')
        .delete()
        .eq('id', id)

      if (error) {
        return {
          success: false,
          message: 'Erro ao deletar cartão de crédito: ' + error.message
        }
      }

      return {
        success: true,
        message: 'Cartão de crédito deletado com sucesso!'
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao deletar cartão de crédito: ' + error.message
      }
    }
  }

  // Métodos para Contatos
  async getContatos(): Promise<Contato[]> {
    try {
      // Se o Supabase não estiver configurado, retornar erro
      if (SUPABASE_URL === 'https://your-project.supabase.co' || SUPABASE_ANON_KEY === 'your-anon-key') {
        console.error('❌ Supabase não configurado')
        throw new Error('Supabase não configurado. Configure as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.')
      }
      
      // Obter empresa_id
      const empresaId = getEmpresaIdFromStorage()
      if (!empresaId) {
        throw new Error('Nenhuma empresa selecionada. Selecione uma empresa para continuar.')
      }
      
      console.log('🔍 Buscando contatos no Supabase...')
      
      const { data, error } = await supabase
        .from('contatos')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .order('nome')

      if (error) {
        console.error('❌ Erro ao buscar contatos:', error)
        throw new Error(`Erro ao buscar contatos: ${error.message}`)
      }

      console.log('✅ Contatos carregados:', data?.length || 0, 'registros')
      
      // Mapear campos snake_case para camelCase
      const contatosMapeados = (data || []).map(item => ({
        id: item.id,
        nome: item.nome,
        tipo: item.tipo,
        email: item.email,
        telefone: item.telefone,
        cpfCnpj: item.cpf_cnpj,
        endereco: item.endereco,
        observacoes: item.observacoes,
        ativo: item.ativo
      }))
      
      return (contatosMapeados as unknown as Contato[]) || []
    } catch (error) {
      console.error('❌ Erro ao buscar contatos:', error)
      throw error
    }
  }

  async saveContato(contato: Omit<Contato, 'id'>): Promise<{ success: boolean; message: string; data?: Contato }> {
    try {
      // Obter empresa_id
      const empresaId = getEmpresaIdFromStorage()
      if (!empresaId) {
        return { success: false, message: 'Nenhuma empresa selecionada. Selecione uma empresa para continuar.' }
      }

      console.log('💾 Salvando contato no Supabase...')
      
      // Mapear campos camelCase para snake_case
      const contatoData = {
        nome: contato.nome,
        tipo: contato.tipo,
        email: contato.email,
        telefone: contato.telefone,
        cpf_cnpj: contato.cpfCnpj,
        endereco: contato.endereco,
        observacoes: contato.observacoes,
        empresa_id: empresaId,
        ativo: contato.ativo
      }
      
      const { data, error } = await supabase
        .from('contatos')
        .insert([contatoData])
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao salvar contato:', error)
        return {
          success: false,
          message: 'Erro ao salvar contato: ' + error.message
        }
      }

      console.log('✅ Contato salvo com sucesso')
      return {
        success: true,
        message: 'Contato salvo com sucesso!',
        data: data as unknown as Contato
      }
    } catch (error: any) {
      console.error('❌ Erro ao salvar contato:', error)
      return {
        success: false,
        message: 'Erro ao salvar contato: ' + error.message
      }
    }
  }

  async updateContato(id: string, data: Partial<Contato>): Promise<{ success: boolean; message: string }> {
    try {
      // Mapear campos camelCase para snake_case
      const updateData: any = {}
      if (data.nome !== undefined) updateData.nome = data.nome
      if (data.tipo !== undefined) updateData.tipo = data.tipo
      if (data.email !== undefined) updateData.email = data.email
      if (data.telefone !== undefined) updateData.telefone = data.telefone
      if (data.cpfCnpj !== undefined) updateData.cpf_cnpj = data.cpfCnpj
      if (data.endereco !== undefined) updateData.endereco = data.endereco
      if (data.observacoes !== undefined) updateData.observacoes = data.observacoes
      if (data.ativo !== undefined) updateData.ativo = data.ativo

      const { error } = await supabase
        .from('contatos')
        .update(updateData)
        .eq('id', id)

      if (error) {
        return {
          success: false,
          message: 'Erro ao atualizar contato: ' + error.message
        }
      }

      return {
        success: true,
        message: 'Contato atualizado com sucesso!'
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao atualizar contato: ' + error.message
      }
    }
  }

  async deleteContato(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('contatos')
        .delete()
        .eq('id', id)

      if (error) {
        return {
          success: false,
          message: 'Erro ao deletar contato: ' + error.message
        }
      }

      return {
        success: true,
        message: 'Contato deletado com sucesso!'
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao deletar contato: ' + error.message
      }
    }
  }

  // Métodos para Centros de Custo
  async getCentrosCusto(): Promise<CentroCusto[]> {
    try {
      // Obter empresa_id
      const empresaId = getEmpresaIdFromStorage()
      if (!empresaId) {
        throw new Error('Nenhuma empresa selecionada. Selecione uma empresa para continuar.')
      }

      console.log('📊 Buscando centros de custo no Supabase...')
      
      const { data, error } = await supabase
        .from('centros_custo')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .order('nome')

      if (error) {
        console.error('❌ Erro ao buscar centros de custo:', error)
        throw new Error(`Erro ao buscar centros de custo: ${error.message}`)
      }

      console.log('✅ Centros de custo carregados:', data?.length || 0, 'registros')
      
      // Converter dados unknown para CentroCusto[]
      const centrosMapeados: CentroCusto[] = (data || []).map(item => ({
        id: String(item.id),
        nome: String(item.nome),
        tipo: String(item.tipo) as 'custo' | 'lucro' | 'ambos',
        descricao: String(item.descricao || ''),
        ativo: Boolean(item.ativo)
      }))
      
      return centrosMapeados
    } catch (error) {
      console.error('❌ Erro ao buscar centros de custo:', error)
      throw error
    }
  }

  async saveCentroCusto(centro: Omit<CentroCusto, 'id'>): Promise<{ success: boolean; message: string; data?: CentroCusto }> {
    try {
      // Obter empresa_id
      const empresaId = getEmpresaIdFromStorage()
      if (!empresaId) {
        return { success: false, message: 'Nenhuma empresa selecionada. Selecione uma empresa para continuar.' }
      }

      console.log('💾 Salvando centro de custo no Supabase...')
      
      // Verificar autenticação
      await ensureAuthenticated()
      
      const { data, error } = await supabase
        .from('centros_custo')
        .insert([{ ...centro, empresa_id: empresaId }])
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao salvar centro de custo:', error)
        return {
          success: false,
          message: 'Erro ao salvar centro de custo: ' + error.message
        }
      }

      console.log('✅ Centro de custo salvo com sucesso')
      return {
        success: true,
        message: 'Centro de custo salvo com sucesso!',
        data: data as unknown as CentroCusto
      }
    } catch (error: any) {
      console.error('❌ Erro ao salvar centro de custo:', error)
      return {
        success: false,
        message: 'Erro ao salvar centro de custo: ' + error.message
      }
    }
  }

  async updateCentroCusto(id: string, data: Partial<CentroCusto>): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('centros_custo')
        .update(data)
        .eq('id', id)

      if (error) {
        return {
          success: false,
          message: 'Erro ao atualizar centro de custo: ' + error.message
        }
      }

      return {
        success: true,
        message: 'Centro de custo atualizado com sucesso!'
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao atualizar centro de custo: ' + error.message
      }
    }
  }

  async deleteCentroCusto(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('centros_custo')
        .delete()
        .eq('id', id)

      if (error) {
        return {
          success: false,
          message: 'Erro ao deletar centro de custo: ' + error.message
        }
      }

      return {
        success: true,
        message: 'Centro de custo deletado com sucesso!'
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao deletar centro de custo: ' + error.message
      }
    }
  }
}

export const supabaseService = new SupabaseServiceImpl() 