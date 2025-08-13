// Tipos base para o sistema financeiro
export interface SheetData {
  id: string
  data: string // Data da transação
  valor: number // Valor (negativo para débitos)
  descricao: string // Descrição obrigatória
  conta: string // Conta bancária
  contaTransferencia?: string // Conta de transferência
  cartao?: string // Cartão de crédito/débito
  categoria: string // Categoria
  subcategoria?: string // Subcategoria (depende da categoria)
  contato?: string // Contato/Fornecedor
  centro?: string // Centro de custo/lucro
  projeto?: string // Projeto
  forma: string // Forma de pagamento
  numeroDocumento?: string // Número do documento
  observacoes?: string // Observações
  dataCompetencia?: string // Data de competência
  tags?: string[] // Tags para filtros
  status: 'pago' | 'pendente' | 'vencido'
  dataPagamento?: string // Data do pagamento
  vencimento: string // Data de vencimento (mantido para compatibilidade)
  empresa?: string // Mantido para compatibilidade
  tipo: 'receita' | 'despesa' | 'transferencia' | 'investimento'
  parcela?: string // Parcela atual
  situacao?: string // Situação
}

// Interface para nova transação
export interface NewTransaction {
  data: string
  valor: number
  descricao: string
  conta: string
  contaTransferencia?: string
  cartao?: string
  categoria: string
  subcategoria?: string
  contato?: string
  centro?: string
  projeto?: string
  forma: string
  numeroDocumento?: string
  observacoes?: string
  dataCompetencia?: string
  tags?: string[]
  tipo: 'receita' | 'despesa' | 'transferencia' | 'investimento'
  vencimento?: string
  parcelas?: number
}

// Dados para gráficos
export interface ChartData {
  date: string
  [key: string]: any
}

export interface PieData {
  name: string
  value: number
}

// Estatísticas do dashboard
export interface DashboardStats {
  totalReceitas: number
  totalDespesas: number
  saldo: number
  totalPago: number
  totalPendente: number
  totalVencido: number
}

// Módulo 1: Gestão Financeira Essencial
export interface ContaBancaria {
  id: string
  nome: string
  tipo: 'conta_corrente' | 'poupanca' | 'investimento' | 'cartao_credito' | 'cartao_debito'
  banco: string
  agencia?: string
  conta?: string
  saldo: number
  limite?: number // Para cartões
  ativo: boolean
}

export interface CartaoCredito {
  id: string
  nome: string
  banco: string
  limite: number
  vencimento: number // Dia do vencimento
  contaId: string
  ativo: boolean
}

// Módulo 2: Organização e Planejamento
export interface Categoria {
  id: string
  nome: string
  tipo: 'receita' | 'despesa' | 'ambos'
  cor: string
  icone?: string
  ativo: boolean
}

export interface Subcategoria {
  id: string
  nome: string
  categoriaId: string
  ativo: boolean
}

export interface CentroCusto {
  id: string
  nome: string
  tipo: 'custo' | 'lucro'
  descricao?: string
  ativo: boolean
}

export interface Contato {
  id: string
  nome: string
  tipo: 'cliente' | 'fornecedor' | 'parceiro' | 'funcionario'
  email?: string
  telefone?: string
  cpfCnpj?: string
  endereco?: string
  observacoes?: string
  ativo: boolean
}

export interface Meta {
  id: string
  nome: string
  tipo: 'receita' | 'despesa' | 'investimento'
  valorMeta: number
  valorAtual: number
  dataInicio: string
  dataFim: string
  categoriaId?: string
  ativo: boolean
}

export interface Orcamento {
  id: string
  mes: string // YYYY-MM
  categoriaId: string
  valorPrevisto: number
  valorRealizado: number
  ativo: boolean
}

// Módulo 3: Recursos Avançados
export interface Investimento {
  id: string
  nome: string
  tipo: 'acao' | 'fiis' | 'etfs' | 'cdb' | 'lci' | 'lca' | 'poupanca' | 'outros'
  valor: number
  quantidade: number
  precoMedio: number
  dataCompra?: string
  instituicao?: string
  observacoes?: string
  ativo: boolean
  dataCriacao: string
}

// Módulo 4: Relatórios
export interface Relatorio {
  id: string
  nome: string
  tipo: 'dre' | 'balanco' | 'fluxo_caixa' | 'categoria' | 'centro_custo'
  parametros: any
  dataGeracao: string
  dados: any
}

// Sistema de Alertas
export interface Alerta {
  id: string
  tipo: 'vencimento' | 'meta' | 'orcamento' | 'saldo' | 'personalizado'
  titulo: string
  mensagem: string
  prioridade: 'baixa' | 'media' | 'alta' | 'critica'
  status: 'ativo' | 'lido' | 'arquivado'
  categoria?: string
  dataCriacao: string
  dataVencimento?: string
  dataLeitura?: string
  usuarioId?: string
  configuracaoId?: string
  dadosRelacionados?: any // Dados específicos do tipo de alerta
}

export interface ConfiguracaoAlerta {
  id: string
  tipo: 'vencimento' | 'meta' | 'orcamento' | 'saldo' | 'personalizado'
  ativo: boolean
  diasAntes?: number // Para alertas de vencimento
  valorMinimo?: number // Para alertas de saldo
  percentualMeta?: number // Para alertas de metas
  categorias?: string[] // Categorias específicas
  contas?: string[] // Contas específicas
  horarioNotificacao?: string // HH:MM
  frequencia: 'diario' | 'semanal' | 'mensal' | 'personalizado'
  canais: ('email' | 'push' | 'sms' | 'dashboard')[]
  usuarioId?: string
}

export interface Notificacao {
  id: string
  alertaId: string
  tipo: 'email' | 'push' | 'sms' | 'dashboard'
  status: 'pendente' | 'enviada' | 'falha'
  dataEnvio?: string
  dadosEnvio?: any
  tentativas: number
  maxTentativas: number
}

// Configurações do sistema
export interface ConfiguracaoSistema {
  moeda: 'BRL'
  formatoData: 'DD/MM/AAAA'
  formatoMoeda: 'R$ #,##0.00'
  regimeContabil: 'caixa' | 'competencia'
  alertasVencimento: number // Dias antes do vencimento
  backupAutomatico: boolean
  tema: 'claro' | 'escuro'
} 