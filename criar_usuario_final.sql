-- Criar usuário de teste final
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

-- 2. Criar usuário de teste (se não existir)
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
) ON CONFLICT (email) DO NOTHING;

-- 3. Verificar se foi criado
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'teste@finflow.com';

-- 4. Mostrar credenciais
SELECT 
    '=== CREDENCIAIS DE LOGIN ===' as info,
    'Email: teste@finflow.com' as email,
    'Senha: 123456' as senha,
    'URL: https://controle-financeiro-4ys46ncae-elislecio-8967s-projects.vercel.app' as url,
    '========================' as separator;
