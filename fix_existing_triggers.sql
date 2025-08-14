-- Script para remover TODOS os triggers existentes e políticas RLS antes de aplicar o schema atualizado
-- Execute este script ANTES de executar o supabase_schema.sql

-- Remover TODOS os triggers existentes e políticas RLS nas tabelas principais
DO $$ 
DECLARE
    current_table text;
    trigger_exists boolean;
    policy_exists boolean;
    trigger_record record;
BEGIN
    -- Lista completa de tabelas para verificar (incluindo todas as que têm triggers no schema)
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
            -- Remover TODOS os triggers da tabela (não apenas os de updated_at)
            FOR trigger_record IN 
                SELECT t.tgname as trigger_name
                FROM pg_trigger t
                JOIN pg_class c ON t.tgrelid = c.oid
                WHERE c.relname = current_table
                AND t.tgisinternal = false  -- Não remover triggers internos do sistema
            LOOP
                EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trigger_record.trigger_name) || ' ON ' || quote_ident(current_table);
                RAISE NOTICE 'Trigger % removido da tabela %', trigger_record.trigger_name, current_table;
            END LOOP;

            -- Verificar e remover políticas RLS se existirem
            SELECT EXISTS (
                SELECT 1 FROM pg_policies p
                WHERE p.tablename = current_table
                AND p.policyname = 'Allow all operations for authenticated users'
            ) INTO policy_exists;
            
            IF policy_exists THEN
                EXECUTE 'DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON ' || quote_ident(current_table);
                RAISE NOTICE 'Política RLS removida da tabela %', current_table;
            END IF;

            -- Verificar e remover outras políticas comuns
            SELECT EXISTS (
                SELECT 1 FROM pg_policies p
                WHERE p.tablename = current_table
                AND p.policyname = 'Enable read access for all users'
            ) INTO policy_exists;
            
            IF policy_exists THEN
                EXECUTE 'DROP POLICY IF EXISTS "Enable read access for all users" ON ' || quote_ident(current_table);
                RAISE NOTICE 'Política "Enable read access for all users" removida da tabela %', current_table;
            END IF;

            SELECT EXISTS (
                SELECT 1 FROM pg_policies p
                WHERE p.tablename = current_table
                AND p.policyname = 'Enable insert for authenticated users only'
            ) INTO policy_exists;
            
            IF policy_exists THEN
                EXECUTE 'DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON ' || quote_ident(current_table);
                RAISE NOTICE 'Política "Enable insert for authenticated users only" removida da tabela %', current_table;
            END IF;

            SELECT EXISTS (
                SELECT 1 FROM pg_policies p
                WHERE p.tablename = current_table
                AND p.policyname = 'Enable update for authenticated users only'
            ) INTO policy_exists;
            
            IF policy_exists THEN
                EXECUTE 'DROP POLICY IF EXISTS "Enable update for authenticated users only" ON ' || quote_ident(current_table);
                RAISE NOTICE 'Política "Enable update for authenticated users only" removida da tabela %', current_table;
            END IF;

            SELECT EXISTS (
                SELECT 1 FROM pg_policies p
                WHERE p.tablename = current_table
                AND p.policyname = 'Enable delete for authenticated users only'
            ) INTO policy_exists;
            
            IF policy_exists THEN
                EXECUTE 'DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON ' || quote_ident(current_table);
                RAISE NOTICE 'Política "Enable delete for authenticated users only" removida da tabela %', current_table;
            END IF;
        END IF;
    END LOOP;

    RAISE NOTICE 'TODOS os triggers e políticas RLS existentes foram verificados e removidos se necessário';
END $$;

-- Verificar se ainda existem triggers
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    t.tgisinternal as is_internal
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
AND t.tgisinternal = false  -- Apenas triggers não-internos
ORDER BY c.relname, t.tgname;

-- Verificar se ainda existem políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname
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
