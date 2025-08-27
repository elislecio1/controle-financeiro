-- Criar usuário alternativo
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar estrutura da tabela auth.users
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Verificar usuários existentes
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;

-- 3. Tentar criar usuário com email diferente
DO $$
BEGIN
    -- Verificar se o usuário já existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@finflow.com') THEN
        -- Inserir novo usuário
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data,
            is_super_admin
        ) VALUES (
            gen_random_uuid(),
            'admin@finflow.com',
            crypt('123456', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"name": "Administrador", "full_name": "Administrador FinFlow"}',
            false
        );
        
        RAISE NOTICE 'Usuário admin@finflow.com criado com sucesso!';
    ELSE
        RAISE NOTICE 'Usuário admin@finflow.com já existe!';
    END IF;
END $$;

-- 4. Verificar se foi criado
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'admin@finflow.com';

-- 5. Mostrar credenciais
SELECT 
    '=== CREDENCIAIS DE LOGIN ===' as info,
    'Email: admin@finflow.com' as email,
    'Senha: 123456' as senha,
    '========================' as separator;
