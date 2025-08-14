-- Script para corrigir a constraint do campo dias_antes
-- Permite o valor 0 (vencimentos de hoje) além dos valores de 1 a 30

-- Remover a constraint antiga
ALTER TABLE configuracoes_alertas DROP CONSTRAINT IF EXISTS configuracoes_alertas_dias_antes_check;

-- Adicionar a nova constraint que permite valores de 0 a 30
ALTER TABLE configuracoes_alertas ADD CONSTRAINT configuracoes_alertas_dias_antes_check 
CHECK (dias_antes >= 0 AND dias_antes <= 30);

-- Verificar se a alteração foi aplicada
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'configuracoes_alertas' 
AND column_name = 'dias_antes';

-- Testar inserção com valor 0
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

-- Verificar se a inserção foi bem-sucedida
SELECT id, tipo, ativo, dias_antes, frequencia 
FROM configuracoes_alertas 
WHERE dias_antes = 0 
ORDER BY created_at DESC 
LIMIT 1;

-- Limpar o teste (opcional)
-- DELETE FROM configuracoes_alertas WHERE dias_antes = 0 AND tipo = 'vencimento';
