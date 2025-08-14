-- Script AGGRESSIVO para remover TODOS os triggers e políticas RLS
-- Execute este script ANTES de executar o supabase_schema.sql
-- ATENÇÃO: Este script remove TODOS os triggers das tabelas especificadas

-- Desabilitar temporariamente Row Level Security em todas as tabelas
DO $$ 
DECLARE
    current_table text;
BEGIN
    FOR current_table IN 
        SELECT unnest(ARRAY[
            'transactions', 'categorias', 'subcategorias', 'contas_bancarias',
            'cartoes_credito', 'investimentos', 'metas', 'orcamentos', 'contatos',
            'centros_custo', 'negocios', 'conformidade_fiscal', 'relatorios',
            'configuracoes_sistema', 'alertas', 'configuracoes_alertas', 'notificacoes',
            'integracoes_bancarias', 'logs_sincronizacao', 'transacoes_importadas',
            'configuracoes_notificacoes', 'historico_notificacoes'
        ])
    LOOP
        -- Verificar se a tabela existe
        IF EXISTS (
            SELECT 1 FROM information_schema.tables t
            WHERE t.table_name = current_table 
            AND t.table_schema = 'public'
        ) THEN
            -- Desabilitar RLS temporariamente
            EXECUTE 'ALTER TABLE ' || quote_ident(current_table) || ' DISABLE ROW LEVEL SECURITY';
            RAISE NOTICE 'RLS desabilitado na tabela %', current_table;
        END IF;
    END LOOP;
END $$;

-- Remover TODOS os triggers de forma agressiva
DO $$ 
DECLARE
    current_table text;
    trigger_name text;
BEGIN
    FOR current_table IN 
        SELECT unnest(ARRAY[
            'transactions', 'categorias', 'subcategorias', 'contas_bancarias',
            'cartoes_credito', 'investimentos', 'metas', 'orcamentos', 'contatos',
            'centros_custo', 'negocios', 'conformidade_fiscal', 'relatorios',
            'configuracoes_sistema', 'alertas', 'configuracoes_alertas', 'notificacoes',
            'integracoes_bancarias', 'logs_sincronizacao', 'transacoes_importadas',
            'configuracoes_notificacoes', 'historico_notificacoes'
        ])
    LOOP
        -- Verificar se a tabela existe
        IF EXISTS (
            SELECT 1 FROM information_schema.tables t
            WHERE t.table_name = current_table 
            AND t.table_schema = 'public'
        ) THEN
            -- Remover TODOS os triggers da tabela
            FOR trigger_name IN 
                SELECT t.tgname
                FROM pg_trigger t
                JOIN pg_class c ON t.tgrelid = c.oid
                WHERE c.relname = current_table
                AND t.tgisinternal = false
            LOOP
                BEGIN
                    EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trigger_name) || ' ON ' || quote_ident(current_table) || ' CASCADE';
                    RAISE NOTICE 'Trigger % removido da tabela %', trigger_name, current_table;
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE 'Erro ao remover trigger % da tabela %: %', trigger_name, current_table, SQLERRM;
                END;
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- Remover políticas RLS de forma agressiva
DO $$ 
DECLARE
    current_table text;
    policy_name text;
BEGIN
    FOR current_table IN 
        SELECT unnest(ARRAY[
            'transactions', 'categorias', 'subcategorias', 'contas_bancarias',
            'cartoes_credito', 'investimentos', 'metas', 'orcamentos', 'contatos',
            'centros_custo', 'negocios', 'conformidade_fiscal', 'relatorios',
            'configuracoes_sistema', 'alertas', 'configuracoes_alertas', 'notificacoes',
            'integracoes_bancarias', 'logs_sincronizacao', 'transacoes_importadas',
            'configuracoes_notificacoes', 'historico_notificacoes'
        ])
    LOOP
        -- Verificar se a tabela existe
        IF EXISTS (
            SELECT 1 FROM information_schema.tables t
            WHERE t.table_name = current_table 
            AND t.table_schema = 'public'
        ) THEN
            -- Remover TODAS as políticas da tabela
            FOR policy_name IN 
                SELECT p.policyname
                FROM pg_policies p
                WHERE p.tablename = current_table
            LOOP
                BEGIN
                    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_name) || ' ON ' || quote_ident(current_table);
                    RAISE NOTICE 'Política % removida da tabela %', policy_name, current_table;
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE 'Erro ao remover política % da tabela %: %', policy_name, current_table, SQLERRM;
                END;
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- Verificar o que ainda existe
SELECT 'TRIGGERS RESTANTES:' as tipo, 
       t.tgname as nome, 
       c.relname as tabela
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname IN (
    'transactions', 'categorias', 'subcategorias', 'contas_bancarias',
    'cartoes_credito', 'investimentos', 'metas', 'orcamentos', 'contatos',
    'centros_custo', 'negocios', 'conformidade_fiscal', 'relatorios',
    'configuracoes_sistema', 'alertas', 'configuracoes_alertas', 'notificacoes',
    'integracoes_bancarias', 'logs_sincronizacao', 'transacoes_importadas',
    'configuracoes_notificacoes', 'historico_notificacoes'
)
AND t.tgisinternal = false
ORDER BY c.relname, t.tgname;

SELECT 'POLÍTICAS RLS RESTANTES:' as tipo,
       tablename as tabela,
       policyname as politica
FROM pg_policies
WHERE tablename IN (
    'transactions', 'categorias', 'subcategorias', 'contas_bancarias',
    'cartoes_credito', 'investimentos', 'metas', 'orcamentos', 'contatos',
    'centros_custo', 'negocios', 'conformidade_fiscal', 'relatorios',
    'configuracoes_sistema', 'alertas', 'configuracoes_alertas', 'notificacoes',
    'integracoes_bancarias', 'logs_sincronizacao', 'transacoes_importadas',
    'configuracoes_notificacoes', 'historico_notificacoes'
)
ORDER BY tablename, policyname;
