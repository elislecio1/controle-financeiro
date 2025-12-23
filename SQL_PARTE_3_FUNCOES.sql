-- ============================================
-- PARTE 3: FUNÇÕES RPC PARA ADMINISTRAÇÃO DE USUÁRIOS
-- ============================================
-- Execute esta parte DEPOIS da Parte 2

-- Remover funções antigas se existirem (para evitar conflitos de tipo)
DROP FUNCTION IF EXISTS get_admin_users() CASCADE;
DROP FUNCTION IF EXISTS update_user_role(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS delete_admin_user(UUID) CASCADE;

-- Função 1: Buscar usuários (apenas admins)
CREATE OR REPLACE FUNCTION get_admin_users()
RETURNS TABLE(
    id UUID,
    email TEXT,
    email_confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    raw_user_meta_data JSONB,
    role TEXT,
    full_name TEXT
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
        COALESCE(up.role, 'user') as role,
        COALESCE(up.full_name, u.raw_user_meta_data->>'full_name', '') as full_name
    FROM auth.users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    ORDER BY u.created_at DESC;
END;
$$;

-- Função 2: Atualizar role do usuário
DROP FUNCTION IF EXISTS update_user_role(UUID, TEXT) CASCADE;

CREATE OR REPLACE FUNCTION update_user_role(
    target_user_id UUID,
    new_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem atualizar roles';
    END IF;

    -- Validar role
    IF new_role NOT IN ('admin', 'user', 'viewer') THEN
        RAISE EXCEPTION 'Role inválido. Use: admin, user ou viewer';
    END IF;

    -- Atualizar ou inserir role no user_profiles
    INSERT INTO user_profiles (user_id, role, full_name)
    VALUES (
        target_user_id, 
        new_role, 
        COALESCE(
            (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = target_user_id),
            ''
        )
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = new_role,
        updated_at = NOW();

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Role atualizado com sucesso'
    );
END;
$$;

-- Função 3: Deletar usuário (apenas admins)
DROP FUNCTION IF EXISTS delete_admin_user(UUID) CASCADE;

CREATE OR REPLACE FUNCTION delete_admin_user(
    target_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem deletar usuários';
    END IF;

    -- Não permitir deletar a si mesmo
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Você não pode deletar seu próprio usuário';
    END IF;

    -- Deletar perfil
    DELETE FROM user_profiles WHERE user_id = target_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Usuário deletado com sucesso'
    );
END;
$$;

