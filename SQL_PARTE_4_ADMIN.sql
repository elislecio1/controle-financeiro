-- ============================================
-- PARTE 4: CRIAR PERFIL DE ADMIN PARA SEU USUÁRIO
-- ============================================
-- Execute esta parte DEPOIS da Parte 3
-- IMPORTANTE: Execute esta parte LOGADO no sistema

-- Criar perfil de admin para seu usuário atual
INSERT INTO user_profiles (user_id, role, full_name)
VALUES (
    auth.uid(), 
    'admin',
    COALESCE(
        (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth.uid()),
        'Administrador'
    )
)
ON CONFLICT (user_id) 
DO UPDATE SET 
    role = 'admin',
    updated_at = NOW();

