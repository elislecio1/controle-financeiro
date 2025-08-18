-- 🗑️ REMOVER TRANSAÇÕES SIMULADAS AGORA
-- Execute este script para remover imediatamente todas as transações simuladas

-- Primeiro, vamos ver o que será removido
SELECT 
    'ANTES DA REMOÇÃO' as status,
    COUNT(*) as total_simuladas
FROM transacoes_importadas 
WHERE descricao ILIKE '%simulad%' 
   OR descricao ILIKE '%Simulado%' 
   OR id_externo ILIKE '%inter_dev_%';

-- AGORA REMOVER TODAS AS TRANSAÇÕES SIMULADAS
DELETE FROM transacoes_importadas 
WHERE descricao ILIKE '%simulad%' 
   OR descricao ILIKE '%Simulado%' 
   OR id_externo ILIKE '%inter_dev_%';

-- Verificar se a remoção foi bem-sucedida
SELECT 
    'APÓS A REMOÇÃO' as status,
    COUNT(*) as transacoes_simuladas_restantes
FROM transacoes_importadas 
WHERE descricao ILIKE '%simulad%' 
   OR descricao ILIKE '%Simulado%' 
   OR id_externo ILIKE '%inter_dev_%';

-- Mostrar total de transações restantes
SELECT 
    'ESTATÍSTICAS FINAIS' as info,
    COUNT(*) as total_transacoes,
    COUNT(CASE WHEN status_conciliacao = 'pendente' THEN 1 END) as pendentes,
    COUNT(CASE WHEN status_conciliacao = 'conciliada' THEN 1 END) as conciliadas,
    COUNT(CASE WHEN status_conciliacao = 'ignorada' THEN 1 END) as ignoradas
FROM transacoes_importadas;
