-- =====================================================
-- CORRIGIR ADMINISTRAÇÃO DE USUÁRIOS
-- =====================================================
-- Este script corrige os problemas de RLS e cria
-- as funções necessárias para gerenciar usuários
-- =====================================================

-- 1. Garantir que a tabela user_profiles existe e tem a estrutura correta
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name TEXT,
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Adicionar colunas que podem estar faltando
DO $$ 
BEGIN
    -- Adicionar full_name se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'full_name'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN full_name TEXT;
    END IF;
    
    -- Adicionar name se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN name TEXT;
    END IF;
    
    -- Adicionar email se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- 4. Habilitar RLS na tabela user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. REMOVER TODAS as políticas antigas que podem estar causando problemas
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;

-- 6. Criar NOVAS políticas RLS corretas

-- Política: Usuários podem ver seus próprios perfis
CREATE POLICY "Users can view own profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = user_id);

-- Política: Admins podem ver TODOS os perfis
CREATE POLICY "Admins can view all profiles"
ON public.user_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.user_id = auth.uid() 
        AND up.role = 'admin'
    )
);

-- Política: Usuários podem atualizar seus próprios perfis
CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política: Admins podem atualizar TODOS os perfis
CREATE POLICY "Admins can update all profiles"
ON public.user_profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.user_id = auth.uid() 
        AND up.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.user_id = auth.uid() 
        AND up.role = 'admin'
    )
);

-- Política: Usuários podem inserir seus próprios perfis
CREATE POLICY "Users can insert own profile"
ON public.user_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política: Admins podem inserir perfis para qualquer usuário
CREATE POLICY "Admins can insert profiles"
ON public.user_profiles FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.user_id = auth.uid() 
        AND up.role = 'admin'
    )
);

-- Política: Admins podem deletar perfis
CREATE POLICY "Admins can delete profiles"
ON public.user_profiles FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.user_id = auth.uid() 
        AND up.role = 'admin'
    )
);

-- 7. Remover funções antigas se existirem (para evitar conflitos de tipo de retorno)
DROP FUNCTION IF EXISTS public.get_admin_users();
DROP FUNCTION IF EXISTS public.update_user_role(UUID, TEXT);
DROP FUNCTION IF EXISTS public.create_admin_user(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.delete_admin_user(UUID);

-- 8. Criar função RPC para buscar usuários (para AdminUserManagement)
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
    id UUID,
    email TEXT,
    email_confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    raw_user_meta_data JSONB,
    role TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem acessar esta função.';
    END IF;
    
    -- Retornar todos os usuários com seus perfis
    RETURN QUERY
    SELECT 
        u.id,
        u.email::TEXT,
        u.email_confirmed_at,
        u.created_at,
        u.last_sign_in_at,
        u.raw_user_meta_data,
        COALESCE(up.role, 'user')::TEXT as role
    FROM auth.users u
    LEFT JOIN public.user_profiles up ON up.user_id = u.id
    ORDER BY u.created_at DESC;
END;
$$;

-- 9. Criar função RPC para atualizar role de usuário
CREATE OR REPLACE FUNCTION public.update_user_role(
    target_user_id UUID,
    new_role TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem atualizar roles.';
    END IF;
    
    -- Validar role
    IF new_role NOT IN ('admin', 'user', 'viewer') THEN
        RAISE EXCEPTION 'Role inválido. Use: admin, user ou viewer.';
    END IF;
    
    -- Atualizar ou inserir perfil
    INSERT INTO public.user_profiles (user_id, role, updated_at)
    VALUES (target_user_id, new_role, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = new_role,
        updated_at = NOW();
END;
$$;

-- 10. Sincronizar perfis existentes com auth.users
-- Criar perfis para usuários que não têm perfil ainda
INSERT INTO public.user_profiles (user_id, email, full_name, role, created_at)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email) as full_name,
    'user' as role,
    u.created_at
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 11. Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 12. Verificar funções criadas
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_admin_users', 'update_user_role');

-- 13. Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Administração de usuários configurada com sucesso!';
    RAISE NOTICE '📋 Políticas RLS criadas para user_profiles';
    RAISE NOTICE '🔧 Funções RPC criadas: get_admin_users, update_user_role';
    RAISE NOTICE '👥 Perfis sincronizados com auth.users';
END $$;
