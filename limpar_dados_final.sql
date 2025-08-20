-- SCRIPT FINAL PARA LIMPAR DADOS SIMULADOS
-- Execute este script no SQL Editor do Supabase
-- ⚠️ ATENÇÃO: Este script irá DELETAR dados. Execute com cuidado!

-- 1. VERIFICAR TABELAS EXISTENTES
SELECT '=== TABELAS EXISTENTES ===' as info;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('transactions', 'contas_bancarias', 'categorias', 'subcategorias', 'investimentos')
ORDER BY table_name;

-- 2. VERIFICAR DADOS DE TESTE
SELECT '=== DADOS DE TESTE ENCONTRADOS ===' as info;

-- Transações de teste
SELECT 
  'transactions' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN descricao ILIKE '%teste%' OR descricao ILIKE '%mock%' OR descricao ILIKE '%simulado%' OR descricao ILIKE '%exemplo%' THEN 1 END) as dados_teste
FROM transactions;

-- Contas bancárias de teste
SELECT 
  'contas_bancarias' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN nome ILIKE '%teste%' OR nome ILIKE '%mock%' OR nome ILIKE '%simulado%' OR nome ILIKE '%exemplo%' THEN 1 END) as dados_teste
FROM contas_bancarias;

-- Categorias de teste
SELECT 
  'categorias' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN nome ILIKE '%teste%' OR nome ILIKE '%mock%' OR nome ILIKE '%simulado%' OR nome ILIKE '%exemplo%' THEN 1 END) as dados_teste
FROM categorias;

-- Subcategorias de teste
SELECT 
  'subcategorias' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN nome ILIKE '%teste%' OR nome ILIKE '%mock%' OR nome ILIKE '%simulado%' OR nome ILIKE '%exemplo%' THEN 1 END) as dados_teste
FROM subcategorias;

-- Investimentos de teste
SELECT 
  'investimentos' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN nome ILIKE '%teste%' OR nome ILIKE '%mock%' OR nome ILIKE '%simulado%' OR nome ILIKE '%exemplo%' THEN 1 END) as dados_teste
FROM investimentos;

-- 3. LIMPEZA SEGURA (DESCOMENTE PARA EXECUTAR)
-- ⚠️ DESCOMENTE AS LINHAS ABAIXO PARA EXECUTAR A LIMPEZA

/*
-- Limpar transações de teste
DELETE FROM transactions 
WHERE descricao ILIKE '%teste%' 
   OR descricao ILIKE '%mock%' 
   OR descricao ILIKE '%simulado%'
   OR descricao ILIKE '%exemplo%'
   OR valor = 0
   OR valor IS NULL;

-- Limpar contas bancárias de teste
DELETE FROM contas_bancarias 
WHERE nome ILIKE '%teste%' 
   OR nome ILIKE '%mock%' 
   OR nome ILIKE '%simulado%'
   OR nome ILIKE '%exemplo%';

-- Limpar categorias de teste
DELETE FROM categorias 
WHERE nome ILIKE '%teste%' 
   OR nome ILIKE '%mock%' 
   OR nome ILIKE '%simulado%'
   OR nome ILIKE '%exemplo%';

-- Limpar subcategorias de teste
DELETE FROM subcategorias 
WHERE nome ILIKE '%teste%' 
   OR nome ILIKE '%mock%' 
   OR nome ILIKE '%simulado%'
   OR nome ILIKE '%exemplo%';

-- Limpar investimentos de teste
DELETE FROM investimentos 
WHERE nome ILIKE '%teste%' 
   OR nome ILIKE '%mock%' 
   OR nome ILIKE '%simulado%'
   OR nome ILIKE '%exemplo%';

SELECT 'Limpeza concluída com sucesso!' as resultado;
*/

-- 4. VERIFICAÇÃO APÓS LIMPEZA (execute após a limpeza)
SELECT '=== VERIFICAÇÃO APÓS LIMPEZA ===' as info;

SELECT 
  'transactions' as tabela,
  COUNT(*) as total_restante
FROM transactions;

SELECT 
  'contas_bancarias' as tabela,
  COUNT(*) as total_restante
FROM contas_bancarias;

SELECT 
  'categorias' as tabela,
  COUNT(*) as total_restante
FROM categorias;

SELECT 
  'subcategorias' as tabela,
  COUNT(*) as total_restante
FROM subcategorias;

SELECT 
  'investimentos' as tabela,
  COUNT(*) as total_restante
FROM investimentos;
