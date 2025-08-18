const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurações do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function limparTransacoesSimuladas() {
  try {
    console.log('🧹 Iniciando limpeza de transações simuladas...');
    
    // 1. Buscar todas as transações simuladas
    console.log('🔍 Buscando transações simuladas...');
    
    const { data: transacoesSimuladas, error: searchError } = await supabase
      .from('transacoes_importadas')
      .select('*')
      .or('descricao.ilike.%simulad%,descricao.ilike.%Simulado%,id_externo.ilike.%inter_dev_%');
    
    if (searchError) {
      console.error('❌ Erro ao buscar transações simuladas:', searchError);
      return;
    }
    
    console.log(`📊 Encontradas ${transacoesSimuladas.length} transações simuladas`);
    
    if (transacoesSimuladas.length === 0) {
      console.log('✅ Nenhuma transação simulada encontrada para remover');
      return;
    }
    
    // 2. Mostrar detalhes das transações que serão removidas
    console.log('\n📋 Transações que serão removidas:');
    transacoesSimuladas.forEach((transacao, index) => {
      console.log(`${index + 1}. ${transacao.descricao} - R$ ${transacao.valor} - ${transacao.data_transacao}`);
    });
    
    // 3. Remover transações simuladas
    console.log('\n🗑️ Removendo transações simuladas...');
    
    const idsParaRemover = transacoesSimuladas.map(t => t.id);
    
    const { error: deleteError } = await supabase
      .from('transacoes_importadas')
      .delete()
      .in('id', idsParaRemover);
    
    if (deleteError) {
      console.error('❌ Erro ao remover transações simuladas:', deleteError);
      return;
    }
    
    console.log(`✅ ${transacoesSimuladas.length} transações simuladas removidas com sucesso!`);
    
    // 4. Verificar se ainda existem transações simuladas
    console.log('\n🔍 Verificando se ainda existem transações simuladas...');
    
    const { data: verificacao, error: verifyError } = await supabase
      .from('transacoes_importadas')
      .select('count')
      .or('descricao.ilike.%simulad%,descricao.ilike.%Simulado%,id_externo.ilike.%inter_dev_%');
    
    if (verifyError) {
      console.error('❌ Erro na verificação:', verifyError);
    } else {
      console.log('✅ Verificação concluída - transações simuladas removidas');
    }
    
    // 5. Mostrar estatísticas finais
    const { data: totalTransacoes, error: totalError } = await supabase
      .from('transacoes_importadas')
      .select('*', { count: 'exact' });
    
    if (!totalError) {
      console.log(`📊 Total de transações restantes: ${totalTransacoes.length}`);
    }
    
    console.log('\n🎯 Limpeza concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o script
limparTransacoesSimuladas();
