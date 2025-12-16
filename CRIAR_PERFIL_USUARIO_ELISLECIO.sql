-- Criar perfil para o usuário elislecio@gmail.com
-- Execute este script no SQL Editor do Supabase
-- IMPORTANTE: Faça login primeiro no sistema antes de executar este script

-- 1. Verificar se o usuário existe
SELECT 
    id,
    email,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'name' as name,
    created_at
FROM auth.users
WHERE email = 'elislecio@gmail.com'
   OR id = '16290525-2b7f-4157-86f5-7e1c165fc070';

-- 2. Verificar se o perfil já existe
SELECT 
    user_id,
    email,
    name,
    role,
    full_name,
    created_at
FROM user_profiles
WHERE user_id = '16290525-2b7f-4157-86f5-7e1c165fc070'
   OR email = 'elislecio@gmail.com';

-- 3. Criar ou atualizar o perfil usando a função RPC (recomendado)
-- Esta função ignora RLS e cria o perfil corretamente
SELECT public.create_or_update_user_profile(
    '16290525-2b7f-4157-86f5-7e1c165fc070'::UUID,
    'elislecio@gmail.com',
    'Elislécio Ferreira',
    'admin'::TEXT,
    'Elislécio Ferreira',
    '{}'::JSONB,
    '{"theme": "light", "currency": "BRL", "language": "pt-BR", "dashboard": {"show_stats": true, "show_charts": true, "default_period": "current_month"}, "date_format": "DD/MM/YYYY", "notifications": {"sms": false, "push": true, "email": true}}'::JSONB
);

-- 4. OU criar/atualizar diretamente (se a função RPC não existir)
INSERT INTO user_profiles (
    user_id,
    email,
    name,
    role,
    full_name,
    metadata,
    preferences
)
VALUES (
    '16290525-2b7f-4157-86f5-7e1c165fc070'::UUID,
    'elislecio@gmail.com',
    'Elislécio Ferreira',
    'admin',
    'Elislécio Ferreira',
    '{}'::JSONB,
    '{"theme": "light", "currency": "BRL", "language": "pt-BR", "dashboard": {"show_stats": true, "show_charts": true, "default_period": "current_month"}, "date_format": "DD/MM/YYYY", "notifications": {"sms": false, "push": true, "email": true}}'::JSONB
)
ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    metadata = EXCLUDED.metadata,
    preferences = EXCLUDED.preferences,
    updated_at = NOW();

-- 5. Verificar o perfil criado
SELECT 
    user_id,
    email,
    name,
    role,
    full_name,
    preferences,
    created_at,
    updated_at
FROM user_profiles
WHERE user_id = '16290525-2b7f-4157-86f5-7e1c165fc070';

-- 6. Verificar políticas RLS (devem permitir acesso ao próprio perfil)
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

