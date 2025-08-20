-- Script para limpar dados simulados e de teste
-- Execute este script no SQL Editor do Supabase
-- ⚠️ ATENÇÃO: Este script irá DELETAR dados. Execute com cuidado!

-- 0. Verificar tabelas existentes
SELECT 'Verificando tabelas existentes...' as info;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('transactions', 'contas_bancarias', 'categorias', 'subcategorias', 'investimentos', 'cartoes', 'contatos')
ORDER BY table_name;

-- 1. Verificar dados antes da limpeza
SELECT 'Verificando dados antes da limpeza...' as info;

-- Verificar transações de teste
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
    PERFORM set_config('app.current_table', 'transactions', false);
    RAISE NOTICE 'Verificando tabela: transactions';
  END IF;
END $$;

SELECT 
  'transactions' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN descricao ILIKE '%teste%' OR descricao ILIKE '%mock%' OR descricao ILIKE '%simulado%' THEN 1 END) as dados_teste
FROM transactions
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions');

-- Verificar contas bancárias de teste
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contas_bancarias') THEN
    PERFORM set_config('app.current_table', 'contas_bancarias', false);
    RAISE NOTICE 'Verificando tabela: contas_bancarias';
  END IF;
END $$;

SELECT 
  'contas_bancarias' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN nome ILIKE '%teste%' OR nome ILIKE '%mock%' OR nome ILIKE '%simulado%' THEN 1 END) as dados_teste
FROM contas_bancarias
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contas_bancarias');

-- Verificar categorias de teste
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categorias') THEN
    PERFORM set_config('app.current_table', 'categorias', false);
    RAISE NOTICE 'Verificando tabela: categorias';
  END IF;
END $$;

SELECT 
  'categorias' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN nome ILIKE '%teste%' OR nome ILIKE '%mock%' OR nome ILIKE '%simulado%' THEN 1 END) as dados_teste
FROM categorias
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categorias');

-- Verificar subcategorias de teste
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subcategorias') THEN
    PERFORM set_config('app.current_table', 'subcategorias', false);
    RAISE NOTICE 'Verificando tabela: subcategorias';
  END IF;
END $$;

SELECT 
  'subcategorias' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN nome ILIKE '%teste%' OR nome ILIKE '%mock%' OR nome ILIKE '%simulado%' THEN 1 END) as dados_teste
FROM subcategorias
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subcategorias');

-- Verificar investimentos de teste
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'investimentos') THEN
    PERFORM set_config('app.current_table', 'investimentos', false);
    RAISE NOTICE 'Verificando tabela: investimentos';
  END IF;
END $$;

SELECT 
  'investimentos' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN nome ILIKE '%teste%' OR nome ILIKE '%mock%' OR nome ILIKE '%simulado%' THEN 1 END) as dados_teste
FROM investimentos
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'investimentos');

-- Verificar cartões de teste (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cartoes') THEN
    PERFORM set_config('app.current_table', 'cartoes', false);
    RAISE NOTICE 'Verificando tabela: cartoes';
  ELSE
    RAISE NOTICE 'Tabela cartoes não existe - pulando verificação';
  END IF;
END $$;

SELECT 
  'cartoes' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN nome ILIKE '%teste%' OR nome ILIKE '%mock%' OR nome ILIKE '%simulado%' THEN 1 END) as dados_teste
FROM cartoes
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cartoes');

-- Verificar contatos de teste (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contatos') THEN
    PERFORM set_config('app.current_table', 'contatos', false);
    RAISE NOTICE 'Verificando tabela: contatos';
  ELSE
    RAISE NOTICE 'Tabela contatos não existe - pulando verificação';
  END IF;
END $$;

SELECT 
  'contatos' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN nome ILIKE '%teste%' OR nome ILIKE '%mock%' OR nome ILIKE '%simulado%' THEN 1 END) as dados_teste
FROM contatos
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contatos');

-- 2. LIMPEZA DE DADOS DE TESTE
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

-- Limpar cartões de teste
-- DELETE FROM cartoes 
-- WHERE nome ILIKE '%teste%' 
--    OR nome ILIKE '%mock%' 
--    OR nome ILIKE '%simulado%'
--    OR nome ILIKE '%exemplo%';

-- Limpar contatos de teste
-- DELETE FROM contatos 
-- WHERE nome ILIKE '%teste%' 
--    OR nome ILIKE '%mock%' 
--    OR nome ILIKE '%simulado%'
--    OR nome ILIKE '%exemplo%'
--    OR email ILIKE '%teste%'
--    OR email ILIKE '%exemplo%';

-- 3. LIMPEZA DE DADOS COM VALORES SUSPEITOS
-- ⚠️ DESCOMENTE AS LINHAS ABAIXO PARA EXECUTAR A LIMPEZA

-- Limpar transações com valores suspeitos (muito altos ou negativos)
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

-- 4. VERIFICAÇÃO APÓS LIMPEZA
-- Execute esta seção após a limpeza para verificar os resultados

SELECT 'Verificando dados após a limpeza...' as info;

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

-- 5. SCRIPT DE LIMPEZA COMPLETA (EXECUTAR COM CUIDADO)
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

-- Limpar cartões de teste
DELETE FROM cartoes 
WHERE nome ILIKE '%teste%' 
   OR nome ILIKE '%mock%' 
   OR nome ILIKE '%simulado%'
   OR nome ILIKE '%exemplo%';

-- Limpar contatos de teste
DELETE FROM contatos 
WHERE nome ILIKE '%teste%' 
   OR nome ILIKE '%mock%' 
   OR nome ILIKE '%simulado%'
   OR nome ILIKE '%exemplo%'
   OR email ILIKE '%teste%'
   OR email ILIKE '%exemplo%';

-- Confirmar transação
COMMIT;

-- Verificar resultados
SELECT 'Limpeza concluída!' as resultado;
*/

-- 6. INSTRUÇÕES DE USO
/*
1. Execute primeiro a seção 1 para verificar os dados atuais
2. Revise os dados que serão removidos
3. Descomente as seções 2, 3 ou 5 conforme necessário
4. Execute novamente para aplicar a limpeza
5. Execute a seção 4 para verificar os resultados
6. Se necessário, use ROLLBACK para desfazer mudanças
*/
