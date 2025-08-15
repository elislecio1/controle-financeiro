// Script para verificar se as credenciais estão sendo salvas corretamente
import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase (use as mesmas do seu .env)
const SUPABASE_URL = 'https://your-project.supabase.co'; // Substitua pela sua URL
const SUPABASE_ANON_KEY = 'your-anon-key'; // Substitua pela sua chave

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verificarCredenciais() {
  try {
    console.log('🔍 Verificando credenciais salvas no banco...');
    
    // Buscar todas as integrações
    const { data: integracoes, error } = await supabase
      .from('integracoes_bancarias')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar integrações:', error);
      return;
    }
    
    console.log(`📊 Encontradas ${integracoes.length} integrações:`);
    
    integracoes.forEach((integracao, index) => {
      console.log(`\n--- Integração ${index + 1} ---`);
      console.log(`ID: ${integracao.id}`);
      console.log(`Nome: ${integracao.nome}`);
      console.log(`Banco: ${integracao.banco}`);
      console.log(`Tipo: ${integracao.tipo_integracao}`);
      console.log(`Status: ${integracao.status}`);
      console.log(`Ativo: ${integracao.ativo}`);
      
      // Verificar configuração
      if (integracao.configuracao) {
        const config = integracao.configuracao;
        console.log('\n🔧 Configuração:');
        console.log(`  Ambiente: ${config.ambiente || 'N/A'}`);
        console.log(`  API Key: ${config.apiKey ? '✅ Configurada' : '❌ Não configurada'}`);
        console.log(`  API Secret: ${config.apiSecret ? '✅ Configurada' : '❌ Não configurada'}`);
        console.log(`  Client ID: ${config.clientId ? '✅ Configurado' : '❌ Não configurado'}`);
        console.log(`  Client Secret: ${config.clientSecret ? '✅ Configurado' : '❌ Não configurado'}`);
        console.log(`  Base URL: ${config.baseUrl || 'N/A'}`);
        console.log(`  Timeout: ${config.timeout || 'N/A'}`);
        console.log(`  Tipo Certificado: ${config.tipoCertificado || 'N/A'}`);
        console.log(`  Senha Certificado: ${config.senhaCertificado ? '✅ Configurada' : '❌ Não configurada'}`);
        console.log(`  Certificado Arquivo: ${config.certificadoArquivo ? '✅ Selecionado' : '❌ Não selecionado'}`);
        console.log(`  Chave Privada Arquivo: ${config.chavePrivadaArquivo ? '✅ Selecionada' : '❌ Não selecionada'}`);
      } else {
        console.log('❌ Nenhuma configuração encontrada');
      }
      
      console.log(`\n📅 Criada em: ${integracao.created_at}`);
      console.log(`📅 Atualizada em: ${integracao.updated_at}`);
    });
    
    // Verificar se há integrações do Banco Inter
    const integracoesInter = integracoes.filter(i => i.banco === '077');
    console.log(`\n🏦 Integrações do Banco Inter: ${integracoesInter.length}`);
    
    if (integracoesInter.length > 0) {
      console.log('\n⚠️  Verificações importantes para Banco Inter:');
      integracoesInter.forEach((integracao, index) => {
        const config = integracao.configuracao;
        console.log(`\n  Integração Inter ${index + 1} (${integracao.nome}):`);
        
        if (!config.apiKey || !config.apiSecret) {
          console.log('    ❌ API Key e/ou API Secret não configuradas');
        } else {
          console.log('    ✅ API Key e API Secret configuradas');
        }
        
        if (!config.certificadoArquivo) {
          console.log('    ❌ Certificado digital não selecionado');
        } else {
          console.log('    ✅ Certificado digital selecionado');
        }
        
        if (integracao.tipo_integracao === 'api_oficial') {
          console.log('    ✅ Tipo de integração correto (API Oficial)');
        } else {
          console.log('    ⚠️  Tipo de integração pode não ser o ideal');
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar credenciais:', error);
  }
}

// Executar verificação
verificarCredenciais();
