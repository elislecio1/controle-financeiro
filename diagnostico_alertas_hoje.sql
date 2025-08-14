-- Script de diagnóstico completo para alertas
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar configurações de alerta
SELECT 
    id,
    tipo,
    ativo,
    dias_antes,
    frequencia,
    canais,
    created_at
FROM configuracoes_alertas 
WHERE ativo = true
ORDER BY created_at DESC;

-- 2. Verificar todas as transações pendentes
SELECT 
    id,
    descricao,
    valor,
    vencimento,
    status,
    categoria,
    created_at
FROM transactions 
WHERE status = 'pendente' 
AND vencimento IS NOT NULL
ORDER BY vencimento ASC;

-- 3. Verificar transações vencendo hoje (13/08/2025)
SELECT 
    id,
    descricao,
    valor,
    vencimento,
    status,
    categoria
FROM transactions 
WHERE status = 'pendente' 
AND vencimento = '13/08/2025'
ORDER BY valor DESC;

-- 4. Verificar transações vencendo amanhã (14/08/2025)
SELECT 
    id,
    descricao,
    valor,
    vencimento,
    status,
    categoria
FROM transactions 
WHERE status = 'pendente' 
AND vencimento = '14/08/2025'
ORDER BY valor DESC;

-- 5. Verificar se há transações de teste (que devem ser removidas)
SELECT 
    COUNT(*) as total_transacoes_teste
FROM transactions 
WHERE descricao LIKE '%Teste%';

-- 6. Verificar formato das datas de vencimento
SELECT 
    vencimento,
    CASE 
        WHEN vencimento ~ '^\d{2}/\d{2}/\d{4}$' THEN 'Formato correto'
        ELSE 'Formato incorreto'
    END as status_formato
FROM transactions 
WHERE status = 'pendente' 
AND vencimento IS NOT NULL
GROUP BY vencimento
ORDER BY vencimento;

-- 7. Verificar se há transações com status diferente de 'pendente'
SELECT 
    status,
    COUNT(*) as total
FROM transactions 
GROUP BY status
ORDER BY status;

-- 8. Verificar se há transações sem data de vencimento
SELECT 
    COUNT(*) as total_sem_vencimento
FROM transactions 
WHERE status = 'pendente' 
AND (vencimento IS NULL OR vencimento = '');

-- 9. Testar cálculo de dias até vencimento para hoje
SELECT 
    descricao,
    vencimento,
    CASE 
        WHEN vencimento ~ '^\d{2}/\d{2}/\d{4}$' THEN
            TO_DATE(vencimento, 'DD/MM/YYYY')::date - CURRENT_DATE
        ELSE NULL
    END as dias_ate_vencimento
FROM transactions 
WHERE status = 'pendente'
AND vencimento IS NOT NULL
ORDER BY dias_ate_vencimento ASC;

-- 10. Verificar se há transações que deveriam gerar alerta (dias_ate_vencimento <= 0)
SELECT 
    descricao,
    valor,
    vencimento,
    CASE 
        WHEN vencimento ~ '^\d{2}/\d{2}/\d{4}$' THEN
            TO_DATE(vencimento, 'DD/MM/YYYY')::date - CURRENT_DATE
        ELSE NULL
    END as dias_ate_vencimento
FROM transactions 
WHERE status = 'pendente'
AND vencimento IS NOT NULL
AND (
    CASE 
        WHEN vencimento ~ '^\d{2}/\d{2}/\d{4}$' THEN
            TO_DATE(vencimento, 'DD/MM/YYYY')::date - CURRENT_DATE
        ELSE NULL
    END
) <= 0
ORDER BY dias_ate_vencimento ASC;
