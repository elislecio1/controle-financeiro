// Criar usuário via API Supabase (corrigido)
// Execute: node criar_usuario_api_corrigido.js

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const SUPABASE_URL = 'https://eshaahpcddqkeevxpgfk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_ku5hM79z9JTOfK4K3B8-DQ_60SnmG_q';

async function criarUsuario() {
    console.log('🔧 Criando usuário via API Supabase...\n');
    
    try {
        // Criar cliente com service role (permite criar usuários)
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // 1. Criar novo usuário diretamente
        console.log('1️⃣ Criando novo usuário...');
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: 'teste@finflow.com',
            password: '123456',
            email_confirm: true,
            user_metadata: {
                name: 'Usuário Teste',
                full_name: 'Usuário Teste FinFlow'
            }
        });
        
        if (createError) {
            console.log('❌ Erro ao criar usuário:', createError.message);
            
            // Se o usuário já existe, tentar fazer login para verificar
            console.log('\n2️⃣ Tentando fazer login para verificar...');
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: 'teste@finflow.com',
                password: '123456'
            });
            
            if (signInError) {
                console.log('❌ Erro no login:', signInError.message);
            } else {
                console.log('✅ Login bem-sucedido!');
                console.log('   Usuário:', signInData.user.email);
                console.log('   ID:', signInData.user.id);
            }
        } else {
            console.log('✅ Usuário criado com sucesso!');
            console.log('   ID:', newUser.user.id);
            console.log('   Email:', newUser.user.email);
            console.log('   Email confirmado:', newUser.user.email_confirmed_at);
        }
        
        console.log('\n🎉 Processo concluído!');
        console.log('\n=== CREDENCIAIS DE LOGIN ===');
        console.log('Email: teste@finflow.com');
        console.log('Senha: 123456');
        console.log('============================');
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

// Executar função
criarUsuario();
