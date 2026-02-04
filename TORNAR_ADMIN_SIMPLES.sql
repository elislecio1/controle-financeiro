-- =====================================================
-- TORNAR USUÁRIO ADMIN - VERSÃO SIMPLES
-- =====================================================
-- Este script torna o usuário atual ou um email específico como admin
-- Funciona mesmo se a tabela não tiver todas as colunas
-- =====================================================

-- OPÇÃO 1: Tornar o usuário ATUAL (logado) como admin
-- Execute esta parte se você está logado no Supabase

INSERT INTO public.user_profiles (
    user_id,
    email,
    full_name,
    name,
    role,
    created_at,
    updated_at
)
SELECT 
    auth.uid(),
    COALESCE(
        (SELECT email FROM auth.users WHERE id = auth.uid()),
        'email@não.disponível'
    ) as email,
    COALESCE(
        (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth.uid()),
        (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = auth.uid()),
        (SELECT email FROM auth.users WHERE id = auth.uid())
    ) as full_name,
    COALESCE(
        (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = auth.uid()),
        (SELECT email FROM auth.users WHERE id = auth.uid())
    ) as name,
    'admin' as role,
    COALESCE(
        (SELECT created_at FROM auth.users WHERE id = auth.uid()),
        NOW()
    ) as created_at,
    NOW() as updated_at
ON CONFLICT (user_id) 
DO UPDATE SET
    role = 'admin',
    updated_at = NOW();

-- Verificar resultado
SELECT 
    '✅ Usuário atual configurado como ADMIN!' as mensagem,
    up.user_id,
    up.email,
    up.full_name,
    up.role
FROM public.user_profiles up
WHERE up.user_id = auth.uid();

-- =====================================================
-- OPÇÃO 2: Tornar um EMAIL ESPECÍFICO como admin
-- Descomente e altere o email abaixo se preferir esta opção
-- =====================================================

/*
DO $$
DECLARE
    target_email TEXT := 'elislecio@gmail.com'; -- ⚠️ ALTERE AQUI O EMAIL
    target_user_id UUID;
BEGIN
    -- Buscar ID do usuário pelo email
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = target_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário com email % não encontrado!', target_email;
    END IF;
    
    -- Criar ou atualizar perfil como ADMIN
    INSERT INTO public.user_profiles (
        user_id,
        email,
        full_name,
        name,
        role,
        created_at,
        updated_at
    )
    SELECT 
        target_user_id,
        target_email,
        COALESCE(
            (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = target_user_id),
            (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = target_user_id),
            target_email
        ) as full_name,
        COALESCE(
            (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = target_user_id),
            target_email
        ) as name,
        'admin' as role,
        (SELECT created_at FROM auth.users WHERE id = target_user_id),
        NOW()
    ON CONFLICT (user_id) 
    DO UPDATE SET
        role = 'admin',
        updated_at = NOW();
    
    RAISE NOTICE '✅ Usuário % configurado como ADMINISTRADOR!', target_email;
END $$;

-- Verificar resultado
SELECT 
    up.user_id,
    u.email,
    up.full_name,
    up.role
FROM public.user_profiles up
JOIN auth.users u ON u.id = up.user_id
WHERE u.email = 'elislecio@gmail.com'; -- ⚠️ ALTERE AQUI O EMAIL
*/
