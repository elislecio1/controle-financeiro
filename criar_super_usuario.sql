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
DO $$
BEGIN
    -- Verificar se a tabela user_profiles existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        -- Executar a consulta apenas se a tabela existir
        PERFORM 
            u.email,
            u.email_confirmed_at,
            p.name,
            p.role,
            p.created_at
        FROM auth.users u
        LEFT JOIN public.user_profiles p ON u.id = p.user_id
        WHERE u.email = 'elislecio@gmail.com';
        
        RAISE NOTICE '✅ Consulta de verificação executada com sucesso!';
    ELSE
        RAISE NOTICE '⚠️ Tabela user_profiles ainda não existe. Execute primeiro o setup_auth_tables.sql';
    END IF;
END
$$;

-- 4. Verificar permissões (apenas se a tabela existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        PERFORM 
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
        
        RAISE NOTICE '✅ Verificação de permissões executada!';
    ELSE
        RAISE NOTICE '⚠️ Tabela user_profiles não existe. Execute primeiro o setup_auth_tables.sql';
    END IF;
END
$$;
