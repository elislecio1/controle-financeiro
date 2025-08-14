-- Script ESPECÍFICO para remover o trigger problemático
-- Execute este script ANTES de executar o supabase_schema.sql

-- Verificar se o trigger existe
SELECT 'VERIFICANDO TRIGGER:' as acao, 
       t.tgname as trigger_name, 
       c.relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE t.tgname = 'trigger_criar_alerta_transacao'
AND c.relname = 'transactions';

-- Remover o trigger específico
DROP TRIGGER IF EXISTS trigger_criar_alerta_transacao ON transactions;

-- Verificar se foi removido
SELECT 'APÓS REMOÇÃO:' as acao, 
       t.tgname as trigger_name, 
       c.relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE t.tgname = 'trigger_criar_alerta_transacao'
AND c.relname = 'transactions';

-- Remover TODOS os triggers da tabela transactions
DO $$ 
DECLARE
    trigger_record record;
BEGIN
    RAISE NOTICE 'Removendo TODOS os triggers da tabela transactions...';
    
    FOR trigger_record IN 
        SELECT t.tgname
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'transactions'
        AND t.tgisinternal = false
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trigger_record.tgname) || ' ON transactions CASCADE';
        RAISE NOTICE 'Trigger % removido da tabela transactions', trigger_record.tgname;
    END LOOP;
    
    RAISE NOTICE 'Todos os triggers da tabela transactions foram removidos';
END $$;

-- Verificar se ainda existem triggers na tabela transactions
SELECT 'TRIGGERS RESTANTES EM TRANSACTIONS:' as acao, 
       t.tgname as trigger_name, 
       c.relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'transactions'
AND t.tgisinternal = false
ORDER BY t.tgname;

-- Remover também políticas RLS da tabela transactions
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON transactions;
DROP POLICY IF EXISTS "Enable read access for all users" ON transactions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON transactions;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON transactions;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON transactions;

-- Desabilitar RLS temporariamente na tabela transactions
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Mensagem de confirmação
SELECT 'SUCESSO: Tabela transactions limpa de triggers e políticas RLS' as resultado;
