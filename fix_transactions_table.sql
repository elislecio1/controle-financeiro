-- =====================================================
-- CORREÇÃO DA TABELA TRANSACTIONS
-- =====================================================

-- Este script corrige a tabela transactions existente
-- Execute este script se você já tem uma tabela transactions sem a coluna 'data'

-- 1. Adicionar a coluna 'data' se ela não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'data'
    ) THEN
        ALTER TABLE transactions ADD COLUMN data VARCHAR(10);
        
        -- Atualizar registros existentes com a data do vencimento
        UPDATE transactions 
        SET data = vencimento 
        WHERE data IS NULL;
        
        -- Tornar a coluna NOT NULL após preencher os dados
        ALTER TABLE transactions ALTER COLUMN data SET NOT NULL;
    END IF;
END $$;

-- 2. Verificar se todas as colunas necessárias existem
DO $$ 
BEGIN
    -- Adicionar colunas que podem estar faltando
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'conta_transferencia'
    ) THEN
        ALTER TABLE transactions ADD COLUMN conta_transferencia VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'cartao'
    ) THEN
        ALTER TABLE transactions ADD COLUMN cartao VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'subcategoria'
    ) THEN
        ALTER TABLE transactions ADD COLUMN subcategoria VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'contato'
    ) THEN
        ALTER TABLE transactions ADD COLUMN contato VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'centro'
    ) THEN
        ALTER TABLE transactions ADD COLUMN centro VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'projeto'
    ) THEN
        ALTER TABLE transactions ADD COLUMN projeto VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'numero_documento'
    ) THEN
        ALTER TABLE transactions ADD COLUMN numero_documento VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'observacoes'
    ) THEN
        ALTER TABLE transactions ADD COLUMN observacoes TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'data_competencia'
    ) THEN
        ALTER TABLE transactions ADD COLUMN data_competencia VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE transactions ADD COLUMN tags JSONB;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'data_pagamento'
    ) THEN
        ALTER TABLE transactions ADD COLUMN data_pagamento VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'parcela'
    ) THEN
        ALTER TABLE transactions ADD COLUMN parcela VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'situacao'
    ) THEN
        ALTER TABLE transactions ADD COLUMN situacao VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE transactions ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE transactions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 3. Adicionar constraints se não existirem
DO $$ 
BEGIN
    -- Constraint para status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'transactions' 
        AND constraint_name = 'transactions_status_check'
    ) THEN
        ALTER TABLE transactions ADD CONSTRAINT transactions_status_check 
        CHECK (status IN ('pago', 'pendente', 'vencido'));
    END IF;
    
    -- Constraint para tipo
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'transactions' 
        AND constraint_name = 'transactions_tipo_check'
    ) THEN
        ALTER TABLE transactions ADD CONSTRAINT transactions_tipo_check 
        CHECK (tipo IN ('receita', 'despesa', 'transferencia', 'investimento'));
    END IF;
END $$;

-- 4. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_transactions_data ON transactions(data);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_tipo ON transactions(tipo);
CREATE INDEX IF NOT EXISTS idx_transactions_categoria ON transactions(categoria);
CREATE INDEX IF NOT EXISTS idx_transactions_vencimento ON transactions(vencimento);

-- 5. Verificar se o trigger existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_transactions_updated_at'
    ) THEN
        -- Criar a função se não existir
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        -- Criar o trigger
        CREATE TRIGGER update_transactions_updated_at 
        BEFORE UPDATE ON transactions 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 6. Verificar se RLS está habilitado
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 7. Criar política RLS se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transactions' 
        AND policyname = 'Allow all operations for authenticated users'
    ) THEN
        CREATE POLICY "Allow all operations for authenticated users" 
        ON transactions FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se a tabela está correta
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;

-- Verificar se os índices foram criados
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'transactions';

-- Verificar se as políticas RLS foram criadas
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'transactions'; 