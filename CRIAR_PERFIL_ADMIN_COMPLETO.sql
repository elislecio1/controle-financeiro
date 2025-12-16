-- Script COMPLETO para criar/atualizar perfil do usuário como ADMIN
-- Execute este script no SQL Editor do Supabase
-- IMPORTANTE: Execute enquanto estiver logado como o usuário ou use SECURITY DEFINER

-- 1. Verificar se o usuário existe
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE id = '16290525-2b7f-4157-86f5-7e1c165fc070';

-- 2. Verificar perfil atual (se existir)
SELECT user_id, email, name, role, full_name, metadata, created_at, updated_at
FROM user_profiles
WHERE user_id = '16290525-2b7f-4157-86f5-7e1c165fc070';

-- 3. Criar ou atualizar perfil usando SECURITY DEFINER para contornar RLS
CREATE OR REPLACE FUNCTION public.create_or_update_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_role TEXT DEFAULT 'user',
  p_full_name TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Inserir ou atualizar perfil
  INSERT INTO public.user_profiles (
    user_id,
    email,
    name,
    role,
    full_name,
    metadata,
    preferences
  )
  VALUES (
    p_user_id,
    p_email,
    p_name,
    p_role,
    COALESCE(p_full_name, p_name),
    p_metadata,
    '{"theme": "light", "currency": "BRL", "language": "pt-BR", "dashboard": {"show_stats": true, "show_charts": true, "default_period": "current_month"}, "date_format": "DD/MM/YYYY", "notifications": {"sms": false, "push": true, "email": true}}'::jsonb
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

  -- Retornar sucesso
  result := jsonb_build_object(
    'success', true,
    'message', 'Perfil criado/atualizado com sucesso',
    'user_id', p_user_id,
    'role', p_role
  );

  RETURN result;
END;
$$;

-- 4. Executar a função para criar/atualizar o perfil
SELECT public.create_or_update_user_profile(
  '16290525-2b7f-4157-86f5-7e1c165fc070'::UUID,
  'elislecio@gmail.com',
  'Elislécio Ferreira',
  'admin',
  'Elislécio Ferreira',
  '{"theme": "light", "currency": "BRL", "language": "pt-BR"}'::jsonb
);

-- 5. Verificar resultado
SELECT 
  user_id, 
  email, 
  name, 
  role, 
  full_name, 
  metadata,
  created_at, 
  updated_at
FROM user_profiles
WHERE user_id = '16290525-2b7f-4157-86f5-7e1c165fc070';

-- 6. Verificar políticas RLS (devem permitir que o usuário veja seu próprio perfil)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_profiles';

