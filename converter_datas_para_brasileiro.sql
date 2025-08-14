-- Script para converter todas as datas para formato brasileiro (DD/MM/YYYY)
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar o formato atual das datas
SELECT 
    'Verificando formato atual das datas' as acao,
    COUNT(*) as total_transacoes,
    COUNT(CASE WHEN vencimento ~ '^\d{4}-\d{2}-\d{2}$' THEN 1 END) as formato_iso,
    COUNT(CASE WHEN vencimento ~ '^\d{2}/\d{2}/\d{4}$' THEN 1 END) as formato_brasileiro,
    COUNT(CASE WHEN vencimento !~ '^\d{4}-\d{2}-\d{2}$' AND vencimento !~ '^\d{2}/\d{2}/\d{4}$' THEN 1 END) as outros_formatos
FROM transactions 
WHERE vencimento IS NOT NULL;

-- 2. Mostrar exemplos de cada formato
SELECT 
    'Exemplos de formato ISO' as tipo,
    vencimento,
    descricao
FROM transactions 
WHERE vencimento ~ '^\d{4}-\d{2}-\d{2}$'
LIMIT 5;

SELECT 
    'Exemplos de formato brasileiro' as tipo,
    vencimento,
    descricao
FROM transactions 
WHERE vencimento ~ '^\d{2}/\d{2}/\d{4}$'
LIMIT 5;

-- 3. CONVERTER DATAS DO FORMATO ISO PARA BRASILEIRO
-- ATENÇÃO: Execute esta parte apenas se estiver certo de que quer fazer a conversão

-- Converter campo vencimento
UPDATE transactions 
SET vencimento = TO_CHAR(TO_DATE(vencimento, 'YYYY-MM-DD'), 'DD/MM/YYYY')
WHERE vencimento ~ '^\d{4}-\d{2}-\d{2}$';

-- Converter campo data (se existir e estiver no formato ISO)
UPDATE transactions 
SET data = TO_CHAR(TO_DATE(data, 'YYYY-MM-DD'), 'DD/MM/YYYY')
WHERE data ~ '^\d{4}-\d{2}-\d{2}$';

-- 4. Verificar se a conversão foi bem-sucedida
SELECT 
    'Verificando após conversão' as acao,
    COUNT(*) as total_transacoes,
    COUNT(CASE WHEN vencimento ~ '^\d{2}/\d{2}/\d{4}$' THEN 1 END) as formato_brasileiro,
    COUNT(CASE WHEN vencimento ~ '^\d{4}-\d{2}-\d{2}$' THEN 1 END) as formato_iso_restante
FROM transactions 
WHERE vencimento IS NOT NULL;

-- 5. Mostrar algumas transações convertidas
SELECT 
    'Transações convertidas' as status,
    id,
    descricao,
    vencimento,
    data,
    valor,
    status as status_transacao
FROM transactions 
WHERE vencimento IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 6. Verificar se há transações vencendo hoje (13/08/2025)
SELECT 
    'Transações vencendo hoje (13/08/2025)' as filtro,
    id,
    descricao,
    valor,
    vencimento,
    status,
    categoria
FROM transactions 
WHERE vencimento = '13/08/2025'
AND status = 'pendente'
ORDER BY valor DESC;

-- 7. Verificar se há transações vencendo amanhã (14/08/2025)
SELECT 
    'Transações vencendo amanhã (14/08/2025)' as filtro,
    id,
    descricao,
    valor,
    vencimento,
    status,
    categoria
FROM transactions 
WHERE vencimento = '14/08/2025'
AND status = 'pendente'
ORDER BY valor DESC;

-- 8. Contar total de transações por status
SELECT 
    'Total por status' as resumo,
    status,
    COUNT(*) as quantidade,
    SUM(ABS(valor)) as valor_total
FROM transactions 
GROUP BY status
ORDER BY status;
