-- Corrigir constraint do campo tipo na tabela centros_custo
-- Este arquivo deve ser executado no Supabase SQL Editor

-- 1. Verificar a constraint atual
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'centros_custo'::regclass 
AND contype = 'c';

-- 2. Remover a constraint atual (se existir)
DO $$
BEGIN
    -- Verificar se a constraint existe e removê-la
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'centros_custo'::regclass 
        AND conname = 'centros_custo_tipo_check'
    ) THEN
        ALTER TABLE centros_custo DROP CONSTRAINT centros_custo_tipo_check;
        RAISE NOTICE 'Constraint centros_custo_tipo_check removida';
    ELSE
        RAISE NOTICE 'Constraint centros_custo_tipo_check não encontrada';
    END IF;
END $$;

-- 3. Criar nova constraint que permite 'ambos'
ALTER TABLE centros_custo 
ADD CONSTRAINT centros_custo_tipo_check 
CHECK (tipo IN ('custo', 'lucro', 'ambos'));

-- 4. Verificar se a nova constraint foi criada
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'centros_custo'::regclass 
AND contype = 'c';

-- 5. Verificar a estrutura atual da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'centros_custo'
ORDER BY ordinal_position;
