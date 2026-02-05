-- =====================================================
-- VERIFICAR E MIGRAR CATEGORIAS, SUBCATEGORIAS E CONTATOS
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- Este script verifica e atualiza categorias, subcategorias e contatos que não têm empresa_id

-- =====================================================
-- 1. VERIFICAR SITUAÇÃO ATUAL
-- =====================================================

SELECT 
    'ANTES DA MIGRAÇÃO' as status,
    'categorias' as tabela,
    COUNT(*) as total,
    COUNT(empresa_id) as com_empresa_id,
    COUNT(*) - COUNT(empresa_id) as sem_empresa_id
FROM categorias
UNION ALL
SELECT 
    'ANTES DA MIGRAÇÃO' as status,
    'subcategorias' as tabela,
    COUNT(*) as total,
    COUNT(empresa_id) as com_empresa_id,
    COUNT(*) - COUNT(empresa_id) as sem_empresa_id
FROM subcategorias
UNION ALL
SELECT 
    'ANTES DA MIGRAÇÃO' as status,
    'contatos' as tabela,
    COUNT(*) as total,
    COUNT(empresa_id) as com_empresa_id,
    COUNT(*) - COUNT(empresa_id) as sem_empresa_id
FROM contatos;

-- =====================================================
-- 2. MIGRAR DADOS SEM empresa_id
-- =====================================================

DO $$
DECLARE
    v_empresa_id UUID;
    v_categorias_atualizadas INTEGER;
    v_subcategorias_atualizadas INTEGER;
    v_contatos_atualizados INTEGER;
BEGIN
    -- Buscar ID da empresa Don Santos
    SELECT id INTO v_empresa_id 
    FROM empresas 
    WHERE cnpj = '12.032.130/0001-95' 
    LIMIT 1;
    
    IF v_empresa_id IS NULL THEN
        RAISE EXCEPTION 'Empresa Don Santos não encontrada. Execute primeiro o script migrar_dados_empresa_don_santos.sql';
    END IF;
    
    RAISE NOTICE 'Empresa Don Santos encontrada: %', v_empresa_id;
    
    -- Atualizar categorias
    UPDATE categorias
    SET empresa_id = v_empresa_id
    WHERE empresa_id IS NULL;
    GET DIAGNOSTICS v_categorias_atualizadas = ROW_COUNT;
    RAISE NOTICE 'Categorias atualizadas: %', v_categorias_atualizadas;
    
    -- Atualizar subcategorias
    UPDATE subcategorias
    SET empresa_id = v_empresa_id
    WHERE empresa_id IS NULL;
    GET DIAGNOSTICS v_subcategorias_atualizadas = ROW_COUNT;
    RAISE NOTICE 'Subcategorias atualizadas: %', v_subcategorias_atualizadas;
    
    -- Atualizar contatos
    UPDATE contatos
    SET empresa_id = v_empresa_id
    WHERE empresa_id IS NULL;
    GET DIAGNOSTICS v_contatos_atualizados = ROW_COUNT;
    RAISE NOTICE 'Contatos atualizados: %', v_contatos_atualizados;
    
    RAISE NOTICE '✅ Migração concluída!';
END $$;

-- =====================================================
-- 3. VERIFICAR SITUAÇÃO APÓS MIGRAÇÃO
-- =====================================================

SELECT 
    'APÓS MIGRAÇÃO' as status,
    'categorias' as tabela,
    COUNT(*) as total,
    COUNT(empresa_id) as com_empresa_id,
    COUNT(*) - COUNT(empresa_id) as sem_empresa_id
FROM categorias
UNION ALL
SELECT 
    'APÓS MIGRAÇÃO' as status,
    'subcategorias' as tabela,
    COUNT(*) as total,
    COUNT(empresa_id) as com_empresa_id,
    COUNT(*) - COUNT(empresa_id) as sem_empresa_id
FROM subcategorias
UNION ALL
SELECT 
    'APÓS MIGRAÇÃO' as status,
    'contatos' as tabela,
    COUNT(*) as total,
    COUNT(empresa_id) as com_empresa_id,
    COUNT(*) - COUNT(empresa_id) as sem_empresa_id
FROM contatos;

-- =====================================================
-- 4. LISTAR DADOS DA EMPRESA DON SANTOS
-- =====================================================

-- Categorias
SELECT 
    'Categorias da Don Santos' as tipo,
    id,
    nome,
    tipo as categoria_tipo,
    ativo,
    empresa_id
FROM categorias
WHERE empresa_id = (SELECT id FROM empresas WHERE cnpj = '12.032.130/0001-95')
ORDER BY nome;

-- Subcategorias
SELECT 
    'Subcategorias da Don Santos' as tipo,
    id,
    nome,
    categoria_id,
    ativo,
    empresa_id
FROM subcategorias
WHERE empresa_id = (SELECT id FROM empresas WHERE cnpj = '12.032.130/0001-95')
ORDER BY nome;

-- Contatos
SELECT 
    'Contatos da Don Santos' as tipo,
    id,
    nome,
    tipo as contato_tipo,
    email,
    telefone,
    ativo,
    empresa_id
FROM contatos
WHERE empresa_id = (SELECT id FROM empresas WHERE cnpj = '12.032.130/0001-95')
ORDER BY nome;
