const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas!');
  console.log('Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão no arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Dados de exemplo baseados na sua planilha
const dadosExemplo = [
  {
    data: '2025-01-09',
    vencimento: '2025-01-09',
    valor: -87.90,
    descricao: 'ENERGIA BTN',
    conta: 'NEONEGIA',
    tipo: 'despesa',
    status: 'pago',
    data_pagamento: '2025-05-28',
    observacoes: 'Migrado da planilha - Empresa: NEONEGIA',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    data: '2025-03-20',
    vencimento: '2025-03-20',
    valor: -746.84,
    descricao: 'FGTS',
    conta: 'FGTS 02/2025',
    tipo: 'despesa',
    status: 'pendente',
    data_pagamento: null,
    observacoes: 'Migrado da planilha - Empresa: FGTS 02/2025',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    data: '2025-03-25',
    vencimento: '2025-03-25',
    valor: -179.00,
    descricao: 'ESCRITORIO VIRTUAL',
    conta: 'MYPLACEOFFICE',
    tipo: 'despesa',
    status: 'pago',
    data_pagamento: '2025-05-26',
    observacoes: 'Migrado da planilha - Empresa: MYPLACEOFFICE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    data: '2025-04-10',
    vencimento: '2025-04-10',
    valor: -1065.40,
    descricao: 'HONORARIOS CONTABEIS',
    conta: 'BUREAU',
    tipo: 'despesa',
    status: 'pago',
    data_pagamento: '2025-06-10',
    observacoes: 'Migrado da planilha - Empresa: BUREAU',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    data: '2025-04-10',
    vencimento: '2025-04-10',
    valor: -426.16,
    descricao: 'HONORARIOS CONTABEIS',
    conta: 'BUREAU',
    tipo: 'despesa',
    status: 'pago',
    data_pagamento: '2025-06-10',
    observacoes: 'Migrado da planilha - Empresa: BUREAU',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Função para inserir transações no Supabase
async function inserirTransacoesExemplo() {
  try {
    console.log('🚀 Iniciando migração de exemplo...');
    console.log(`📊 Total de transações para inserir: ${dadosExemplo.length}`);
    
    // Testar conexão com Supabase
    console.log('🔌 Testando conexão com Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('transactions')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erro na conexão com Supabase:', testError);
      throw testError;
    }
    
    console.log('✅ Conexão com Supabase estabelecida!');
    
    // Inserir transações
    console.log('📝 Inserindo transações...');
    const { data, error } = await supabase
      .from('transactions')
      .insert(dadosExemplo)
      .select();
    
    if (error) {
      console.error('❌ Erro ao inserir transações:', error);
      throw error;
    }
    
    console.log('🎉 Migração concluída com sucesso!');
    console.log(`✅ ${data.length} transações inseridas`);
    
    // Mostrar resumo
    console.log('\n📊 Resumo das transações inseridas:');
    data.forEach((transacao, index) => {
      console.log(`${index + 1}. ${transacao.descricao} - R$ ${Math.abs(transacao.valor).toFixed(2)} - ${transacao.status}`);
    });
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

// Executar migração se o script for chamado diretamente
if (require.main === module) {
  inserirTransacoesExemplo();
}

module.exports = {
  inserirTransacoesExemplo,
  dadosExemplo
};
