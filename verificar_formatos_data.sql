-- Script para verificar os formatos de data na tabela transactions
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name IN ('data', 'vencimento', 'data_competencia', 'data_pagamento')
ORDER BY column_name;

-- 2. Verificar algumas transações recentes
SELECT 
    id,
    descricao,
    data,
    vencimento,
    data_competencia,
    data_pagamento,
    created_at,
    CASE 
        WHEN data ~ '^\d{4}-\d{2}-\d{2}$' THEN 'Formato ISO (YYYY-MM-DD)'
        WHEN data ~ '^\d{2}/\d{2}/\d{4}$' THEN 'Formato Brasileiro (DD/MM/YYYY)'
        ELSE 'Formato Desconhecido'
    END as formato_data,
    CASE 
        WHEN vencimento ~ '^\d{4}-\d{2}-\d{2}$' THEN 'Formato ISO (YYYY-MM-DD)'
        WHEN vencimento ~ '^\d{2}/\d{2}/\d{4}$' THEN 'Formato Brasileiro (DD/MM/YYYY)'
        ELSE 'Formato Desconhecido'
    END as formato_vencimento
FROM transactions 
ORDER BY created_at DESC
LIMIT 10;

-- 3. Contar formatos de data
SELECT 
    'Campo DATA' as campo,
    COUNT(*) as total,
    COUNT(CASE WHEN data ~ '^\d{4}-\d{2}-\d{2}$' THEN 1 END) as formato_iso,
    COUNT(CASE WHEN data ~ '^\d{2}/\d{2}/\d{4}$' THEN 1 END) as formato_brasileiro,
    COUNT(CASE WHEN data !~ '^\d{4}-\d{2}-\d{2}$' AND data !~ '^\d{2}/\d{2}/\d{4}$' THEN 1 END) as outros_formatos
FROM transactions
UNION ALL
SELECT 
    'Campo VENCIMENTO' as campo,
    COUNT(*) as total,
    COUNT(CASE WHEN vencimento ~ '^\d{4}-\d{2}-\d{2}$' THEN 1 END) as formato_iso,
    COUNT(CASE WHEN vencimento ~ '^\d{2}/\d{2}/\d{4}$' THEN 1 END) as formato_brasileiro,
    COUNT(CASE WHEN vencimento !~ '^\d{4}-\d{2}-\d{2}$' AND vencimento !~ '^\d{2}/\d{2}/\d{4}$' THEN 1 END) as outros_formatos
FROM transactions
WHERE vencimento IS NOT NULL;

-- 4. Verificar se há problemas de conversão
SELECT 
    'Problemas detectados' as status,
    COUNT(*) as total_problemas
FROM transactions 
WHERE (data_type = 'date' AND data !~ '^\d{4}-\d{2}-\d{2}$')
   OR (vencimento IS NOT NULL AND vencimento !~ '^\d{4}-\d{2}-\d{2}$');

-- 5. Mostrar exemplos de problemas
SELECT 
    'Exemplos de problemas' as tipo,
    id,
    descricao,
    data,
    vencimento,
    created_at
FROM transactions 
WHERE (data !~ '^\d{4}-\d{2}-\d{2}$' AND data IS NOT NULL)
   OR (vencimento IS NOT NULL AND vencimento !~ '^\d{4}-\d{2}-\d{2}$')
ORDER BY created_at DESC
LIMIT 5;
