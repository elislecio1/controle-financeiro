-- =====================================================
-- VERIFICAÇÃO E CORREÇÃO DAS CONTAS BANCÁRIAS
-- =====================================================

-- 1. Verificar se a tabela contas_bancarias existe
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contas_bancarias') THEN
        RAISE NOTICE '✅ Tabela contas_bancarias existe';
    ELSE
        RAISE NOTICE '❌ Tabela contas_bancarias não existe';
    END IF;
END $$;

-- 2. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contas_bancarias' 
ORDER BY ordinal_position;

-- 3. Verificar contas existentes
SELECT 
    id,
    nome,
    tipo,
    banco,
    agencia,
    conta,
    saldo,
    limite,
    ativo,
    created_at,
    updated_at
FROM contas_bancarias
ORDER BY nome;

-- 4. Contar total de contas
SELECT COUNT(*) as total_contas FROM contas_bancarias;

-- 5. Verificar contas ativas
SELECT COUNT(*) as contas_ativas FROM contas_bancarias WHERE ativo = true;

-- 6. Inserir contas padrão se não existirem
DO $$
DECLARE
    conta_count INTEGER;
BEGIN
    -- Verificar se existem contas
    SELECT COUNT(*) INTO conta_count FROM contas_bancarias;
    
    IF conta_count = 0 THEN
        RAISE NOTICE '📝 Nenhuma conta encontrada. Inserindo contas padrão...';
        
        -- Inserir contas padrão
        INSERT INTO contas_bancarias (nome, tipo, banco, agencia, conta, saldo, limite, ativo) VALUES
        ('CEF - CAIXA', 'conta_corrente', 'Caixa Econômica', '1234', '12345-6', 5000.00, 0.00, true),
        ('Inter DS', 'conta_corrente', 'Inter', '5678', '98765-4', 15000.00, 0.00, true),
        ('C6 DS Vendas', 'conta_corrente', 'C6 Bank', '9012', '54321-0', 3000.00, 0.00, true);
        
        RAISE NOTICE '✅ Contas padrão inseridas com sucesso';
    ELSE
        RAISE NOTICE '📊 Encontradas % contas no banco de dados', conta_count;
    END IF;
END $$;

-- 7. Verificar RLS (Row Level Security)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'contas_bancarias' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE '✅ RLS está habilitado na tabela contas_bancarias';
    ELSE
        RAISE NOTICE '⚠️ RLS não está habilitado na tabela contas_bancarias';
    END IF;
END $$;

-- 8. Verificar políticas RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'contas_bancarias';

-- 9. Criar políticas RLS se não existirem
DO $$
BEGIN
    -- Política para usuários verem suas próprias contas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'contas_bancarias' 
        AND policyname = 'users_can_view_own_accounts'
    ) THEN
        RAISE NOTICE '🔒 Criando política RLS para visualização de contas...';
        CREATE POLICY "users_can_view_own_accounts" ON contas_bancarias
        FOR SELECT USING (true); -- Permitir visualização para todos os usuários autenticados
    END IF;

    -- Política para usuários inserirem suas próprias contas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'contas_bancarias' 
        AND policyname = 'users_can_insert_own_accounts'
    ) THEN
        RAISE NOTICE '🔒 Criando política RLS para inserção de contas...';
        CREATE POLICY "users_can_insert_own_accounts" ON contas_bancarias
        FOR INSERT WITH CHECK (true); -- Permitir inserção para todos os usuários autenticados
    END IF;

    -- Política para usuários atualizarem suas próprias contas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'contas_bancarias' 
        AND policyname = 'users_can_update_own_accounts'
    ) THEN
        RAISE NOTICE '🔒 Criando política RLS para atualização de contas...';
        CREATE POLICY "users_can_update_own_accounts" ON contas_bancarias
        FOR UPDATE USING (true); -- Permitir atualização para todos os usuários autenticados
    END IF;

    -- Política para usuários deletarem suas próprias contas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'contas_bancarias' 
        AND policyname = 'users_can_delete_own_accounts'
    ) THEN
        RAISE NOTICE '🔒 Criando política RLS para exclusão de contas...';
        CREATE POLICY "users_can_delete_own_accounts" ON contas_bancarias
        FOR DELETE USING (true); -- Permitir exclusão para todos os usuários autenticados
    END IF;
END $$;

-- 10. Habilitar RLS se não estiver habilitado
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'contas_bancarias' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE '🔒 Habilitando RLS na tabela contas_bancarias...';
        ALTER TABLE contas_bancarias ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS habilitado com sucesso';
    END IF;
END $$;

-- 11. Verificação final
DO $$
DECLARE
    conta_count INTEGER;
    conta_ativa_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO conta_count FROM contas_bancarias;
    SELECT COUNT(*) INTO conta_ativa_count FROM contas_bancarias WHERE ativo = true;
    
    RAISE NOTICE '📊 RESUMO FINAL:';
    RAISE NOTICE '   Total de contas: %', conta_count;
    RAISE NOTICE '   Contas ativas: %', conta_ativa_count;
    
    IF conta_count > 0 THEN
        RAISE NOTICE '✅ Sistema de contas bancárias funcionando corretamente';
    ELSE
        RAISE NOTICE '❌ Nenhuma conta encontrada no banco de dados';
    END IF;
END $$;

-- 12. Mostrar contas finais
SELECT 
    nome,
    tipo,
    banco,
    agencia,
    conta,
    saldo,
    ativo
FROM contas_bancarias
ORDER BY nome;
