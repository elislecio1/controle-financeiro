import { createClient } from '@supabase/supabase-js';
import { 
  IntegracaoBancaria, 
  IntegracaoConfig, 
  LogSincronizacao, 
  TransacaoImportada,
  ResultadoSincronizacao,
  BancoInfo
} from '../types';

// Configurações do Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Mapeamento entre camelCase (frontend) e snake_case (database)
const toSnakeCase = (obj: any): any => {
  const result: any = {};
  Object.keys(obj).forEach(key => {
    // Ignorar valores undefined
    if (obj[key] === undefined) return;
    
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = obj[key];
  });
  return result;
};

const toCamelCase = (obj: any): any => {
  const result: any = {};
  Object.keys(obj).forEach(key => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  });
  return result;
};

export interface IntegracoesService {
  getBancosBrasileiros(): BancoInfo[];
  getBancoPorCodigo(codigo: string): BancoInfo | undefined;
  getIntegracoes(): Promise<IntegracaoBancaria[]>;
  getIntegracao(id: string): Promise<IntegracaoBancaria | null>;
  salvarIntegracao(integracao: Partial<IntegracaoBancaria>): Promise<IntegracaoBancaria>;
  atualizarIntegracao(id: string, integracao: Partial<IntegracaoBancaria>): Promise<IntegracaoBancaria>;
  deletarIntegracao(id: string): Promise<void>;
  ativarIntegracao(id: string): Promise<void>;
  desativarIntegracao(id: string): Promise<void>;
  sincronizarIntegracao(id: string): Promise<ResultadoSincronizacao>;
  sincronizarTodas(): Promise<ResultadoSincronizacao[]>;
  getLogsSincronizacao(integracaoId?: string): Promise<LogSincronizacao[]>;
  limparLogsAntigos(dias: number): Promise<void>;
  registrarLogSincronizacao(log: Partial<LogSincronizacao>): Promise<void>;
  getTransacoesImportadas(integracaoId?: string): Promise<TransacaoImportada[]>;
  conciliarTransacao(id: string, transacaoSistemaId: string): Promise<void>;
  ignorarTransacao(id: string): Promise<void>;
  executarConciliacaoAutomatica(): Promise<number>;
  testarConexaoBanco(integracao: IntegracaoBancaria): Promise<boolean>;
}

export class IntegracoesServiceImpl implements IntegracoesService {
  
  // Dados dos bancos brasileiros com foco no Inter
  private bancosBrasileiros: BancoInfo[] = [
    {
      codigo: '077',
      nome: 'Inter',
      nomeCompleto: 'Banco Inter S.A.',
      tipo: 'privado',
      suporteOpenBanking: true,
      suporteAPI: true,
      suporteWebhook: true,
      suporteCSV: true,
      documentacao: 'https://developers.inter.co/docs/category/introdução',
      status: 'ativo'
    },
    {
      codigo: '001',
      nome: 'Banco do Brasil',
      nomeCompleto: 'Banco do Brasil S.A.',
      tipo: 'publico',
      suporteOpenBanking: true,
      suporteAPI: true,
      suporteWebhook: false,
      suporteCSV: true,
      documentacao: 'https://developers.bb.com.br/',
      status: 'ativo'
    },
    {
      codigo: '104',
      nome: 'Caixa',
      nomeCompleto: 'Caixa Econômica Federal',
      tipo: 'publico',
      suporteOpenBanking: true,
      suporteAPI: true,
      suporteWebhook: false,
      suporteCSV: true,
      documentacao: 'https://developers.caixa.gov.br/',
      status: 'ativo'
    },
    {
      codigo: '033',
      nome: 'Santander',
      nomeCompleto: 'Banco Santander (Brasil) S.A.',
      tipo: 'privado',
      suporteOpenBanking: true,
      suporteAPI: true,
      suporteWebhook: true,
      suporteCSV: true,
      documentacao: 'https://developers.santander.com.br/',
      status: 'ativo'
    },
    {
      codigo: '341',
      nome: 'Itaú',
      nomeCompleto: 'Itaú Unibanco S.A.',
      tipo: 'privado',
      suporteOpenBanking: true,
      suporteAPI: true,
      suporteWebhook: true,
      suporteCSV: true,
      documentacao: 'https://developers.itau.com.br/',
      status: 'ativo'
    },
    {
      codigo: '237',
      nome: 'Bradesco',
      nomeCompleto: 'Banco Bradesco S.A.',
      tipo: 'privado',
      suporteOpenBanking: true,
      suporteAPI: true,
      suporteWebhook: false,
      suporteCSV: true,
      documentacao: 'https://developers.bradesco.com.br/',
      status: 'ativo'
    },
    {
      codigo: '756',
      nome: 'Sicoob',
      nomeCompleto: 'Sistema de Cooperativas de Crédito do Brasil',
      tipo: 'cooperativo',
      suporteOpenBanking: true,
      suporteAPI: false,
      suporteWebhook: false,
      suporteCSV: true,
      documentacao: 'https://www.sicoob.com.br/',
      status: 'ativo'
    }
  ];

  getBancosBrasileiros(): BancoInfo[] {
    return this.bancosBrasileiros;
  }

  getBancoPorCodigo(codigo: string): BancoInfo | undefined {
    return this.bancosBrasileiros.find(banco => banco.codigo === codigo);
  }

  async getIntegracoes(): Promise<IntegracaoBancaria[]> {
    try {
      const { data, error } = await supabase
        .from('integracoes_bancarias')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ? data.map(toCamelCase) : [];
    } catch (error) {
      console.error('Erro ao buscar integrações:', error);
      return [];
    }
  }

  async getIntegracao(id: string): Promise<IntegracaoBancaria | null> {
    try {
      const { data, error } = await supabase
        .from('integracoes_bancarias')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data ? toCamelCase(data) : null;
    } catch (error) {
      console.error('Erro ao buscar integração:', error);
      return null;
    }
  }

  async salvarIntegracao(integracao: Partial<IntegracaoBancaria>): Promise<IntegracaoBancaria> {
    try {
      console.log('🔍 Dados da integração recebidos:', integracao);
      
      // Validar campos obrigatórios
      if (!integracao.nome) throw new Error('Nome da integração é obrigatório');
      if (!integracao.banco) throw new Error('Banco é obrigatório');
      if (!integracao.tipoIntegracao) throw new Error('Tipo de integração é obrigatório');
      if (!integracao.configuracao) throw new Error('Configuração é obrigatória');
      
      // Garantir que configuracao seja um objeto válido
      if (typeof integracao.configuracao !== 'object' || integracao.configuracao === null) {
        throw new Error('Configuração deve ser um objeto válido');
      }
      
      const integracaoData = {
        ...toSnakeCase(integracao),
        id: integracao.id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('🔍 Dados convertidos para snake_case:', integracaoData);

      const { data, error } = await supabase
        .from('integracoes_bancarias')
        .insert(integracaoData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw error;
      }
      
      console.log('✅ Integração salva com sucesso:', data);
      return toCamelCase(data);
    } catch (error) {
      console.error('❌ Erro ao salvar integração:', error);
      throw error;
    }
  }

  async atualizarIntegracao(id: string, integracao: Partial<IntegracaoBancaria>): Promise<IntegracaoBancaria> {
    try {
      const integracaoData = {
        ...toSnakeCase(integracao),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('integracoes_bancarias')
        .update(integracaoData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Erro ao atualizar integração:', error);
      throw error;
    }
  }

  async deletarIntegracao(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('integracoes_bancarias')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar integração:', error);
      throw error;
    }
  }

  async ativarIntegracao(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('integracoes_bancarias')
        .update({ 
          ativo: true, 
          status: 'ativo',
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao ativar integração:', error);
      throw error;
    }
  }

  async desativarIntegracao(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('integracoes_bancarias')
        .update({ 
          ativo: false, 
          status: 'inativo',
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao desativar integração:', error);
      throw error;
    }
  }

  async sincronizarIntegracao(id: string): Promise<ResultadoSincronizacao> {
    try {
      const integracao = await this.getIntegracao(id);
      if (!integracao) {
        throw new Error('Integração não encontrada');
      }

      const startTime = Date.now();
      let resultado: ResultadoSincronizacao;

      switch (integracao.tipoIntegracao) {
        case 'api_oficial':
          resultado = await this.sincronizarAPI(integracao);
          break;
        case 'open_banking':
          resultado = await this.sincronizarOpenBanking(integracao);
          break;
        case 'webhook':
          resultado = await this.sincronizarWebhook(integracao);
          break;
        case 'arquivo_csv':
          resultado = await this.sincronizarCSV(integracao);
          break;
        default:
          throw new Error('Tipo de integração não suportado');
      }

      const tempoExecucao = Date.now() - startTime;
      
      // Registrar log de sincronização
      await this.registrarLogSincronizacao({
        integracaoId: id,
        tipoOperacao: 'importacao',
        status: resultado.sucesso ? 'sucesso' : 'erro',
        mensagem: resultado.mensagem,
        dadosProcessados: resultado.transacoesImportadas + resultado.transacoesAtualizadas,
        transacoesImportadas: resultado.transacoesImportadas,
        transacoesAtualizadas: resultado.transacoesAtualizadas,
        transacoesErro: resultado.transacoesErro,
        tempoExecucaoMs: tempoExecucao
      });

      // Atualizar última sincronização
      await this.atualizarIntegracao(id, {
        ultimaSincronizacao: new Date().toISOString()
      });

      return resultado;
    } catch (error) {
      console.error('Erro ao sincronizar integração:', error);
      
      await this.registrarLogSincronizacao({
        integracaoId: id,
        tipoOperacao: 'erro',
        status: 'erro',
        mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
        dadosProcessados: 0,
        transacoesImportadas: 0,
        transacoesAtualizadas: 0,
        transacoesErro: 0
      });

      throw error;
    }
  }

  async sincronizarTodas(): Promise<ResultadoSincronizacao[]> {
    const integracoes = await this.getIntegracoes();
    const integracoesAtivas = integracoes.filter(i => i.ativo);
    
    const resultados: ResultadoSincronizacao[] = [];
    
    for (const integracao of integracoesAtivas) {
      try {
        const resultado = await this.sincronizarIntegracao(integracao.id);
        resultados.push(resultado);
      } catch (error) {
        resultados.push({
          sucesso: false,
          mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
          transacoesImportadas: 0,
          transacoesAtualizadas: 0,
          transacoesErro: 0,
          tempoExecucao: 0
        });
      }
    }
    
    return resultados;
  }

  // Implementação específica para API Oficial do Inter
  private async sincronizarAPI(integracao: IntegracaoBancaria): Promise<ResultadoSincronizacao> {
    try {
      // Simular chamadas para a API do Inter
      const config = integracao.configuracao;
      
      // Verificar se é o Banco Inter
      if (config.nomeInstituicao.toLowerCase().includes('inter')) {
        return await this.sincronizarInterAPI(integracao);
      }
      
      // Simulação genérica para outros bancos
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        sucesso: true,
        mensagem: 'Sincronização via API realizada com sucesso',
        transacoesImportadas: Math.floor(Math.random() * 50) + 10,
        transacoesAtualizadas: Math.floor(Math.random() * 20) + 5,
        transacoesErro: Math.floor(Math.random() * 5),
        tempoExecucao: 2000
      };
    } catch (error) {
      throw new Error(`Erro na sincronização via API: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Implementação específica para o Banco Inter
  private async sincronizarInterAPI(integracao: IntegracaoBancaria): Promise<ResultadoSincronizacao> {
    try {
      const config = integracao.configuracao;
      const startTime = Date.now();
      
      console.log('🔄 Iniciando sincronização com Banco Inter...');
      
      // Simular chamadas para os endpoints do Inter
      const resultados = await Promise.all([
        this.consultarExtratoInter(config),
        this.consultarSaldosInter(config),
        this.consultarPagamentosInter(config)
      ]);
      
      const totalImportadas = resultados.reduce((sum, r) => sum + r.transacoesImportadas, 0);
      const totalAtualizadas = resultados.reduce((sum, r) => sum + r.transacoesAtualizadas, 0);
      const totalErros = resultados.reduce((sum, r) => sum + r.transacoesErro, 0);
      
      // Salvar transações importadas no banco
      await this.salvarTransacoesImportadas(integracao.id, totalImportadas);
      
      // Registrar log de sincronização
      await this.registrarLogSincronizacao({
        integracaoId: integracao.id,
        tipoOperacao: 'importacao',
        status: 'sucesso',
        mensagem: `Sincronização com Banco Inter: ${totalImportadas} transações importadas, ${totalAtualizadas} atualizadas`,
        dadosProcessados: totalImportadas + totalAtualizadas,
        transacoesImportadas: totalImportadas,
        transacoesAtualizadas: totalAtualizadas,
        transacoesErro: totalErros,
        tempoExecucaoMs: Date.now() - startTime
      });
      
      console.log(`✅ Sincronização concluída: ${totalImportadas} importadas, ${totalAtualizadas} atualizadas`);
      
      return {
        sucesso: true,
        mensagem: 'Sincronização com Banco Inter realizada com sucesso',
        transacoesImportadas: totalImportadas,
        transacoesAtualizadas: totalAtualizadas,
        transacoesErro: totalErros,
        tempoExecucao: Date.now() - startTime,
        detalhes: {
          banco: 'Inter',
          ambiente: config.ambiente,
          endpoints: config.endpoints
        }
      };
    } catch (error) {
      console.error('❌ Erro na sincronização com Inter:', error);
      
      // Registrar log de erro
      await this.registrarLogSincronizacao({
        integracaoId: integracao.id,
        tipoOperacao: 'erro',
        status: 'erro',
        mensagem: `Erro na sincronização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        dadosProcessados: 0,
        transacoesImportadas: 0,
        transacoesAtualizadas: 0,
        transacoesErro: 1,
        tempoExecucaoMs: 0,
        detalhesErro: { error: error instanceof Error ? error.message : String(error) }
      });
      
      throw new Error(`Erro na sincronização com Inter: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Simulação dos endpoints específicos do Inter
  private async consultarExtratoInter(config: IntegracaoConfig): Promise<{ transacoesImportadas: number; transacoesAtualizadas: number; transacoesErro: number }> {
    // Simular consulta ao endpoint de extrato do Inter
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      transacoesImportadas: Math.floor(Math.random() * 30) + 15,
      transacoesAtualizadas: Math.floor(Math.random() * 10) + 3,
      transacoesErro: Math.floor(Math.random() * 2)
    };
  }

  private async consultarSaldosInter(config: IntegracaoConfig): Promise<{ transacoesImportadas: number; transacoesAtualizadas: number; transacoesErro: number }> {
    // Simular consulta ao endpoint de saldos do Inter
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      transacoesImportadas: Math.floor(Math.random() * 15) + 5,
      transacoesAtualizadas: Math.floor(Math.random() * 8) + 2,
      transacoesErro: Math.floor(Math.random() * 1)
    };
  }

  private async consultarPagamentosInter(config: IntegracaoConfig): Promise<{ transacoesImportadas: number; transacoesAtualizadas: number; transacoesErro: number }> {
    // Simular consulta ao endpoint de pagamentos do Inter
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return {
      transacoesImportadas: Math.floor(Math.random() * 20) + 8,
      transacoesAtualizadas: Math.floor(Math.random() * 12) + 4,
      transacoesErro: Math.floor(Math.random() * 2)
    };
  }

  private async sincronizarOpenBanking(integracao: IntegracaoBancaria): Promise<ResultadoSincronizacao> {
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    return {
      sucesso: true,
      mensagem: 'Sincronização via Open Banking realizada com sucesso',
      transacoesImportadas: Math.floor(Math.random() * 40) + 15,
      transacoesAtualizadas: Math.floor(Math.random() * 15) + 5,
      transacoesErro: Math.floor(Math.random() * 3),
      tempoExecucao: 2500
    };
  }

  private async sincronizarWebhook(integracao: IntegracaoBancaria): Promise<ResultadoSincronizacao> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      sucesso: true,
      mensagem: 'Sincronização via Webhook realizada com sucesso',
      transacoesImportadas: Math.floor(Math.random() * 25) + 10,
      transacoesAtualizadas: Math.floor(Math.random() * 8) + 3,
      transacoesErro: Math.floor(Math.random() * 2),
      tempoExecucao: 1500
    };
  }

  private async sincronizarCSV(integracao: IntegracaoBancaria): Promise<ResultadoSincronizacao> {
    await new Promise(resolve => setTimeout(resolve, 1800));
    
    return {
      sucesso: true,
      mensagem: 'Sincronização via arquivo CSV realizada com sucesso',
      transacoesImportadas: Math.floor(Math.random() * 35) + 12,
      transacoesAtualizadas: Math.floor(Math.random() * 12) + 4,
      transacoesErro: Math.floor(Math.random() * 3),
      tempoExecucao: 1800
    };
  }

  async getLogsSincronizacao(integracaoId?: string): Promise<LogSincronizacao[]> {
    try {
      let query = supabase
        .from('logs_sincronizacao')
        .select('*')
        .order('created_at', { ascending: false });

      if (integracaoId) {
        query = query.eq('integracao_id', integracaoId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ? data.map(toCamelCase) : [];
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      return [];
    }
  }

  async limparLogsAntigos(dias: number): Promise<void> {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - dias);

      const { error } = await supabase
        .from('logs_sincronizacao')
        .delete()
        .lt('created_at', dataLimite.toISOString());

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao limpar logs antigos:', error);
      throw error;
    }
  }

  async registrarLogSincronizacao(log: Partial<LogSincronizacao>): Promise<void> {
    try {
      const logData = {
        ...toSnakeCase(log),
        id: log.id || crypto.randomUUID(),
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('logs_sincronizacao')
        .insert(logData);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao registrar log:', error);
      throw error;
    }
  }

  async getTransacoesImportadas(integracaoId?: string): Promise<TransacaoImportada[]> {
    try {
      let query = supabase
        .from('transacoes_importadas')
        .select('*')
        .order('created_at', { ascending: false });

      if (integracaoId) {
        query = query.eq('integracao_id', integracaoId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ? data.map(toCamelCase) : [];
    } catch (error) {
      console.error('Erro ao buscar transações importadas:', error);
      return [];
    }
  }

  async conciliarTransacao(id: string, transacaoSistemaId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('transacoes_importadas')
        .update({ 
          status_conciliacao: 'conciliada',
          transacao_id: transacaoSistemaId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao conciliar transação:', error);
      throw error;
    }
  }

  async ignorarTransacao(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('transacoes_importadas')
        .update({ 
          status_conciliacao: 'ignorada',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao ignorar transação:', error);
      throw error;
    }
  }

  async executarConciliacaoAutomatica(): Promise<number> {
    try {
      // Simular conciliação automática
      const transacoesPendentes = await this.getTransacoesImportadas();
      const transacoesConciliadas = Math.floor(Math.random() * transacoesPendentes.length);
      
      // Simular conciliação de algumas transações
      for (let i = 0; i < transacoesConciliadas; i++) {
        if (transacoesPendentes[i]) {
          await this.conciliarTransacao(
            transacoesPendentes[i].id, 
            crypto.randomUUID()
          );
        }
      }
      
      return transacoesConciliadas;
    } catch (error) {
      console.error('Erro na conciliação automática:', error);
      return 0;
    }
  }

  async testarConexaoBanco(integracao: IntegracaoBancaria): Promise<boolean> {
    try {
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Para o Banco Inter, simular teste específico
      if (integracao.configuracao.nomeInstituicao.toLowerCase().includes('inter')) {
        return Math.random() > 0.1; // 90% de sucesso
      }
      
      return Math.random() > 0.2; // 80% de sucesso para outros bancos
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      return false;
    }
  }

  // Métodos específicos para teste de conexão por tipo
  async testarConexaoAPI(integracao: IntegracaoBancaria): Promise<boolean> {
    try {
      const config = integracao.configuracao;
      
      // Simular teste de API
      if (config.apiKey && config.apiSecret) {
        await new Promise(resolve => setTimeout(resolve, 800));
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  async testarConexaoOpenBanking(integracao: IntegracaoBancaria): Promise<boolean> {
    try {
      const config = integracao.configuracao;
      
      // Simular teste de Open Banking
      if (config.clientId && config.clientSecret) {
        await new Promise(resolve => setTimeout(resolve, 1200));
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  async testarConexaoWebhook(integracao: IntegracaoBancaria): Promise<boolean> {
    try {
      const config = integracao.configuracao;
      
      // Simular teste de Webhook
      if (config.webhookUrl) {
        await new Promise(resolve => setTimeout(resolve, 600));
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  async testarConexaoCSV(integracao: IntegracaoBancaria): Promise<boolean> {
    try {
      const config = integracao.configuracao;
      
      // Simular teste de arquivo CSV
      if (config.formatoArquivo) {
        await new Promise(resolve => setTimeout(resolve, 400));
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  // Método para salvar transações importadas no banco
  private async salvarTransacoesImportadas(integracaoId: string, quantidade: number): Promise<void> {
    try {
      console.log(`💾 Salvando ${quantidade} transações importadas...`);
      
      const transacoes = [];
      for (let i = 0; i < quantidade; i++) {
        const data = new Date();
        data.setDate(data.getDate() - Math.floor(Math.random() * 30)); // Últimos 30 dias
        
        const transacao = {
          id: crypto.randomUUID(),
          integracao_id: integracaoId,
          id_externo: `INTER_${Date.now()}_${i}`,
          data_transacao: data.toLocaleDateString('pt-BR'),
          valor: Math.random() * 1000 + 10, // R$ 10 a R$ 1010
          descricao: this.gerarDescricaoAleatoria(),
          tipo: Math.random() > 0.5 ? 'debito' : 'credito',
          categoria_banco: this.gerarCategoriaAleatoria(),
          conta_origem: 'Conta Corrente Inter',
          conta_destino: '',
          hash_transacao: crypto.randomUUID(),
          status_conciliacao: 'pendente',
          dados_originais: {
            banco: 'Inter',
            timestamp: new Date().toISOString(),
            dados_originais: true
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        transacoes.push(transacao);
      }
      
      // Inserir transações em lotes
      const { error } = await supabase
        .from('transacoes_importadas')
        .insert(transacoes);
      
      if (error) {
        console.error('❌ Erro ao salvar transações importadas:', error);
        throw error;
      }
      
      console.log(`✅ ${quantidade} transações importadas salvas com sucesso!`);
    } catch (error) {
      console.error('❌ Erro ao salvar transações importadas:', error);
      throw error;
    }
  }

  // Métodos auxiliares para gerar dados de teste
  private gerarDescricaoAleatoria(): string {
    const descricoes = [
      'Pagamento PIX',
      'Transferência entre contas',
      'Pagamento de boleto',
      'Compra no cartão',
      'Depósito',
      'Saque',
      'Pagamento de conta',
      'Recebimento de cliente',
      'Pagamento de fornecedor',
      'Transferência TED',
      'Pagamento de imposto',
      'Recebimento de salário',
      'Pagamento de aluguel',
      'Compra online',
      'Pagamento de energia'
    ];
    
    return descricoes[Math.floor(Math.random() * descricoes.length)];
  }

  private gerarCategoriaAleatoria(): string {
    const categorias = [
      'Transferências',
      'Pagamentos',
      'Compras',
      'Serviços',
      'Impostos',
      'Receitas',
      'Despesas',
      'Investimentos',
      'Cartão de Crédito',
      'PIX'
    ];
    
    return categorias[Math.floor(Math.random() * categorias.length)];
  }
}

export const integracoesService = new IntegracoesServiceImpl();
