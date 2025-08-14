-- Script para corrigir as políticas RLS das tabelas de integrações
-- Execute este script no SQL Editor do Supabase

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON integracoes_bancarias;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON logs_sincronizacao;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON transacoes_importadas;

-- Desabilitar RLS temporariamente para desenvolvimento
ALTER TABLE integracoes_bancarias DISABLE ROW LEVEL SECURITY;
ALTER TABLE logs_sincronizacao DISABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_importadas DISABLE ROW LEVEL SECURITY;

-- OU criar políticas mais permissivas para desenvolvimento
-- ALTER TABLE integracoes_bancarias ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE logs_sincronizacao ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transacoes_importadas ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para desenvolvimento (comentar se usar a opção acima)
-- CREATE POLICY "Allow all operations for development" ON integracoes_bancarias
--     FOR ALL USING (true);

-- CREATE POLICY "Allow all operations for development" ON logs_sincronizacao
--     FOR ALL USING (true);

-- CREATE POLICY "Allow all operations for development" ON transacoes_importadas
--     FOR ALL USING (true);

-- Verificar status das tabelas
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('integracoes_bancarias', 'logs_sincronizacao', 'transacoes_importadas')
AND schemaname = 'public';

-- Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('integracoes_bancarias', 'logs_sincronizacao', 'transacoes_importadas')
AND schemaname = 'public';
