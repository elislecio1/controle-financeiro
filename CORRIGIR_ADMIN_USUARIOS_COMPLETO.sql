-- ============================================================
-- 🔧 CORRIGIR ADMINISTRAÇÃO DE USUÁRIOS - COMPLETO
-- ============================================================
-- Este script corrige:
-- 1. Função delete_admin_user faltando
-- 2. Status "Pendente" (email não confirmado)
-- 3. Funcionalidades de edição
-- ============================================================

-- 0. Verificar e criar coluna 'status' se não existir
DO $$ 
BEGIN
    -- Adicionar coluna status se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending'));
        RAISE NOTICE '✅ Coluna status criada na tabela user_profiles';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna status já existe na tabela user_profiles';
    END IF;
END $$;

-- 1. Remover função antiga se existir
DROP FUNCTION IF EXISTS public.delete_admin_user(UUID);

-- 2. Criar função RPC para deletar usuário
CREATE OR REPLACE FUNCTION public.delete_admin_user(
    target_user_id UUID
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
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem deletar usuários.';
    END IF;
    
    -- Verificar se não está tentando deletar a si mesmo
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Você não pode deletar seu próprio usuário.';
    END IF;
    
    -- Deletar perfil do usuário (cascade vai deletar outras referências)
    DELETE FROM public.user_profiles
    WHERE user_id = target_user_id;
    
    -- Deletar usuário do auth.users (requer permissões de admin do Supabase)
    -- Nota: Esta operação requer permissões especiais do Supabase
    -- Se não funcionar, o usuário precisará ser deletado manualmente pelo dashboard do Supabase
    -- ou usar a API Admin do Supabase
    
    RAISE NOTICE 'Perfil do usuário % deletado. Se o usuário ainda existir em auth.users, delete manualmente pelo dashboard do Supabase.', target_user_id;
END;
$$;

-- 3. Criar função para confirmar email de usuário (resolver status "Pendente")
CREATE OR REPLACE FUNCTION public.confirm_user_email(
    target_user_id UUID
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
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem confirmar emails.';
    END IF;
    
    -- Atualizar perfil para indicar que foi confirmado
    UPDATE public.user_profiles
    SET 
        updated_at = NOW()
    WHERE user_id = target_user_id;
    
    -- Atualizar status se a coluna existir (usando EXECUTE para evitar erro se não existir)
    BEGIN
        EXECUTE 'UPDATE public.user_profiles SET status = ''active'' WHERE user_id = $1' USING target_user_id;
    EXCEPTION
        WHEN undefined_column THEN
            -- Coluna status não existe, não faz nada
            NULL;
    END;
    
    RAISE NOTICE 'Email do usuário % marcado como confirmado no perfil. Para confirmar no auth.users, use o dashboard do Supabase.', target_user_id;
END;
$$;

-- 4. Criar função para atualizar informações do usuário
CREATE OR REPLACE FUNCTION public.update_admin_user(
    target_user_id UUID,
    new_email TEXT DEFAULT NULL,
    new_name TEXT DEFAULT NULL,
    new_full_name TEXT DEFAULT NULL,
    new_role TEXT DEFAULT NULL
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
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem atualizar usuários.';
    END IF;
    
    -- Validar role se fornecido
    IF new_role IS NOT NULL AND new_role NOT IN ('admin', 'user', 'viewer') THEN
        RAISE EXCEPTION 'Role inválido. Use: admin, user ou viewer.';
    END IF;
    
    -- Atualizar ou inserir perfil
    INSERT INTO public.user_profiles (user_id, email, name, full_name, role, updated_at)
    VALUES (
        target_user_id,
        COALESCE(new_email, (SELECT email FROM auth.users WHERE id = target_user_id)),
        COALESCE(new_name, (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = target_user_id)),
        COALESCE(new_full_name, (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = target_user_id)),
        COALESCE(new_role, (SELECT role FROM public.user_profiles WHERE user_id = target_user_id), 'user'),
        NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        email = COALESCE(new_email, user_profiles.email),
        name = COALESCE(new_name, user_profiles.name),
        full_name = COALESCE(new_full_name, user_profiles.full_name),
        role = COALESCE(new_role, user_profiles.role),
        updated_at = NOW();
    
    RAISE NOTICE 'Usuário % atualizado com sucesso.', target_user_id;
END;
$$;

-- 5. Verificar funções criadas
SELECT 
    routine_name,
    routine_type,
    routine_schema
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('delete_admin_user', 'confirm_user_email', 'update_admin_user')
ORDER BY routine_name;

-- 6. Atualizar status de usuários pendentes para active (se email já foi confirmado)
-- Só executa se a coluna status existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'status'
    ) THEN
        UPDATE public.user_profiles
        SET status = 'active'
        WHERE status = 'pending' 
        AND EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = user_profiles.user_id
            AND u.email_confirmed_at IS NOT NULL
        );
        RAISE NOTICE '✅ Status de usuários pendentes atualizado';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna status não existe, pulando atualização';
    END IF;
END $$;

-- 7. Listar usuários pendentes (baseado em email_confirmed_at, não na coluna status)
SELECT 
    up.user_id,
    up.email,
    up.full_name,
    up.role,
    u.email_confirmed_at,
    CASE 
        WHEN u.email_confirmed_at IS NULL THEN 'Pendente (Email não confirmado)'
        ELSE 'Confirmado'
    END as status_detalhado
FROM public.user_profiles up
LEFT JOIN auth.users u ON u.id = up.user_id
WHERE u.email_confirmed_at IS NULL
ORDER BY up.created_at DESC;

-- 8. Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Funções de administração de usuários criadas com sucesso!';
    RAISE NOTICE '🔧 Funções disponíveis:';
    RAISE NOTICE '   - delete_admin_user(user_id)';
    RAISE NOTICE '   - confirm_user_email(user_id)';
    RAISE NOTICE '   - update_admin_user(user_id, email, name, full_name, role)';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Para confirmar emails pendentes:';
    RAISE NOTICE '   Execute: SELECT confirm_user_email(user_id) para cada usuário pendente';
    RAISE NOTICE '   Ou use o dashboard do Supabase: Authentication > Users > Confirm Email';
END $$;
