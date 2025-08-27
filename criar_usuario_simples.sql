-- Script simples para criar usuário de teste
-- Execute este script no SQL Editor do Supabase

-- 1. Criar usuário diretamente
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

-- 2. Criar perfil do usuário
INSERT INTO user_profiles (
    user_id,
    email,
    name,
    role,
    status,
    approved,
    allow_email_login,
    allow_google_login
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'teste@finflow.com'),
    'teste@finflow.com',
    'Usuário Teste',
    'admin',
    'active',
    true,
    true,
    false
);

-- 3. Verificar se foi criado
SELECT 
    u.email,
    up.name,
    up.role,
    up.status,
    up.approved,
    up.allow_email_login
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.email = 'teste@finflow.com';
