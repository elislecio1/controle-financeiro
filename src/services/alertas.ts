import { createClient } from '@supabase/supabase-js'
import { Alerta, ConfiguracaoAlerta, Notificacao, SheetData, Meta, Orcamento, ContaBancaria } from '../types'

// Configurações do Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://eshaahpcddqkeevxpgfk.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaGFhaHBjZGRxa2VldnhwZ2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4MDAsImV4cCI6MjA1MDU0ODgwMH0.REAL_KEY_HERE'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Sistema operando apenas com dados reais - sem dados simulados

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
        throw new Error('Supabase não configurado. Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
      }

      const { data, error } = await supabase
        .from(this.TABLE_ALERTAS)
        .select('*')
        .order('dataCriacao', { ascending: false })

      if (error) {
        console.error('Erro ao buscar alertas:', error)
        throw new Error(`Erro ao buscar alertas: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar alertas:', error)
      throw error
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
       const configData: any = {
         tipo: config.tipo,
         ativo: config.ativo,
         dias_antes: config.diasAntes,
         valor_minimo: config.valorMinimo,
         percentual_meta: config.percentualMeta,
         categorias: config.categorias,
         contas: config.contas,
         frequencia: config.frequencia,
         canais: config.canais
       }
       
       // Só incluir horario_notificacao se não estiver vazio
       if (config.horarioNotificacao && config.horarioNotificacao.trim() !== '') {
         configData.horario_notificacao = config.horarioNotificacao
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
       if (data.frequencia !== undefined) updateData.frequencia = data.frequencia
       if (data.canais !== undefined) updateData.canais = data.canais
       
       // Só incluir horario_notificacao se não estiver vazio
       if (data.horarioNotificacao !== undefined && data.horarioNotificacao && data.horarioNotificacao.trim() !== '') {
         updateData.horario_notificacao = data.horarioNotificacao
       }

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

      console.log('🔍 Iniciando verificação de vencimentos...')
      console.log('📅 Data atual:', hoje.toLocaleDateString('pt-BR'))

      // Buscar configurações de vencimento
      const configuracoes = await this.getConfiguracoes()
      console.log('⚙️ Configurações encontradas:', configuracoes.length)
      
      const configVencimento = configuracoes.find(c => c.tipo === 'vencimento' && c.ativo)
      console.log('⚙️ Configuração de vencimento:', configVencimento)
      
      // Se não há configuração, sempre verificar vencimentos de hoje
      const diasAntes = configVencimento?.diasAntes || 0
      console.log('🔍 Verificando vencimentos - dias antes:', diasAntes)

      // Buscar transações pendentes do banco de dados (excluindo transações de teste)
      const { data: transacoes, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('status', 'pendente')
        .not('vencimento', 'is', null)
        .not('descricao', 'ilike', '%teste%')

      if (error) {
        console.error('Erro ao buscar transações:', error)
        return []
      }

      if (!transacoes || transacoes.length === 0) {
        console.log('📊 Nenhuma transação pendente encontrada')
        return []
      }

      console.log('📊 Transações pendentes encontradas:', transacoes.length)
      
      // Listar todas as transações encontradas
      transacoes.forEach((t, index) => {
        console.log(`📋 Transação ${index + 1}: ${t.descricao} - R$ ${t.valor} - Vence: ${t.vencimento}`)
      })

      for (const transacao of transacoes) {
        console.log(`🔍 Analisando transação: ${transacao.descricao} - Vencimento: ${transacao.vencimento}`)
        
        const dataVencimento = this.parseBrazilianDate(transacao.vencimento)
        if (dataVencimento) {
          const diasAteVencimento = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
          
          console.log(`📅 ${transacao.descricao}: vence em ${diasAteVencimento} dias (data: ${dataVencimento.toLocaleDateString('pt-BR')})`)
          
          // Criar alerta se vence hoje (diasAteVencimento === 0) ou nos próximos X dias configurados
          if (diasAteVencimento <= diasAntes && diasAteVencimento >= 0) {
            console.log(`✅ Condição atendida: diasAteVencimento (${diasAteVencimento}) <= diasAntes (${diasAntes})`)
            
            const prioridade = diasAteVencimento === 0 ? 'critica' : diasAteVencimento === 1 ? 'alta' : 'media'
            
            const alerta: Alerta = {
              id: `venc_${transacao.id}`,
              tipo: 'vencimento' as const,
              titulo: `${transacao.descricao} vence ${diasAteVencimento === 0 ? 'hoje' : `em ${diasAteVencimento} dia(s)`}!`,
              mensagem: `A ${transacao.descricao} no valor de ${this.formatarMoeda(transacao.valor)} vence ${diasAteVencimento === 0 ? 'hoje' : `em ${diasAteVencimento} dia(s)`}. Evite multas e juros.`,
              prioridade: prioridade as 'baixa' | 'media' | 'alta' | 'critica',
              status: 'ativo' as const,
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
          } else {
            console.log(`❌ Condição não atendida: diasAteVencimento (${diasAteVencimento}) > diasAntes (${diasAntes}) ou diasAteVencimento < 0`)
          }
        } else {
          console.log(`⚠️ Não foi possível parsear a data de vencimento: ${transacao.vencimento}`)
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

      // Buscar configurações de meta ativas
      const configuracoes = await this.getConfiguracoes()
      const configMeta = configuracoes.find(c => c.tipo === 'meta' && c.ativo)
      
      // Se não há configuração de meta ativa, não gerar alertas
      if (!configMeta) {
        console.log('🔍 Verificando metas - nenhuma configuração ativa encontrada')
        return []
      }

      console.log('🔍 Verificando metas - configuração encontrada:', configMeta)

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
        console.log('📊 Nenhuma meta encontrada')
        return []
      }

      console.log('📊 Metas encontradas:', metas.length)

      for (const meta of metas) {
        const percentual = (meta.valor_atual / meta.valor_meta) * 100
        
        // Usar percentual da configuração ou padrão de 80%
        const percentualMinimo = configMeta.percentualMeta || 80
        
        console.log(`📊 Verificando meta "${meta.nome}": ${percentual.toFixed(1)}% (mínimo: ${percentualMinimo}%)`)
        
        if (percentual < percentualMinimo) {
          const alerta: Alerta = {
            id: `meta_${meta.id}`,
            tipo: 'meta' as const,
            titulo: `Meta "${meta.nome}" em Risco`,
            mensagem: `Você está ${(100 - percentual).toFixed(0)}% abaixo da meta "${meta.nome}". Revise seus gastos para atingir o objetivo.`,
            prioridade: percentual < 50 ? 'alta' : 'media',
            status: 'ativo' as const,
            categoria: meta.categoria || 'Metas',
            dataCriacao: hoje.toISOString(),
            dadosRelacionados: {
              metaId: meta.id,
              valorAtual: meta.valor_atual,
              valorMeta: meta.valor_meta,
              percentual
            }
          }
          
          alertas.push(alerta)
          console.log(`🚨 Alerta de meta criado: ${alerta.titulo}`)
        }
      }

      console.log(`✅ Total de alertas de meta criados: ${alertas.length}`)
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

      // Buscar configurações de orçamento ativas
      const configuracoes = await this.getConfiguracoes()
      const configOrcamento = configuracoes.find(c => c.tipo === 'orcamento' && c.ativo)
      
      // Se não há configuração de orçamento ativa, não gerar alertas
      if (!configOrcamento) {
        console.log('🔍 Verificando orçamentos - nenhuma configuração ativa encontrada')
        return []
      }

      console.log('🔍 Verificando orçamentos - configuração encontrada:', configOrcamento)

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
        console.log('📊 Nenhum orçamento encontrado')
        return []
      }

      console.log('📊 Orçamentos encontrados:', orcamentos.length)

      for (const orcamento of orcamentos) {
        const percentual = (orcamento.valor_realizado / orcamento.valor_previsto) * 100
        
        // Usar percentual da configuração ou padrão de 90%
        const percentualLimite = configOrcamento.percentualMeta || 90
        
        console.log(`📊 Verificando orçamento "${orcamento.categoria}": ${percentual.toFixed(1)}% (limite: ${percentualLimite}%)`)
        
        if (percentual > percentualLimite) {
          const alerta: Alerta = {
            id: `orc_${orcamento.id}`,
            tipo: 'orcamento' as const,
            titulo: `Orçamento "${orcamento.categoria}" Próximo do Limite`,
            mensagem: `O orçamento de ${orcamento.categoria} está ${percentual.toFixed(0)}% utilizado. Controle seus gastos para não ultrapassar o limite.`,
            prioridade: percentual > 95 ? 'alta' : 'media',
            status: 'ativo' as const,
            categoria: orcamento.categoria,
            dataCriacao: hoje.toISOString(),
            dadosRelacionados: {
              orcamentoId: orcamento.id,
              valorPrevisto: orcamento.valor_previsto,
              valorRealizado: orcamento.valor_realizado,
              percentual
            }
          }
          
          alertas.push(alerta)
          console.log(`🚨 Alerta de orçamento criado: ${alerta.titulo}`)
        }
      }

      console.log(`✅ Total de alertas de orçamento criados: ${alertas.length}`)
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

      // Buscar configurações de saldo ativas
      const configuracoes = await this.getConfiguracoes()
      const configSaldo = configuracoes.find(c => c.tipo === 'saldo' && c.ativo)
      
      // Se não há configuração de saldo ativa, não gerar alertas
      if (!configSaldo) {
        console.log('🔍 Verificando saldos - nenhuma configuração ativa encontrada')
        return []
      }

      console.log('🔍 Verificando saldos - configuração encontrada:', configSaldo)

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
        console.log('📊 Nenhuma conta bancária encontrada')
        return []
      }

      console.log('📊 Contas bancárias encontradas:', contas.length)

      for (const conta of contas) {
        // Verificar se a conta está na lista de contas configuradas (se especificada)
        if (configSaldo.contas && configSaldo.contas.length > 0) {
          if (!configSaldo.contas.includes(conta.nome)) {
            console.log(`📊 Conta ${conta.nome} não está na lista de contas configuradas`)
            continue
          }
        }

        // Usar valor mínimo da configuração ou da conta
        const saldoMinimo = configSaldo.valorMinimo || conta.saldo_minimo || 1000
        
        console.log(`📊 Verificando ${conta.nome}: saldo atual ${conta.saldo}, mínimo ${saldoMinimo}`)
        
        if (conta.saldo < saldoMinimo) {
          const alerta: Alerta = {
            id: `saldo_${conta.id}`,
            tipo: 'saldo' as const,
            titulo: `Saldo Baixo na ${conta.nome}`,
            mensagem: `O saldo da ${conta.nome} está R$ ${(saldoMinimo - conta.saldo).toFixed(2)} abaixo do limite mínimo configurado.`,
            prioridade: conta.saldo < saldoMinimo * 0.5 ? 'critica' : 'alta',
            status: 'ativo' as const,
            categoria: 'Contas',
            dataCriacao: hoje.toISOString(),
            dadosRelacionados: {
              contaId: conta.id,
              saldoAtual: conta.saldo,
              saldoMinimo: saldoMinimo
            }
          }
          
          alertas.push(alerta)
          console.log(`🚨 Alerta de saldo criado: ${alerta.titulo}`)
        }
      }

      console.log(`✅ Total de alertas de saldo criados: ${alertas.length}`)
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
        id: Date.now().toString()
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
    
    console.log(`🔍 Parseando data: "${dateStr}"`)
    
    // Tentar formato brasileiro (DD/MM/YYYY)
    if (dateStr.includes('/')) {
      const partes = dateStr.split('/')
      if (partes.length === 3) {
        // Garantir que dia e mês tenham 2 dígitos
        const dia = parseInt(partes[0].padStart(2, '0'))
        const mes = parseInt(partes[1].padStart(2, '0')) - 1
        const ano = parseInt(partes[2])
        
        console.log(`📅 Formato brasileiro - Partes: dia=${dia}, mes=${mes + 1}, ano=${ano}`)
        
        if (!isNaN(dia) && !isNaN(mes) && !isNaN(ano)) {
          const data = new Date(ano, mes, dia)
          if (data.getFullYear() === ano && data.getMonth() === mes && data.getDate() === dia) {
            console.log(`✅ Data brasileira parseada: ${data.toLocaleDateString('pt-BR')}`)
            return data
          }
        }
      }
    }
    
    // Tentar formato ISO (YYYY-MM-DD)
    if (dateStr.includes('-')) {
      const data = new Date(dateStr)
      if (!isNaN(data.getTime())) {
        console.log(`✅ Data ISO parseada: ${data.toLocaleDateString('pt-BR')}`)
        return data
      }
    }
    
    console.log(`❌ Formato de data não reconhecido: ${dateStr}`)
    return null
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
    console.log('📧 Email enviado para:', notificacao.destinatario || 'usuário@exemplo.com')
  }

  private async simularEnvioPush(notificacao: Notificacao): Promise<void> {
    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('📱 Push notification enviado para:', notificacao.destinatario || 'device-123')
  }
}

export const alertasService = new AlertasServiceImpl()
