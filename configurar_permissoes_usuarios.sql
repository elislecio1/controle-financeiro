-- Configurar permissões dos usuários admin
-- Execute este script no SQL Editor do Supabase

-- 1. Criar função para verificar permissão de login
CREATE OR REPLACE FUNCTION check_user_login_permission(user_email TEXT)
RETURNS TABLE(can_login BOOLEAN, user_role TEXT, user_id UUID) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN u.email_confirmed_at IS NOT NULL THEN true
      ELSE false
    END as can_login,
    COALESCE(up.role, 'user') as user_role,
    u.id as user_id
  FROM auth.users u
  LEFT JOIN user_profiles up ON u.id = up.user_id
  WHERE u.email = user_email;
END;
$$;

-- 2. Criar tabela de permissões se não existir
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_name TEXT NOT NULL,
    granted BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, permission_name)
);

-- 3. Habilitar RLS na tabela de permissões
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS para user_permissions
DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
CREATE POLICY "Users can view own permissions" ON user_permissions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all permissions" ON user_permissions;
CREATE POLICY "Admins can manage all permissions" ON user_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 5. Inserir permissões para elislecio@gmail.com
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Buscar ID do usuário
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'elislecio@gmail.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Inserir permissões básicas
        INSERT INTO user_permissions (user_id, permission_name, granted)
        VALUES 
            (user_uuid, 'login', true),
            (user_uuid, 'admin_access', true),
            (user_uuid, 'user_management', true),
            (user_uuid, 'system_settings', true)
        ON CONFLICT (user_id, permission_name) 
        DO UPDATE SET granted = true, updated_at = NOW();
        
        RAISE NOTICE 'Permissões concedidas para elislecio@gmail.com';
    ELSE
        RAISE NOTICE 'Usuário elislecio@gmail.com não encontrado';
    END IF;
END $$;

-- 6. Inserir permissões para donsantos.financeiro@gmail.com
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Buscar ID do usuário
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'donsantos.financeiro@gmail.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Inserir permissões básicas
        INSERT INTO user_permissions (user_id, permission_name, granted)
        VALUES 
            (user_uuid, 'login', true),
            (user_uuid, 'admin_access', true),
            (user_uuid, 'user_management', true),
            (user_uuid, 'system_settings', true)
        ON CONFLICT (user_id, permission_name) 
        DO UPDATE SET granted = true, updated_at = NOW();
        
        RAISE NOTICE 'Permissões concedidas para donsantos.financeiro@gmail.com';
    ELSE
        RAISE NOTICE 'Usuário donsantos.financeiro@gmail.com não encontrado';
    END IF;
END $$;

-- 7. Atualizar perfis dos usuários para role admin
UPDATE user_profiles 
SET role = 'admin', updated_at = NOW()
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email IN ('elislecio@gmail.com', 'donsantos.financeiro@gmail.com')
);

-- 8. Verificar configuração
SELECT 
    '=== VERIFICAÇÃO DE PERMISSÕES ===' as info;

SELECT 
    u.email,
    up.role,
    u.email_confirmed_at,
    CASE WHEN u.email_confirmed_at IS NOT NULL THEN '✅ Confirmado' ELSE '❌ Não confirmado' END as status
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.email IN ('elislecio@gmail.com', 'donsantos.financeiro@gmail.com');

SELECT 
    '=== PERMISSÕES CONCEDIDAS ===' as info;

SELECT 
    u.email,
    up.permission_name,
    up.granted,
    up.created_at
FROM user_permissions up
JOIN auth.users u ON up.user_id = u.id
WHERE u.email IN ('elislecio@gmail.com', 'donsantos.financeiro@gmail.com')
ORDER BY u.email, up.permission_name;

-- 9. Testar função de permissão
SELECT 
    '=== TESTE DA FUNÇÃO ===' as info;

SELECT * FROM check_user_login_permission('elislecio@gmail.com');
SELECT * FROM check_user_login_permission('donsantos.financeiro@gmail.com');
