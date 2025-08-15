import { createClient } from '@supabase/supabase-js'
import { SheetData, NewTransaction, Categoria, Subcategoria, Investimento, ContaBancaria, CartaoCredito, Contato } from '../types'
import { formatarMoeda, formatarData, parsearDataBrasileira, parsearValorBrasileiro } from '../utils/formatters'

// Configurações do Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Verificar se as credenciais estão configuradas
const isSupabaseConfigured = SUPABASE_URL !== 'https://your-project.supabase.co' && SUPABASE_ANON_KEY !== 'your-anon-key'

// Cliente Supabase - Instância única para evitar múltiplas instâncias
let supabaseInstance: ReturnType<typeof createClient> | null = null

const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        storageKey: 'controle-financeiro-auth'
      }
    })
  }
  return supabaseInstance
}

// Cliente Supabase
const supabase = getSupabaseClient()

// Dados mock para quando não há conexão
const mockData: SheetData[] = [
  {
    id: '1',
    data: '15/01/2024',
    valor: 5000, // Receita (positivo)
    descricao: 'Salário',
    conta: 'Conta Corrente',
    categoria: 'Receitas',
    forma: 'Transferência',
    tipo: 'receita',
    status: 'pago',
    dataPagamento: '15/01/2024',
    vencimento: '15/01/2024',
    empresa: 'Empresa ABC'
  },
  {
    id: '2',
    data: '20/01/2024',
    valor: -1200, // Despesa (negativo)
    descricao: 'Aluguel',
    conta: 'Conta Corrente',
    categoria: 'Moradia',
    forma: 'PIX',
    tipo: 'despesa',
    status: 'pago',
    dataPagamento: '20/01/2024',
    vencimento: '20/01/2024',
    empresa: 'Imobiliária XYZ'
  },
  {
    id: '3',
    data: '25/01/2024',
    valor: -150, // Despesa (negativo)
    descricao: 'Conta de Luz',
    conta: 'Conta Corrente',
    categoria: 'Serviços',
    forma: 'Boleto',
    tipo: 'despesa',
    status: 'pendente',
    vencimento: '25/01/2024',
    empresa: 'Companhia de Energia'
  }
]

// Mock data para categorias
const mockCategorias: Categoria[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    nome: 'Alimentação',
    tipo: 'despesa',
    cor: '#EF4444',
    ativo: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    nome: 'Transporte',
    tipo: 'despesa',
    cor: '#F59E0B',
    ativo: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    nome: 'Moradia',
    tipo: 'despesa',
    cor: '#10B981',
    ativo: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    nome: 'Receitas',
    tipo: 'receita',
    cor: '#3B82F6',
    ativo: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    nome: 'Serviços',
    tipo: 'despesa',
    cor: '#8B5CF6',
    ativo: true
  }
]

// Mock data para subcategorias
const mockSubcategorias: Subcategoria[] = [
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    nome: 'Restaurantes',
    categoriaId: '550e8400-e29b-41d4-a716-446655440001',
    ativo: true
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440002',
    nome: 'Supermercado',
    categoriaId: '550e8400-e29b-41d4-a716-446655440001',
    ativo: true
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440003',
    nome: 'Combustível',
    categoriaId: '550e8400-e29b-41d4-a716-446655440002',
    ativo: true
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440004',
    nome: 'Uber/Táxi',
    categoriaId: '550e8400-e29b-41d4-a716-446655440002',
    ativo: true
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440005',
    nome: 'Aluguel',
    categoriaId: '550e8400-e29b-41d4-a716-446655440003',
    ativo: true
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440006',
    nome: 'Salário',
    categoriaId: '550e8400-e29b-41d4-a716-446655440004',
    ativo: true
  }
]

// Mock data para investimentos
const mockInvestimentos: Investimento[] = [
  {
    id: '770e8400-e29b-41d4-a716-446655440001',
    nome: 'PETR4',
    tipo: 'acao',
    valor: 5000,
    quantidade: 100,
    precoMedio: 50,
    dataCompra: '2024-01-15',
    instituicao: 'XP Investimentos',
    observacoes: 'Petrobras - Ação preferencial',
    ativo: true,
    dataCriacao: '2024-01-15T10:00:00Z'
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440002',
    nome: 'ITUB4',
    tipo: 'acao',
    valor: 3000,
    quantidade: 50,
    precoMedio: 60,
    dataCompra: '2024-02-01',
    instituicao: 'Rico Investimentos',
    observacoes: 'Itaú Unibanco - Ação preferencial',
    ativo: true,
    dataCriacao: '2024-02-01T14:30:00Z'
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440003',
    nome: 'CDB 110% CDI',
    tipo: 'cdb',
    valor: 10000,
    quantidade: 0,
    precoMedio: 0,
    dataCompra: '2024-01-01',
    instituicao: 'Banco Inter',
    observacoes: 'CDB com rendimento de 110% do CDI',
    ativo: true,
    dataCriacao: '2024-01-01T09:00:00Z'
  }
]

// Mock data para contas bancárias
const mockContas: ContaBancaria[] = [
  {
    id: '880e8400-e29b-41d4-a716-446655440001',
    nome: 'Conta Corrente Principal',
    tipo: 'conta_corrente',
    banco: 'Banco do Brasil',
    agencia: '1234',
    conta: '12345-6',
    saldo: 5000,
    limite: 0,
    ativo: true
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440002',
    nome: 'Conta Poupança',
    tipo: 'poupanca',
    banco: 'Itaú',
    agencia: '5678',
    conta: '98765-4',
    saldo: 15000,
    limite: 0,
    ativo: true
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440003',
    nome: 'Carteira',
    tipo: 'investimento',
    banco: '',
    agencia: '',
    conta: '',
    saldo: 500,
    limite: 0,
    ativo: true
  }
]

// Mock data para cartões de crédito
const mockCartoes: CartaoCredito[] = [
  {
    id: '990e8400-e29b-41d4-a716-446655440001',
    nome: 'Cartão Nubank',
    banco: 'Nubank',
    limite: 5000,
    vencimento: 15,
    contaId: '880e8400-e29b-41d4-a716-446655440001',
    ativo: true
  },
  {
    id: '990e8400-e29b-41d4-a716-446655440002',
    nome: 'Cartão Itaú',
    banco: 'Itaú',
    limite: 3000,
    vencimento: 20,
    contaId: '880e8400-e29b-41d4-a716-446655440002',
    ativo: true
  }
]

// Mock data para contatos
const mockContatos: Contato[] = [
  {
    id: 'aa0e8400-e29b-41d4-a716-446655440001',
    nome: 'João Silva',
    tipo: 'cliente',
    email: 'joao.silva@email.com',
    telefone: '(11) 99999-9999',
    cpfCnpj: '123.456.789-00',
    endereco: 'Rua das Flores, 123 - São Paulo/SP',
    observacoes: 'Cliente preferencial',
    ativo: true
  },
  {
    id: 'aa0e8400-e29b-41d4-a716-446655440002',
    nome: 'Empresa ABC Ltda',
    tipo: 'fornecedor',
    email: 'contato@empresaabc.com.br',
    telefone: '(11) 3333-3333',
    cpfCnpj: '12.345.678/0001-90',
    endereco: 'Av. Paulista, 1000 - São Paulo/SP',
    observacoes: 'Fornecedor de materiais',
    ativo: true
  },
  {
    id: 'aa0e8400-e29b-41d4-a716-446655440003',
    nome: 'Maria Santos',
    tipo: 'cliente',
    email: 'maria.santos@email.com',
    telefone: '(11) 88888-8888',
    cpfCnpj: '987.654.321-00',
    endereco: 'Rua do Comércio, 456 - Rio de Janeiro/RJ',
    observacoes: 'Cliente desde 2023',
    ativo: true
  }
]

export interface SupabaseService {
  readonly supabase: any
  getData(): Promise<SheetData[]>
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
}

class SupabaseServiceImpl implements SupabaseService {
  private readonly TABLE_NAME = 'transactions'
  
  get supabase() {
    return supabase
  }

  async getData(): Promise<SheetData[]> {
    try {
      // Se o Supabase não estiver configurado, retornar erro
      if (!isSupabaseConfigured) {
        throw new Error('Supabase não configurado. Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY')
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

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
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

      return sheetData
    } catch (error: any) {
      console.error('❌ Erro ao carregar dados:', error)
      throw error
    }
  }

  async saveTransaction(transaction: NewTransaction): Promise<{ success: boolean; message: string; data?: SheetData }> {
    try {
      console.log('💾 Salvando transação no Supabase...')
      
      // Validar campos obrigatórios
      if (!transaction.descricao || !transaction.valor || !transaction.data) {
        throw new Error('Descrição, valor e data são obrigatórios')
      }

      // Verificar se já existe transação similar
      const transacaoSimilar = await this.checkSimilarTransaction(transaction)
      if (transacaoSimilar) {
        return {
          success: false,
          message: `Já existe uma transação similar: ${transacaoSimilar.descricao} - ${formatarMoeda(transacaoSimilar.valor)} em ${transacaoSimilar.data}. Deseja cadastrar mesmo assim?`
        }
      }
      
      // Criar transação principal
      const transactionData = {
        data: this.convertToISODate(transaction.data),
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
        data_competencia: transaction.dataCompetencia ? this.convertToISODate(transaction.dataCompetencia) : null,
        tags: transaction.tags ? JSON.stringify(transaction.tags) : null,
        tipo: transaction.tipo,
        vencimento: transaction.vencimento ? this.convertToISODate(transaction.vencimento) : this.convertToISODate(transaction.data),
        situacao: '',
        data_pagamento: null,
        created_at: new Date().toISOString()
      }

      // Se for transferência, criar duas transações (débito e crédito)
      if (transaction.tipo === 'transferencia' && transaction.contaTransferencia) {
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

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert([transactionData])
        .select()

      if (error) {
        console.error('❌ Erro ao salvar transação:', error)
        throw new Error(`Erro ao salvar transação: ${error.message}`)
      }

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
      
      if (data.data) updateData.data = this.convertToISODate(data.data)
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
      if (data.dataCompetencia !== undefined) updateData.data_competencia = data.dataCompetencia ? this.convertToISODate(data.dataCompetencia) : null
      if (data.tags !== undefined) updateData.tags = data.tags ? JSON.stringify(data.tags) : null
      if (data.tipo) updateData.tipo = data.tipo
      if (data.vencimento) updateData.vencimento = this.convertToISODate(data.vencimento)
      if (data.situacao !== undefined) updateData.situacao = data.situacao
      if (data.dataPagamento !== undefined) updateData.data_pagamento = data.dataPagamento ? this.convertToISODate(data.dataPagamento) : null
      
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
      // Se o Supabase não estiver configurado, retornar erro
      if (!isSupabaseConfigured) {
        return {
          success: false,
          message: 'Supabase não configurado. Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY',
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
    
    // Se já é uma string no formato DD/MM/AAAA, retorna como está
    if (typeof dateValue === 'string' && dateValue.includes('/')) {
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
    
    // Se já está no formato brasileiro, retorna como está
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return dateStr
    }
    
    // Se está no formato ISO, converte para brasileiro
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const data = new Date(dateStr)
      return data.toLocaleDateString('pt-BR')
    }
    
    // Tenta converter usando parsearDataBrasileira
    const data = parsearDataBrasileira(dateStr)
    if (!data) return dateStr
    
    return data.toLocaleDateString('pt-BR')
  }

  private async checkSimilarTransaction(transaction: NewTransaction): Promise<SheetData | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('descricao', transaction.descricao)
        .eq('valor', transaction.valor)
        .eq('data', this.convertToISODate(transaction.data))
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
      // Se o Supabase não estiver configurado, retornar erro
      if (!isSupabaseConfigured) {
        throw new Error('Supabase não configurado. Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY')
      }
      
      console.log('🔍 Buscando categorias no Supabase...')
      
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
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
      console.log('💾 Salvando categoria no Supabase...')
      
      const { data, error } = await supabase
        .from('categorias')
        .insert([categoria])
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
      const { error } = await supabase
        .from('categorias')
        .update(data)
        .eq('id', id)

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
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id)

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
      // Se o Supabase não estiver configurado, usar dados mock
      if (!isSupabaseConfigured) {
        console.log('🔄 Supabase não configurado, usando subcategorias mock')
        return mockSubcategorias
      }
      
      console.log('🔍 Buscando subcategorias no Supabase...')
      
      const { data, error } = await supabase
        .from('subcategorias')
        .select('*')
        .eq('ativo', true)
        .order('nome')

      if (error) {
        console.log('⚠️ Erro ao buscar subcategorias, usando dados mock')
        return mockSubcategorias
      }

      console.log('✅ Subcategorias carregadas:', data?.length || 0, 'registros')
      
             // Mapear categoria_id para categoriaId (formato TypeScript)
       const mappedData: Subcategoria[] = (data || []).map(item => ({
         id: String(item.id),
         nome: String(item.nome),
         categoriaId: String(item.categoria_id),
         ativo: Boolean(item.ativo)
       }))
      
      return mappedData.length > 0 ? mappedData : mockSubcategorias
    } catch (error) {
      console.error('❌ Erro ao buscar subcategorias:', error)
      return mockSubcategorias
    }
  }

  async saveSubcategoria(subcategoria: Omit<Subcategoria, 'id'>): Promise<{ success: boolean; message: string; data?: Subcategoria }> {
    try {
      console.log('💾 Salvando subcategoria no Supabase...')
      
      // Mapear categoriaId para categoria_id (schema do banco)
      const subcategoriaData = {
        nome: subcategoria.nome,
        categoria_id: subcategoria.categoriaId,
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
      // Se o Supabase não estiver configurado, usar dados mock
      if (!isSupabaseConfigured) {
        console.log('🔄 Supabase não configurado, usando investimentos mock')
        return mockInvestimentos
      }
      
      console.log('🔍 Buscando investimentos no Supabase...')
      
      const { data, error } = await supabase
        .from('investimentos')
        .select('*')
        .eq('ativo', true)
        .order('nome')

      if (error) {
        console.log('⚠️ Erro ao buscar investimentos, usando dados mock')
        return mockInvestimentos
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
       
       return investimentosMapeados.length > 0 ? investimentosMapeados : mockInvestimentos
    } catch (error) {
      console.error('❌ Erro ao buscar investimentos:', error)
      return mockInvestimentos
    }
  }

  async saveInvestimento(investimento: Omit<Investimento, 'id'>): Promise<{ success: boolean; message: string; data?: Investimento }> {
    try {
      console.log('💾 Salvando investimento no Supabase...')
      
      const { data, error } = await supabase
        .from('investimentos')
        .insert([investimento])
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
      // Se o Supabase não estiver configurado, usar dados mock
      if (!isSupabaseConfigured) {
        console.log('🔄 Supabase não configurado, usando contas bancárias mock')
        return mockContas
      }
      
      console.log('📊 Buscando contas bancárias no Supabase...')
      
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('*')
        .eq('ativo', true)
        .order('nome')

      if (error) {
        console.log('⚠️ Erro ao buscar contas bancárias, usando dados mock')
        return mockContas
      }

             console.log('✅ Contas bancárias carregadas:', data?.length || 0, 'registros')
       
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
       
       return contasMapeadas.length > 0 ? contasMapeadas : mockContas
    } catch (error) {
      console.error('❌ Erro ao buscar contas bancárias:', error)
      return mockContas
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
        data: data
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
      // Se o Supabase não estiver configurado, usar dados mock
      if (!isSupabaseConfigured) {
        console.log('🔄 Supabase não configurado, usando cartões de crédito mock')
        return mockCartoes
      }
      
      console.log('💳 Buscando cartões de crédito no Supabase...')
      
      const { data, error } = await supabase
        .from('cartoes_credito')
        .select('*')
        .eq('ativo', true)
        .order('nome')

      if (error) {
        console.log('⚠️ Erro ao buscar cartões de crédito, usando dados mock')
        return mockCartoes
      }

      console.log('✅ Cartões de crédito carregados:', data?.length || 0, 'registros')
      return data || mockCartoes
    } catch (error) {
      console.error('❌ Erro ao buscar cartões de crédito:', error)
      return mockCartoes
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
        data: data
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
      // Se o Supabase não estiver configurado, usar dados mock
      if (!isSupabaseConfigured) {
        console.log('🔄 Supabase não configurado, usando contatos mock')
        return mockContatos
      }
      
      console.log('🔍 Buscando contatos no Supabase...')
      
      const { data, error } = await supabase
        .from('contatos')
        .select('*')
        .eq('ativo', true)
        .order('nome')

      if (error) {
        console.log('⚠️ Erro ao buscar contatos, usando dados mock')
        return mockContatos
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
      
      return contatosMapeados || mockContatos
    } catch (error) {
      console.error('❌ Erro ao buscar contatos:', error)
      return mockContatos
    }
  }

  async saveContato(contato: Omit<Contato, 'id'>): Promise<{ success: boolean; message: string; data?: Contato }> {
    try {
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
        data: data
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
}

export const supabaseService = new SupabaseServiceImpl() 