-- Criar usuário de teste com email único
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se o usuário já existe
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE email = 'admin@finflow.com';

-- 2. Se não existir, criar o usuário
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
) ON CONFLICT (email) DO NOTHING;

-- 3. Verificar se foi criado
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'admin@finflow.com';

-- 4. Mostrar credenciais
SELECT 
    '=== CREDENCIAIS DE LOGIN ===' as info,
    'Email: admin@finflow.com' as email,
    'Senha: 123456' as senha,
    '========================' as separator;
