-- Script para atualizar perfil do usuário
-- Execute este script no SQL Editor do Supabase
-- Substitua o user_id e email pelos seus dados

-- Verificar perfil atual
SELECT user_id, email, name, role, full_name, metadata
FROM user_profiles
WHERE user_id = '16290525-2b7f-4157-86f5-7e1c165fc070';

-- Atualizar ou criar perfil do usuário
INSERT INTO user_profiles (user_id, email, name, role, full_name, metadata)
VALUES (
  '16290525-2b7f-4157-86f5-7e1c165fc070',
  'elislecio@gmail.com',
  'Elislécio Ferreira',
  'admin',
  'Elislécio Ferreira',
  '{"theme": "light", "currency": "BRL", "language": "pt-BR"}'::jsonb
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = 'admin',
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Verificar resultado
SELECT user_id, email, name, role, full_name, created_at, updated_at
FROM user_profiles
WHERE user_id = '16290525-2b7f-4157-86f5-7e1c165fc070';

