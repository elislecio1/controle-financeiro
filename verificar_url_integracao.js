const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurações do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verificarECorrigirURL() {
  try {
    console.log('🔍 Verificando integrações bancárias...');
    
    // Buscar todas as integrações
    const { data: integracoes, error } = await supabase
      .from('integracoes_bancarias')
      .select('*');
    
    if (error) {
      console.error('❌ Erro ao buscar integrações:', error);
      return;
    }
    
    console.log(`📊 Encontradas ${integracoes.length} integrações`);
    
    // Verificar integrações do Inter
    const integracoesInter = integracoes.filter(integracao => 
      integracao.nome_banco === 'Inter' || 
      integracao.configuracao?.nome_banco === 'Inter'
    );
    
    console.log(`🏦 Encontradas ${integracoesInter.length} integrações do Banco Inter`);
    
    for (const integracao of integracoesInter) {
      console.log(`\n📋 Integração ID: ${integracao.id}`);
      console.log(`📝 Nome: ${integracao.nome}`);
      console.log(`🏦 Banco: ${integracao.nome_banco}`);
      
      const config = integracao.configuracao || {};
      const baseUrl = config.baseUrl;
      
      console.log(`🌐 URL Base atual: ${baseUrl || 'Não configurada'}`);
      
      // Verificar se a URL está incorreta
      if (baseUrl === 'https://cdp.inter.com.br') {
        console.log('⚠️  URL incorreta detectada! Corrigindo...');
        
        // Determinar a URL correta baseada no ambiente
        const ambiente = config.ambiente || 'producao';
        const novaUrl = ambiente === 'producao' 
          ? 'https://api.inter.com.br' 
          : 'https://api-hml.inter.com.br';
        
        console.log(`✅ Nova URL: ${novaUrl}`);
        
        // Atualizar a configuração
        const configAtualizada = {
          ...config,
          baseUrl: novaUrl
        };
        
        const { error: updateError } = await supabase
          .from('integracoes_bancarias')
          .update({ configuracao: configAtualizada })
          .eq('id', integracao.id);
        
        if (updateError) {
          console.error('❌ Erro ao atualizar integração:', updateError);
        } else {
          console.log('✅ URL corrigida com sucesso!');
        }
      } else if (!baseUrl) {
        console.log('⚠️  URL não configurada. Configurando URL padrão...');
        
        const ambiente = config.ambiente || 'producao';
        const novaUrl = ambiente === 'producao' 
          ? 'https://api.inter.com.br' 
          : 'https://api-hml.inter.com.br';
        
        console.log(`✅ Configurando URL: ${novaUrl}`);
        
        const configAtualizada = {
          ...config,
          baseUrl: novaUrl
        };
        
        const { error: updateError } = await supabase
          .from('integracoes_bancarias')
          .update({ configuracao: configAtualizada })
          .eq('id', integracao.id);
        
        if (updateError) {
          console.error('❌ Erro ao atualizar integração:', updateError);
        } else {
          console.log('✅ URL configurada com sucesso!');
        }
      } else {
        console.log('✅ URL já está correta');
      }
    }
    
    console.log('\n🎯 Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o script
verificarECorrigirURL();
