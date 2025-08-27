// Criar usuário via API Supabase
// Execute: node criar_usuario_api.js

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const SUPABASE_URL = 'https://eshaahpcddqkeevxpgfk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_ku5hM79z9JTOfK4K3B8-DQ_60SnmG_q';

async function criarUsuario() {
    console.log('🔧 Criando usuário via API Supabase...\n');
    
    try {
        // Criar cliente com service role (permite criar usuários)
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // 1. Verificar se o usuário já existe
        console.log('1️⃣ Verificando se o usuário já existe...');
        const { data: existingUser, error: checkError } = await supabase.auth.admin.getUserByEmail('teste@finflow.com');
        
        if (checkError && checkError.message !== 'User not found') {
            console.log('⚠️ Erro ao verificar usuário:', checkError.message);
        } else if (existingUser) {
            console.log('✅ Usuário já existe:', existingUser.user.email);
        } else {
            console.log('ℹ️ Usuário não encontrado, criando novo...');
        }
        
        // 2. Criar novo usuário
        console.log('\n2️⃣ Criando novo usuário...');
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
        } else {
            console.log('✅ Usuário criado com sucesso!');
            console.log('   ID:', newUser.user.id);
            console.log('   Email:', newUser.user.email);
            console.log('   Email confirmado:', newUser.user.email_confirmed_at);
        }
        
        // 3. Verificar usuário criado
        console.log('\n3️⃣ Verificando usuário criado...');
        const { data: user, error: getUserError } = await supabase.auth.admin.getUserByEmail('teste@finflow.com');
        
        if (getUserError) {
            console.log('❌ Erro ao buscar usuário:', getUserError.message);
        } else {
            console.log('✅ Usuário encontrado:');
            console.log('   ID:', user.user.id);
            console.log('   Email:', user.user.email);
            console.log('   Email confirmado:', user.user.email_confirmed_at);
            console.log('   Criado em:', user.user.created_at);
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
