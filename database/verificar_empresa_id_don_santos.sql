-- =====================================================
-- VERIFICAR ID DA EMPRESA DON SANTOS
-- =====================================================
-- Execute este script para verificar qual é o ID real da empresa Don Santos
-- Compare este ID com o que está armazenado no localStorage do navegador

-- 1. Buscar empresa Don Santos
SELECT 
    id,
    nome,
    cnpj,
    razao_social,
    ativo,
    created_at
FROM empresas
WHERE cnpj = '12.032.130/0001-95'
   OR nome ILIKE '%Don Santos%'
   OR nome ILIKE '%DON SANTOS%';

-- 2. Verificar quantas categorias existem para esta empresa
SELECT 
    'Categorias' as tipo,
    COUNT(*) as total,
    COUNT(CASE WHEN empresa_id IS NULL THEN 1 END) as sem_empresa_id,
    COUNT(CASE WHEN empresa_id IS NOT NULL THEN 1 END) as com_empresa_id
FROM categorias
UNION ALL
SELECT 
    'Categorias da Don Santos' as tipo,
    COUNT(*) as total,
    0 as sem_empresa_id,
    COUNT(*) as com_empresa_id
FROM categorias
WHERE empresa_id = (SELECT id FROM empresas WHERE cnpj = '12.032.130/0001-95' LIMIT 1);

-- 3. Verificar quantos contatos existem para esta empresa
SELECT 
    'Contatos' as tipo,
    COUNT(*) as total,
    COUNT(CASE WHEN empresa_id IS NULL THEN 1 END) as sem_empresa_id,
    COUNT(CASE WHEN empresa_id IS NOT NULL THEN 1 END) as com_empresa_id
FROM contatos
UNION ALL
SELECT 
    'Contatos da Don Santos' as tipo,
    COUNT(*) as total,
    0 as sem_empresa_id,
    COUNT(*) as com_empresa_id
FROM contatos
WHERE empresa_id = (SELECT id FROM empresas WHERE cnpj = '12.032.130/0001-95' LIMIT 1);

-- 4. Listar algumas categorias da Don Santos para verificar
SELECT 
    id,
    nome,
    tipo,
    ativo,
    empresa_id,
    CASE 
        WHEN empresa_id = (SELECT id FROM empresas WHERE cnpj = '12.032.130/0001-95' LIMIT 1) 
        THEN '✅ CORRETO' 
        ELSE '❌ ID DIFERENTE' 
    END as status
FROM categorias
WHERE empresa_id = (SELECT id FROM empresas WHERE cnpj = '12.032.130/0001-95' LIMIT 1)
LIMIT 10;

-- 5. Listar alguns contatos da Don Santos para verificar
SELECT 
    id,
    nome,
    tipo,
    ativo,
    empresa_id,
    CASE 
        WHEN empresa_id = (SELECT id FROM empresas WHERE cnpj = '12.032.130/0001-95' LIMIT 1) 
        THEN '✅ CORRETO' 
        ELSE '❌ ID DIFERENTE' 
    END as status
FROM contatos
WHERE empresa_id = (SELECT id FROM empresas WHERE cnpj = '12.032.130/0001-95' LIMIT 1)
LIMIT 10;
