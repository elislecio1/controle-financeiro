// Teste de conexão com Supabase
// Execute: node teste_conexao_supabase.js

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const SUPABASE_URL = 'https://eshaahpcddqkeevxpgfk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD';

async function testarConexao() {
    console.log('🔍 Testando conexão com Supabase...\n');
    
    try {
        // 1. Criar cliente Supabase
        console.log('1️⃣ Criando cliente Supabase...');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Cliente criado com sucesso!\n');
        
        // 2. Testar conexão básica
        console.log('2️⃣ Testando conexão básica...');
        const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
        
        if (error) {
            console.log('⚠️ Erro na conexão básica:', error.message);
        } else {
            console.log('✅ Conexão básica funcionando!\n');
        }
        
        // 3. Testar autenticação
        console.log('3️⃣ Testando autenticação...');
        const { data: authData, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
            console.log('⚠️ Erro na autenticação:', authError.message);
        } else {
            console.log('✅ Autenticação funcionando!');
            console.log('   Sessão atual:', authData.session ? 'Ativa' : 'Nenhuma sessão');
        }
        
        // 4. Verificar tabelas
        console.log('\n4️⃣ Verificando tabelas disponíveis...');
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');
            
        if (tablesError) {
            console.log('⚠️ Erro ao verificar tabelas:', tablesError.message);
        } else {
            console.log('✅ Tabelas encontradas:', tables?.length || 0);
        }
        
        // 5. Testar query simples
        console.log('\n5️⃣ Testando query simples...');
        const { data: users, error: usersError } = await supabase
            .from('auth.users')
            .select('id, email')
            .limit(1);
            
        if (usersError) {
            console.log('⚠️ Erro ao consultar usuários:', usersError.message);
        } else {
            console.log('✅ Query de usuários funcionando!');
            console.log('   Usuários encontrados:', users?.length || 0);
        }
        
        console.log('\n🎉 Teste de conexão concluído!');
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

// Executar teste
testarConexao();
