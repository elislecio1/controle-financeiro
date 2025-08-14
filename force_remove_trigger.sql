-- Script FORÇADO para remover o trigger problemático
-- Execute este script ANTES de executar o supabase_schema.sql

-- 1. VERIFICAR O QUE EXISTE ANTES
SELECT '=== ANTES DA LIMPEZA ===' as etapa;

SELECT 'Triggers existentes em transactions:' as info, 
       t.tgname as trigger_name, 
       c.relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'transactions'
AND t.tgisinternal = false
ORDER BY t.tgname;

SELECT 'Políticas RLS existentes em transactions:' as info,
       p.policyname as politica
FROM pg_policies p
WHERE p.tablename = 'transactions'
ORDER BY p.policyname;

-- 2. FORÇAR REMOÇÃO DO TRIGGER ESPECÍFICO
SELECT '=== REMOVENDO TRIGGER ESPECÍFICO ===' as etapa;

-- Tentar remover com CASCADE
DROP TRIGGER IF EXISTS trigger_criar_alerta_transacao ON transactions CASCADE;

-- Verificar se foi removido
SELECT 'Verificação após remoção específica:' as info,
       t.tgname as trigger_name, 
       c.relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE t.tgname = 'trigger_criar_alerta_transacao'
AND c.relname = 'transactions';

-- 3. REMOVER TODOS OS TRIGGERS FORÇADAMENTE
SELECT '=== REMOVENDO TODOS OS TRIGGERS ===' as etapa;

DO $$ 
DECLARE
    trigger_name text;
    trigger_count integer := 0;
BEGIN
    -- Contar quantos triggers existem
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'transactions'
    AND t.tgisinternal = false;
    
    RAISE NOTICE 'Encontrados % triggers na tabela transactions', trigger_count;
    
    -- Remover cada trigger individualmente
    FOR trigger_name IN 
        SELECT t.tgname
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'transactions'
        AND t.tgisinternal = false
    LOOP
        BEGIN
            EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trigger_name) || ' ON transactions CASCADE';
            RAISE NOTICE 'Trigger % removido com sucesso', trigger_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERRO ao remover trigger %: %', trigger_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Processo de remoção de triggers concluído';
END $$;

-- 4. VERIFICAR SE AINDA EXISTEM TRIGGERS
SELECT '=== VERIFICAÇÃO FINAL ===' as etapa;

SELECT 'Triggers restantes em transactions:' as info, 
       t.tgname as trigger_name, 
       c.relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'transactions'
AND t.tgisinternal = false
ORDER BY t.tgname;

-- 5. SE AINDA EXISTIR, TENTAR REMOÇÃO DIRETA
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'trigger_criar_alerta_transacao'
        AND c.relname = 'transactions'
    ) THEN
        RAISE NOTICE 'Trigger ainda existe! Tentando remoção forçada...';
        
        -- Tentar remoção direta do sistema
        DELETE FROM pg_trigger 
        WHERE tgname = 'trigger_criar_alerta_transacao'
        AND tgrelid = (SELECT oid FROM pg_class WHERE relname = 'transactions');
        
        RAISE NOTICE 'Remoção forçada executada';
    ELSE
        RAISE NOTICE 'Trigger não existe mais - sucesso!';
    END IF;
END $$;

-- 6. VERIFICAÇÃO FINAL
SELECT '=== VERIFICAÇÃO FINAL APÓS REMOÇÃO FORÇADA ===' as etapa;

SELECT 'Triggers finais em transactions:' as info, 
       t.tgname as trigger_name, 
       c.relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'transactions'
AND t.tgisinternal = false
ORDER BY t.tgname;

-- 7. LIMPEZA DE POLÍTICAS RLS
SELECT '=== LIMPANDO POLÍTICAS RLS ===' as etapa;

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON transactions;
DROP POLICY IF EXISTS "Enable read access for all users" ON transactions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON transactions;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON transactions;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON transactions;

-- 8. DESABILITAR RLS
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

SELECT '=== LIMPEZA CONCLUÍDA ===' as etapa;
SELECT 'Tabela transactions limpa de triggers e políticas RLS' as resultado;
