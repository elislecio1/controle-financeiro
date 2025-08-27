-- Atualizar políticas RLS para centros de custo da empresa
-- Este arquivo deve ser executado no Supabase SQL Editor

-- 1. Remover políticas antigas
DO $$
BEGIN
    -- Remover política de SELECT
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'centros_custo' 
        AND policyname = 'Usuários podem ver seus próprios centros de custo'
    ) THEN
        DROP POLICY "Usuários podem ver seus próprios centros de custo" ON centros_custo;
        RAISE NOTICE 'Política de SELECT removida';
    END IF;
    
    -- Remover política de INSERT
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'centros_custo' 
        AND policyname = 'Usuários podem inserir seus próprios centros de custo'
    ) THEN
        DROP POLICY "Usuários podem inserir seus próprios centros de custo" ON centros_custo;
        RAISE NOTICE 'Política de INSERT removida';
    END IF;
    
    -- Remover política de UPDATE
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'centros_custo' 
        AND policyname = 'Usuários podem atualizar seus próprios centros de custo'
    ) THEN
        DROP POLICY "Usuários podem atualizar seus próprios centros de custo" ON centros_custo;
        RAISE NOTICE 'Política de UPDATE removida';
    END IF;
    
    -- Remover política de DELETE
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'centros_custo' 
        AND policyname = 'Usuários podem deletar seus próprios centros de custo'
    ) THEN
        DROP POLICY "Usuários podem deletar seus próprios centros de custo" ON centros_custo;
        RAISE NOTICE 'Política de DELETE removida';
    END IF;
END $$;

-- 2. Criar novas políticas para empresa

-- Política para SELECT - usuários autenticados podem ver todos os centros de custo da empresa
CREATE POLICY "Usuários podem ver centros de custo da empresa" ON centros_custo
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Política para INSERT - usuários autenticados podem inserir centros de custo
CREATE POLICY "Usuários podem inserir centros de custo da empresa" ON centros_custo
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Política para UPDATE - usuários autenticados podem atualizar centros de custo
CREATE POLICY "Usuários podem atualizar centros de custo da empresa" ON centros_custo
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Política para DELETE - usuários autenticados podem deletar centros de custo
CREATE POLICY "Usuários podem deletar centros de custo da empresa" ON centros_custo
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- 3. Verificar se as novas políticas foram criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'centros_custo'
ORDER BY policyname;

-- 4. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'centros_custo';
