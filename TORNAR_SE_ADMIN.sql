-- ============================================
-- TORNAR-SE ADMINISTRADOR
-- ============================================
-- Execute este script APÓS fazer login no sistema
-- 
-- OPÇÃO 1: Via SQL Editor (após autenticação)
-- Execute este comando no SQL Editor do Supabase
-- (você precisa estar autenticado como usuário)

INSERT INTO user_profiles (user_id, role, full_name)
VALUES (
    auth.uid(), 
    'admin',
    COALESCE(
        (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth.uid()),
        'Administrador'
    )
)
ON CONFLICT (user_id) 
DO UPDATE SET 
    role = 'admin',
    updated_at = NOW();

-- OPÇÃO 2: Via RPC (recomendado - funciona da aplicação)
-- Use a função update_user_role() via RPC na aplicação
-- Exemplo: supabase.rpc('update_user_role', { target_user_id: 'seu-uuid', new_role: 'admin' })

-- OPÇÃO 3: Via Supabase Dashboard (SQL Editor com autenticação)
-- 1. Faça login no Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Execute o comando acima
-- 4. Verifique se funcionou:
SELECT 
    u.email,
    COALESCE(up.role, 'user') as role,
    up.full_name
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.id = auth.uid();

