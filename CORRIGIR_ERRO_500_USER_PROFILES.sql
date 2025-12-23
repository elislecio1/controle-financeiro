-- Corrigir erro 500 ao buscar user_profiles
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar políticas RLS existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 2. REMOVER TODAS AS POLÍTICAS PROBLEMÁTICAS
DROP POLICY IF EXISTS "Admins have full access" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;

-- 3. CRIAR POLÍTICAS SIMPLES E CORRETAS (SEM RECURSÃO)
-- Política para SELECT: usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Política para INSERT: usuários podem criar seu próprio perfil
CREATE POLICY "Users can insert own profile"
ON user_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Verificar se a função create_or_update_user_profile existe e está correta
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
    -- Tentar inserir ou atualizar o perfil
    INSERT INTO public.user_profiles (
        user_id, 
        email, 
        name, 
        role, 
        full_name, 
        metadata, 
        preferences
    )
    VALUES (
        p_user_id, 
        p_email, 
        p_name, 
        p_role, 
        p_full_name, 
        p_metadata, 
        p_preferences
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = COALESCE(EXCLUDED.role, user_profiles.role),
        full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
        metadata = EXCLUDED.metadata,
        preferences = EXCLUDED.preferences,
        updated_at = NOW()
    RETURNING * INTO v_profile;

    RETURN v_profile;
END;
$$;

-- 5. Garantir que o usuário atual tem perfil
-- Execute esta parte APÓS fazer login no sistema
DO $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Obter o user_id do usuário autenticado
    current_user_id := auth.uid();
    
    -- Se houver um usuário autenticado, criar/atualizar perfil
    IF current_user_id IS NOT NULL THEN
        -- Verificar se o perfil existe
        IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = current_user_id) THEN
            -- Criar perfil padrão
            INSERT INTO user_profiles (
                user_id,
                name,
                role,
                preferences
            )
            SELECT 
                current_user_id,
                COALESCE((raw_user_meta_data->>'full_name')::text, (raw_user_meta_data->>'name')::text, 'Usuário'),
                'user',
                '{"theme": "light", "currency": "BRL", "language": "pt-BR", "dashboard": {"show_stats": true, "show_charts": true, "default_period": "current_month"}, "date_format": "DD/MM/YYYY", "notifications": {"sms": false, "push": true, "email": true}}'::jsonb
            FROM auth.users
            WHERE id = current_user_id;
        END IF;
    END IF;
END $$;

-- 6. Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 7. Testar a query (substitua o UUID pelo seu user_id)
-- SELECT * FROM user_profiles WHERE user_id = '16290525-2b7f-4157-86f5-7e1c165fc070';

