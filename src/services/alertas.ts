import { createClient } from '@supabase/supabase-js'
import { Alerta, ConfiguracaoAlerta, Notificacao, SheetData, Meta, Orcamento, ContaBancaria } from '../types'

// Configurações do Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Dados mock para desenvolvimento
const mockAlertas: Alerta[] = [
  {
    id: '1',
    tipo: 'vencimento',
    titulo: 'Internet vence hoje!',
    mensagem: 'A conta de internet no valor de R$ 89,90 vence hoje. Evite multas e juros.',
    prioridade: 'critica',
    status: 'ativo',
    categoria: 'Serviços',
    dataCriacao: new Date().toISOString(),
    dataVencimento: new Date().toISOString(),
    dadosRelacionados: {
      transacaoId: '2',
      valor: 89.90,
      descricao: 'Internet'
    }
  },
  {
    id: '2',
    tipo: 'meta',
    titulo: 'Meta de Economia em Risco',
    mensagem: 'Você está 20% abaixo da meta mensal de economia. Revise seus gastos.',
    prioridade: 'media',
    status: 'ativo',
    categoria: 'Metas',
    dataCriacao: new Date().toISOString(),
    dadosRelacionados: {
      metaId: '1',
      valorAtual: 800,
      valorMeta: 1000,
      percentual: 80
    }
  },
  {
    id: '3',
    tipo: 'saldo',
    titulo: 'Saldo Baixo na Conta Principal',
    mensagem: 'O saldo da conta principal está abaixo do limite mínimo configurado.',
    prioridade: 'critica',
    status: 'ativo',
    categoria: 'Contas',
    dataCriacao: new Date().toISOString(),
    dadosRelacionados: {
      contaId: '1',
      saldoAtual: 500,
      saldoMinimo: 1000
    }
  },
  {
    id: '4',
    tipo: 'vencimento',
    titulo: 'Conta de Luz vence amanhã!',
    mensagem: 'A conta de luz no valor de R$ 150,00 vence amanhã. Programe o pagamento.',
    prioridade: 'alta',
    status: 'ativo',
    categoria: 'Serviços',
    dataCriacao: new Date().toISOString(),
    dadosRelacionados: {
      transacaoId: '1',
      valor: 150,
      descricao: 'Conta de Luz'
    }
  },
  {
    id: '5',
    tipo: 'orcamento',
    titulo: 'Orçamento de Alimentação Próximo do Limite',
    mensagem: 'O orçamento de alimentação está 95% utilizado. Controle seus gastos.',
    prioridade: 'media',
    status: 'ativo',
    categoria: 'Alimentação',
    dataCriacao: new Date().toISOString(),
    dadosRelacionados: {
      orcamentoId: '1',
      valorPrevisto: 500,
      valorRealizado: 475,
      percentual: 95
    }
  }
]

const mockConfiguracoes: ConfiguracaoAlerta[] = [
  {
    id: '1',
    tipo: 'vencimento',
    ativo: true,
    diasAntes: 3,
    categorias: ['Serviços', 'Moradia'],
    horarioNotificacao: '09:00',
    frequencia: 'diario',
    canais: ['dashboard', 'email']
  },
  {
    id: '2',
    tipo: 'saldo',
    ativo: true,
    valorMinimo: 1000,
    contas: ['Conta Corrente Principal'],
    horarioNotificacao: '08:00',
    frequencia: 'diario',
    canais: ['dashboard', 'push']
  },
  {
    id: '3',
    tipo: 'meta',
    ativo: true,
    percentualMeta: 80,
    horarioNotificacao: '18:00',
    frequencia: 'semanal',
    canais: ['dashboard', 'email']
  }
]

export interface AlertasService {
  // Alertas
  getAlertas(): Promise<Alerta[]>
  getAlertasAtivos(): Promise<Alerta[]>
  criarAlerta(alerta: Omit<Alerta, 'id' | 'dataCriacao'>): Promise<{ success: boolean; message: string; data?: Alerta }>
  atualizarAlerta(id: string, data: Partial<Alerta>): Promise<{ success: boolean; message: string }>
  marcarComoLido(id: string): Promise<{ success: boolean; message: string }>
  arquivarAlerta(id: string): Promise<{ success: boolean; message: string }>
  deletarAlerta(id: string): Promise<{ success: boolean; message: string }>
  
  // Configurações
  getConfiguracoes(): Promise<ConfiguracaoAlerta[]>
  salvarConfiguracao(config: Omit<ConfiguracaoAlerta, 'id'>): Promise<{ success: boolean; message: string; data?: ConfiguracaoAlerta }>
  atualizarConfiguracao(id: string, data: Partial<ConfiguracaoAlerta>): Promise<{ success: boolean; message: string }>
  deletarConfiguracao(id: string): Promise<{ success: boolean; message: string }>
  
  // Verificações automáticas
  verificarVencimentos(): Promise<Alerta[]>
  verificarMetas(): Promise<Alerta[]>
  verificarOrcamentos(): Promise<Alerta[]>
  verificarSaldos(): Promise<Alerta[]>
  
  // Notificações
  enviarNotificacao(notificacao: Omit<Notificacao, 'id' | 'tentativas'>): Promise<{ success: boolean; message: string }>
  getNotificacoes(): Promise<Notificacao[]>
}

class AlertasServiceImpl implements AlertasService {
  private readonly TABLE_ALERTAS = 'alertas'
  private readonly TABLE_CONFIGURACOES = 'configuracoes_alertas'
  private readonly TABLE_NOTIFICACOES = 'notificacoes'

  // ===== ALERTAS =====
  async getAlertas(): Promise<Alerta[]> {
    try {
      if (!this.isSupabaseConfigured()) {
        return mockAlertas
      }

      const { data, error } = await supabase
        .from(this.TABLE_ALERTAS)
        .select('*')
        .order('dataCriacao', { ascending: false })

      if (error) {
        console.error('Erro ao buscar alertas:', error)
        return mockAlertas
      }

      return data || mockAlertas
    } catch (error) {
      console.error('Erro ao buscar alertas:', error)
      return mockAlertas
    }
  }

  async getAlertasAtivos(): Promise<Alerta[]> {
    try {
      const alertas = await this.getAlertas()
      return alertas.filter(alerta => alerta.status === 'ativo')
    } catch (error) {
      console.error('Erro ao buscar alertas ativos:', error)
      return []
    }
  }

  async criarAlerta(alerta: Omit<Alerta, 'id' | 'dataCriacao'>): Promise<{ success: boolean; message: string; data?: Alerta }> {
    try {
      if (!this.isSupabaseConfigured()) {
        const novoAlerta: Alerta = {
          ...alerta,
          id: Date.now().toString(),
          dataCriacao: new Date().toISOString()
        }
        mockAlertas.unshift(novoAlerta)
        return {
          success: true,
          message: 'Alerta criado com sucesso!',
          data: novoAlerta
        }
      }

      const alertaData = {
        ...alerta,
        dataCriacao: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from(this.TABLE_ALERTAS)
        .insert([alertaData])
        .select()
        .single()

      if (error) {
        return {
          success: false,
          message: 'Erro ao criar alerta: ' + error.message
        }
      }

      return {
        success: true,
        message: 'Alerta criado com sucesso!',
        data: data
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao criar alerta: ' + error.message
      }
    }
  }

  async atualizarAlerta(id: string, data: Partial<Alerta>): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isSupabaseConfigured()) {
        const index = mockAlertas.findIndex(a => a.id === id)
        if (index !== -1) {
          mockAlertas[index] = { ...mockAlertas[index], ...data }
          return { success: true, message: 'Alerta atualizado com sucesso!' }
        }
        return { success: false, message: 'Alerta não encontrado' }
      }

      const { error } = await supabase
        .from(this.TABLE_ALERTAS)
        .update(data)
        .eq('id', id)

      if (error) {
        return {
          success: false,
          message: 'Erro ao atualizar alerta: ' + error.message
        }
      }

      return { success: true, message: 'Alerta atualizado com sucesso!' }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao atualizar alerta: ' + error.message
      }
    }
  }

  async marcarComoLido(id: string): Promise<{ success: boolean; message: string }> {
    return this.atualizarAlerta(id, {
      status: 'lido',
      dataLeitura: new Date().toISOString()
    })
  }

  async arquivarAlerta(id: string): Promise<{ success: boolean; message: string }> {
    return this.atualizarAlerta(id, { status: 'arquivado' })
  }

  async deletarAlerta(id: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isSupabaseConfigured()) {
        const index = mockAlertas.findIndex(a => a.id === id)
        if (index !== -1) {
          mockAlertas.splice(index, 1)
          return { success: true, message: 'Alerta deletado com sucesso!' }
        }
        return { success: false, message: 'Alerta não encontrado' }
      }

      const { error } = await supabase
        .from(this.TABLE_ALERTAS)
        .delete()
        .eq('id', id)

      if (error) {
        return {
          success: false,
          message: 'Erro ao deletar alerta: ' + error.message
        }
      }

      return { success: true, message: 'Alerta deletado com sucesso!' }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao deletar alerta: ' + error.message
      }
    }
  }

  // ===== CONFIGURAÇÕES =====
  async getConfiguracoes(): Promise<ConfiguracaoAlerta[]> {
    try {
      if (!this.isSupabaseConfigured()) {
        return mockConfiguracoes
      }

      const { data, error } = await supabase
        .from(this.TABLE_CONFIGURACOES)
        .select('*')
        .eq('ativo', true)

      if (error) {
        console.error('Erro ao buscar configurações:', error)
        return mockConfiguracoes
      }

      return data || mockConfiguracoes
    } catch (error) {
      console.error('Erro ao buscar configurações:', error)
      return mockConfiguracoes
    }
  }

  async salvarConfiguracao(config: Omit<ConfiguracaoAlerta, 'id'>): Promise<{ success: boolean; message: string; data?: ConfiguracaoAlerta }> {
    try {
      if (!this.isSupabaseConfigured()) {
        const novaConfig: ConfiguracaoAlerta = {
          ...config,
          id: Date.now().toString()
        }
        mockConfiguracoes.push(novaConfig)
        return {
          success: true,
          message: 'Configuração salva com sucesso!',
          data: novaConfig
        }
      }

      const { data, error } = await supabase
        .from(this.TABLE_CONFIGURACOES)
        .insert([config])
        .select()
        .single()

      if (error) {
        return {
          success: false,
          message: 'Erro ao salvar configuração: ' + error.message
        }
      }

      return {
        success: true,
        message: 'Configuração salva com sucesso!',
        data: data
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao salvar configuração: ' + error.message
      }
    }
  }

  async atualizarConfiguracao(id: string, data: Partial<ConfiguracaoAlerta>): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isSupabaseConfigured()) {
        const index = mockConfiguracoes.findIndex(c => c.id === id)
        if (index !== -1) {
          mockConfiguracoes[index] = { ...mockConfiguracoes[index], ...data }
          return { success: true, message: 'Configuração atualizada com sucesso!' }
        }
        return { success: false, message: 'Configuração não encontrada' }
      }

      const { error } = await supabase
        .from(this.TABLE_CONFIGURACOES)
        .update(data)
        .eq('id', id)

      if (error) {
        return {
          success: false,
          message: 'Erro ao atualizar configuração: ' + error.message
        }
      }

      return { success: true, message: 'Configuração atualizada com sucesso!' }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao atualizar configuração: ' + error.message
      }
    }
  }

  async deletarConfiguracao(id: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isSupabaseConfigured()) {
        const index = mockConfiguracoes.findIndex(c => c.id === id)
        if (index !== -1) {
          mockConfiguracoes.splice(index, 1)
          return { success: true, message: 'Configuração deletada com sucesso!' }
        }
        return { success: false, message: 'Configuração não encontrada' }
      }

      const { error } = await supabase
        .from(this.TABLE_CONFIGURACOES)
        .delete()
        .eq('id', id)

      if (error) {
        return {
          success: false,
          message: 'Erro ao deletar configuração: ' + error.message
        }
      }

      return { success: true, message: 'Configuração deletada com sucesso!' }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao deletar configuração: ' + error.message
      }
    }
  }

  // ===== VERIFICAÇÕES AUTOMÁTICAS =====
  async verificarVencimentos(): Promise<Alerta[]> {
    try {
      // Buscar transações pendentes próximas do vencimento
      const hoje = new Date()
      const alertas: Alerta[] = []

      // Buscar dados reais do sistema
      let transacoesVencendo: any[] = []
      
      if (this.isSupabaseConfigured()) {
        // Buscar do Supabase
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('status', 'pendente')
          .not('vencimento', 'is', null)
        
        if (!error && data) {
          transacoesVencendo = data
        }
      } else {
        // Em desenvolvimento, usar dados mockados mais realistas
        const hojeStr = hoje.toLocaleDateString('pt-BR')
        const amanha = new Date(hoje)
        amanha.setDate(hoje.getDate() + 1)
        const amanhaStr = amanha.toLocaleDateString('pt-BR')
        
        transacoesVencendo = [
          {
            id: '1',
            descricao: 'Conta de Luz',
            valor: 150,
            vencimento: amanhaStr, // Vence amanhã, não hoje
            categoria: 'Serviços',
            status: 'pendente'
          },
          {
            id: '2',
            descricao: 'Internet',
            valor: 89.90,
            vencimento: hojeStr, // Vence hoje
            categoria: 'Serviços',
            status: 'pendente'
          }
        ]
      }

      for (const transacao of transacoesVencendo) {
        const dataVencimento = this.parseBrazilianDate(transacao.vencimento)
        if (dataVencimento) {
          const diasAteVencimento = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
          
          // Só criar alerta se realmente vence nos próximos 3 dias
          if (diasAteVencimento <= 3 && diasAteVencimento >= 0) {
            const prioridade = diasAteVencimento === 0 ? 'critica' : diasAteVencimento === 1 ? 'alta' : 'media'
            
            alertas.push({
              id: `venc_${transacao.id}`,
              tipo: 'vencimento',
              titulo: `${transacao.descricao} vence ${diasAteVencimento === 0 ? 'hoje' : `em ${diasAteVencimento} dia(s)`}!`,
              mensagem: `A ${transacao.descricao} no valor de ${this.formatarMoeda(transacao.valor)} vence ${diasAteVencimento === 0 ? 'hoje' : `em ${diasAteVencimento} dia(s)`}. Evite multas e juros.`,
              prioridade,
              status: 'ativo',
              categoria: transacao.categoria,
              dataCriacao: hoje.toISOString(),
              dataVencimento: transacao.vencimento,
              dadosRelacionados: {
                transacaoId: transacao.id,
                valor: transacao.valor,
                descricao: transacao.descricao,
                diasAteVencimento
              }
            })
          }
        }
      }

      return alertas
    } catch (error) {
      console.error('Erro ao verificar vencimentos:', error)
      return []
    }
  }

  async verificarMetas(): Promise<Alerta[]> {
    try {
      const alertas: Alerta[] = []
      const hoje = new Date()

      // Simular verificação de metas (em produção, buscar do banco)
      const metas = [
        {
          id: '1',
          nome: 'Economia Mensal',
          valorMeta: 1000,
          valorAtual: 800,
          categoria: 'Economia'
        }
      ]

      for (const meta of metas) {
        const percentual = (meta.valorAtual / meta.valorMeta) * 100
        
        if (percentual < 80) {
          alertas.push({
            id: `meta_${meta.id}`,
            tipo: 'meta',
            titulo: 'Meta de Economia em Risco',
            mensagem: `Você está ${(100 - percentual).toFixed(0)}% abaixo da meta mensal de economia. Revise seus gastos para atingir o objetivo.`,
            prioridade: percentual < 50 ? 'alta' : 'media',
            status: 'ativo',
            categoria: meta.categoria,
            dataCriacao: hoje.toISOString(),
            dadosRelacionados: {
              metaId: meta.id,
              valorAtual: meta.valorAtual,
              valorMeta: meta.valorMeta,
              percentual
            }
          })
        }
      }

      return alertas
    } catch (error) {
      console.error('Erro ao verificar metas:', error)
      return []
    }
  }

  async verificarOrcamentos(): Promise<Alerta[]> {
    try {
      const alertas: Alerta[] = []
      const hoje = new Date()

      // Simular verificação de orçamentos (em produção, buscar do banco)
      const orcamentos = [
        {
          id: '1',
          categoria: 'Alimentação',
          valorPrevisto: 500,
          valorRealizado: 450
        }
      ]

      for (const orcamento of orcamentos) {
        const percentual = (orcamento.valorRealizado / orcamento.valorPrevisto) * 100
        
        if (percentual > 90) {
          alertas.push({
            id: `orc_${orcamento.id}`,
            tipo: 'orcamento',
            titulo: 'Orçamento Próximo do Limite',
            mensagem: `O orçamento de ${orcamento.categoria} está ${percentual.toFixed(0)}% utilizado. Controle seus gastos para não ultrapassar o limite.`,
            prioridade: percentual > 95 ? 'alta' : 'media',
            status: 'ativo',
            categoria: orcamento.categoria,
            dataCriacao: hoje.toISOString(),
            dadosRelacionados: {
              orcamentoId: orcamento.id,
              valorPrevisto: orcamento.valorPrevisto,
              valorRealizado: orcamento.valorRealizado,
              percentual
            }
          })
        }
      }

      return alertas
    } catch (error) {
      console.error('Erro ao verificar orçamentos:', error)
      return []
    }
  }

  async verificarSaldos(): Promise<Alerta[]> {
    try {
      const alertas: Alerta[] = []
      const hoje = new Date()

      // Simular verificação de saldos (em produção, buscar do banco)
      const contas = [
        {
          id: '1',
          nome: 'Conta Corrente Principal',
          saldo: 500,
          saldoMinimo: 1000
        }
      ]

      for (const conta of contas) {
        if (conta.saldo < conta.saldoMinimo) {
          alertas.push({
            id: `saldo_${conta.id}`,
            tipo: 'saldo',
            titulo: 'Saldo Baixo na Conta',
            mensagem: `O saldo da ${conta.nome} está R$ ${(conta.saldoMinimo - conta.saldo).toFixed(2)} abaixo do limite mínimo configurado.`,
            prioridade: conta.saldo < conta.saldoMinimo * 0.5 ? 'critica' : 'alta',
            status: 'ativo',
            categoria: 'Contas',
            dataCriacao: hoje.toISOString(),
            dadosRelacionados: {
              contaId: conta.id,
              saldoAtual: conta.saldo,
              saldoMinimo: conta.saldoMinimo
            }
          })
        }
      }

      return alertas
    } catch (error) {
      console.error('Erro ao verificar saldos:', error)
      return []
    }
  }

  // ===== NOTIFICAÇÕES =====
  async enviarNotificacao(notificacao: Omit<Notificacao, 'id' | 'tentativas'>): Promise<{ success: boolean; message: string }> {
    try {
      const notificacaoCompleta: Notificacao = {
        ...notificacao,
        id: Date.now().toString(),
        tentativas: 1
      }

      // Simular envio de notificação
      console.log('📧 Enviando notificação:', notificacaoCompleta)

      // Em produção, implementar envio real por email, push, SMS
      if (notificacao.tipo === 'email') {
        // Enviar email
        await this.simularEnvioEmail(notificacaoCompleta)
      } else if (notificacao.tipo === 'push') {
        // Enviar push notification
        await this.simularEnvioPush(notificacaoCompleta)
      }

      return { success: true, message: 'Notificação enviada com sucesso!' }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao enviar notificação: ' + error.message
      }
    }
  }

  async getNotificacoes(): Promise<Notificacao[]> {
    try {
      // Em produção, buscar do banco
      return []
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
      return []
    }
  }

  // ===== MÉTODOS AUXILIARES =====
  private isSupabaseConfigured(): boolean {
    return SUPABASE_URL !== 'https://your-project.supabase.co' && SUPABASE_ANON_KEY !== 'your-anon-key'
  }

  private parseBrazilianDate(dateStr: string): Date | null {
    if (!dateStr) return null
    
    const partes = dateStr.split('/')
    if (partes.length !== 3) return null
    
    const dia = parseInt(partes[0])
    const mes = parseInt(partes[1]) - 1
    const ano = parseInt(partes[2])
    
    if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return null
    
    return new Date(ano, mes, dia)
  }

  private formatarMoeda(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  private async simularEnvioEmail(notificacao: Notificacao): Promise<void> {
    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('📧 Email enviado para:', notificacao.dadosEnvio?.email || 'usuário@exemplo.com')
  }

  private async simularEnvioPush(notificacao: Notificacao): Promise<void> {
    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('📱 Push notification enviado para:', notificacao.dadosEnvio?.deviceId || 'device-123')
  }
}

export const alertasService = new AlertasServiceImpl()
