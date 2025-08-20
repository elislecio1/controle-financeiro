-- ====================================
-- SCRIPT PARA CRIAR SUPER USUÁRIO
-- Sistema: FinFlow Pro - Controle Financeiro
-- ====================================

-- 1. Criar usuário no sistema de autenticação
-- ATENÇÃO: Execute este comando no painel do Supabase > Authentication > Users > Add User
-- Ou use a API do Supabase para criar o usuário

-- 2. Após criar o usuário, execute este script para configurar como admin
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Buscar o ID do usuário elislecio@gmail.com
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = 'elislecio@gmail.com';
    
    IF user_id IS NOT NULL THEN
        -- Atualizar o perfil para admin
        UPDATE public.user_profiles 
        SET role = 'admin', 
            name = 'Elislecio dos Santos Ferreira',
            updated_at = timezone('utc'::text, now())
        WHERE user_id = user_id;
        
        -- Verificar se foi atualizado
        IF FOUND THEN
            RAISE NOTICE '✅ Usuário % configurado como ADMIN com sucesso!', 'elislecio@gmail.com';
        ELSE
            RAISE NOTICE '⚠️ Usuário encontrado mas perfil não foi atualizado';
        END IF;
    ELSE
        RAISE NOTICE '❌ Usuário elislecio@gmail.com não encontrado. Crie primeiro no painel de autenticação.';
    END IF;
END
$$;

-- 3. Verificar se o usuário foi criado corretamente
SELECT 
    u.email,
    u.email_confirmed_at,
    p.name,
    p.role,
    p.created_at
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE u.email = 'elislecio@gmail.com';

-- 4. Verificar permissões
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
WHERE schemaname = 'public' 
AND tablename = 'user_profiles';
