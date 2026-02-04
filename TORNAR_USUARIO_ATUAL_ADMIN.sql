-- =====================================================
-- TORNAR USUÁRIO ATUAL ADMINISTRADOR
-- =====================================================
-- Este script torna o usuário que está logado como admin
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Verificar qual é o usuário atual
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_user_email;

-- 2. Verificar se o usuário atual tem perfil
SELECT 
    up.id,
    up.user_id,
    up.email,
    up.full_name,
    up.name,
    up.role,
    up.status,
    up.created_at
FROM public.user_profiles up
WHERE up.user_id = auth.uid();

-- 3. Criar ou atualizar perfil do usuário atual como ADMIN
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
    updated_at = NOW(),
    email = COALESCE(
        EXCLUDED.email,
        (SELECT email FROM auth.users WHERE id = auth.uid())
    ),
    full_name = COALESCE(
        EXCLUDED.full_name,
        user_profiles.full_name,
        (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth.uid()),
        (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = auth.uid())
    ),
    name = COALESCE(
        EXCLUDED.name,
        user_profiles.name,
        (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = auth.uid())
    );

-- 4. Verificar se foi atualizado corretamente
SELECT 
    '✅ Perfil atualizado!' as mensagem,
    up.user_id,
    up.email,
    up.full_name,
    up.role,
    up.created_at
FROM public.user_profiles up
WHERE up.user_id = auth.uid();

-- 5. Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Usuário atual configurado como ADMINISTRADOR!';
    RAISE NOTICE '🔄 Faça logout e login novamente para que as mudanças tenham efeito.';
    RAISE NOTICE '📋 Você agora pode acessar a página de Administração de Usuários.';
END $$;
