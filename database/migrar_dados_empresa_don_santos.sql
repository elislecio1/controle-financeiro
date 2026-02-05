-- =====================================================
-- MIGRAÇÃO DE DADOS EXISTENTES PARA EMPRESA DON SANTOS
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- Este script associa todos os dados existentes à empresa "Don Santos"
-- CNPJ: 12.032.130/0001-95

-- =====================================================
-- 1. CRIAR OU BUSCAR EMPRESA DON SANTOS
-- =====================================================

-- Verificar se a empresa já existe
DO $$
DECLARE
    v_empresa_id UUID;
    empresa_existe BOOLEAN;
BEGIN
    -- Verificar se empresa Don Santos já existe
    SELECT EXISTS(SELECT 1 FROM empresas WHERE cnpj = '12.032.130/0001-95') INTO empresa_existe;
    
    IF NOT empresa_existe THEN
        -- Criar empresa Don Santos
        INSERT INTO empresas (nome, cnpj, razao_social, ativo)
        VALUES (
            'Don Santos',
            '12.032.130/0001-95',
            'DON SANTOS',
            true
        )
        RETURNING id INTO v_empresa_id;
        
        RAISE NOTICE 'Empresa Don Santos criada com ID: %', v_empresa_id;
    ELSE
        -- Buscar ID da empresa existente
        SELECT id INTO v_empresa_id FROM empresas WHERE cnpj = '12.032.130/0001-95';
        RAISE NOTICE 'Empresa Don Santos já existe com ID: %', v_empresa_id;
    END IF;
    
    -- =====================================================
    -- 2. ASSOCIAR TODOS OS USUÁRIOS EXISTENTES À EMPRESA
    -- =====================================================
    
    -- Associar todos os usuários autenticados à empresa Don Santos como admin
    INSERT INTO empresa_usuarios (empresa_id, user_id, role, ativo, aceito_em)
    SELECT 
        v_empresa_id,
        id,
        'admin',
        true,
        NOW()
    FROM auth.users
    WHERE id NOT IN (
        SELECT user_id FROM empresa_usuarios WHERE empresa_usuarios.empresa_id = v_empresa_id
    )
    ON CONFLICT (empresa_id, user_id) DO NOTHING;
    
    RAISE NOTICE 'Usuários associados à empresa Don Santos';
    
    -- =====================================================
    -- 3. ATUALIZAR DADOS EXISTENTES COM empresa_id
    -- =====================================================
    
    -- Transactions
    UPDATE transactions
    SET empresa_id = v_empresa_id
    WHERE empresa_id IS NULL;
    
    RAISE NOTICE 'Transações atualizadas: %', (SELECT COUNT(*) FROM transactions WHERE transactions.empresa_id = v_empresa_id);
    
    -- Categorias
    UPDATE categorias
    SET empresa_id = v_empresa_id
    WHERE empresa_id IS NULL;
    
    RAISE NOTICE 'Categorias atualizadas: %', (SELECT COUNT(*) FROM categorias WHERE categorias.empresa_id = v_empresa_id);
    
    -- Subcategorias
    UPDATE subcategorias
    SET empresa_id = v_empresa_id
    WHERE empresa_id IS NULL;
    
    RAISE NOTICE 'Subcategorias atualizadas: %', (SELECT COUNT(*) FROM subcategorias WHERE subcategorias.empresa_id = v_empresa_id);
    
    -- Centros de Custo
    UPDATE centros_custo
    SET empresa_id = v_empresa_id
    WHERE empresa_id IS NULL;
    
    RAISE NOTICE 'Centros de custo atualizados: %', (SELECT COUNT(*) FROM centros_custo WHERE centros_custo.empresa_id = v_empresa_id);
    
    -- Contatos
    UPDATE contatos
    SET empresa_id = v_empresa_id
    WHERE empresa_id IS NULL;
    
    RAISE NOTICE 'Contatos atualizados: %', (SELECT COUNT(*) FROM contatos WHERE contatos.empresa_id = v_empresa_id);
    
    -- Contas Bancárias
    UPDATE contas_bancarias
    SET empresa_id = v_empresa_id
    WHERE empresa_id IS NULL;
    
    RAISE NOTICE 'Contas bancárias atualizadas: %', (SELECT COUNT(*) FROM contas_bancarias WHERE contas_bancarias.empresa_id = v_empresa_id);
    
    -- Cartões de Crédito
    UPDATE cartoes_credito
    SET empresa_id = v_empresa_id
    WHERE empresa_id IS NULL;
    
    RAISE NOTICE 'Cartões de crédito atualizados: %', (SELECT COUNT(*) FROM cartoes_credito WHERE cartoes_credito.empresa_id = v_empresa_id);
    
    -- Investimentos
    UPDATE investimentos
    SET empresa_id = v_empresa_id
    WHERE empresa_id IS NULL;
    
    RAISE NOTICE 'Investimentos atualizados: %', (SELECT COUNT(*) FROM investimentos WHERE investimentos.empresa_id = v_empresa_id);
    
    -- Metas
    UPDATE metas
    SET empresa_id = v_empresa_id
    WHERE empresa_id IS NULL;
    
    RAISE NOTICE 'Metas atualizadas: %', (SELECT COUNT(*) FROM metas WHERE metas.empresa_id = v_empresa_id);
    
    -- Orçamentos
    UPDATE orcamentos
    SET empresa_id = v_empresa_id
    WHERE empresa_id IS NULL;
    
    RAISE NOTICE 'Orçamentos atualizados: %', (SELECT COUNT(*) FROM orcamentos WHERE orcamentos.empresa_id = v_empresa_id);
    
    RAISE NOTICE '✅ Migração concluída com sucesso!';
    
END $$;

-- =====================================================
-- 4. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se todos os dados foram migrados
SELECT 
    'transactions' as tabela,
    COUNT(*) as total,
    COUNT(empresa_id) as com_empresa_id,
    COUNT(*) - COUNT(empresa_id) as sem_empresa_id
FROM transactions
UNION ALL
SELECT 
    'categorias' as tabela,
    COUNT(*) as total,
    COUNT(empresa_id) as com_empresa_id,
    COUNT(*) - COUNT(empresa_id) as sem_empresa_id
FROM categorias
UNION ALL
SELECT 
    'subcategorias' as tabela,
    COUNT(*) as total,
    COUNT(empresa_id) as com_empresa_id,
    COUNT(*) - COUNT(empresa_id) as sem_empresa_id
FROM subcategorias
UNION ALL
SELECT 
    'centros_custo' as tabela,
    COUNT(*) as total,
    COUNT(empresa_id) as com_empresa_id,
    COUNT(*) - COUNT(empresa_id) as sem_empresa_id
FROM centros_custo
UNION ALL
SELECT 
    'contatos' as tabela,
    COUNT(*) as total,
    COUNT(empresa_id) as com_empresa_id,
    COUNT(*) - COUNT(empresa_id) as sem_empresa_id
FROM contatos
UNION ALL
SELECT 
    'contas_bancarias' as tabela,
    COUNT(*) as total,
    COUNT(empresa_id) as com_empresa_id,
    COUNT(*) - COUNT(empresa_id) as sem_empresa_id
FROM contas_bancarias
UNION ALL
SELECT 
    'cartoes_credito' as tabela,
    COUNT(*) as total,
    COUNT(empresa_id) as com_empresa_id,
    COUNT(*) - COUNT(empresa_id) as sem_empresa_id
FROM cartoes_credito
UNION ALL
SELECT 
    'investimentos' as tabela,
    COUNT(*) as total,
    COUNT(empresa_id) as com_empresa_id,
    COUNT(*) - COUNT(empresa_id) as sem_empresa_id
FROM investimentos
UNION ALL
SELECT 
    'metas' as tabela,
    COUNT(*) as total,
    COUNT(empresa_id) as com_empresa_id,
    COUNT(*) - COUNT(empresa_id) as sem_empresa_id
FROM metas
UNION ALL
SELECT 
    'orcamentos' as tabela,
    COUNT(*) as total,
    COUNT(empresa_id) as com_empresa_id,
    COUNT(*) - COUNT(empresa_id) as sem_empresa_id
FROM orcamentos;

-- Verificar usuários associados à empresa Don Santos
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as users,
    COUNT(CASE WHEN role = 'viewer' THEN 1 END) as viewers
FROM empresa_usuarios eu
JOIN empresas e ON e.id = eu.empresa_id
WHERE e.cnpj = '12.032.130/0001-95';
