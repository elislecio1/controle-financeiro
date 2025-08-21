-- =====================================================
-- CORREÇÕES PARA CONVITES E LOGIN
-- =====================================================

-- 1. Corrigir função de cancelar convite para excluir fisicamente
CREATE OR REPLACE FUNCTION cancel_user_invite(p_invite_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar se o usuário atual é administrador ou criador do convite
    IF NOT EXISTS (
        SELECT 1 FROM public.user_invites 
        WHERE id = p_invite_id AND (
            invited_by = auth.uid() OR 
            EXISTS (
                SELECT 1 FROM public.user_profiles 
                WHERE user_id = auth.uid() AND role = 'admin'
            )
        )
    ) THEN
        RAISE EXCEPTION 'Sem permissão para cancelar este convite';
    END IF;

    -- Excluir convite fisicamente
    DELETE FROM public.user_invites 
    WHERE id = p_invite_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Verificar se a função check_user_login_permission existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_user_login_permission') THEN
        -- Criar função de verificação de permissão de login
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
    END IF;
END $$;

-- 3. Verificar se as colunas de controle existem na tabela user_profiles
DO $$
BEGIN
    -- Adicionar coluna allow_google_login se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'allow_google_login') THEN
        ALTER TABLE user_profiles ADD COLUMN allow_google_login BOOLEAN DEFAULT false;
    END IF;
    
    -- Adicionar coluna allow_email_login se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'allow_email_login') THEN
        ALTER TABLE user_profiles ADD COLUMN allow_email_login BOOLEAN DEFAULT true;
    END IF;
    
    -- Adicionar coluna approved se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'approved') THEN
        ALTER TABLE user_profiles ADD COLUMN approved BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 4. Configurar usuário admin com acesso total
UPDATE user_profiles 
SET 
    allow_google_login = true,
    allow_email_login = true,
    approved = true,
    status = 'active'
WHERE email = 'elislecio@gmail.com';

-- 5. Verificar e configurar usuário que conseguiu acessar sem aprovação
UPDATE user_profiles 
SET 
    allow_google_login = false,
    allow_email_login = false,
    approved = false,
    status = 'inactive'
WHERE email = 'donsantos.financeiro@gmail.com';

-- 6. Limpar convites expirados e cancelados
DELETE FROM user_invites 
WHERE status IN ('expired', 'cancelled') 
   OR expires_at < NOW();

-- 7. Notificação de conclusão
DO $$ 
BEGIN
    RAISE NOTICE '✅ Correções aplicadas com sucesso!';
    RAISE NOTICE '🗑️ Convites agora são excluídos fisicamente ao cancelar';
    RAISE NOTICE '🔒 Verificação de permissão de login implementada';
    RAISE NOTICE '👤 Usuário donsantos.financeiro@gmail.com bloqueado';
    RAISE NOTICE '🧹 Convites expirados e cancelados removidos';
END $$;
