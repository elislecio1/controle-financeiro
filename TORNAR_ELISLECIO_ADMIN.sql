-- =====================================================
-- TORNAR elislecio@gmail.com ADMINISTRADOR
-- =====================================================
-- Script específico para tornar elislecio@gmail.com como admin
-- =====================================================

DO $$
DECLARE
    target_email TEXT := 'elislecio@gmail.com';
    target_user_id UUID;
BEGIN
    -- 1. Buscar ID do usuário pelo email
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = target_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION '❌ Usuário com email % não encontrado! Verifique se o email está correto.', target_email;
    END IF;
    
    RAISE NOTICE '✅ Usuário encontrado: % (ID: %)', target_email, target_user_id;
    
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
        COALESCE(
            (SELECT created_at FROM auth.users WHERE id = target_user_id),
            NOW()
        ) as created_at,
        NOW() as updated_at
    ON CONFLICT (user_id) 
    DO UPDATE SET
        role = 'admin',
        email = COALESCE(EXCLUDED.email, user_profiles.email),
        full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
        name = COALESCE(EXCLUDED.name, user_profiles.name),
        updated_at = NOW();
    
    RAISE NOTICE '✅ Usuário % configurado como ADMINISTRADOR!', target_email;
    RAISE NOTICE '🔄 Faça logout e login novamente na aplicação para que as mudanças tenham efeito.';
END $$;

-- 3. Verificar resultado
SELECT 
    '✅ Verificação' as status,
    up.user_id,
    u.email,
    up.full_name,
    up.name,
    up.role,
    up.created_at,
    up.updated_at
FROM public.user_profiles up
JOIN auth.users u ON u.id = up.user_id
WHERE u.email = 'elislecio@gmail.com';

-- 4. Mensagem final
SELECT 
    '✅ SUCESSO!' as resultado,
    'elislecio@gmail.com foi configurado como ADMINISTRADOR' as mensagem,
    'Faça logout e login novamente na aplicação' as proximo_passo;
