-- 🧹 Script para Limpar Transações Simuladas
-- Execute este script no SQL Editor do Supabase

-- 1. Primeiro, vamos ver quantas transações simuladas existem
SELECT 
    COUNT(*) as total_simuladas,
    COUNT(CASE WHEN descricao ILIKE '%simulad%' THEN 1 END) as com_simulad,
    COUNT(CASE WHEN descricao ILIKE '%Simulado%' THEN 1 END) as com_Simulado,
    COUNT(CASE WHEN id_externo ILIKE '%inter_dev_%' THEN 1 END) as com_inter_dev
FROM transacoes_importadas 
WHERE descricao ILIKE '%simulad%' 
   OR descricao ILIKE '%Simulado%' 
   OR id_externo ILIKE '%inter_dev_%';

-- 2. Mostrar as transações simuladas que serão removidas
SELECT 
    id,
    descricao,
    valor,
    data_transacao,
    tipo,
    status_conciliacao,
    id_externo,
    created_at
FROM transacoes_importadas 
WHERE descricao ILIKE '%simulad%' 
   OR descricao ILIKE '%Simulado%' 
   OR id_externo ILIKE '%inter_dev_%'
ORDER BY created_at DESC;

-- 3. REMOVER as transações simuladas (DESCOMENTE A LINHA ABAIXO PARA EXECUTAR)
-- DELETE FROM transacoes_importadas 
-- WHERE descricao ILIKE '%simulad%' 
--    OR descricao ILIKE '%Simulado%' 
--    OR id_externo ILIKE '%inter_dev_%';

-- 4. Verificar se ainda existem transações simuladas (execute após a remoção)
-- SELECT COUNT(*) as transacoes_simuladas_restantes
-- FROM transacoes_importadas 
-- WHERE descricao ILIKE '%simulad%' 
--    OR descricao ILIKE '%Simulado%' 
--    OR id_externo ILIKE '%inter_dev_%';

-- 5. Mostrar estatísticas finais
-- SELECT 
--     COUNT(*) as total_transacoes,
--     COUNT(CASE WHEN status_conciliacao = 'pendente' THEN 1 END) as pendentes,
--     COUNT(CASE WHEN status_conciliacao = 'conciliada' THEN 1 END) as conciliadas,
--     COUNT(CASE WHEN status_conciliacao = 'ignorada' THEN 1 END) as ignoradas
-- FROM transacoes_importadas;
