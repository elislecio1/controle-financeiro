-- Script para verificar transações vencendo hoje e configurações de alerta
-- Execute este script no SQL Editor do Supabase para diagnosticar o problema

-- 1. Verificar configurações de alerta ativas
SELECT 
    id,
    tipo,
    ativo,
    dias_antes,
    frequencia,
    canais,
    created_at
FROM configuracoes_alertas 
WHERE tipo = 'vencimento' AND ativo = true
ORDER BY created_at DESC;

-- 2. Verificar transações pendentes com vencimento
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
    categoria,
    created_at
FROM transactions 
WHERE status = 'pendente' 
AND vencimento = '13/08/2025'
ORDER BY valor DESC;

-- 4. Verificar transações vencendo nos próximos 7 dias
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
AND vencimento IN ('13/08/2025', '14/08/2025', '15/08/2025', '16/08/2025', '17/08/2025', '18/08/2025', '19/08/2025', '20/08/2025')
ORDER BY vencimento ASC;

-- 5. Verificar se a tabela de alertas existe e tem dados
SELECT 
    COUNT(*) as total_alertas,
    COUNT(CASE WHEN status = 'ativo' THEN 1 END) as alertas_ativos,
    COUNT(CASE WHEN tipo = 'vencimento' THEN 1 END) as alertas_vencimento
FROM alertas;

-- 6. Verificar alertas de vencimento ativos
SELECT 
    id,
    tipo,
    titulo,
    mensagem,
    prioridade,
    status,
    data_criacao,
    dados_relacionados
FROM alertas 
WHERE tipo = 'vencimento' 
AND status = 'ativo'
ORDER BY data_criacao DESC
LIMIT 10;

-- 7. Testar inserção de uma configuração de alerta com dias_antes = 0
INSERT INTO configuracoes_alertas (
    tipo, 
    ativo, 
    dias_antes, 
    frequencia, 
    canais
) VALUES (
    'vencimento',
    true,
    0,
    'diario',
    ARRAY['dashboard']
) ON CONFLICT DO NOTHING;

-- 8. Verificar se a inserção foi bem-sucedida
SELECT 
    id,
    tipo,
    ativo,
    dias_antes,
    frequencia,
    canais,
    created_at
FROM configuracoes_alertas 
WHERE dias_antes = 0 
AND tipo = 'vencimento'
ORDER BY created_at DESC;
