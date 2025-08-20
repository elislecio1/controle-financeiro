-- Script SIMPLIFICADO para limpar dados simulados e de teste
-- Execute este script no SQL Editor do Supabase
-- ⚠️ ATENÇÃO: Este script irá DELETAR dados. Execute com cuidado!

-- 1. Verificar tabelas existentes
SELECT '=== TABELAS EXISTENTES ===' as info;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('transactions', 'contas_bancarias', 'categorias', 'subcategorias', 'investimentos', 'cartoes', 'contatos')
ORDER BY table_name;

-- 2. Verificar dados de teste (apenas nas tabelas que existem)
SELECT '=== VERIFICANDO DADOS DE TESTE ===' as info;

-- Verificar transações
SELECT 
  'transactions' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN descricao ILIKE '%teste%' OR descricao ILIKE '%mock%' OR descricao ILIKE '%simulado%' OR descricao ILIKE '%exemplo%' THEN 1 END) as dados_teste
FROM transactions;

-- Verificar contas bancárias
SELECT 
  'contas_bancarias' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN nome ILIKE '%teste%' OR nome ILIKE '%mock%' OR nome ILIKE '%simulado%' OR nome ILIKE '%exemplo%' THEN 1 END) as dados_teste
FROM contas_bancarias;

-- Verificar categorias
SELECT 
  'categorias' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN nome ILIKE '%teste%' OR nome ILIKE '%mock%' OR nome ILIKE '%simulado%' OR nome ILIKE '%exemplo%' THEN 1 END) as dados_teste
FROM categorias;

-- Verificar subcategorias
SELECT 
  'subcategorias' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN nome ILIKE '%teste%' OR nome ILIKE '%mock%' OR nome ILIKE '%simulado%' OR nome ILIKE '%exemplo%' THEN 1 END) as dados_teste
FROM subcategorias;

-- Verificar investimentos
SELECT 
  'investimentos' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN nome ILIKE '%teste%' OR nome ILIKE '%mock%' OR nome ILIKE '%simulado%' OR nome ILIKE '%exemplo%' THEN 1 END) as dados_teste
FROM investimentos;

-- 3. LIMPEZA DE DADOS DE TESTE
-- ⚠️ DESCOMENTE AS LINHAS ABAIXO PARA EXECUTAR A LIMPEZA

-- Limpar transações de teste
-- DELETE FROM transactions 
-- WHERE descricao ILIKE '%teste%' 
--    OR descricao ILIKE '%mock%' 
--    OR descricao ILIKE '%simulado%'
--    OR descricao ILIKE '%exemplo%'
--    OR valor = 0
--    OR valor IS NULL;

-- Limpar contas bancárias de teste
-- DELETE FROM contas_bancarias 
-- WHERE nome ILIKE '%teste%' 
--    OR nome ILIKE '%mock%' 
--    OR nome ILIKE '%simulado%'
--    OR nome ILIKE '%exemplo%';

-- Limpar categorias de teste
-- DELETE FROM categorias 
-- WHERE nome ILIKE '%teste%' 
--    OR nome ILIKE '%mock%' 
--    OR nome ILIKE '%simulado%'
--    OR nome ILIKE '%exemplo%';

-- Limpar subcategorias de teste
-- DELETE FROM subcategorias 
-- WHERE nome ILIKE '%teste%' 
--    OR nome ILIKE '%mock%' 
--    OR nome ILIKE '%simulado%'
--    OR nome ILIKE '%exemplo%';

-- Limpar investimentos de teste
-- DELETE FROM investimentos 
-- WHERE nome ILIKE '%teste%' 
--    OR nome ILIKE '%mock%' 
--    OR nome ILIKE '%simulado%'
--    OR nome ILIKE '%exemplo%';

-- 4. LIMPEZA DE DADOS COM VALORES SUSPEITOS
-- ⚠️ DESCOMENTE AS LINHAS ABAIXO PARA EXECUTAR A LIMPEZA

-- Limpar transações com valores suspeitos
-- DELETE FROM transactions 
-- WHERE valor > 1000000  -- Mais de 1 milhão
--    OR valor < -1000000 -- Menos de -1 milhão
--    OR valor = 999999   -- Valor suspeito
--    OR valor = 123456   -- Valor suspeito
--    OR valor = 654321;  -- Valor suspeito

-- Limpar transações com datas futuras muito distantes
-- DELETE FROM transactions 
-- WHERE vencimento > '2030-12-31'  -- Datas muito futuras
--    OR vencimento < '2020-01-01'; -- Datas muito antigas

-- 5. VERIFICAÇÃO APÓS LIMPEZA
-- Execute esta seção após a limpeza para verificar os resultados

SELECT '=== VERIFICAÇÃO APÓS LIMPEZA ===' as info;

-- Verificar transações restantes
SELECT 
  'transactions' as tabela,
  COUNT(*) as total_restante,
  MIN(valor) as valor_minimo,
  MAX(valor) as valor_maximo,
  MIN(vencimento) as data_mais_antiga,
  MAX(vencimento) as data_mais_recente
FROM transactions;

-- Verificar contas bancárias restantes
SELECT 
  'contas_bancarias' as tabela,
  COUNT(*) as total_restante,
  string_agg(nome, ', ') as contas_restantes
FROM contas_bancarias;

-- Verificar categorias restantes
SELECT 
  'categorias' as tabela,
  COUNT(*) as total_restante,
  string_agg(nome, ', ') as categorias_restantes
FROM categorias;

-- 6. SCRIPT DE LIMPEZA COMPLETA (EXECUTAR COM CUIDADO)
-- ⚠️ DESCOMENTE TODO O BLOCO ABAIXO PARA LIMPEZA COMPLETA

/*
-- Iniciar transação
BEGIN;

-- Limpar transações de teste
DELETE FROM transactions 
WHERE descricao ILIKE '%teste%' 
   OR descricao ILIKE '%mock%' 
   OR descricao ILIKE '%simulado%'
   OR descricao ILIKE '%exemplo%'
   OR valor = 0
   OR valor IS NULL
   OR valor > 1000000
   OR valor < -1000000
   OR vencimento > '2030-12-31'
   OR vencimento < '2020-01-01';

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

-- Confirmar transação
COMMIT;

-- Verificar resultados
SELECT 'Limpeza concluída!' as resultado;
*/

-- 7. INSTRUÇÕES DE USO
/*
1. Execute primeiro a seção 1 para verificar as tabelas existentes
2. Execute a seção 2 para verificar os dados atuais
3. Revise os dados que serão removidos
4. Descomente as seções 3, 4 ou 6 conforme necessário
5. Execute novamente para aplicar a limpeza
6. Execute a seção 5 para verificar os resultados
7. Se necessário, use ROLLBACK para desfazer mudanças
*/
