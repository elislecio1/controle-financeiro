-- =====================================================
-- CORRIGIR RECURSÃO INFINITA NAS POLÍTICAS RLS
-- =====================================================
-- Este script corrige o erro "infinite recursion detected in policy"
-- criando uma função auxiliar que verifica admin sem causar recursão
-- =====================================================

-- 1. Criar função auxiliar para verificar se usuário é admin (SEM RECURSÃO)
-- Esta função usa SECURITY DEFINER para bypassar RLS temporariamente
DROP FUNCTION IF EXISTS public.is_user_admin(UUID);
CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    -- Usar SECURITY DEFINER para bypassar RLS e evitar recursão
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_profiles 
        WHERE user_id = check_user_id 
        AND role = 'admin'
    );
END;
$$;

-- 2. REMOVER TODAS as políticas antigas que causam recursão
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;

-- 3. Criar NOVAS políticas RLS usando a função auxiliar (SEM RECURSÃO)

-- Política: Usuários podem ver seus próprios perfis
CREATE POLICY "Users can view own profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = user_id);

-- Política: Admins podem ver TODOS os perfis (usando função auxiliar)
CREATE POLICY "Admins can view all profiles"
ON public.user_profiles FOR SELECT
USING (public.is_user_admin());

-- Política: Usuários podem atualizar seus próprios perfis
CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política: Admins podem atualizar TODOS os perfis (usando função auxiliar)
CREATE POLICY "Admins can update all profiles"
ON public.user_profiles FOR UPDATE
USING (public.is_user_admin())
WITH CHECK (public.is_user_admin());

-- Política: Usuários podem inserir seus próprios perfis
CREATE POLICY "Users can insert own profile"
ON public.user_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política: Admins podem inserir perfis para qualquer usuário (usando função auxiliar)
CREATE POLICY "Admins can insert profiles"
ON public.user_profiles FOR INSERT
WITH CHECK (public.is_user_admin());

-- Política: Admins podem deletar perfis (usando função auxiliar)
CREATE POLICY "Admins can delete profiles"
ON public.user_profiles FOR DELETE
USING (public.is_user_admin());

-- 4. Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 5. Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Políticas RLS corrigidas com sucesso!';
    RAISE NOTICE '🔧 Função auxiliar is_user_admin() criada';
    RAISE NOTICE '📋 Recursão infinita resolvida';
END $$;
