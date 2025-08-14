-- Script para testar o parsing de datas brasileiras
-- Este script simula o que a função parseBrazilianDate faz no JavaScript

-- 1. Verificar formato das datas de vencimento
SELECT DISTINCT 
    vencimento,
    LENGTH(vencimento) as tamanho,
    CASE 
        WHEN vencimento ~ '^\d{2}/\d{2}/\d{4}$' THEN 'Formato correto DD/MM/YYYY'
        WHEN vencimento ~ '^\d{1}/\d{1}/\d{4}$' THEN 'Formato DD/MM/YYYY (sem zeros)'
        WHEN vencimento ~ '^\d{2}/\d{1}/\d{4}$' THEN 'Formato DD/M/YYYY'
        WHEN vencimento ~ '^\d{1}/\d{2}/\d{4}$' THEN 'Formato D/MM/YYYY'
        ELSE 'Formato inválido'
    END as formato_detectado
FROM transactions 
WHERE vencimento IS NOT NULL
ORDER BY vencimento;

-- 2. Testar conversão de data brasileira para ISO
-- Simulando o que a função parseBrazilianDate faz
SELECT 
    vencimento,
    CASE 
        WHEN vencimento ~ '^\d{2}/\d{2}/\d{4}$' THEN
            TO_DATE(vencimento, 'DD/MM/YYYY')
        WHEN vencimento ~ '^\d{1}/\d{1}/\d{4}$' THEN
            TO_DATE(LPAD(SPLIT_PART(vencimento, '/', 1), 2, '0') || '/' || 
                   LPAD(SPLIT_PART(vencimento, '/', 2), 2, '0') || '/' || 
                   SPLIT_PART(vencimento, '/', 3), 'DD/MM/YYYY')
        WHEN vencimento ~ '^\d{2}/\d{1}/\d{4}$' THEN
            TO_DATE(SPLIT_PART(vencimento, '/', 1) || '/' || 
                   LPAD(SPLIT_PART(vencimento, '/', 2), 2, '0') || '/' || 
                   SPLIT_PART(vencimento, '/', 3), 'DD/MM/YYYY')
        WHEN vencimento ~ '^\d{1}/\d{2}/\d{4}$' THEN
            TO_DATE(LPAD(SPLIT_PART(vencimento, '/', 1), 2, '0') || '/' || 
                   SPLIT_PART(vencimento, '/', 2) || '/' || 
                   SPLIT_PART(vencimento, '/', 3), 'DD/MM/YYYY')
        ELSE NULL
    END as data_convertida,
    CASE 
        WHEN vencimento ~ '^\d{2}/\d{2}/\d{4}$' THEN
            TO_DATE(vencimento, 'DD/MM/YYYY')::date
        WHEN vencimento ~ '^\d{1}/\d{1}/\d{4}$' THEN
            TO_DATE(LPAD(SPLIT_PART(vencimento, '/', 1), 2, '0') || '/' || 
                   LPAD(SPLIT_PART(vencimento, '/', 2), 2, '0') || '/' || 
                   SPLIT_PART(vencimento, '/', 3), 'DD/MM/YYYY')::date
        WHEN vencimento ~ '^\d{2}/\d{1}/\d{4}$' THEN
            TO_DATE(SPLIT_PART(vencimento, '/', 1) || '/' || 
                   LPAD(SPLIT_PART(vencimento, '/', 2), 2, '0') || '/' || 
                   SPLIT_PART(vencimento, '/', 3), 'DD/MM/YYYY')::date
        WHEN vencimento ~ '^\d{1}/\d{2}/\d{4}$' THEN
            TO_DATE(LPAD(SPLIT_PART(vencimento, '/', 1), 2, '0') || '/' || 
                   SPLIT_PART(vencimento, '/', 2) || '/' || 
                   SPLIT_PART(vencimento, '/', 3), 'DD/MM/YYYY')::date
        ELSE NULL
    END as data_hoje_comparacao
FROM transactions 
WHERE vencimento IS NOT NULL
AND vencimento IN ('13/08/2025', '14/08/2025', '15/08/2025')
ORDER BY vencimento;

-- 3. Calcular dias até vencimento para datas específicas
SELECT 
    descricao,
    vencimento,
    CASE 
        WHEN vencimento ~ '^\d{2}/\d{2}/\d{4}$' THEN
            TO_DATE(vencimento, 'DD/MM/YYYY')::date
        WHEN vencimento ~ '^\d{1}/\d{1}/\d{4}$' THEN
            TO_DATE(LPAD(SPLIT_PART(vencimento, '/', 1), 2, '0') || '/' || 
                   LPAD(SPLIT_PART(vencimento, '/', 2), 2, '0') || '/' || 
                   SPLIT_PART(vencimento, '/', 3), 'DD/MM/YYYY')::date
        WHEN vencimento ~ '^\d{2}/\d{1}/\d{4}$' THEN
            TO_DATE(SPLIT_PART(vencimento, '/', 1) || '/' || 
                   LPAD(SPLIT_PART(vencimento, '/', 2), 2, '0') || '/' || 
                   SPLIT_PART(vencimento, '/', 3), 'DD/MM/YYYY')::date
        WHEN vencimento ~ '^\d{1}/\d{2}/\d{4}$' THEN
            TO_DATE(LPAD(SPLIT_PART(vencimento, '/', 1), 2, '0') || '/' || 
                   SPLIT_PART(vencimento, '/', 2) || '/' || 
                   SPLIT_PART(vencimento, '/', 3), 'DD/MM/YYYY')::date
        ELSE NULL
    END as data_vencimento,
    CURRENT_DATE as data_atual,
    CASE 
        WHEN vencimento ~ '^\d{2}/\d{2}/\d{4}$' THEN
            TO_DATE(vencimento, 'DD/MM/YYYY')::date - CURRENT_DATE
        WHEN vencimento ~ '^\d{1}/\d{1}/\d{4}$' THEN
            TO_DATE(LPAD(SPLIT_PART(vencimento, '/', 1), 2, '0') || '/' || 
                   LPAD(SPLIT_PART(vencimento, '/', 2), 2, '0') || '/' || 
                   SPLIT_PART(vencimento, '/', 3), 'DD/MM/YYYY')::date - CURRENT_DATE
        WHEN vencimento ~ '^\d{2}/\d{1}/\d{4}$' THEN
            TO_DATE(SPLIT_PART(vencimento, '/', 1) || '/' || 
                   LPAD(SPLIT_PART(vencimento, '/', 2), 2, '0') || '/' || 
                   SPLIT_PART(vencimento, '/', 3), 'DD/MM/YYYY')::date - CURRENT_DATE
        WHEN vencimento ~ '^\d{1}/\d{2}/\d{4}$' THEN
            TO_DATE(LPAD(SPLIT_PART(vencimento, '/', 1), 2, '0') || '/' || 
                   SPLIT_PART(vencimento, '/', 2) || '/' || 
                   SPLIT_PART(vencimento, '/', 3), 'DD/MM/YYYY')::date - CURRENT_DATE
        ELSE NULL
    END as dias_ate_vencimento
FROM transactions 
WHERE status = 'pendente'
AND vencimento IS NOT NULL
AND vencimento IN ('13/08/2025', '14/08/2025', '15/08/2025', '16/08/2025', '17/08/2025')
ORDER BY dias_ate_vencimento ASC;

-- 4. Verificar se há transações vencendo hoje (dias_ate_vencimento = 0)
SELECT 
    descricao,
    valor,
    vencimento,
    CASE 
        WHEN vencimento ~ '^\d{2}/\d{2}/\d{4}$' THEN
            TO_DATE(vencimento, 'DD/MM/YYYY')::date - CURRENT_DATE
        WHEN vencimento ~ '^\d{1}/\d{1}/\d{4}$' THEN
            TO_DATE(LPAD(SPLIT_PART(vencimento, '/', 1), 2, '0') || '/' || 
                   LPAD(SPLIT_PART(vencimento, '/', 2), 2, '0') || '/' || 
                   SPLIT_PART(vencimento, '/', 3), 'DD/MM/YYYY')::date - CURRENT_DATE
        WHEN vencimento ~ '^\d{2}/\d{1}/\d{4}$' THEN
            TO_DATE(SPLIT_PART(vencimento, '/', 1) || '/' || 
                   LPAD(SPLIT_PART(vencimento, '/', 2), 2, '0') || '/' || 
                   SPLIT_PART(vencimento, '/', 3), 'DD/MM/YYYY')::date - CURRENT_DATE
        WHEN vencimento ~ '^\d{1}/\d{2}/\d{4}$' THEN
            TO_DATE(LPAD(SPLIT_PART(vencimento, '/', 1), 2, '0') || '/' || 
                   SPLIT_PART(vencimento, '/', 2) || '/' || 
                   SPLIT_PART(vencimento, '/', 3), 'DD/MM/YYYY')::date - CURRENT_DATE
        ELSE NULL
    END as dias_ate_vencimento
FROM transactions 
WHERE status = 'pendente'
AND vencimento IS NOT NULL
AND (
    CASE 
        WHEN vencimento ~ '^\d{2}/\d{2}/\d{4}$' THEN
            TO_DATE(vencimento, 'DD/MM/YYYY')::date - CURRENT_DATE
        WHEN vencimento ~ '^\d{1}/\d{1}/\d{4}$' THEN
            TO_DATE(LPAD(SPLIT_PART(vencimento, '/', 1), 2, '0') || '/' || 
                   LPAD(SPLIT_PART(vencimento, '/', 2), 2, '0') || '/' || 
                   SPLIT_PART(vencimento, '/', 3), 'DD/MM/YYYY')::date - CURRENT_DATE
        WHEN vencimento ~ '^\d{2}/\d{1}/\d{4}$' THEN
            TO_DATE(SPLIT_PART(vencimento, '/', 1) || '/' || 
                   LPAD(SPLIT_PART(vencimento, '/', 2), 2, '0') || '/' || 
                   SPLIT_PART(vencimento, '/', 3), 'DD/MM/YYYY')::date - CURRENT_DATE
        WHEN vencimento ~ '^\d{1}/\d{2}/\d{4}$' THEN
            TO_DATE(LPAD(SPLIT_PART(vencimento, '/', 1), 2, '0') || '/' || 
                   SPLIT_PART(vencimento, '/', 2) || '/' || 
                   SPLIT_PART(vencimento, '/', 3), 'DD/MM/YYYY')::date - CURRENT_DATE
        ELSE NULL
    END
) = 0
ORDER BY valor DESC;
