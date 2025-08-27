-- Criar usuário de teste sem conflito
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar usuários existentes
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;

-- 2. Verificar se o usuário já existe
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE email = 'teste@finflow.com';

-- 3. Criar usuário apenas se não existir
DO $$
BEGIN
    -- Verificar se o usuário já existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'teste@finflow.com') THEN
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
            'teste@finflow.com',
            crypt('123456', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"name": "Usuário Teste", "full_name": "Usuário Teste FinFlow"}',
            false
        );
        
        RAISE NOTICE 'Usuário teste@finflow.com criado com sucesso!';
    ELSE
        RAISE NOTICE 'Usuário teste@finflow.com já existe!';
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
WHERE email = 'teste@finflow.com';

-- 5. Mostrar credenciais
SELECT 
    '=== CREDENCIAIS DE LOGIN ===' as info,
    'Email: teste@finflow.com' as email,
    'Senha: 123456' as senha,
    'URL Local: http://localhost:3001' as url_local,
    'URL Produção: https://controle-financeiro-8x5c5s4ph-elislecio-8967s-projects.vercel.app' as url_prod,
    '========================' as separator;
