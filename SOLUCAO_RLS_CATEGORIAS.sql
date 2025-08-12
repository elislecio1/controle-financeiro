-- =====================================================
-- SOLUÇÃO PARA ERRO DE RLS NA TABELA CATEGORIAS
-- =====================================================

-- ATENÇÃO: Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela categorias existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'categorias';

-- 2. Desabilitar RLS para a tabela categorias
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se RLS foi desabilitado
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'categorias';

-- 4. Remover políticas RLS existentes (se houver)
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON categorias;

-- 5. Verificar se tudo está funcionando
SELECT 'RLS desabilitado para categorias com sucesso!' as status;
