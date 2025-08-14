-- Script para verificar transações reais e remover as de teste
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar todas as transações pendentes
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

-- 2. Verificar transações de teste (que devem ser removidas)
SELECT 
    id,
    descricao,
    valor,
    vencimento,
    status,
    categoria,
    created_at
FROM transactions 
WHERE descricao LIKE '%Teste%'
ORDER BY created_at DESC;

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

-- 5. Contar total de transações por status
SELECT 
    status,
    COUNT(*) as total
FROM transactions 
GROUP BY status
ORDER BY status;

-- 6. Contar transações pendentes por data de vencimento
SELECT 
    vencimento,
    COUNT(*) as total
FROM transactions 
WHERE status = 'pendente' 
AND vencimento IS NOT NULL
GROUP BY vencimento
ORDER BY vencimento;

-- 7. REMOVER transações de teste (execute apenas se quiser limpar)
-- DELETE FROM transactions WHERE descricao LIKE '%Teste%';

-- 8. Verificar se a remoção foi bem-sucedida
SELECT 
    COUNT(*) as total_apos_limpeza
FROM transactions 
WHERE descricao LIKE '%Teste%';
