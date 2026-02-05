-- =====================================================
-- CORRIGIR RECURSÃO INFINITA NAS POLÍTICAS RLS
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- Este script corrige o erro: "infinite recursion detected in policy for relation 'empresa_usuarios'"

-- =====================================================
-- 1. REMOVER POLÍTICAS PROBLEMÁTICAS
-- =====================================================

DROP POLICY IF EXISTS "Company admins can view all memberships" ON empresa_usuarios;
DROP POLICY IF EXISTS "Company admins can add users" ON empresa_usuarios;
DROP POLICY IF EXISTS "Company admins can update memberships" ON empresa_usuarios;
DROP POLICY IF EXISTS "Company admins can remove users" ON empresa_usuarios;

-- =====================================================
-- 2. CRIAR FUNÇÃO SECURITY DEFINER PARA VERIFICAR ROLE
-- =====================================================
-- Esta função bypassa RLS para verificar se o usuário é admin
-- Evitando recursão infinita

CREATE OR REPLACE FUNCTION is_company_admin(p_user_id UUID, p_empresa_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM empresa_usuarios
        WHERE empresa_usuarios.user_id = p_user_id
        AND empresa_usuarios.empresa_id = p_empresa_id
        AND empresa_usuarios.role = 'admin'
        AND empresa_usuarios.ativo = true
    );
END;
$$;

-- Grant de execução
GRANT EXECUTE ON FUNCTION is_company_admin(UUID, UUID) TO authenticated;

-- =====================================================
-- 3. CRIAR POLÍTICAS CORRIGIDAS (SEM RECURSÃO)
-- =====================================================

-- Política 1: Usuários podem ver seus próprios vínculos (mantida, não causa recursão)
-- Esta já existe e está correta, mas vamos garantir que está criada
DROP POLICY IF EXISTS "Users can view their company memberships" ON empresa_usuarios;
CREATE POLICY "Users can view their company memberships" ON empresa_usuarios
    FOR SELECT
    USING (user_id = auth.uid());

-- Política 2: Admins podem ver todos os vínculos da empresa (CORRIGIDA)
-- Usa função SECURITY DEFINER para evitar recursão
CREATE POLICY "Company admins can view all memberships" ON empresa_usuarios
    FOR SELECT
    USING (
        -- Se é o próprio vínculo, sempre pode ver
        user_id = auth.uid()
        OR
        -- Se é admin da empresa, pode ver todos os vínculos
        is_company_admin(auth.uid(), empresa_id)
    );

-- Política 3: Admins podem criar vínculos (CORRIGIDA)
CREATE POLICY "Company admins can add users" ON empresa_usuarios
    FOR INSERT
    WITH CHECK (
        is_company_admin(auth.uid(), empresa_id)
    );

-- Política 4: Admins podem atualizar vínculos (CORRIGIDA)
CREATE POLICY "Company admins can update memberships" ON empresa_usuarios
    FOR UPDATE
    USING (
        -- Pode atualizar próprio vínculo
        user_id = auth.uid()
        OR
        -- Ou se é admin da empresa
        is_company_admin(auth.uid(), empresa_id)
    )
    WITH CHECK (
        -- Pode atualizar próprio vínculo
        user_id = auth.uid()
        OR
        -- Ou se é admin da empresa
        is_company_admin(auth.uid(), empresa_id)
    );

-- Política 5: Admins podem remover vínculos (CORRIGIDA)
CREATE POLICY "Company admins can remove users" ON empresa_usuarios
    FOR DELETE
    USING (
        -- Pode remover próprio vínculo (sair da empresa)
        user_id = auth.uid()
        OR
        -- Ou se é admin da empresa (remover outros usuários)
        is_company_admin(auth.uid(), empresa_id)
    );

-- =====================================================
-- 4. POLÍTICA PARA INSERT INICIAL (usuário criando empresa)
-- =====================================================
-- Permitir que usuários criem seu próprio vínculo quando criam uma empresa
-- Isso é necessário para o bootstrap inicial

CREATE POLICY "Users can create their own membership" ON empresa_usuarios
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 5. VERIFICAÇÃO
-- =====================================================

-- Verificar políticas criadas
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
WHERE tablename = 'empresa_usuarios'
ORDER BY policyname;

-- Testar função
SELECT 
    'Função is_company_admin criada com sucesso!' as status,
    is_company_admin(auth.uid(), (SELECT id FROM empresas LIMIT 1)) as test_result;

-- =====================================================
-- 6. NOTAS IMPORTANTES
-- =====================================================
-- 
-- As políticas agora usam a função is_company_admin() que:
-- 1. É SECURITY DEFINER (bypassa RLS)
-- 2. É STABLE (pode ser otimizada pelo planner)
-- 3. Evita recursão infinita
--
-- IMPORTANTE: Se você ainda tiver o erro, pode ser necessário:
-- 1. Limpar o cache do navegador
-- 2. Fazer logout e login novamente
-- 3. Verificar se há outras políticas conflitantes
