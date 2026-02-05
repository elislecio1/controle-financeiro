-- =====================================================
-- MIGRAÇÃO DE CATEGORIAS, SUBCATEGORIAS E CONTATOS PARA EMPRESA DON SANTOS
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- Este script associa categorias, subcategorias e contatos existentes à empresa "Don Santos"
-- CNPJ: 12.032.130/0001-95

-- =====================================================
-- 1. BUSCAR ID DA EMPRESA DON SANTOS
-- =====================================================

DO $$
DECLARE
    v_empresa_id UUID;
    empresa_existe BOOLEAN;
BEGIN
    -- Verificar se empresa Don Santos já existe
    SELECT EXISTS(SELECT 1 FROM empresas WHERE cnpj = '12.032.130/0001-95') INTO empresa_existe;
    
    IF NOT empresa_existe THEN
        RAISE EXCEPTION 'Empresa Don Santos não encontrada. Execute primeiro o script migrar_dados_empresa_don_santos.sql';
    END IF;
    
    -- Buscar ID da empresa
    SELECT id INTO v_empresa_id FROM empresas WHERE cnpj = '12.032.130/0001-95';
    
    RAISE NOTICE 'Empresa Don Santos encontrada com ID: %', v_empresa_id;
    
    -- =====================================================
    -- 2. ATUALIZAR CATEGORIAS
    -- =====================================================
    
    UPDATE categorias
    SET empresa_id = v_empresa_id
    WHERE empresa_id IS NULL;
    
    RAISE NOTICE 'Categorias atualizadas: %', (SELECT COUNT(*) FROM categorias WHERE empresa_id = v_empresa_id);
    
    -- =====================================================
    -- 3. ATUALIZAR SUBCATEGORIAS
    -- =====================================================
    
    UPDATE subcategorias
    SET empresa_id = v_empresa_id
    WHERE empresa_id IS NULL;
    
    RAISE NOTICE 'Subcategorias atualizadas: %', (SELECT COUNT(*) FROM subcategorias WHERE empresa_id = v_empresa_id);
    
    -- =====================================================
    -- 4. ATUALIZAR CONTATOS
    -- =====================================================
    
    UPDATE contatos
    SET empresa_id = v_empresa_id
    WHERE empresa_id IS NULL;
    
    RAISE NOTICE 'Contatos atualizados: %', (SELECT COUNT(*) FROM contatos WHERE empresa_id = v_empresa_id);
    
    RAISE NOTICE '✅ Migração de categorias, subcategorias e contatos concluída com sucesso!';
    
END $$;

-- =====================================================
-- 5. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar categorias
SELECT 
    'categorias' as tabela,
    COUNT(*) as total,
    COUNT(empresa_id) as com_empresa_id,
    COUNT(*) - COUNT(empresa_id) as sem_empresa_id
FROM categorias;

-- Verificar subcategorias
SELECT 
    'subcategorias' as tabela,
    COUNT(*) as total,
    COUNT(empresa_id) as com_empresa_id,
    COUNT(*) - COUNT(empresa_id) as sem_empresa_id
FROM subcategorias;

-- Verificar contatos
SELECT 
    'contatos' as tabela,
    COUNT(*) as total,
    COUNT(empresa_id) as com_empresa_id,
    COUNT(*) - COUNT(empresa_id) as sem_empresa_id
FROM contatos;

-- Verificar dados da empresa Don Santos
SELECT 
    'categorias' as tipo,
    COUNT(*) as total
FROM categorias
WHERE empresa_id = (SELECT id FROM empresas WHERE cnpj = '12.032.130/0001-95')
UNION ALL
SELECT 
    'subcategorias' as tipo,
    COUNT(*) as total
FROM subcategorias
WHERE empresa_id = (SELECT id FROM empresas WHERE cnpj = '12.032.130/0001-95')
UNION ALL
SELECT 
    'contatos' as tipo,
    COUNT(*) as total
FROM contatos
WHERE empresa_id = (SELECT id FROM empresas WHERE cnpj = '12.032.130/0001-95');
