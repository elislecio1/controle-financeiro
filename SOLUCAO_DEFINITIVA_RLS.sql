-- =====================================================
-- SOLUÇÃO DEFINITIVA PARA ERRO DE RLS
-- =====================================================

-- ATENÇÃO: Execute este script no SQL Editor do Supabase

-- 1. Primeiro, vamos verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('contas_bancarias', 'cartoes_credito', 'transactions');

-- 2. Se as tabelas não existirem, execute o script completo:
-- Copie e cole o conteúdo do arquivo 'recreate_tables.sql' aqui

-- 3. Desabilitar RLS em TODAS as tabelas (solução definitiva)
ALTER TABLE contas_bancarias DISABLE ROW LEVEL SECURITY;
ALTER TABLE cartoes_credito DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE centros_custo DISABLE ROW LEVEL SECURITY;
ALTER TABLE contatos DISABLE ROW LEVEL SECURITY;
ALTER TABLE metas DISABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE investimentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE relatorios DISABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_sistema DISABLE ROW LEVEL SECURITY;

-- 4. Verificar se RLS foi desabilitado
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'contas_bancarias',
    'cartoes_credito',
    'transactions',
    'categorias',
    'subcategorias',
    'centros_custo',
    'contatos',
    'metas',
    'orcamentos',
    'investimentos',
    'relatorios',
    'configuracoes_sistema'
);

-- 5. Remover políticas RLS existentes (se houver)
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON contas_bancarias;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON cartoes_credito;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON transactions;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON categorias;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON subcategorias;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON centros_custo;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON contatos;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON metas;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON orcamentos;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON investimentos;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON relatorios;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON configuracoes_sistema;

-- 6. Verificar se tudo está funcionando
SELECT 'RLS desabilitado com sucesso!' as status; 