-- Configurar usuários admin específicos
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar usuários existentes
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email IN ('elislecio@gmail.com', 'donsantos.financeiro@gmail.com')
ORDER BY created_at DESC;

-- 2. Criar usuário elislecio@gmail.com
DO $$
BEGIN
    -- Verificar se o usuário já existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'elislecio@gmail.com') THEN
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
            'elislecio@gmail.com',
            crypt('Don@767987', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"name": "Elislecio", "full_name": "Elislecio Admin"}',
            true
        );
        
        RAISE NOTICE 'Usuário elislecio@gmail.com criado com sucesso!';
    ELSE
        RAISE NOTICE 'Usuário elislecio@gmail.com já existe!';
    END IF;
END $$;

-- 3. Criar usuário donsantos.financeiro@gmail.com
DO $$
BEGIN
    -- Verificar se o usuário já existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'donsantos.financeiro@gmail.com') THEN
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
            'donsantos.financeiro@gmail.com',
            crypt('Don@767987', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"name": "Don Santos", "full_name": "Don Santos Financeiro"}',
            true
        );
        
        RAISE NOTICE 'Usuário donsantos.financeiro@gmail.com criado com sucesso!';
    ELSE
        RAISE NOTICE 'Usuário donsantos.financeiro@gmail.com já existe!';
    END IF;
END $$;

-- 4. Verificar usuários criados
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email IN ('elislecio@gmail.com', 'donsantos.financeiro@gmail.com')
ORDER BY created_at DESC;

-- 5. Mostrar credenciais
SELECT 
    '=== CREDENCIAIS DE LOGIN ===' as info,
    'Email: elislecio@gmail.com' as email,
    'Senha: Don@767987' as senha,
    '========================' as separator
UNION ALL
SELECT 
    'Email: donsantos.financeiro@gmail.com' as info,
    'Senha: Don@767987' as email,
    '========================' as senha,
    '========================' as separator;
