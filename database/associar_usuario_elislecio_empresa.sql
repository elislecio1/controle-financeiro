-- =====================================================
-- ASSOCIAR USUÁRIO ELISLECIO@GMAIL.COM À EMPRESA DON SANTOS
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- Este script garante que o usuário elislecio@gmail.com está associado à empresa Don Santos

-- =====================================================
-- 1. VERIFICAR SE O USUÁRIO EXISTE
-- =====================================================

DO $$
DECLARE
    v_user_id UUID;
    v_empresa_id UUID;
    v_empresa_existe BOOLEAN;
    v_associacao_existe BOOLEAN;
BEGIN
    -- Buscar ID do usuário elislecio@gmail.com
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'elislecio@gmail.com'
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário elislecio@gmail.com não encontrado na tabela auth.users';
    END IF;

    RAISE NOTICE '✅ Usuário encontrado: % (ID: %)', 'elislecio@gmail.com', v_user_id;

    -- Buscar ID da empresa Don Santos
    SELECT id INTO v_empresa_id
    FROM empresas
    WHERE cnpj = '12.032.130/0001-95'
    LIMIT 1;

    IF v_empresa_id IS NULL THEN
        RAISE EXCEPTION 'Empresa Don Santos não encontrada. Execute primeiro o script migrar_dados_empresa_don_santos.sql';
    END IF;

    RAISE NOTICE '✅ Empresa Don Santos encontrada: ID %', v_empresa_id;

    -- Verificar se já existe associação
    SELECT EXISTS(
        SELECT 1 FROM empresa_usuarios
        WHERE user_id = v_user_id
        AND empresa_id = v_empresa_id
    ) INTO v_associacao_existe;

    IF v_associacao_existe THEN
        RAISE NOTICE '⚠️ Associação já existe. Atualizando para garantir que está ativa e como admin...';
        
        -- Atualizar associação existente para garantir que está ativa e como admin
        UPDATE empresa_usuarios
        SET 
            role = 'admin',
            ativo = true,
            aceito_em = COALESCE(aceito_em, NOW()),
            updated_at = NOW()
        WHERE user_id = v_user_id
        AND empresa_id = v_empresa_id;
        
        RAISE NOTICE '✅ Associação atualizada com sucesso!';
    ELSE
        RAISE NOTICE '📝 Criando nova associação...';
        
        -- Criar nova associação
        INSERT INTO empresa_usuarios (
            empresa_id,
            user_id,
            role,
            ativo,
            aceito_em,
            created_at,
            updated_at
        ) VALUES (
            v_empresa_id,
            v_user_id,
            'admin',
            true,
            NOW(),
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Associação criada com sucesso!';
    END IF;

    -- Verificar resultado final
    RAISE NOTICE '';
    RAISE NOTICE '📋 Verificação final:';
    RAISE NOTICE '   Usuário: elislecio@gmail.com (ID: %)', v_user_id;
    RAISE NOTICE '   Empresa: Don Santos (ID: %)', v_empresa_id;
    RAISE NOTICE '   Role: admin';
    RAISE NOTICE '   Ativo: true';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Processo concluído com sucesso!';

END $$;

-- =====================================================
-- 2. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar associação criada
SELECT 
    u.email as usuario_email,
    e.nome as empresa_nome,
    eu.role,
    eu.ativo,
    eu.aceito_em,
    eu.created_at
FROM empresa_usuarios eu
JOIN auth.users u ON u.id = eu.user_id
JOIN empresas e ON e.id = eu.empresa_id
WHERE u.email = 'elislecio@gmail.com'
AND e.cnpj = '12.032.130/0001-95';

-- Verificar todas as empresas do usuário
SELECT 
    e.nome as empresa_nome,
    e.cnpj,
    eu.role,
    eu.ativo,
    eu.created_at
FROM empresas e
JOIN empresa_usuarios eu ON e.id = eu.empresa_id
JOIN auth.users u ON u.id = eu.user_id
WHERE u.email = 'elislecio@gmail.com'
ORDER BY eu.created_at DESC;
