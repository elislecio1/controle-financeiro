-- Adicionar coluna user_id na tabela centros_custo se ela não existir
-- Este arquivo deve ser executado no Supabase SQL Editor

-- 1. Verificar se a coluna user_id já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'centros_custo' 
        AND column_name = 'user_id'
    ) THEN
        -- Adicionar a coluna user_id
        ALTER TABLE centros_custo ADD COLUMN user_id UUID REFERENCES auth.users(id);
        
        -- Adicionar índice para melhor performance
        CREATE INDEX idx_centros_custo_user_id ON centros_custo(user_id);
        
        RAISE NOTICE 'Coluna user_id adicionada com sucesso na tabela centros_custo';
    ELSE
        RAISE NOTICE 'Coluna user_id já existe na tabela centros_custo';
    END IF;
END $$;

-- 2. Verificar a estrutura atual da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'centros_custo'
ORDER BY ordinal_position;

-- 3. Se a coluna user_id foi adicionada, atualizar registros existentes
-- (opcional - apenas se houver dados existentes que precisam ser migrados)
-- UPDATE centros_custo SET user_id = auth.uid() WHERE user_id IS NULL;
