-- Criar usuário de teste para login
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se o usuário já existe
DO $$
DECLARE
    user_exists BOOLEAN;
    user_id UUID;
BEGIN
    -- Verificar se o usuário já existe
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'teste@finflow.com') INTO user_exists;
    
    IF NOT user_exists THEN
        -- Criar usuário no auth.users
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data,
            is_super_admin
        ) VALUES (
            gen_random_uuid(),
            'teste@finflow.com',
            crypt('123456', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"name": "Usuário Teste", "full_name": "Usuário Teste FinFlow"}',
            false
        );
        
        RAISE NOTICE 'Usuário criado com sucesso!';
    ELSE
        RAISE NOTICE 'Usuário já existe!';
    END IF;
    
    -- Obter o ID do usuário
    SELECT id INTO user_id FROM auth.users WHERE email = 'teste@finflow.com';
    
    -- Verificar se o perfil já existe
    IF NOT EXISTS(SELECT 1 FROM user_profiles WHERE user_profiles.user_id = user_id) THEN
        -- Criar perfil do usuário
        INSERT INTO user_profiles (
            user_id,
            email,
            name,
            role,
            status,
            approved,
            allow_email_login,
            allow_google_login
        ) VALUES (
            user_id,
            'teste@finflow.com',
            'Usuário Teste',
            'admin',
            'active',
            true,
            true,
            false
        );
        
        RAISE NOTICE 'Perfil criado com sucesso!';
    ELSE
        -- Atualizar perfil existente
        UPDATE user_profiles SET
            approved = true,
            allow_email_login = true,
            allow_google_login = false,
            status = 'active'
        WHERE user_profiles.user_id = user_id;
        
        RAISE NOTICE 'Perfil atualizado com sucesso!';
    END IF;
    
    RAISE NOTICE '=== CREDENCIAIS DE LOGIN ===';
    RAISE NOTICE 'Email: teste@finflow.com';
    RAISE NOTICE 'Senha: 123456';
    RAISE NOTICE '========================';
END $$;

-- 2. Verificar se foi criado corretamente
SELECT 
    u.email,
    up.name,
    up.role,
    up.status,
    up.approved,
    up.allow_email_login
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.email = 'teste@finflow.com';
