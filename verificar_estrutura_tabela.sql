-- Script para verificar a estrutura da tabela user_profiles
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles';

-- 2. Verificar estrutura da tabela user_profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 3. Verificar se há dados na tabela
SELECT COUNT(*) as total_registros
FROM user_profiles;

-- 4. Verificar alguns registros de exemplo
SELECT * 
FROM user_profiles 
LIMIT 5;

-- 5. Verificar constraints da tabela
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles';
