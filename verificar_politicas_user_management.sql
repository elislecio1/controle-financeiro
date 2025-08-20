-- Script para verificar e corrigir políticas RLS para User Management
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se as tabelas existem
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'user_invites');

-- 2. Verificar políticas RLS atuais
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
WHERE tablename IN ('user_profiles', 'user_invites')
ORDER BY tablename, policyname;

-- 3. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'user_invites');

-- 4. Verificar dados nas tabelas
SELECT 'user_profiles' as tabela, COUNT(*) as total FROM user_profiles
UNION ALL
SELECT 'user_invites' as tabela, COUNT(*) as total FROM user_invites;

-- 5. Verificar dados específicos
SELECT 
  'user_profiles' as tabela,
  user_id,
  email,
  name,
  role,
  created_at
FROM user_profiles
ORDER BY created_at DESC;

SELECT 
  'user_invites' as tabela,
  id,
  email,
  name,
  role,
  status,
  invited_at,
  expires_at
FROM user_invites
ORDER BY invited_at DESC;

-- 6. Corrigir políticas RLS para user_profiles (se necessário)
-- Política para permitir que admins vejam todos os perfis
DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;
CREATE POLICY "Admins can view all user profiles" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() 
      AND up.role = 'admin'
    )
  );

-- Política para permitir que usuários vejam seu próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Política para permitir que admins atualizem perfis
DROP POLICY IF EXISTS "Admins can update user profiles" ON user_profiles;
CREATE POLICY "Admins can update user profiles" ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() 
      AND up.role = 'admin'
    )
  );

-- 7. Corrigir políticas RLS para user_invites (se necessário)
-- Política para permitir que admins vejam todos os convites
DROP POLICY IF EXISTS "Admins can view all invites" ON user_invites;
CREATE POLICY "Admins can view all invites" ON user_invites
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() 
      AND up.role = 'admin'
    )
  );

-- Política para permitir que admins criem convites
DROP POLICY IF EXISTS "Admins can create invites" ON user_invites;
CREATE POLICY "Admins can create invites" ON user_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() 
      AND up.role = 'admin'
    )
  );

-- Política para permitir que admins atualizem convites
DROP POLICY IF EXISTS "Admins can update invites" ON user_invites;
CREATE POLICY "Admins can update invites" ON user_invites
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() 
      AND up.role = 'admin'
    )
  );

-- 8. Verificar se as políticas foram criadas corretamente
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
WHERE tablename IN ('user_profiles', 'user_invites')
ORDER BY tablename, policyname;

-- 9. Testar acesso como admin
-- (Execute isso no contexto do usuário admin logado)
SELECT 
  'Teste de acesso - user_profiles' as teste,
  COUNT(*) as total_perfis
FROM user_profiles;

SELECT 
  'Teste de acesso - user_invites' as teste,
  COUNT(*) as total_convites
FROM user_invites;
