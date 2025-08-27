-- Criar usuário básico para teste
-- Execute este script no SQL Editor do Supabase

-- 1. Criar usuário apenas na tabela auth.users
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

-- 2. Verificar se foi criado
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'teste@finflow.com';

-- 3. Mostrar credenciais
SELECT 
    '=== CREDENCIAIS DE LOGIN ===' as info,
    'Email: teste@finflow.com' as email,
    'Senha: 123456' as senha,
    '========================' as separator;
