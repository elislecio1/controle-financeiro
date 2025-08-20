-- =====================================================
-- RESTRIÇÃO DE LOGIN GOOGLE APENAS PARA USUÁRIOS PRÉ-CADASTRADOS
-- =====================================================

-- 1. Verificar se a tabela user_profiles existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        RAISE EXCEPTION 'Tabela user_profiles não existe. Execute primeiro o script de configuração de autenticação.';
    END IF;
END $$;

-- 2. Adicionar coluna para controlar se o usuário pode fazer login com Google
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS allow_google_login BOOLEAN DEFAULT false;

-- 3. Adicionar coluna para controlar se o usuário pode fazer login com email/senha
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS allow_email_login BOOLEAN DEFAULT true;

-- 4. Adicionar coluna para status de aprovação
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- 5. Atualizar usuário admin existente para permitir todos os tipos de login
UPDATE user_profiles 
SET 
    allow_google_login = true,
    allow_email_login = true,
    approved = true,
    status = 'active'
WHERE email = 'elislecio@gmail.com';

-- 6. Criar função para verificar se usuário pode fazer login
CREATE OR REPLACE FUNCTION check_user_login_permission(user_email TEXT)
RETURNS TABLE(
    can_login BOOLEAN,
    allowed_methods TEXT[],
    user_id UUID,
    role TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.approved AND up.status = 'active' as can_login,
        CASE 
            WHEN up.allow_google_login AND up.allow_email_login THEN ARRAY['google', 'email']
            WHEN up.allow_google_login THEN ARRAY['google']
            WHEN up.allow_email_login THEN ARRAY['email']
            ELSE ARRAY[]::TEXT[]
        END as allowed_methods,
        up.user_id,
        up.role,
        up.status
    FROM user_profiles up
    WHERE up.email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Criar função para registrar tentativa de login
CREATE OR REPLACE FUNCTION log_login_attempt(
    user_email TEXT,
    login_method TEXT,
    success BOOLEAN,
    ip_address TEXT DEFAULT NULL,
    user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_activity_logs (
        user_id,
        user_email,
        action_type,
        table_name,
        record_id,
        description,
        ip_address,
        user_agent,
        metadata
    ) VALUES (
        (SELECT user_id FROM user_profiles WHERE email = user_email LIMIT 1),
        user_email,
        CASE WHEN success THEN 'login_success' ELSE 'login_failed' END,
        'auth',
        gen_random_uuid(),
        CASE 
            WHEN success THEN 
                'Login bem-sucedido via ' || login_method
            ELSE 
                'Tentativa de login falhou via ' || login_method
        END,
        COALESCE(ip_address, 'unknown'),
        COALESCE(user_agent, 'unknown'),
        jsonb_build_object(
            'login_method', login_method,
            'success', success,
            'timestamp', NOW()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Criar trigger para verificar permissão de login Google
CREATE OR REPLACE FUNCTION check_google_login_permission()
RETURNS TRIGGER AS $$
DECLARE
    user_permission RECORD;
BEGIN
    -- Verificar se o usuário existe e tem permissão
    SELECT * INTO user_permission 
    FROM check_user_login_permission(NEW.email);
    
    -- Se usuário não existe ou não tem permissão
    IF NOT FOUND OR NOT user_permission.can_login THEN
        -- Registrar tentativa de login falhada
        PERFORM log_login_attempt(
            NEW.email, 
            'google', 
            false,
            current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
            current_setting('request.headers', true)::jsonb->>'user-agent'
        );
        
        RAISE EXCEPTION 'Acesso negado. Este email não está autorizado para fazer login com Google.';
    END IF;
    
    -- Verificar se Google login é permitido
    IF NOT ('google' = ANY(user_permission.allowed_methods)) THEN
        -- Registrar tentativa de login falhada
        PERFORM log_login_attempt(
            NEW.email, 
            'google', 
            false,
            current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
            current_setting('request.headers', true)::jsonb->>'user-agent'
        );
        
        RAISE EXCEPTION 'Login com Google não é permitido para este usuário.';
    END IF;
    
    -- Registrar login bem-sucedido
    PERFORM log_login_attempt(
        NEW.email, 
        'google', 
        true,
        current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
        current_setting('request.headers', true)::jsonb->>'user-agent'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Criar trigger na tabela auth.users (se existir)
-- Nota: Esta função será chamada pelo Supabase Auth hooks
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se o usuário está pré-cadastrado
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE email = NEW.email AND approved = true
    ) THEN
        -- Deletar o usuário criado automaticamente
        DELETE FROM auth.users WHERE id = NEW.id;
        
        RAISE EXCEPTION 'Usuário não autorizado. Entre em contato com o administrador.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Configurar RLS para user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seus próprios dados
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Política para admins verem todos os perfis
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 11. Função para administradores aprovarem usuários
CREATE OR REPLACE FUNCTION approve_user(
    target_email TEXT,
    allow_google BOOLEAN DEFAULT true,
    allow_email BOOLEAN DEFAULT true,
    user_role TEXT DEFAULT 'user'
)
RETURNS BOOLEAN AS $$
DECLARE
    admin_user RECORD;
BEGIN
    -- Verificar se o usuário atual é admin
    SELECT * INTO admin_user 
    FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Apenas administradores podem aprovar usuários.';
    END IF;
    
    -- Atualizar ou criar perfil do usuário
    INSERT INTO user_profiles (
        email,
        full_name,
        role,
        status,
        approved,
        allow_google_login,
        allow_email_login,
        created_at,
        updated_at
    ) VALUES (
        target_email,
        COALESCE((SELECT full_name FROM user_profiles WHERE email = target_email), 'Usuário Aprovado'),
        user_role,
        'active',
        true,
        allow_google,
        allow_email,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        approved = true,
        allow_google_login = allow_google,
        allow_email_login = allow_email,
        role = user_role,
        status = 'active',
        updated_at = NOW();
    
    -- Registrar atividade
    INSERT INTO user_activity_logs (
        user_id,
        user_email,
        action_type,
        table_name,
        record_id,
        description,
        metadata
    ) VALUES (
        admin_user.user_id,
        admin_user.email,
        'approve_user',
        'user_profiles',
        (SELECT user_id FROM user_profiles WHERE email = target_email),
        'Usuário aprovado: ' || target_email,
        jsonb_build_object(
            'target_email', target_email,
            'allow_google', allow_google,
            'allow_email', allow_email,
            'role', user_role
        )
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Função para revogar acesso de usuário
CREATE OR REPLACE FUNCTION revoke_user_access(target_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    admin_user RECORD;
BEGIN
    -- Verificar se o usuário atual é admin
    SELECT * INTO admin_user 
    FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Apenas administradores podem revogar acesso.';
    END IF;
    
    -- Revogar acesso
    UPDATE user_profiles 
    SET 
        approved = false,
        allow_google_login = false,
        allow_email_login = false,
        status = 'inactive',
        updated_at = NOW()
    WHERE email = target_email;
    
    -- Registrar atividade
    INSERT INTO user_activity_logs (
        user_id,
        user_email,
        action_type,
        table_name,
        record_id,
        description,
        metadata
    ) VALUES (
        admin_user.user_id,
        admin_user.email,
        'revoke_access',
        'user_profiles',
        (SELECT user_id FROM user_profiles WHERE email = target_email),
        'Acesso revogado: ' || target_email,
        jsonb_build_object('target_email', target_email)
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Comentários para documentação
COMMENT ON FUNCTION check_user_login_permission(TEXT) IS 'Verifica se um usuário pode fazer login e quais métodos são permitidos';
COMMENT ON FUNCTION log_login_attempt(TEXT, TEXT, BOOLEAN, TEXT, TEXT) IS 'Registra tentativas de login para auditoria';
COMMENT ON FUNCTION approve_user(TEXT, BOOLEAN, BOOLEAN, TEXT) IS 'Permite que admins aprovem novos usuários';
COMMENT ON FUNCTION revoke_user_access(TEXT) IS 'Permite que admins revoguem acesso de usuários';

-- 14. Notificação de conclusão
DO $$ 
BEGIN
    RAISE NOTICE '✅ Sistema de restrição de login Google implementado com sucesso!';
    RAISE NOTICE '📋 Usuário admin (elislecio@gmail.com) configurado com acesso total';
    RAISE NOTICE '🔒 Novos usuários precisarão ser aprovados por administradores';
    RAISE NOTICE '📊 Todas as tentativas de login serão registradas nos logs';
END $$;
