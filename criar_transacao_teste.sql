-- Script para criar uma transação de teste vencendo hoje
-- Execute este script no SQL Editor do Supabase para testar os alertas

-- 1. Criar uma transação de teste vencendo hoje (13/08/2025)
INSERT INTO transactions (
    descricao,
    valor,
    tipo,
    categoria,
    subcategoria,
    conta,
    data,
    vencimento,
    status,
    forma,
    observacoes,
    created_at,
    updated_at
) VALUES (
    'Conta de Luz - Teste',
    150.00,
    'despesa',
    'Serviços',
    'Energia',
    'Conta Corrente Principal',
    '13/08/2025',
    '13/08/2025',
    'pendente',
    'pix',
    'Transação de teste para verificar alertas',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- 2. Criar outra transação vencendo amanhã (14/08/2025)
INSERT INTO transactions (
    descricao,
    valor,
    tipo,
    categoria,
    subcategoria,
    conta,
    data,
    vencimento,
    status,
    forma,
    observacoes,
    created_at,
    updated_at
) VALUES (
    'Internet - Teste',
    89.90,
    'despesa',
    'Serviços',
    'Internet',
    'Conta Corrente Principal',
    '14/08/2025',
    '14/08/2025',
    'pendente',
    'pix',
    'Transação de teste para verificar alertas',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- 3. Verificar se as transações foram criadas
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
ORDER BY vencimento ASC;

-- 4. Verificar transações vencendo hoje
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

-- 5. Verificar total de transações pendentes
SELECT 
    COUNT(*) as total_pendentes,
    COUNT(CASE WHEN vencimento = '13/08/2025' THEN 1 END) as vencendo_hoje,
    COUNT(CASE WHEN vencimento = '14/08/2025' THEN 1 END) as vencendo_amanha
FROM transactions 
WHERE status = 'pendente';

-- 6. Limpar transações de teste (execute apenas se quiser remover)
-- DELETE FROM transactions WHERE descricao LIKE '%Teste%';
