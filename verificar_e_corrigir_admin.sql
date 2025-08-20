-- =====================================================
-- VERIFICAR E CORRIGIR PERMISSÕES DO ADMIN
-- =====================================================

-- 1. Verificar se o usuário existe
DO $$
BEGIN
    RAISE NOTICE '🔍 Verificando usuário elislecio@gmail.com...';
    
    IF EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = 'elislecio@gmail.com'
    ) THEN
        RAISE NOTICE '✅ Usuário encontrado no auth.users';
    ELSE
        RAISE NOTICE '❌ Usuário NÃO encontrado no auth.users';
    END IF;
END
$$;

-- 2. Verificar se o perfil existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = (
            SELECT id FROM auth.users 
            WHERE email = 'elislecio@gmail.com'
        )
    ) THEN
        RAISE NOTICE '✅ Perfil encontrado na tabela user_profiles';
    ELSE
        RAISE NOTICE '❌ Perfil NÃO encontrado na tabela user_profiles';
    END IF;
END
$$;

-- 3. Verificar função atual
DO $$
DECLARE
    v_user_id UUID;
    v_role TEXT;
BEGIN
    -- Buscar ID do usuário
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = 'elislecio@gmail.com';
    
    IF v_user_id IS NOT NULL THEN
        -- Buscar função atual
        SELECT role INTO v_role 
        FROM public.user_profiles 
        WHERE user_id = v_user_id;
        
        RAISE NOTICE '👤 Usuário ID: %', v_user_id;
        RAISE NOTICE '🎭 Função atual: %', COALESCE(v_role, 'NÃO DEFINIDA');
        
        -- Se não tem função ou não é admin, corrigir
        IF v_role IS NULL OR v_role != 'admin' THEN
            RAISE NOTICE '⚠️ Função incorreta. Corrigindo para admin...';
            
            -- Atualizar ou inserir perfil com função admin
            INSERT INTO public.user_profiles (
                user_id,
                name,
                role,
                preferences,
                created_at,
                updated_at
            ) VALUES (
                v_user_id,
                'Elislecio Ferreira',
                'admin',
                '{"theme": "light", "currency": "BRL", "date_format": "DD/MM/YYYY", "language": "pt-BR", "notifications": {"email": true, "push": true, "sms": false}, "dashboard": {"default_period": "current_month", "show_charts": true, "show_stats": true}}'::jsonb,
                NOW(),
                NOW()
            )
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                role = 'admin',
                updated_at = NOW();
            
            RAISE NOTICE '✅ Função corrigida para admin!';
        ELSE
            RAISE NOTICE '✅ Função já está correta (admin)';
        END IF;
    ELSE
        RAISE NOTICE '❌ Usuário não encontrado';
    END IF;
END
$$;

-- 4. Verificar resultado final
DO $$
DECLARE
    v_user_id UUID;
    v_role TEXT;
    v_name TEXT;
BEGIN
    -- Buscar dados finais
    SELECT 
        u.id,
        p.role,
        p.name
    INTO 
        v_user_id,
        v_role,
        v_name
    FROM auth.users u
    LEFT JOIN public.user_profiles p ON u.id = p.user_id
    WHERE u.email = 'elislecio@gmail.com';
    
    RAISE NOTICE '📋 RESULTADO FINAL:';
    RAISE NOTICE '   Email: elislecio@gmail.com';
    RAISE NOTICE '   ID: %', v_user_id;
    RAISE NOTICE '   Nome: %', v_name;
    RAISE NOTICE '   Função: %', v_role;
    
    IF v_role = 'admin' THEN
        RAISE NOTICE '✅ SUCESSO: Usuário configurado como administrador!';
        RAISE NOTICE '🎯 Agora o menu de administração deve aparecer.';
    ELSE
        RAISE NOTICE '❌ ERRO: Usuário ainda não é administrador.';
    END IF;
END
$$;

-- 5. Verificar se a tabela user_profiles existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_profiles' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Tabela user_profiles existe';
    ELSE
        RAISE NOTICE '❌ Tabela user_profiles NÃO existe';
        RAISE NOTICE '💡 Execute primeiro o script setup_auth_tables.sql';
    END IF;
END
$$;
