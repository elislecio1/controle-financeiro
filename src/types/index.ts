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
  tipo: 'custo' | 'lucro' | 'ambos'
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
  diasAntes?: number
  valorMinimo?: number
  percentualMeta?: number
  categorias?: string[]
  contas?: string[]
  frequencia?: string
  canais?: string[]
  horarioNotificacao?: string
}

export interface Notificacao {
  id: string
  tipo: 'dashboard' | 'email' | 'push' | 'sms'
  titulo: string
  mensagem: string
  dataEnvio: string
  status: 'enviado' | 'erro' | 'pendente'
  destinatario?: string
  dadosAdicional?: any
}

// Sistema de Integrações Externas
export interface IntegracaoBancaria {
  id: string
  nome: string
  banco: string
  tipoIntegracao: 'api_oficial' | 'open_banking' | 'webhook' | 'arquivo_csv'
  status: 'ativo' | 'inativo' | 'erro' | 'sincronizando'
  configuracao: IntegracaoConfig
  ultimaSincronizacao?: string
  proximaSincronizacao?: string
  frequenciaSincronizacao: number // em horas
  contaBancariaId?: string
  ativo: boolean
  createdAt: string
  updatedAt: string
}

export interface IntegracaoConfig {
  // Configurações comuns
  nomeInstituicao: string
  ambiente: 'producao' | 'homologacao' | 'desenvolvimento'
  
  // Para APIs oficiais
  apiKey?: string
  apiSecret?: string
  clientId?: string
  clientSecret?: string
  baseUrl?: string
  endpoints?: {
    transacoes: string
    saldo: string
    contas: string
  }
  
  // Para Open Banking
  certificadoDigital?: string
  chavePrivada?: string
  
  // Para certificados digitais (Banco Inter e outros)
  certificadoArquivo?: File | string // File para upload, string para armazenamento
  chavePrivadaArquivo?: File | string
  senhaCertificado?: string
  tipoCertificado?: 'pfx' | 'pem' | 'p12' | 'crt'
  
  // Para Webhooks
  webhookUrl?: string
  webhookSecret?: string
  
  // Para arquivos CSV
  formatoArquivo?: 'csv' | 'ofx' | 'qif'
  separador?: string
  encoding?: string
  mapeamentoCampos?: {
    data: string
    valor: string
    descricao: string
    categoria: string
    conta: string
  }
  
  // Configurações de segurança
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
}

export interface LogSincronizacao {
  id: string
  integracaoId: string
  tipoOperacao: 'importacao' | 'exportacao' | 'erro' | 'info'
  status: 'sucesso' | 'erro' | 'parcial'
  mensagem?: string
  dadosProcessados: number
  transacoesImportadas: number
  transacoesAtualizadas: number
  transacoesErro: number
  tempoExecucaoMs?: number
  detalhesErro?: any
  createdAt: string
}

export interface TransacaoImportada {
  id: string
  integracaoId: string
  idExterno?: string
  dataTransacao: string
  valor: number
  descricao: string
  tipo: 'credito' | 'debito' | 'transferencia'
  categoriaBanco?: string
  contaOrigem?: string
  contaDestino?: string
  hashTransacao: string
  statusConciliacao: 'pendente' | 'conciliada' | 'ignorada'
  transacaoId?: string
  dadosOriginais: any
  createdAt: string
  updatedAt: string
}

export interface ConfiguracaoNotificacao {
  id: string
  tipo: 'email' | 'push' | 'sms' | 'webhook'
  nome: string
  configuracao: NotificacaoConfig
  ativo: boolean
  frequencia: 'imediato' | 'diario' | 'semanal' | 'mensal'
  horarioEnvio?: string
  createdAt: string
  updatedAt: string
}

export interface NotificacaoConfig {
  // Configurações de Email
  email?: {
    servidor: string
    porta: number
    usuario: string
    senha: string
    ssl: boolean
    remetente: string
    nomeRemetente: string
  }
  
  // Configurações de Push
  push?: {
    vapidPublicKey: string
    vapidPrivateKey: string
    subject: string
  }
  
  // Configurações de SMS
  sms?: {
    provedor: 'twilio' | 'aws_sns' | 'custom'
    accountSid?: string
    authToken?: string
    numeroOrigem?: string
    apiKey?: string
    apiSecret?: string
  }
  
  // Configurações de Webhook
  webhook?: {
    url: string
    metodo: 'GET' | 'POST' | 'PUT'
    headers?: Record<string, string>
    timeout?: number
    retryAttempts?: number
  }
  
  // Configurações de template
  template?: {
    assunto: string
    corpo: string
    variaveis?: string[]
  }
}

export interface HistoricoNotificacao {
  id: string
  configuracaoId: string
  tipoNotificacao: string
  destinatario: string
  assunto?: string
  conteudo?: string
  status: 'enviado' | 'erro' | 'pendente'
  dataEnvio: string
  detalhesErro?: string
  dadosAdicional?: any
}

// Tipos auxiliares para integrações
export interface BancoInfo {
  codigo: string
  nome: string
  nomeCompleto: string
  tipo: 'publico' | 'privado' | 'cooperativo'
  suporteOpenBanking: boolean
  suporteAPI: boolean
  suporteWebhook: boolean
  suporteCSV: boolean
  documentacao?: string
  status: 'ativo' | 'inativo' | 'beta'
}

export interface ResultadoSincronizacao {
  sucesso: boolean
  mensagem: string
  transacoesImportadas: number
  transacoesAtualizadas: number
  transacoesErro: number
  tempoExecucao: number
  detalhes?: any
}

export interface DadosConciliacao {
  transacaoImportada: TransacaoImportada
  transacaoSistema?: SheetData
  scoreConciliacao: number // 0-100
  sugestoes?: string[]
  automatica: boolean
}

// Sistema de Autenticação e Usuários
export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  role: 'admin' | 'user' | 'viewer'
  created_at: string
  updated_at: string
  last_sign_in_at?: string
  email_confirmed_at?: string
}

export interface UserProfile {
  id: string
  user_id: string
  name: string
  avatar_url?: string
  phone?: string
  document?: string
  birth_date?: string
  role: 'admin' | 'user' | 'viewer'
  is_active: boolean
  preferences: UserPreferences
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  currency: 'BRL' | 'USD' | 'EUR'
  date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  language: 'pt-BR' | 'en-US' | 'es-ES'
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  dashboard: {
    default_period: 'current_month' | 'last_30_days' | 'current_year'
    show_charts: boolean
    show_stats: boolean
  }
}

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name: string
  confirmPassword: string
}

export interface ResetPasswordRequest {
  email: string
}

export interface UpdatePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface AuthError {
  message: string
  status?: number
  code?: string
}

export default {} 