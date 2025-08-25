// Script final para criar usuários administradores
const { createClient } = require('@supabase/supabase-js');

console.log('🔧 Criando usuários administradores...\n');

// Configurações corretas do Supabase
const SUPABASE_URL = 'https://eshaahpcddqkeevxpgfk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_ku5hM79z9JTOfK4K3B8-DQ_60SnmG_q';

// Dados dos usuários administradores
const adminUsers = [
  {
    email: 'elislecio@gmail.com',
    password: 'Don@767987',
    name: 'Elislecio - Administrador',
    role: 'admin'
  },
  {
    email: 'donsantos.financeiro@gmail.com',
    password: 'Don@767987',
    name: 'Don Santos - Administrador',
    role: 'admin'
  }
];

async function createAdminUsers() {
  try {
    // Criar cliente Supabase com service role key
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false
      }
    });

    console.log('📋 Usuários a serem configurados:');
    adminUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });
    console.log('');

    // Verificar se os usuários já existem
    console.log('🔍 Verificando usuários existentes...');
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error(`❌ Erro ao listar usuários: ${listError.message}`);
      return;
    }

    const existingEmails = existingUsers.users.map(u => u.email);
    console.log(`📊 Total de usuários encontrados: ${existingUsers.users.length}`);

    for (const userData of adminUsers) {
      console.log(`\n🔧 Configurando usuário: ${userData.email}`);
      
      try {
        let userId = null;

        // Verificar se o usuário já existe
        const existingUser = existingUsers.users.find(u => u.email === userData.email);
        
        if (existingUser) {
          console.log(`  ✅ Usuário ${userData.email} já existe`);
          userId = existingUser.id;
        } else {
          console.log(`  🔧 Criando usuário ${userData.email}...`);
          
          // Criar usuário
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
            user_metadata: {
              name: userData.name,
              role: userData.role
            }
          });

          if (createError) {
            console.error(`  ❌ Erro ao criar usuário: ${createError.message}`);
            continue;
          }

          console.log(`  ✅ Usuário ${userData.email} criado com sucesso`);
          userId = newUser.user.id;
        }

        // Criar/atualizar perfil do usuário
        console.log(`  🔧 Configurando perfil para ${userData.email}...`);
        
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .upsert({
            user_id: userId,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            status: 'active',
            approved: true,
            allow_google_login: true,
            allow_email_login: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })
          .select()
          .single();

        if (profileError) {
          console.error(`  ❌ Erro ao criar perfil: ${profileError.message}`);
          
          // Se a tabela não existe, criar primeiro
          if (profileError.message.includes('relation "user_profiles" does not exist')) {
            console.log(`  💡 Tabela user_profiles não existe. Execute o script SQL primeiro.`);
            console.log(`  📋 Execute: criar_tabela_user_profiles.sql`);
          }
        } else {
          console.log(`  ✅ Perfil criado/atualizado para ${userData.email}`);
          console.log(`     - ID: ${profileData.user_id}`);
          console.log(`     - Role: ${profileData.role}`);
          console.log(`     - Status: ${profileData.status}`);
        }

      } catch (error) {
        console.error(`  ❌ Erro inesperado para ${userData.email}: ${error.message}`);
      }
    }

    // Verificar resultado final
    console.log('\n🔍 Verificando configuração final...');
    
    const { data: finalProfiles, error: finalError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .in('email', adminUsers.map(u => u.email))
      .order('created_at');

    if (finalError) {
      console.error(`❌ Erro ao verificar perfis finais: ${finalError.message}`);
    } else {
      console.log(`✅ ${finalProfiles.length} usuários administradores configurados:`);
      
      finalProfiles.forEach(profile => {
        console.log(`  📧 ${profile.email}`);
        console.log(`     - Nome: ${profile.name}`);
        console.log(`     - Role: ${profile.role}`);
        console.log(`     - Status: ${profile.status}`);
        console.log(`     - Aprovado: ${profile.approved ? 'Sim' : 'Não'}`);
        console.log(`     - Google Login: ${profile.allow_google_login ? 'Sim' : 'Não'}`);
        console.log(`     - Email Login: ${profile.allow_email_login ? 'Sim' : 'Não'}`);
        console.log('');
      });
    }

    console.log('🎉 Processo concluído!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('1. Acesse o sistema: http://localhost:3000/');
    console.log('2. Faça login com as credenciais criadas');
    console.log('3. Verifique se os usuários têm permissões de administrador');
    console.log('4. Teste o login com Google OAuth');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.log('');
    console.log('💡 Possíveis soluções:');
    console.log('1. Execute primeiro: criar_tabela_user_profiles.sql');
    console.log('2. Verifique se o projeto Supabase está ativo');
    console.log('3. Verifique se as credenciais estão corretas');
  }
}

// Executar o script
createAdminUsers().catch(console.error);
