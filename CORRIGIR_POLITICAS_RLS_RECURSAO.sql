-- CORRIGIR POLÍTICAS RLS QUE CAUSAM RECURSÃO INFINITA
-- Execute este script no SQL Editor do Supabase
-- Este script remove políticas problemáticas e cria políticas corretas

-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES (para começar do zero)
DROP POLICY IF EXISTS "Admins have full access" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;

-- 2. CRIAR POLÍTICAS CORRETAS (SEM RECURSÃO)
-- Política para SELECT: usuários podem ver seu próprio perfil
-- IMPORTANTE: Não verifica role, apenas user_id para evitar recursão
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Política para INSERT: usuários podem criar seu próprio perfil
CREATE POLICY "Users can insert own profile"
ON user_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. NOTA SOBRE POLÍTICAS DE ADMIN
-- Por enquanto, vamos usar apenas políticas básicas para evitar recursão
-- Para gerenciar outros usuários, use funções RPC com SECURITY DEFINER
-- (veja arquivo CRIAR_PERFIL_ADMIN_COMPLETO.sql para exemplo)

-- 4. VERIFICAR POLÍTICAS CRIADAS
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
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 5. TESTAR ACESSO
-- Execute enquanto estiver autenticado
SELECT 
  user_id, 
  email, 
  name, 
  role, 
  full_name
FROM user_profiles
WHERE user_id = auth.uid();

