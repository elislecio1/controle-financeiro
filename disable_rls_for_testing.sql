-- Script para desabilitar RLS temporariamente para fins de teste
-- Execute este script no SQL Editor do Supabase

-- Desabilitar RLS para a tabela contas_bancarias
ALTER TABLE contas_bancarias DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS para a tabela cartoes_credito
ALTER TABLE cartoes_credito DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS para a tabela transactions (se existir)
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS para a tabela categorias (se existir)
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS para a tabela subcategorias (se existir)
ALTER TABLE subcategorias DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS para a tabela investimentos (se existir)
ALTER TABLE investimentos DISABLE ROW LEVEL SECURITY;

-- Verificar se as tabelas existem antes de desabilitar RLS
-- Se alguma tabela não existir, o comando será ignorado

-- Para reabilitar RLS posteriormente (quando implementar autenticação):
-- ALTER TABLE contas_bancarias ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cartoes_credito ENABLE ROW LEVEL SECURITY;
-- etc... 