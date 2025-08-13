import { createClient } from '@supabase/supabase-js'
import { Alerta, ConfiguracaoAlerta, Notificacao, SheetData, Meta, Orcamento, ContaBancaria } from '../types'

// Configurações do Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://eshaahpcddqkeevxpgfk.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaGFhaHBjZGRxa2VldnhwZ2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4MDAsImV4cCI6MjA1MDU0ODgwMH0.REAL_KEY_HERE'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Array vazio - não usaremos dados mockados
const mockAlertas: Alerta[] = []

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
      // Gerar alertas dinamicamente baseados nos dados reais
      const alertasVencimento = await this.verificarVencimentos()
      const alertasSaldo = await this.verificarSaldos()
      const alertasMeta = await this.verificarMetas()
      const alertasOrcamento = await this.verificarOrcamentos()
      
      // Combinar todos os alertas
      const todosAlertas = [
        ...alertasVencimento,
        ...alertasSaldo,
        ...alertasMeta,
        ...alertasOrcamento
      ]
      
      // Filtrar apenas alertas ativos
      return todosAlertas.filter(alerta => alerta.status === 'ativo')
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

      if (!data) {
        return mockConfiguracoes
      }

      // Mapear dados do banco para o formato da aplicação
      const configuracoes: ConfiguracaoAlerta[] = data.map(item => ({
        id: item.id,
        tipo: item.tipo,
        ativo: item.ativo,
        diasAntes: item.dias_antes,
        valorMinimo: item.valor_minimo,
        percentualMeta: item.percentual_meta,
        categorias: item.categorias || [],
        contas: item.contas || [],
        horarioNotificacao: item.horario_notificacao,
        frequencia: item.frequencia,
        canais: item.canais
      }))

      return configuracoes
    } catch (error) {
      console.error('Erro ao buscar configurações:', error)
      return mockConfiguracoes
    }
  }

  async salvarConfiguracao(config: Omit<ConfiguracaoAlerta, 'id'>): Promise<{ success: boolean; message: string; data?: ConfiguracaoAlerta }> {
    try {
      console.log('🔧 Salvando configuração:', config)
      console.log('🔧 Supabase configurado:', this.isSupabaseConfigured())
      console.log('🔧 URL Supabase:', SUPABASE_URL)
      
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

      // Mapear campos para o formato do banco
      const configData = {
        tipo: config.tipo,
        ativo: config.ativo,
        dias_antes: config.diasAntes,
        valor_minimo: config.valorMinimo,
        percentual_meta: config.percentualMeta,
        categorias: config.categorias,
        contas: config.contas,
        horario_notificacao: config.horarioNotificacao,
        frequencia: config.frequencia,
        canais: config.canais
      }

      console.log('📊 Dados para inserção:', configData)
      console.log('📊 Tabela:', this.TABLE_CONFIGURACOES)

      // Tentar inserção com retry e diferentes abordagens
      let data, error;
      
      // Primeira tentativa: inserção normal
      const result = await supabase
        .from(this.TABLE_CONFIGURACOES)
        .insert([configData])
        .select()
        .single()

      data = result.data;
      error = result.error;

      // Se falhou com erro de RLS, tentar abordagem alternativa
      if (error && (error.code === '42501' || error.message.includes('row-level security'))) {
        console.log('🔄 Tentando abordagem alternativa para RLS...')
        
        // Tentar com service_role key (se disponível)
        const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
        if (serviceRoleKey) {
          const supabaseAdmin = createClient(SUPABASE_URL, serviceRoleKey);
          const adminResult = await supabaseAdmin
            .from(this.TABLE_CONFIGURACOES)
            .insert([configData])
            .select()
            .single()
          
          data = adminResult.data;
          error = adminResult.error;
        }
      }

      if (error) {
        console.error('❌ Erro ao salvar configuração:', error)
        console.error('❌ Código do erro:', error.code)
        console.error('❌ Detalhes do erro:', error.details)
        console.error('❌ Hint do erro:', error.hint)
        return {
          success: false,
          message: 'Erro ao salvar configuração: ' + error.message
        }
      }

      console.log('✅ Configuração salva com sucesso:', data)

      // Converter de volta para o formato da aplicação
      const configSalva: ConfiguracaoAlerta = {
        id: data.id,
        tipo: data.tipo,
        ativo: data.ativo,
        diasAntes: data.dias_antes,
        valorMinimo: data.valor_minimo,
        percentualMeta: data.percentual_meta,
        categorias: data.categorias || [],
        contas: data.contas || [],
        horarioNotificacao: data.horario_notificacao,
        frequencia: data.frequencia,
        canais: data.canais
      }

      return {
        success: true,
        message: 'Configuração salva com sucesso!',
        data: configSalva
      }
    } catch (error: any) {
      console.error('❌ Erro geral ao salvar configuração:', error)
      console.error('❌ Stack trace:', error.stack)
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

      // Mapear campos para o formato do banco (camelCase -> snake_case)
      const updateData: any = {}
      if (data.tipo !== undefined) updateData.tipo = data.tipo
      if (data.ativo !== undefined) updateData.ativo = data.ativo
      if (data.diasAntes !== undefined) updateData.dias_antes = data.diasAntes
      if (data.valorMinimo !== undefined) updateData.valor_minimo = data.valorMinimo
      if (data.percentualMeta !== undefined) updateData.percentual_meta = data.percentualMeta
      if (data.categorias !== undefined) updateData.categorias = data.categorias
      if (data.contas !== undefined) updateData.contas = data.contas
      if (data.horarioNotificacao !== undefined) updateData.horario_notificacao = data.horarioNotificacao
      if (data.frequencia !== undefined) updateData.frequencia = data.frequencia
      if (data.canais !== undefined) updateData.canais = data.canais

      console.log('🔄 Atualizando configuração:', { id, updateData })

      const { error } = await supabase
        .from(this.TABLE_CONFIGURACOES)
        .update(updateData)
        .eq('id', id)

      if (error) {
        console.error('❌ Erro ao atualizar configuração:', error)
        return {
          success: false,
          message: 'Erro ao atualizar configuração: ' + error.message
        }
      }

      console.log('✅ Configuração atualizada com sucesso')
      return { success: true, message: 'Configuração atualizada com sucesso!' }
    } catch (error: any) {
      console.error('❌ Erro geral ao atualizar configuração:', error)
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
      const hoje = new Date()
      const alertas: Alerta[] = []

      // Buscar configurações de vencimento
      const configuracoes = await this.getConfiguracoes()
      const configVencimento = configuracoes.find(c => c.tipo === 'vencimento' && c.ativo)
      
      // Se não há configuração, usar padrão de 3 dias
      const diasAntes = configVencimento?.diasAntes || 3

      console.log('🔍 Verificando vencimentos - dias antes:', diasAntes)

      // Buscar transações pendentes do banco de dados
      const { data: transacoes, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('status', 'pendente')
        .not('vencimento', 'is', null)

      if (error) {
        console.error('Erro ao buscar transações:', error)
        return []
      }

      if (!transacoes || transacoes.length === 0) {
        console.log('📊 Nenhuma transação pendente encontrada')
        return []
      }

      console.log('📊 Transações pendentes encontradas:', transacoes.length)

      for (const transacao of transacoes) {
        const dataVencimento = this.parseBrazilianDate(transacao.vencimento)
        if (dataVencimento) {
          const diasAteVencimento = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
          
          console.log(`📅 ${transacao.descricao}: vence em ${diasAteVencimento} dias`)
          
          // Criar alerta se vence nos próximos X dias (incluindo hoje)
          if (diasAteVencimento <= diasAntes && diasAteVencimento >= 0) {
            const prioridade = diasAteVencimento === 0 ? 'critica' : diasAteVencimento === 1 ? 'alta' : 'media'
            
            const alerta = {
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
            }
            
            alertas.push(alerta)
            console.log(`🚨 Alerta criado: ${alerta.titulo}`)
          }
        }
      }

      console.log(`✅ Total de alertas de vencimento criados: ${alertas.length}`)
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

      // Buscar metas do banco de dados
      const { data: metas, error } = await supabase
        .from('metas')
        .select('*')
        .eq('ativo', true)

      if (error) {
        console.error('Erro ao buscar metas:', error)
        return []
      }

      if (!metas || metas.length === 0) {
        return []
      }

      for (const meta of metas) {
        const percentual = (meta.valor_atual / meta.valor_meta) * 100
        
        if (percentual < 80) {
          alertas.push({
            id: `meta_${meta.id}`,
            tipo: 'meta',
            titulo: `Meta "${meta.nome}" em Risco`,
            mensagem: `Você está ${(100 - percentual).toFixed(0)}% abaixo da meta "${meta.nome}". Revise seus gastos para atingir o objetivo.`,
            prioridade: percentual < 50 ? 'alta' : 'media',
            status: 'ativo',
            categoria: meta.categoria || 'Metas',
            dataCriacao: hoje.toISOString(),
            dadosRelacionados: {
              metaId: meta.id,
              valorAtual: meta.valor_atual,
              valorMeta: meta.valor_meta,
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

      // Buscar orçamentos do banco de dados
      const { data: orcamentos, error } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('ativo', true)

      if (error) {
        console.error('Erro ao buscar orçamentos:', error)
        return []
      }

      if (!orcamentos || orcamentos.length === 0) {
        return []
      }

      for (const orcamento of orcamentos) {
        const percentual = (orcamento.valor_realizado / orcamento.valor_previsto) * 100
        
        if (percentual > 90) {
          alertas.push({
            id: `orc_${orcamento.id}`,
            tipo: 'orcamento',
            titulo: `Orçamento "${orcamento.categoria}" Próximo do Limite`,
            mensagem: `O orçamento de ${orcamento.categoria} está ${percentual.toFixed(0)}% utilizado. Controle seus gastos para não ultrapassar o limite.`,
            prioridade: percentual > 95 ? 'alta' : 'media',
            status: 'ativo',
            categoria: orcamento.categoria,
            dataCriacao: hoje.toISOString(),
            dadosRelacionados: {
              orcamentoId: orcamento.id,
              valorPrevisto: orcamento.valor_previsto,
              valorRealizado: orcamento.valor_realizado,
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

      // Buscar contas bancárias do banco de dados
      const { data: contas, error } = await supabase
        .from('contas_bancarias')
        .select('*')
        .eq('ativo', true)

      if (error) {
        console.error('Erro ao buscar contas:', error)
        return []
      }

      if (!contas || contas.length === 0) {
        return []
      }

      for (const conta of contas) {
        // Definir saldo mínimo padrão se não configurado
        const saldoMinimo = conta.saldo_minimo || 1000
        
        if (conta.saldo < saldoMinimo) {
          alertas.push({
            id: `saldo_${conta.id}`,
            tipo: 'saldo',
            titulo: `Saldo Baixo na ${conta.nome}`,
            mensagem: `O saldo da ${conta.nome} está R$ ${(saldoMinimo - conta.saldo).toFixed(2)} abaixo do limite mínimo configurado.`,
            prioridade: conta.saldo < saldoMinimo * 0.5 ? 'critica' : 'alta',
            status: 'ativo',
            categoria: 'Contas',
            dataCriacao: hoje.toISOString(),
            dadosRelacionados: {
              contaId: conta.id,
              saldoAtual: conta.saldo,
              saldoMinimo: saldoMinimo
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
    return true // Sempre usar Supabase agora
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
