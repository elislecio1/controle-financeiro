-- Verificar se o usuário existe
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar todos os usuários
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC;

-- 2. Verificar especificamente o usuário teste
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'teste@finflow.com';

-- 3. Verificar se há algum usuário com email similar
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email LIKE '%teste%' OR email LIKE '%finflow%';
