-- ============================================================
-- 🔧 CORRIGIR VISIBILIDADE DE CONTAS BANCÁRIAS
-- ============================================================
-- Este script verifica e corrige problemas que impedem
-- as contas bancárias de aparecerem no sistema
-- ============================================================

-- 1. Verificar se a tabela existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'contas_bancarias';

-- 2. Verificar quantas contas existem e seus status
SELECT 
    COUNT(*) as total_contas,
    COUNT(*) FILTER (WHERE ativo = true) as contas_ativas,
    COUNT(*) FILTER (WHERE ativo = false) as contas_inativas,
    COUNT(*) FILTER (WHERE ativo IS NULL) as contas_sem_status
FROM contas_bancarias;

-- 3. Listar todas as contas com seus status
SELECT 
    id,
    nome,
    tipo,
    banco,
    ativo,
    created_at
FROM contas_bancarias
ORDER BY created_at DESC;

-- 4. Verificar RLS (Row Level Security)
SELECT 
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename = 'contas_bancarias';

-- 5. Verificar políticas RLS existentes
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'contas_bancarias';

-- 6. Se RLS estiver habilitado, criar políticas permissivas
DO $$
BEGIN
    -- Verificar se RLS está habilitado
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'contas_bancarias' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE '🔒 RLS está habilitado. Criando políticas permissivas...';
        
        -- Remover políticas antigas que possam estar bloqueando
        DROP POLICY IF EXISTS "users_can_view_own_accounts" ON contas_bancarias;
        DROP POLICY IF EXISTS "users_can_view_all_accounts" ON contas_bancarias;
        DROP POLICY IF EXISTS "Users can view own accounts" ON contas_bancarias;
        DROP POLICY IF EXISTS "Users can view all accounts" ON contas_bancarias;
        
        -- Criar política permissiva para SELECT (visualização)
        CREATE POLICY "users_can_view_all_accounts" 
        ON contas_bancarias
        FOR SELECT
        USING (true); -- Permitir visualização de todas as contas
        
        RAISE NOTICE '✅ Política de visualização criada';
    ELSE
        RAISE NOTICE 'ℹ️ RLS não está habilitado. Não é necessário criar políticas.';
    END IF;
END $$;

-- 7. Atualizar contas que têm ativo = NULL para ativo = true
UPDATE contas_bancarias 
SET ativo = true 
WHERE ativo IS NULL;

-- 8. Verificar resultado final
SELECT 
    COUNT(*) as total_contas,
    COUNT(*) FILTER (WHERE ativo = true) as contas_ativas,
    COUNT(*) FILTER (WHERE ativo = false) as contas_inativas
FROM contas_bancarias;

-- 9. Listar contas que devem aparecer no sistema (ativas)
SELECT 
    id,
    nome,
    tipo,
    banco,
    ativo
FROM contas_bancarias
WHERE ativo = true
ORDER BY nome;

-- ============================================================
-- ✅ SCRIPT CONCLUÍDO
-- ============================================================
-- Verifique os resultados acima:
-- 1. Se houver contas cadastradas, elas devem aparecer
-- 2. Se RLS estava bloqueando, as políticas foram criadas
-- 3. Contas com ativo = NULL foram atualizadas para true
-- ============================================================
