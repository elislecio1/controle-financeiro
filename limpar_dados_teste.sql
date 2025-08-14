-- Script para limpar todos os dados de teste das integrações
-- Execute este script no Supabase SQL Editor

-- 1. Limpar transações importadas de teste
DELETE FROM transacoes_importadas;

-- 2. Limpar logs de sincronização de teste
DELETE FROM logs_sincronizacao;

-- 3. Verificar se as tabelas estão vazias
SELECT 'transacoes_importadas' as tabela, COUNT(*) as total FROM transacoes_importadas
UNION ALL
SELECT 'logs_sincronizacao' as tabela, COUNT(*) as total FROM logs_sincronizacao;

-- 4. Manter apenas as integrações configuradas (não deletar)
SELECT 'integracoes_bancarias' as tabela, COUNT(*) as total FROM integracoes_bancarias;
