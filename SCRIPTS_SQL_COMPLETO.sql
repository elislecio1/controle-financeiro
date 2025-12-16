-- ============================================
-- SCRIPTS SQL COMPLETOS PARA SUPABASE
-- Sistema de Controle Financeiro
-- ============================================
-- 
-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor → New Query
-- 3. Execute cada seção separadamente (ou tudo de uma vez)
-- 4. Verifique se não há erros
--
-- ============================================

-- ============================================
-- SEÇÃO 1: CRIAR TABELA user_profiles
-- ============================================
-- Execute esta seção PRIMEIRO se a tabela não existir

-- Criar tabela user_profiles se não existir
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Adicionar coluna full_name se não existir (para tabelas antigas)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'full_name'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN full_name TEXT;
    END IF;
END $$;

-- Habilitar RLS na tabela user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem seus próprios perfis
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = user_id);

-- Política para admins verem todos os perfis
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
ON user_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Política para usuários atualizarem seus próprios perfis
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para admins atualizarem qualquer perfil
DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;
CREATE POLICY "Admins can update any profile"
ON user_profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Política para admins inserirem perfis
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
CREATE POLICY "Admins can insert profiles"
ON user_profiles FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- SEÇÃO 2: POLÍTICAS RLS PARA TABELA transactions
-- ============================================
-- Execute esta seção para garantir que as políticas estão corretas

-- Habilitar RLS na tabela transactions (se ainda não estiver)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem (para evitar duplicatas)
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

-- Política 1: SELECT (Visualizar)
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

-- Política 2: INSERT (Inserir)
CREATE POLICY "Users can insert own transactions"
ON transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política 3: UPDATE (Atualizar)
CREATE POLICY "Users can update own transactions"
ON transactions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política 4: DELETE (Excluir)
CREATE POLICY "Users can delete own transactions"
ON transactions FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- SEÇÃO 3: FUNÇÕES RPC PARA ADMINISTRAÇÃO DE USUÁRIOS
-- ============================================

-- Remover funções antigas se existirem (para evitar conflitos de tipo)
DROP FUNCTION IF EXISTS get_admin_users() CASCADE;
DROP FUNCTION IF EXISTS update_user_role(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS delete_admin_user(UUID) CASCADE;

-- Função 1: Buscar usuários (apenas admins)
CREATE OR REPLACE FUNCTION get_admin_users()
RETURNS TABLE(
    id UUID,
    email TEXT,
    email_confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    raw_user_meta_data JSONB,
    role TEXT,
    full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem acessar esta função';
    END IF;

    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.email_confirmed_at,
        u.created_at,
        u.last_sign_in_at,
        u.raw_user_meta_data,
        COALESCE(up.role, 'user') as role,
        COALESCE(up.full_name, u.raw_user_meta_data->>'full_name', '') as full_name
    FROM auth.users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    ORDER BY u.created_at DESC;
END;
$$;

-- Função 2: Atualizar role do usuário
DROP FUNCTION IF EXISTS update_user_role(UUID, TEXT) CASCADE;

CREATE OR REPLACE FUNCTION update_user_role(
    target_user_id UUID,
    new_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem atualizar roles';
    END IF;

    -- Validar role
    IF new_role NOT IN ('admin', 'user', 'viewer') THEN
        RAISE EXCEPTION 'Role inválido. Use: admin, user ou viewer';
    END IF;

    -- Atualizar ou inserir role no user_profiles
    INSERT INTO user_profiles (user_id, role, full_name)
    VALUES (
        target_user_id, 
        new_role, 
        COALESCE(
            (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = target_user_id),
            ''
        )
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = new_role,
        updated_at = NOW();

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Role atualizado com sucesso'
    );
END;
$$;

-- Função 3: Deletar usuário (apenas admins)
DROP FUNCTION IF EXISTS delete_admin_user(UUID) CASCADE;

CREATE OR REPLACE FUNCTION delete_admin_user(
    target_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem deletar usuários';
    END IF;

    -- Não permitir deletar a si mesmo
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Você não pode deletar seu próprio usuário';
    END IF;

    -- Deletar perfil
    DELETE FROM user_profiles WHERE user_id = target_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Usuário deletado com sucesso'
    );
END;
$$;

-- ============================================
-- SEÇÃO 4: CRIAR PERFIL DE ADMIN PARA SEU USUÁRIO
-- ============================================
-- Execute esta seção para tornar seu usuário atual um admin
-- IMPORTANTE: Esta seção só funciona se você estiver autenticado
-- Se executar no SQL Editor sem autenticação, será ignorada sem erro

-- Criar perfil de admin para usuário atual (apenas se autenticado)
DO $$ 
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        INSERT INTO user_profiles (user_id, role, full_name)
        VALUES (
            current_user_id, 
            'admin',
            COALESCE(
                (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = current_user_id),
                'Administrador'
            )
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            role = 'admin',
            updated_at = NOW();
        
        RAISE NOTICE 'Perfil de admin criado/atualizado para o usuário: %', current_user_id;
    ELSE
        RAISE NOTICE 'Nenhum usuário autenticado. Para tornar-se admin, execute este comando após fazer login no sistema ou use a função update_user_role() via RPC.';
    END IF;
END $$;

-- ============================================
-- SEÇÃO 5: VERIFICAÇÕES E TESTES
-- ============================================

-- Verificar se a tabela user_profiles existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'user_profiles'
) as user_profiles_exists;

-- Verificar seu role atual (apenas se autenticado)
-- NOTA: Esta query só funciona se você estiver autenticado
-- Se executar no SQL Editor sem autenticação, auth.uid() retornará NULL

DO $$ 
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        RAISE NOTICE 'Usuário autenticado: %. Execute a query abaixo para verificar seu role.', current_user_id;
    ELSE
        RAISE NOTICE 'Nenhum usuário autenticado no SQL Editor.';
        RAISE NOTICE 'Para verificar seu role, execute esta query após fazer login no sistema:';
        RAISE NOTICE 'SELECT u.email, COALESCE(up.role, ''user'') as role, up.full_name FROM auth.users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE u.id = auth.uid();';
    END IF;
END $$;

-- Listar todas as funções criadas
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (routine_name LIKE '%admin%' OR routine_name LIKE '%user%')
ORDER BY routine_name;

-- Listar todas as políticas RLS da tabela transactions
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'transactions';

-- Listar todas as políticas RLS da tabela user_profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'user_profiles';

-- ============================================
-- FIM DOS SCRIPTS
-- ============================================
-- 
-- Após executar todos os scripts:
-- 1. Verifique se não há erros
-- 2. Teste o sistema em duas abas diferentes
-- 3. Verifique se a administração de usuários funciona
--
-- ============================================

