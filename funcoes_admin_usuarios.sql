-- Funções RPC para Administração de Usuários
-- Execute este script no SQL Editor do Supabase

-- 1. Função para buscar usuários (apenas admins)
CREATE OR REPLACE FUNCTION get_admin_users()
RETURNS TABLE(
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
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem acessar esta função';
    END IF;

    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.email_confirmed_at,
        u.created_at,
        u.last_sign_in_at,
        u.raw_user_meta_data,
        COALESCE(up.role, 'user') as role
    FROM auth.users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    ORDER BY u.created_at DESC;
END;
$$;

-- 2. Função para criar usuário (apenas admins)
CREATE OR REPLACE FUNCTION create_admin_user(
    user_email TEXT,
    user_password TEXT,
    user_name TEXT,
    user_role TEXT DEFAULT 'user'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
    result JSONB;
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem criar usuários';
    END IF;

    -- Verificar se o email já existe
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
        RAISE EXCEPTION 'Email já existe no sistema';
    END IF;

    -- Validar role
    IF user_role NOT IN ('admin', 'user', 'viewer') THEN
        RAISE EXCEPTION 'Role inválido. Use: admin, user ou viewer';
    END IF;

    -- Criar usuário na tabela auth.users
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data
    ) VALUES (
        gen_random_uuid(),
        user_email,
        crypt(user_password, gen_salt('bf')),
        NOW(), -- Confirmar email automaticamente
        NOW(),
        NOW(),
        jsonb_build_object('name', user_name, 'full_name', user_name)
    ) RETURNING id INTO new_user_id;

    -- Criar perfil do usuário
    INSERT INTO user_profiles (
        user_id,
        name,
        role,
        preferences
    ) VALUES (
        new_user_id,
        user_name,
        user_role,
        jsonb_build_object(
            'theme', 'light',
            'currency', 'BRL',
            'date_format', 'DD/MM/YYYY',
            'language', 'pt-BR'
        )
    );

    -- Inserir permissões básicas
    INSERT INTO user_permissions (user_id, permission_name, granted)
    VALUES 
        (new_user_id, 'login', true),
        (new_user_id, 'read', true);

    -- Adicionar permissões específicas baseadas no role
    IF user_role = 'admin' THEN
        INSERT INTO user_permissions (user_id, permission_name, granted)
        VALUES 
            (new_user_id, 'admin_access', true),
            (new_user_id, 'user_management', true),
            (new_user_id, 'system_settings', true),
            (new_user_id, 'write', true);
    ELSIF user_role = 'user' THEN
        INSERT INTO user_permissions (user_id, permission_name, granted)
        VALUES (new_user_id, 'write', true);
    END IF;

    result := jsonb_build_object(
        'success', true,
        'user_id', new_user_id,
        'message', 'Usuário criado com sucesso'
    );

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        result := jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
        RETURN result;
END;
$$;

-- 3. Função para deletar usuário (apenas admins)
CREATE OR REPLACE FUNCTION delete_admin_user(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    user_email TEXT;
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem deletar usuários';
    END IF;

    -- Verificar se não está tentando deletar a si mesmo
    IF user_id = auth.uid() THEN
        RAISE EXCEPTION 'Não é possível deletar sua própria conta';
    END IF;

    -- Verificar se o usuário existe
    SELECT email INTO user_email FROM auth.users WHERE id = user_id;
    IF user_email IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado';
    END IF;

    -- Deletar permissões
    DELETE FROM user_permissions WHERE user_id = user_id;
    
    -- Deletar perfil
    DELETE FROM user_profiles WHERE user_id = user_id;
    
    -- Deletar usuário
    DELETE FROM auth.users WHERE id = user_id;

    result := jsonb_build_object(
        'success', true,
        'message', 'Usuário deletado com sucesso'
    );

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        result := jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
        RETURN result;
END;
$$;

-- 4. Função para atualizar role do usuário (apenas admins)
CREATE OR REPLACE FUNCTION update_user_role(user_id UUID, new_role TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    user_email TEXT;
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem atualizar roles';
    END IF;

    -- Verificar se não está tentando alterar sua própria role
    IF user_id = auth.uid() THEN
        RAISE EXCEPTION 'Não é possível alterar sua própria role';
    END IF;

    -- Verificar se o usuário existe
    SELECT email INTO user_email FROM auth.users WHERE id = user_id;
    IF user_email IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado';
    END IF;

    -- Validar role
    IF new_role NOT IN ('admin', 'user', 'viewer') THEN
        RAISE EXCEPTION 'Role inválido. Use: admin, user ou viewer';
    END IF;

    -- Atualizar role no perfil
    UPDATE user_profiles 
    SET role = new_role, updated_at = NOW()
    WHERE user_id = user_id;

    -- Remover permissões antigas
    DELETE FROM user_permissions WHERE user_id = user_id;

    -- Adicionar permissões básicas
    INSERT INTO user_permissions (user_id, permission_name, granted)
    VALUES 
        (user_id, 'login', true),
        (user_id, 'read', true);

    -- Adicionar permissões específicas baseadas no novo role
    IF new_role = 'admin' THEN
        INSERT INTO user_permissions (user_id, permission_name, granted)
        VALUES 
            (user_id, 'admin_access', true),
            (user_id, 'user_management', true),
            (user_id, 'system_settings', true),
            (user_id, 'write', true);
    ELSIF new_role = 'user' THEN
        INSERT INTO user_permissions (user_id, permission_name, granted)
        VALUES (user_id, 'write', true);
    END IF;

    result := jsonb_build_object(
        'success', true,
        'message', 'Role atualizada com sucesso'
    );

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        result := jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
        RETURN result;
END;
$$;

-- 5. Função para buscar estatísticas de usuários (apenas admins)
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem acessar estatísticas';
    END IF;

    SELECT jsonb_build_object(
        'total_users', (SELECT COUNT(*) FROM auth.users),
        'confirmed_users', (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL),
        'pending_users', (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NULL),
        'admin_users', (SELECT COUNT(*) FROM user_profiles WHERE role = 'admin'),
        'user_users', (SELECT COUNT(*) FROM user_profiles WHERE role = 'user'),
        'viewer_users', (SELECT COUNT(*) FROM user_profiles WHERE role = 'viewer'),
        'active_today', (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at >= CURRENT_DATE)
    ) INTO result;

    RETURN result;
END;
$$;

-- 6. Verificar se as funções foram criadas
SELECT 
    '=== FUNÇÕES ADMIN CRIADAS ===' as info;

SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'get_admin_users',
    'create_admin_user', 
    'delete_admin_user',
    'update_user_role',
    'get_user_stats'
)
ORDER BY routine_name;
