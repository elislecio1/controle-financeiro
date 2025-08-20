-- Sistema de Logs de Atividades dos Usuários
-- Este script cria as tabelas e funções necessárias para registrar todas as atividades

-- 1. Tabela principal de logs
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    action_type TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    old_values JSONB,
    new_values JSONB,
    description TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    can_be_undone BOOLEAN DEFAULT true,
    undone_at TIMESTAMP WITH TIME ZONE,
    undone_by UUID REFERENCES auth.users(id),
    metadata JSONB
);

-- 2. Tabela para logs de transações (mais detalhada)
CREATE TABLE IF NOT EXISTS transaction_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    transaction_id TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'mark_paid', 'mark_unpaid'
    old_status TEXT,
    new_status TEXT,
    old_values JSONB,
    new_values JSONB,
    description TEXT NOT NULL,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    can_be_undone BOOLEAN DEFAULT true,
    undone_at TIMESTAMP WITH TIME ZONE,
    undone_by UUID REFERENCES auth.users(id)
);

-- 3. Tabela para logs de configurações do sistema
CREATE TABLE IF NOT EXISTS system_config_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    config_type TEXT NOT NULL, -- 'categoria', 'conta', 'usuario', 'perfil', etc.
    action_type TEXT NOT NULL, -- 'create', 'update', 'delete'
    old_values JSONB,
    new_values JSONB,
    description TEXT NOT NULL,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    can_be_undone BOOLEAN DEFAULT true,
    undone_at TIMESTAMP WITH TIME ZONE,
    undone_by UUID REFERENCES auth.users(id)
);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action_type ON user_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_table_name ON user_activity_logs(table_name);

CREATE INDEX IF NOT EXISTS idx_transaction_logs_user_id ON transaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_created_at ON transaction_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_transaction_id ON transaction_logs(transaction_id);

CREATE INDEX IF NOT EXISTS idx_system_config_logs_user_id ON system_config_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_config_logs_created_at ON system_config_logs(created_at DESC);

-- 5. Função para registrar logs de transações
CREATE OR REPLACE FUNCTION log_transaction_activity()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    current_user_email TEXT;
    action_type TEXT;
    description TEXT;
BEGIN
    -- Obter informações do usuário atual
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
    END IF;
    
    -- Determinar tipo de ação
    IF TG_OP = 'INSERT' THEN
        action_type := 'create';
        description := 'Transação criada: ' || COALESCE(NEW.descricao, 'Sem descrição');
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'update';
        description := 'Transação atualizada: ' || COALESCE(NEW.descricao, 'Sem descrição');
        
        -- Verificar mudanças específicas
        IF OLD.status != NEW.status THEN
            IF NEW.status = 'pago' THEN
                description := 'Transação marcada como paga: ' || COALESCE(NEW.descricao, 'Sem descrição');
            ELSIF OLD.status = 'pago' AND NEW.status != 'pago' THEN
                description := 'Transação desmarcada como paga: ' || COALESCE(NEW.descricao, 'Sem descrição');
            END IF;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'delete';
        description := 'Transação excluída: ' || COALESCE(OLD.descricao, 'Sem descrição');
    END IF;
    
    -- Inserir log
    INSERT INTO transaction_logs (
        user_id,
        user_email,
        transaction_id,
        action_type,
        old_status,
        new_status,
        old_values,
        new_values,
        description,
        ip_address
    ) VALUES (
        current_user_id,
        current_user_email,
        COALESCE(NEW.id, OLD.id),
        action_type,
        OLD.status,
        NEW.status,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        description,
        inet_client_addr()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Triggers para transações
DROP TRIGGER IF EXISTS trigger_log_transaction_activity ON transactions;
CREATE TRIGGER trigger_log_transaction_activity
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION log_transaction_activity();

-- 7. Função para registrar logs de categorias
CREATE OR REPLACE FUNCTION log_categoria_activity()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    current_user_email TEXT;
    action_type TEXT;
    description TEXT;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
    END IF;
    
    IF TG_OP = 'INSERT' THEN
        action_type := 'create';
        description := 'Categoria criada: ' || NEW.nome;
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'update';
        description := 'Categoria atualizada: ' || NEW.nome;
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'delete';
        description := 'Categoria excluída: ' || OLD.nome;
    END IF;
    
    INSERT INTO system_config_logs (
        user_id,
        user_email,
        config_type,
        action_type,
        old_values,
        new_values,
        description,
        ip_address
    ) VALUES (
        current_user_id,
        current_user_email,
        'categoria',
        action_type,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        description,
        inet_client_addr()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Triggers para categorias
DROP TRIGGER IF EXISTS trigger_log_categoria_activity ON categorias;
CREATE TRIGGER trigger_log_categoria_activity
    AFTER INSERT OR UPDATE OR DELETE ON categorias
    FOR EACH ROW EXECUTE FUNCTION log_categoria_activity();

-- 9. Função para registrar logs de contas bancárias
CREATE OR REPLACE FUNCTION log_conta_activity()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    current_user_email TEXT;
    action_type TEXT;
    description TEXT;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
    END IF;
    
    IF TG_OP = 'INSERT' THEN
        action_type := 'create';
        description := 'Conta bancária criada: ' || NEW.nome;
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'update';
        description := 'Conta bancária atualizada: ' || NEW.nome;
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'delete';
        description := 'Conta bancária excluída: ' || OLD.nome;
    END IF;
    
    INSERT INTO system_config_logs (
        user_id,
        user_email,
        config_type,
        action_type,
        old_values,
        new_values,
        description,
        ip_address
    ) VALUES (
        current_user_id,
        current_user_email,
        'conta_bancaria',
        action_type,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        description,
        inet_client_addr()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Triggers para contas bancárias
DROP TRIGGER IF EXISTS trigger_log_conta_activity ON contas_bancarias;
CREATE TRIGGER trigger_log_conta_activity
    AFTER INSERT OR UPDATE OR DELETE ON contas_bancarias
    FOR EACH ROW EXECUTE FUNCTION log_conta_activity();

-- 11. Função para desfazer ação de transação
CREATE OR REPLACE FUNCTION undo_transaction_action(log_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    log_record RECORD;
    current_user_id UUID;
    current_user_email TEXT;
    success BOOLEAN := false;
BEGIN
    -- Obter informações do usuário atual
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
    END IF;
    
    -- Verificar se o usuário é admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = current_user_id AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Apenas administradores podem desfazer ações';
    END IF;
    
    -- Obter o log
    SELECT * INTO log_record FROM transaction_logs WHERE id = log_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Log não encontrado';
    END IF;
    
    IF log_record.undone_at IS NOT NULL THEN
        RAISE EXCEPTION 'Esta ação já foi desfeita';
    END IF;
    
    -- Desfazer baseado no tipo de ação
    CASE log_record.action_type
        WHEN 'create' THEN
            -- Excluir a transação criada
            DELETE FROM transactions WHERE id = log_record.transaction_id;
            success := true;
            
        WHEN 'update' THEN
            -- Restaurar valores antigos
            IF log_record.old_values IS NOT NULL THEN
                UPDATE transactions 
                SET 
                    descricao = log_record.old_values->>'descricao',
                    valor = (log_record.old_values->>'valor')::numeric,
                    tipo = log_record.old_values->>'tipo',
                    categoria = log_record.old_values->>'categoria',
                    conta = log_record.old_values->>'conta',
                    data = log_record.old_values->>'data',
                    vencimento = log_record.old_values->>'vencimento',
                    status = log_record.old_values->>'status',
                    situacao = log_record.old_values->>'situacao',
                    contato = log_record.old_values->>'contato',
                    forma = log_record.old_values->>'forma',
                    data_pagamento = log_record.old_values->>'data_pagamento',
                    updated_at = NOW()
                WHERE id = log_record.transaction_id;
                success := true;
            END IF;
            
        WHEN 'delete' THEN
            -- Recriar a transação excluída
            IF log_record.old_values IS NOT NULL THEN
                INSERT INTO transactions (
                    id, descricao, valor, tipo, categoria, conta, data, 
                    vencimento, status, situacao, contato, forma, data_pagamento,
                    user_id, created_at, updated_at
                ) VALUES (
                    log_record.transaction_id,
                    log_record.old_values->>'descricao',
                    (log_record.old_values->>'valor')::numeric,
                    log_record.old_values->>'tipo',
                    log_record.old_values->>'categoria',
                    log_record.old_values->>'conta',
                    log_record.old_values->>'data',
                    log_record.old_values->>'vencimento',
                    log_record.old_values->>'status',
                    log_record.old_values->>'situacao',
                    log_record.old_values->>'contato',
                    log_record.old_values->>'forma',
                    log_record.old_values->>'data_pagamento',
                    log_record.old_values->>'user_id',
                    log_record.old_values->>'created_at',
                    NOW()
                );
                success := true;
            END IF;
    END CASE;
    
    -- Marcar como desfeito
    IF success THEN
        UPDATE transaction_logs 
        SET 
            undone_at = NOW(),
            undone_by = current_user_id
        WHERE id = log_id;
    END IF;
    
    RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Função para desfazer ação de configuração
CREATE OR REPLACE FUNCTION undo_config_action(log_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    log_record RECORD;
    current_user_id UUID;
    success BOOLEAN := false;
BEGIN
    current_user_id := auth.uid();
    
    -- Verificar se o usuário é admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = current_user_id AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Apenas administradores podem desfazer ações';
    END IF;
    
    SELECT * INTO log_record FROM system_config_logs WHERE id = log_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Log não encontrado';
    END IF;
    
    IF log_record.undone_at IS NOT NULL THEN
        RAISE EXCEPTION 'Esta ação já foi desfeita';
    END IF;
    
    -- Desfazer baseado no tipo de configuração
    CASE log_record.config_type
        WHEN 'categoria' THEN
            CASE log_record.action_type
                WHEN 'create' THEN
                    DELETE FROM categorias WHERE id = (log_record.new_values->>'id')::UUID;
                    success := true;
                WHEN 'update' THEN
                    UPDATE categorias 
                    SET 
                        nome = log_record.old_values->>'nome',
                        descricao = log_record.old_values->>'descricao',
                        cor = log_record.old_values->>'cor',
                        updated_at = NOW()
                    WHERE id = (log_record.new_values->>'id')::UUID;
                    success := true;
                WHEN 'delete' THEN
                    INSERT INTO categorias (
                        id, nome, descricao, cor, user_id, created_at, updated_at
                    ) VALUES (
                        (log_record.old_values->>'id')::UUID,
                        log_record.old_values->>'nome',
                        log_record.old_values->>'descricao',
                        log_record.old_values->>'cor',
                        log_record.old_values->>'user_id',
                        log_record.old_values->>'created_at',
                        NOW()
                    );
                    success := true;
            END CASE;
            
        WHEN 'conta_bancaria' THEN
            CASE log_record.action_type
                WHEN 'create' THEN
                    DELETE FROM contas_bancarias WHERE id = (log_record.new_values->>'id')::UUID;
                    success := true;
                WHEN 'update' THEN
                    UPDATE contas_bancarias 
                    SET 
                        nome = log_record.old_values->>'nome',
                        banco = log_record.old_values->>'banco',
                        tipo = log_record.old_values->>'tipo',
                        saldo = (log_record.old_values->>'saldo')::numeric,
                        updated_at = NOW()
                    WHERE id = (log_record.new_values->>'id')::UUID;
                    success := true;
                WHEN 'delete' THEN
                    INSERT INTO contas_bancarias (
                        id, nome, banco, tipo, saldo, user_id, created_at, updated_at
                    ) VALUES (
                        (log_record.old_values->>'id')::UUID,
                        log_record.old_values->>'nome',
                        log_record.old_values->>'banco',
                        log_record.old_values->>'tipo',
                        (log_record.old_values->>'saldo')::numeric,
                        log_record.old_values->>'user_id',
                        log_record.old_values->>'created_at',
                        NOW()
                    );
                    success := true;
            END CASE;
    END CASE;
    
    -- Marcar como desfeito
    IF success THEN
        UPDATE system_config_logs 
        SET 
            undone_at = NOW(),
            undone_by = current_user_id
        WHERE id = log_id;
    END IF;
    
    RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. RLS Policies para logs
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config_logs ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todos os logs
CREATE POLICY "Admins can view all logs" ON user_activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can view all transaction logs" ON transaction_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can view all config logs" ON system_config_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Usuários podem ver apenas seus próprios logs
CREATE POLICY "Users can view own logs" ON user_activity_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own transaction logs" ON transaction_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own config logs" ON system_config_logs
    FOR SELECT USING (user_id = auth.uid());

-- 14. Função para obter estatísticas de logs
CREATE OR REPLACE FUNCTION get_log_statistics(
    start_date TIMESTAMP DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP DEFAULT NOW()
)
RETURNS TABLE (
    total_actions BIGINT,
    actions_by_type JSONB,
    actions_by_user JSONB,
    recent_activity JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_actions,
        jsonb_object_agg(action_type, count) as actions_by_type,
        jsonb_object_agg(user_email, user_count) as actions_by_user,
        jsonb_agg(
            jsonb_build_object(
                'user_email', user_email,
                'action_type', action_type,
                'description', description,
                'created_at', created_at
            ) ORDER BY created_at DESC LIMIT 10
        ) as recent_activity
    FROM (
        SELECT 
            action_type,
            user_email,
            description,
            created_at,
            COUNT(*) OVER (PARTITION BY action_type) as count,
            COUNT(*) OVER (PARTITION BY user_email) as user_count
        FROM transaction_logs
        WHERE created_at BETWEEN start_date AND end_date
        
        UNION ALL
        
        SELECT 
            action_type,
            user_email,
            description,
            created_at,
            COUNT(*) OVER (PARTITION BY action_type) as count,
            COUNT(*) OVER (PARTITION BY user_email) as user_count
        FROM system_config_logs
        WHERE created_at BETWEEN start_date AND end_date
    ) combined_logs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Comentários para documentação
COMMENT ON TABLE user_activity_logs IS 'Log principal de todas as atividades dos usuários';
COMMENT ON TABLE transaction_logs IS 'Log detalhado de todas as operações com transações';
COMMENT ON TABLE system_config_logs IS 'Log de configurações do sistema (categorias, contas, etc.)';
COMMENT ON FUNCTION log_transaction_activity() IS 'Função para registrar automaticamente atividades de transações';
COMMENT ON FUNCTION undo_transaction_action(UUID) IS 'Função para desfazer ações de transações (apenas admins)';
COMMENT ON FUNCTION undo_config_action(UUID) IS 'Função para desfazer ações de configuração (apenas admins)';

-- 16. Notificação de conclusão
DO $$
BEGIN
    RAISE NOTICE '✅ Sistema de logs implementado com sucesso!';
    RAISE NOTICE '📊 Tabelas criadas: user_activity_logs, transaction_logs, system_config_logs';
    RAISE NOTICE '🔧 Triggers configurados para: transactions, categorias, contas_bancarias';
    RAISE NOTICE '🛡️ RLS policies configuradas para segurança';
    RAISE NOTICE '↩️ Funções de desfazer ações criadas (apenas para admins)';
    RAISE NOTICE '📈 Função de estatísticas criada';
END $$;
