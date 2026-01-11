-- =====================================================
-- CONFIGURAR RLS PARA COMPARTILHAR TRANSAÇÕES POR EMPRESA
-- =====================================================
-- Este script permite que usuários vejam todas as transações
-- da empresa que participam, não apenas as próprias
--
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Verificar estrutura atual da tabela transactions
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Adicionar coluna empresa_id se não existir (para melhor organização)
-- Por enquanto vamos usar o campo 'empresa' (VARCHAR) que já existe
-- Mas vamos criar uma função auxiliar para normalizar nomes de empresas

-- 3. Criar tabela de relacionamento usuário-empresa (se não existir)
CREATE TABLE IF NOT EXISTS public.user_empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, empresa)
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_empresas_user_id ON public.user_empresas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_empresas_empresa ON public.user_empresas(empresa);
CREATE INDEX IF NOT EXISTS idx_transactions_empresa ON public.transactions(empresa);

-- 5. Habilitar RLS na tabela user_empresas
ALTER TABLE public.user_empresas ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para user_empresas
DROP POLICY IF EXISTS "Users can view own empresa memberships" ON public.user_empresas;
CREATE POLICY "Users can view own empresa memberships"
ON public.user_empresas FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage empresa memberships" ON public.user_empresas;
CREATE POLICY "Admins can manage empresa memberships"
ON public.user_empresas FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- 7. Função auxiliar para obter empresas do usuário
CREATE OR REPLACE FUNCTION public.get_user_empresas(user_uuid UUID)
RETURNS TABLE(empresa VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ue.empresa
    FROM public.user_empresas ue
    WHERE ue.user_id = user_uuid AND ue.is_active = true
    
    UNION
    
    -- Também incluir empresas das transações que o usuário criou
    SELECT DISTINCT t.empresa
    FROM public.transactions t
    WHERE t.user_id = user_uuid AND t.empresa IS NOT NULL AND t.empresa != '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. REMOVER políticas RLS antigas da tabela transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view empresa transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;

-- 9. Criar NOVA política RLS para SELECT (Visualizar)
-- Permite que usuários vejam:
-- - Suas próprias transações
-- - Transações da mesma empresa (se participarem da empresa)
-- - Todas as transações se for admin
CREATE POLICY "Users can view empresa transactions"
ON public.transactions FOR SELECT
USING (
    -- Usuário pode ver suas próprias transações
    auth.uid() = user_id
    OR
    -- Usuário pode ver transações da mesma empresa
    (
        empresa IS NOT NULL 
        AND empresa != ''
        AND EXISTS (
            SELECT 1 FROM public.user_empresas ue
            WHERE ue.user_id = auth.uid()
            AND ue.empresa = transactions.empresa
            AND ue.is_active = true
        )
    )
    OR
    -- Usuário pode ver transações de empresas que ele criou transações
    (
        empresa IS NOT NULL 
        AND empresa != ''
        AND EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.user_id = auth.uid()
            AND t.empresa = transactions.empresa
            AND t.empresa IS NOT NULL
            AND t.empresa != ''
        )
    )
    OR
    -- Admins podem ver todas as transações
    EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.user_id = auth.uid()
        AND up.role = 'admin'
    )
);

-- 10. Política para INSERT (Inserir)
-- Usuários podem criar transações para empresas que participam
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert empresa transactions" ON public.transactions;

CREATE POLICY "Users can insert empresa transactions"
ON public.transactions FOR INSERT
WITH CHECK (
    -- Usuário pode criar transações próprias
    auth.uid() = user_id
    AND
    (
        -- Se não especificar empresa, é transação pessoal (OK)
        empresa IS NULL OR empresa = ''
        OR
        -- Se especificar empresa, deve participar dela
        EXISTS (
            SELECT 1 FROM public.user_empresas ue
            WHERE ue.user_id = auth.uid()
            AND ue.empresa = transactions.empresa
            AND ue.is_active = true
        )
        OR
        -- Ou pode criar transação para empresa que já tem transações
        EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.user_id = auth.uid()
            AND t.empresa = transactions.empresa
            AND t.empresa IS NOT NULL
            AND t.empresa != ''
        )
        OR
        -- Admins podem criar transações para qualquer empresa
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role = 'admin'
        )
    )
);

-- 11. Política para UPDATE (Atualizar)
-- Usuários podem atualizar transações da empresa que participam
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update empresa transactions" ON public.transactions;

CREATE POLICY "Users can update empresa transactions"
ON public.transactions FOR UPDATE
USING (
    -- Mesmas condições de visualização
    auth.uid() = user_id
    OR
    (
        empresa IS NOT NULL 
        AND empresa != ''
        AND EXISTS (
            SELECT 1 FROM public.user_empresas ue
            WHERE ue.user_id = auth.uid()
            AND ue.empresa = transactions.empresa
            AND ue.is_active = true
        )
    )
    OR
    EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.user_id = auth.uid()
        AND up.role = 'admin'
    )
)
WITH CHECK (
    -- Mesmas condições para garantir que não mude para empresa não autorizada
    auth.uid() = user_id
    OR
    (
        empresa IS NOT NULL 
        AND empresa != ''
        AND EXISTS (
            SELECT 1 FROM public.user_empresas ue
            WHERE ue.user_id = auth.uid()
            AND ue.empresa = transactions.empresa
            AND ue.is_active = true
        )
    )
    OR
    EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.user_id = auth.uid()
        AND up.role = 'admin'
    )
);

-- 12. Política para DELETE (Excluir)
-- Usuários podem excluir transações da empresa que participam
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete empresa transactions" ON public.transactions;

CREATE POLICY "Users can delete empresa transactions"
ON public.transactions FOR DELETE
USING (
    -- Mesmas condições de visualização
    auth.uid() = user_id
    OR
    (
        empresa IS NOT NULL 
        AND empresa != ''
        AND EXISTS (
            SELECT 1 FROM public.user_empresas ue
            WHERE ue.user_id = auth.uid()
            AND ue.empresa = transactions.empresa
            AND ue.is_active = true
        )
    )
    OR
    EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.user_id = auth.uid()
        AND up.role = 'admin'
    )
);

-- 13. Função para adicionar usuário a uma empresa automaticamente
-- Quando um usuário cria uma transação com uma empresa, ele é automaticamente adicionado
CREATE OR REPLACE FUNCTION public.auto_add_user_to_empresa()
RETURNS TRIGGER AS $$
BEGIN
    -- Se a transação tem uma empresa e o usuário ainda não está vinculado
    IF NEW.empresa IS NOT NULL AND NEW.empresa != '' AND NEW.user_id IS NOT NULL THEN
        INSERT INTO public.user_empresas (user_id, empresa, role, is_active)
        VALUES (NEW.user_id, NEW.empresa, 'member', true)
        ON CONFLICT (user_id, empresa) 
        DO UPDATE SET is_active = true, updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Criar trigger para adicionar usuário à empresa automaticamente
DROP TRIGGER IF EXISTS trigger_auto_add_user_to_empresa ON public.transactions;
CREATE TRIGGER trigger_auto_add_user_to_empresa
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_add_user_to_empresa();

-- 15. Migrar dados existentes: adicionar usuários às empresas baseado nas transações
-- Isso garante que usuários que já criaram transações para uma empresa
-- possam ver todas as transações dessa empresa
INSERT INTO public.user_empresas (user_id, empresa, role, is_active)
SELECT DISTINCT 
    t.user_id,
    t.empresa,
    'member'::VARCHAR(50),
    true
FROM public.transactions t
WHERE t.empresa IS NOT NULL 
AND t.empresa != ''
AND t.user_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.user_empresas ue
    WHERE ue.user_id = t.user_id
    AND ue.empresa = t.empresa
)
ON CONFLICT (user_id, empresa) DO NOTHING;

-- 16. Verificar resultados
SELECT 
    'Total de empresas' as metric,
    COUNT(DISTINCT empresa) as value
FROM public.transactions
WHERE empresa IS NOT NULL AND empresa != ''

UNION ALL

SELECT 
    'Total de usuários em empresas' as metric,
    COUNT(DISTINCT user_id) as value
FROM public.user_empresas
WHERE is_active = true

UNION ALL

SELECT 
    'Total de vínculos usuário-empresa' as metric,
    COUNT(*) as value
FROM public.user_empresas
WHERE is_active = true;

-- 17. Verificar políticas RLS criadas
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
WHERE tablename = 'transactions'
ORDER BY policyname;

-- 18. Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ RLS configurado para compartilhar transações por empresa!';
    RAISE NOTICE '📋 Próximos passos:';
    RAISE NOTICE '1. Os usuários agora podem ver transações da mesma empresa';
    RAISE NOTICE '2. Usuários são automaticamente adicionados à empresa ao criar transação';
    RAISE NOTICE '3. Admins podem ver todas as transações';
    RAISE NOTICE '4. Teste fazendo login com diferentes usuários da mesma empresa';
END $$;

