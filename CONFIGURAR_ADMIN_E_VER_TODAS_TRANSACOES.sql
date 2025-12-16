-- Configurar elislecio@gmail.com como admin e permitir ver todas as transações
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- 1. CRIAR/ATUALIZAR FUNÇÃO RPC (se não existir)
-- ============================================
CREATE OR REPLACE FUNCTION public.create_or_update_user_profile(
    p_user_id UUID,
    p_email TEXT,
    p_name TEXT,
    p_role TEXT DEFAULT 'user',
    p_full_name TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_preferences JSONB DEFAULT '{"theme": "light", "currency": "BRL", "language": "pt-BR", "dashboard": {"show_stats": true, "show_charts": true, "default_period": "current_month"}, "date_format": "DD/MM/YYYY", "notifications": {"sms": false, "push": true, "email": true}}'::jsonb
)
RETURNS public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile public.user_profiles;
BEGIN
    INSERT INTO public.user_profiles (
        user_id, email, name, role, full_name, metadata, preferences
    )
    VALUES (
        p_user_id, p_email, p_name, p_role, p_full_name, p_metadata, p_preferences
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name,
        metadata = EXCLUDED.metadata,
        preferences = EXCLUDED.preferences,
        updated_at = NOW()
    RETURNING * INTO v_profile;

    RETURN v_profile;
END;
$$;

-- ============================================
-- 2. CRIAR FUNÇÃO PARA VERIFICAR SE É ADMIN
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin(user_id_param UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_profiles 
        WHERE user_profiles.user_id = user_id_param 
        AND user_profiles.role = 'admin'
    );
END;
$$;

-- ============================================
-- 3. CONFIGURAR PERFIL DO ADMIN
-- ============================================
SELECT public.create_or_update_user_profile(
    p_user_id => '16290525-2b7f-4157-86f5-7e1c165fc070'::UUID,
    p_email => 'elislecio@gmail.com',
    p_name => 'Elislécio Ferreira',
    p_role => 'admin',
    p_full_name => 'Elislécio Ferreira',
    p_metadata => '{}'::JSONB,
    p_preferences => '{"theme": "light", "currency": "BRL", "language": "pt-BR", "dashboard": {"show_stats": true, "show_charts": true, "default_period": "current_month"}, "date_format": "DD/MM/YYYY", "notifications": {"sms": false, "push": true, "email": true}}'::JSONB
);

-- ============================================
-- 4. CORRIGIR POLÍTICAS RLS DE user_profiles
-- ============================================
-- Remover políticas antigas (incluindo as que podem já existir)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile or admin" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile or admin" ON user_profiles;
DROP POLICY IF EXISTS "Admins have full access" ON user_profiles;

-- Política para SELECT: usuários veem seu próprio perfil OU são admin
CREATE POLICY "Users can view own profile or admin"
ON user_profiles
FOR SELECT
USING (
    auth.uid() = user_id 
    OR public.is_admin(auth.uid())
);

-- Política para INSERT: usuários podem criar seu próprio perfil
CREATE POLICY "Users can insert own profile"
ON user_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuários podem atualizar seu próprio perfil OU admin pode atualizar qualquer perfil
CREATE POLICY "Users can update own profile or admin"
ON user_profiles
FOR UPDATE
USING (
    auth.uid() = user_id 
    OR public.is_admin(auth.uid())
)
WITH CHECK (
    auth.uid() = user_id 
    OR public.is_admin(auth.uid())
);

-- ============================================
-- 5. CORRIGIR POLÍTICAS RLS DE transactions
-- ============================================
-- Remover políticas antigas (incluindo as que podem já existir)
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view own transactions or admin all" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions or admin all" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions or admin all" ON transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;

-- Política para SELECT: TODOS os usuários autenticados veem TODAS as transações
CREATE POLICY "All authenticated users can view all transactions"
ON transactions
FOR SELECT
USING (auth.role() = 'authenticated');

-- Política para INSERT: usuários podem criar suas próprias transações
CREATE POLICY "Users can insert own transactions"
ON transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuários podem atualizar suas próprias transações OU admin pode atualizar qualquer transação
CREATE POLICY "Users can update own transactions or admin all"
ON transactions
FOR UPDATE
USING (
    auth.uid() = user_id 
    OR public.is_admin(auth.uid())
)
WITH CHECK (
    auth.uid() = user_id 
    OR public.is_admin(auth.uid())
);

-- Política para DELETE: usuários podem deletar suas próprias transações OU admin pode deletar qualquer transação
CREATE POLICY "Users can delete own transactions or admin all"
ON transactions
FOR DELETE
USING (
    auth.uid() = user_id 
    OR public.is_admin(auth.uid())
);

-- ============================================
-- 6. VERIFICAR CONFIGURAÇÃO
-- ============================================
-- Verificar perfil do admin
SELECT 
    user_id,
    email,
    name,
    role,
    full_name,
    created_at
FROM user_profiles
WHERE user_id = '16290525-2b7f-4157-86f5-7e1c165fc070';

-- Verificar total de transações (admin deve ver todas)
SELECT 
    COUNT(*) as total_transacoes,
    COUNT(DISTINCT user_id) as total_usuarios,
    SUM(CASE WHEN user_id = '16290525-2b7f-4157-86f5-7e1c165fc070' THEN 1 ELSE 0 END) as minhas_transacoes
FROM transactions;

-- Verificar políticas criadas
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('user_profiles', 'transactions')
ORDER BY tablename, policyname;

