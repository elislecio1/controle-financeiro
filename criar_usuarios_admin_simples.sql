-- Script SIMPLES para criar usuários administradores
-- Execute cada bloco separadamente no SQL Editor do Supabase

-- ==========================================
-- 1. VERIFICAR USUÁRIOS EXISTENTES
-- ==========================================
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE email IN ('elislecio@gmail.com', 'donsantos.financeiro@gmail.com');

-- ==========================================
-- 2. CRIAR PERFIL PARA ELISLECIO
-- ==========================================
INSERT INTO user_profiles (
    user_id,
    email,
    name,
    role,
    status,
    approved,
    allow_google_login,
    allow_email_login,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'elislecio@gmail.com' LIMIT 1),
    'elislecio@gmail.com',
    'Elislecio - Administrador',
    'admin',
    'active',
    true,
    true,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    approved = EXCLUDED.approved,
    allow_google_login = EXCLUDED.allow_google_login,
    allow_email_login = EXCLUDED.allow_email_login,
    updated_at = NOW();

-- ==========================================
-- 3. CRIAR PERFIL PARA DON SANTOS
-- ==========================================
INSERT INTO user_profiles (
    user_id,
    email,
    name,
    role,
    status,
    approved,
    allow_google_login,
    allow_email_login,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'donsantos.financeiro@gmail.com' LIMIT 1),
    'donsantos.financeiro@gmail.com',
    'Don Santos - Administrador',
    'admin',
    'active',
    true,
    true,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    approved = EXCLUDED.approved,
    allow_google_login = EXCLUDED.allow_google_login,
    allow_email_login = EXCLUDED.allow_email_login,
    updated_at = NOW();

-- ==========================================
-- 4. VERIFICAR RESULTADO
-- ==========================================
SELECT 
    up.user_id,
    up.email,
    up.name,
    up.role,
    up.status,
    up.approved,
    up.allow_google_login,
    up.allow_email_login,
    up.created_at,
    up.updated_at
FROM user_profiles up
WHERE up.email IN ('elislecio@gmail.com', 'donsantos.financeiro@gmail.com')
ORDER BY up.created_at;

-- ==========================================
-- 5. RESUMO FINAL
-- ==========================================
SELECT 
    'Configuração de Usuários Administradores' as status,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as total_ativos
FROM user_profiles 
WHERE email IN ('elislecio@gmail.com', 'donsantos.financeiro@gmail.com');
