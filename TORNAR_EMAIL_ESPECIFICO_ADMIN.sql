-- =====================================================
-- TORNAR USUÁRIO ESPECÍFICO ADMINISTRADOR (POR EMAIL)
-- =====================================================
-- Use este script se quiser tornar um usuário específico admin
-- Substitua 'seu-email@exemplo.com' pelo email do usuário
-- =====================================================

-- Substitua este email pelo email do usuário que você quer tornar admin
DO $$
DECLARE
    target_email TEXT := 'elislecio@gmail.com'; -- ⚠️ ALTERE AQUI O EMAIL
    target_user_id UUID;
BEGIN
    -- 1. Buscar ID do usuário pelo email
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = target_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário com email % não encontrado!', target_email;
    END IF;
    
    -- 2. Criar ou atualizar perfil como ADMIN
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
        updated_at = NOW(),
        email = target_email,
        full_name = COALESCE(
            EXCLUDED.full_name,
            user_profiles.full_name,
            (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = target_user_id),
            (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = target_user_id)
        ),
        name = COALESCE(
            EXCLUDED.name,
            user_profiles.name,
            (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = target_user_id)
        );
    
    RAISE NOTICE '✅ Usuário % configurado como ADMINISTRADOR!', target_email;
    RAISE NOTICE '🔄 O usuário precisa fazer logout e login novamente.';
END $$;

-- Verificar resultado
SELECT 
    up.user_id,
    u.email,
    up.full_name,
    up.role,
    up.created_at,
    up.updated_at
FROM public.user_profiles up
JOIN auth.users u ON u.id = up.user_id
WHERE u.email = 'elislecio@gmail.com'; -- ⚠️ ALTERE AQUI O EMAIL
