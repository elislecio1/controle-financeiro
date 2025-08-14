-- Script para verificar transações vencendo hoje (13/08/2025)
-- Considerando ambos os formatos de data: DD/MM/YYYY e YYYY-MM-DD

-- 1. Verificar transações vencendo hoje no formato brasileiro (13/08/2025)
SELECT 
    id,
    descricao,
    valor,
    vencimento,
    status,
    categoria,
    'Formato Brasileiro' as tipo_data
FROM transactions 
WHERE status = 'pendente' 
AND vencimento = '13/08/2025'
ORDER BY valor DESC;

-- 2. Verificar transações vencendo hoje no formato ISO (2025-08-13)
SELECT 
    id,
    descricao,
    valor,
    vencimento,
    status,
    categoria,
    'Formato ISO' as tipo_data
FROM transactions 
WHERE status = 'pendente' 
AND vencimento = '2025-08-13'
ORDER BY valor DESC;

-- 3. Verificar transações vencendo hoje usando TO_DATE (formato brasileiro)
SELECT 
    id,
    descricao,
    valor,
    vencimento,
    status,
    categoria,
    'Parseado Brasileiro' as tipo_data
FROM transactions 
WHERE status = 'pendente' 
AND vencimento ~ '^\d{2}/\d{2}/\d{4}$'
AND TO_DATE(vencimento, 'DD/MM/YYYY')::date = CURRENT_DATE
ORDER BY valor DESC;

-- 4. Verificar transações vencendo hoje usando parse ISO
SELECT 
    id,
    descricao,
    valor,
    vencimento,
    status,
    categoria,
    'Parseado ISO' as tipo_data
FROM transactions 
WHERE status = 'pendente' 
AND vencimento ~ '^\d{4}-\d{2}-\d{2}$'
AND vencimento::date = CURRENT_DATE
ORDER BY valor DESC;

-- 5. Resumo de todas as transações que vencem hoje
SELECT 
    COUNT(*) as total_vencendo_hoje,
    STRING_AGG(descricao, ', ') as transacoes
FROM (
    -- Formato brasileiro
    SELECT descricao FROM transactions 
    WHERE status = 'pendente' AND vencimento = '13/08/2025'
    UNION ALL
    -- Formato ISO
    SELECT descricao FROM transactions 
    WHERE status = 'pendente' AND vencimento = '2025-08-13'
    UNION ALL
    -- Parseado brasileiro
    SELECT descricao FROM transactions 
    WHERE status = 'pendente' 
    AND vencimento ~ '^\d{2}/\d{2}/\d{4}$'
    AND TO_DATE(vencimento, 'DD/MM/YYYY')::date = CURRENT_DATE
    UNION ALL
    -- Parseado ISO
    SELECT descricao FROM transactions 
    WHERE status = 'pendente' 
    AND vencimento ~ '^\d{4}-\d{2}-\d{2}$'
    AND vencimento::date = CURRENT_DATE
) as todas_vencendo_hoje;

-- 6. Verificar todas as transações pendentes com seus formatos de data
SELECT 
    descricao,
    valor,
    vencimento,
    CASE 
        WHEN vencimento ~ '^\d{2}/\d{2}/\d{4}$' THEN 'Brasileiro (DD/MM/YYYY)'
        WHEN vencimento ~ '^\d{4}-\d{2}-\d{2}$' THEN 'ISO (YYYY-MM-DD)'
        ELSE 'Formato Desconhecido'
    END as formato_data,
    CASE 
        WHEN vencimento ~ '^\d{2}/\d{2}/\d{4}$' THEN
            TO_DATE(vencimento, 'DD/MM/YYYY')::date - CURRENT_DATE
        WHEN vencimento ~ '^\d{4}-\d{2}-\d{2}$' THEN
            vencimento::date - CURRENT_DATE
        ELSE NULL
    END as dias_ate_vencimento
FROM transactions 
WHERE status = 'pendente' 
AND vencimento IS NOT NULL
ORDER BY dias_ate_vencimento ASC;
