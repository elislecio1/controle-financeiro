-- ============================================
-- PARTE 5: VERIFICAÇÕES E TESTES
-- ============================================
-- Execute esta parte por último para verificar se tudo funcionou

-- Verificar se a tabela user_profiles existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'user_profiles'
) as user_profiles_exists;

-- Verificar seu role atual
SELECT 
    u.email,
    COALESCE(up.role, 'user') as role,
    up.full_name
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.id = auth.uid();

-- Listar todas as funções criadas
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (routine_name LIKE '%admin%' OR routine_name LIKE '%user%')
ORDER BY routine_name;

