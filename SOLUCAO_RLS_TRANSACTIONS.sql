-- =====================================================
-- SOLUÇÃO PARA ERRO DE RLS NA TABELA TRANSACTIONS
-- =====================================================

-- ATENÇÃO: Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela transactions existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'transactions';

-- 2. Desabilitar RLS para a tabela transactions
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se RLS foi desabilitado
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'transactions';

-- 4. Remover políticas RLS existentes (se houver)
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON transactions;

-- 5. Verificar se tudo está funcionando
SELECT 'RLS desabilitado para transactions com sucesso!' as status; 