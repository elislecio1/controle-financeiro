-- =====================================================
-- SISTEMA DE CONVITES DE USUÁRIOS
-- =====================================================

-- 1. Criar tabela de convites
CREATE TABLE IF NOT EXISTS public.user_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    token VARCHAR(255) UNIQUE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_invites_email ON public.user_invites(email);
CREATE INDEX IF NOT EXISTS idx_user_invites_status ON public.user_invites(status);
CREATE INDEX IF NOT EXISTS idx_user_invites_expires_at ON public.user_invites(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_invites_token ON public.user_invites(token);

-- 3. Configurar RLS (Row Level Security)
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de segurança
-- Política para administradores verem todos os convites
CREATE POLICY "Administradores podem ver todos os convites" ON public.user_invites
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Política para usuários verem apenas convites que criaram
CREATE POLICY "Usuários podem ver seus próprios convites" ON public.user_invites
    FOR SELECT USING (invited_by = auth.uid());

-- Política para administradores criarem convites
CREATE POLICY "Administradores podem criar convites" ON public.user_invites
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Política para administradores atualizarem convites
CREATE POLICY "Administradores podem atualizar convites" ON public.user_invites
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Política para administradores excluírem convites
CREATE POLICY "Administradores podem excluir convites" ON public.user_invites
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 5. Criar função para gerar token único
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS VARCHAR AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_invites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_invites_updated_at
    BEFORE UPDATE ON public.user_invites
    FOR EACH ROW
    EXECUTE FUNCTION update_user_invites_updated_at();

-- 7. Criar função para criar convite
CREATE OR REPLACE FUNCTION create_user_invite(
    p_email VARCHAR,
    p_name VARCHAR,
    p_role VARCHAR DEFAULT 'user',
    p_expires_in_days INTEGER DEFAULT 7
)
RETURNS UUID AS $$
DECLARE
    v_invite_id UUID;
    v_token VARCHAR;
BEGIN
    -- Verificar se o usuário atual é administrador
    IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Apenas administradores podem criar convites';
    END IF;

    -- Verificar se o email já foi convidado e está pendente
    IF EXISTS (
        SELECT 1 FROM public.user_invites 
        WHERE email = p_email AND status = 'pending'
    ) THEN
        RAISE EXCEPTION 'Este email já possui um convite pendente';
    END IF;

    -- Gerar token único
    v_token := generate_invite_token();

    -- Criar convite
    INSERT INTO public.user_invites (
        email,
        name,
        role,
        invited_by,
        expires_at,
        token
    ) VALUES (
        p_email,
        p_name,
        p_role,
        auth.uid(),
        NOW() + (p_expires_in_days || ' days')::INTERVAL,
        v_token
    ) RETURNING id INTO v_invite_id;

    RETURN v_invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Criar função para aceitar convite
CREATE OR REPLACE FUNCTION accept_user_invite(p_token VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    v_invite RECORD;
BEGIN
    -- Buscar convite pelo token
    SELECT * INTO v_invite 
    FROM public.user_invites 
    WHERE token = p_token AND status = 'pending';

    -- Verificar se o convite existe e não expirou
    IF v_invite IS NULL THEN
        RAISE EXCEPTION 'Convite não encontrado ou já expirado';
    END IF;

    IF v_invite.expires_at < NOW() THEN
        -- Marcar como expirado
        UPDATE public.user_invites 
        SET status = 'expired' 
        WHERE id = v_invite.id;
        
        RAISE EXCEPTION 'Convite expirado';
    END IF;

    -- Marcar convite como aceito
    UPDATE public.user_invites 
    SET 
        status = 'accepted',
        accepted_at = NOW(),
        accepted_by = auth.uid()
    WHERE id = v_invite.id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Criar função para cancelar convite
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

    -- Cancelar convite
    UPDATE public.user_invites 
    SET status = 'cancelled' 
    WHERE id = p_invite_id AND status = 'pending';

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Criar função para limpar convites expirados
CREATE OR REPLACE FUNCTION cleanup_expired_invites()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.user_invites 
    SET status = 'expired' 
    WHERE status = 'pending' AND expires_at < NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Criar job para limpar convites expirados (executar diariamente)
-- Nota: Isso depende da configuração do Supabase para jobs agendados

-- 12. Inserir dados de exemplo (opcional)
-- INSERT INTO public.user_invites (email, name, role, invited_by, token) VALUES
-- ('exemplo@empresa.com', 'João Silva', 'user', '00000000-0000-0000-0000-000000000000', generate_invite_token());

-- 13. Verificar configuração
DO $$
BEGIN
    RAISE NOTICE '✅ Tabela de convites criada com sucesso!';
    RAISE NOTICE '📋 Funcionalidades disponíveis:';
    RAISE NOTICE '   - create_user_invite(email, name, role, expires_in_days)';
    RAISE NOTICE '   - accept_user_invite(token)';
    RAISE NOTICE '   - cancel_user_invite(invite_id)';
    RAISE NOTICE '   - cleanup_expired_invites()';
    RAISE NOTICE '🔒 RLS configurado: Apenas admins podem gerenciar convites';
    RAISE NOTICE '⏰ Convites expiram automaticamente após 7 dias';
END
$$;
