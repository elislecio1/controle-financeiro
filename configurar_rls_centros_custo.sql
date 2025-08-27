-- Configurar Row Level Security (RLS) para a tabela centros_custo
-- Este arquivo deve ser executado no Supabase SQL Editor

-- 1. Habilitar RLS na tabela centros_custo (se ainda não estiver habilitado)
ALTER TABLE centros_custo ENABLE ROW LEVEL SECURITY;

-- 2. Criar política para permitir que usuários autenticados vejam apenas seus próprios centros de custo
CREATE POLICY "Usuários podem ver seus próprios centros de custo" ON centros_custo
    FOR SELECT
    USING (auth.uid() = user_id);

-- 3. Criar política para permitir que usuários autenticados insiram seus próprios centros de custo
CREATE POLICY "Usuários podem inserir seus próprios centros de custo" ON centros_custo
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 4. Criar política para permitir que usuários autenticados atualizem seus próprios centros de custo
CREATE POLICY "Usuários podem atualizar seus próprios centros de custo" ON centros_custo
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. Criar política para permitir que usuários autenticados deletem seus próprios centros de custo
CREATE POLICY "Usuários podem deletar seus próprios centros de custo" ON centros_custo
    FOR DELETE
    USING (auth.uid() = user_id);

-- 6. Verificar se as políticas foram criadas
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

-- 7. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'centros_custo';
