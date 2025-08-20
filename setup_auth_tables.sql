-- ====================================
-- SCRIPT DE CONFIGURAÇÃO DE AUTENTICAÇÃO E MULTI-TENANCY
-- Sistema: FinFlow Pro - Controle Financeiro
-- ====================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criar tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    document TEXT,
    birth_date DATE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    preferences JSONB NOT NULL DEFAULT '{
        "theme": "light",
        "currency": "BRL",
        "date_format": "DD/MM/YYYY",
        "language": "pt-BR",
        "notifications": {
            "email": true,
            "push": true,
            "sms": false
        },
        "dashboard": {
            "default_period": "current_month",
            "show_charts": true,
            "show_stats": true
        }
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 3. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Criar função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Criar trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 7. Adicionar coluna user_id em todas as tabelas principais (se não existir)
DO $$
DECLARE
    current_table TEXT;
    tables_to_update TEXT[] := ARRAY[
        'transactions',
        'categorias',
        'subcategorias',
        'contas_bancarias',
        'cartoes_credito',
        'contatos',
        'centros_custo',
        'metas',
        'orcamentos',
        'investimentos',
        'alertas',
        'integracoes_bancarias',
        'transacoes_importadas',
        'logs_sincronizacao'
    ];
BEGIN
    FOREACH current_table IN ARRAY tables_to_update
    LOOP
        -- Verificar se a tabela existe
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = current_table AND table_schema = 'public') THEN
            -- Adicionar coluna user_id se não existir
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = current_table 
                AND column_name = 'user_id' 
                AND table_schema = 'public'
            ) THEN
                EXECUTE format('ALTER TABLE public.%I ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE', current_table);
                RAISE NOTICE 'Adicionada coluna user_id na tabela %', current_table;
            END IF;
        END IF;
    END LOOP;
END
$$;

-- 8. Atualizar dados existentes com user_id padrão (se necessário)
-- ATENÇÃO: Isso deve ser feito apenas uma vez e com cuidado
-- Descomente as linhas abaixo apenas se você tiver dados existentes que precisam ser migrados

/*
DO $$
DECLARE
    default_user_id UUID;
    table_name TEXT;
    tables_to_update TEXT[] := ARRAY[
        'transactions',
        'categorias',
        'subcategorias',
        'contas_bancarias',
        'cartoes_credito',
        'contatos',
        'centros_custo',
        'metas',
        'orcamentos',
        'investimentos',
        'alertas'
    ];
BEGIN
    -- Buscar o primeiro usuário ou criar um usuário padrão
    SELECT id INTO default_user_id FROM auth.users LIMIT 1;
    
    IF default_user_id IS NOT NULL THEN
        FOREACH table_name IN ARRAY tables_to_update
        LOOP
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
                EXECUTE format('UPDATE public.%I SET user_id = %L WHERE user_id IS NULL', table_name, default_user_id);
                RAISE NOTICE 'Atualizada tabela % com user_id padrão', table_name;
            END IF;
        END LOOP;
    END IF;
END
$$;
*/

-- 9. Tornar user_id NOT NULL (descomente após migrar dados existentes)
/*
DO $$
DECLARE
    table_name TEXT;
    tables_to_update TEXT[] := ARRAY[
        'transactions',
        'categorias',
        'subcategorias',
        'contas_bancarias',
        'cartoes_credito',
        'contatos',
        'centros_custo',
        'metas',
        'orcamentos',
        'investimentos',
        'alertas'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_to_update
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id SET NOT NULL', table_name);
            RAISE NOTICE 'Coluna user_id definida como NOT NULL na tabela %', table_name;
        END IF;
    END LOOP;
END
$$;
*/

-- 10. Configurar RLS (Row Level Security)
-- Habilitar RLS em todas as tabelas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    current_table TEXT;
    tables_to_secure TEXT[] := ARRAY[
        'transactions',
        'categorias',
        'subcategorias',
        'contas_bancarias',
        'cartoes_credito',
        'contatos',
        'centros_custo',
        'metas',
        'orcamentos',
        'investimentos',
        'alertas',
        'integracoes_bancarias',
        'transacoes_importadas',
        'logs_sincronizacao'
    ];
BEGIN
    FOREACH current_table IN ARRAY tables_to_secure
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = current_table AND table_schema = 'public') THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', current_table);
            RAISE NOTICE 'RLS habilitado na tabela %', current_table;
        END IF;
    END LOOP;
END
$$;

-- 11. Criar políticas RLS para user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 12. Criar políticas RLS para tabelas principais
DO $$
DECLARE
    current_table TEXT;
    tables_to_secure TEXT[] := ARRAY[
        'transactions',
        'categorias',
        'subcategorias',
        'contas_bancarias',
        'cartoes_credito',
        'contatos',
        'centros_custo',
        'metas',
        'orcamentos',
        'investimentos',
        'alertas',
        'integracoes_bancarias',
        'transacoes_importadas',
        'logs_sincronizacao'
    ];
BEGIN
    FOREACH current_table IN ARRAY tables_to_secure
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = current_table AND table_schema = 'public') THEN
            -- Política de SELECT
            EXECUTE format('DROP POLICY IF EXISTS "Users can view own %s" ON public.%I', current_table, current_table);
            EXECUTE format('CREATE POLICY "Users can view own %s" ON public.%I FOR SELECT USING (auth.uid() = user_id)', current_table, current_table);
            
            -- Política de INSERT
            EXECUTE format('DROP POLICY IF EXISTS "Users can insert own %s" ON public.%I', current_table, current_table);
            EXECUTE format('CREATE POLICY "Users can insert own %s" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)', current_table, current_table);
            
            -- Política de UPDATE
            EXECUTE format('DROP POLICY IF EXISTS "Users can update own %s" ON public.%I', current_table, current_table);
            EXECUTE format('CREATE POLICY "Users can update own %s" ON public.%I FOR UPDATE USING (auth.uid() = user_id)', current_table, current_table);
            
            -- Política de DELETE
            EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %s" ON public.%I', current_table, current_table);
            EXECUTE format('CREATE POLICY "Users can delete own %s" ON public.%I FOR DELETE USING (auth.uid() = user_id)', current_table, current_table);
            
            RAISE NOTICE 'Políticas RLS criadas para tabela %', current_table;
        END IF;
    END LOOP;
END
$$;

-- 13. Configurar autenticação Google (configurar no painel do Supabase)
-- Vá em Authentication > Providers > Google
-- Configure as credenciais OAuth do Google

-- 14. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

DO $$
DECLARE
    current_table TEXT;
    tables_to_index TEXT[] := ARRAY[
        'transactions',
        'categorias',
        'subcategorias',
        'contas_bancarias',
        'cartoes_credito',
        'contatos',
        'centros_custo',
        'metas',
        'orcamentos',
        'investimentos',
        'alertas',
        'integracoes_bancarias',
        'transacoes_importadas',
        'logs_sincronizacao'
    ];
BEGIN
    FOREACH current_table IN ARRAY tables_to_index
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = current_table AND table_schema = 'public') THEN
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_user_id ON public.%I(user_id)', current_table, current_table);
            RAISE NOTICE 'Índice criado para user_id na tabela %', current_table;
        END IF;
    END LOOP;
END
$$;

-- 15. Configurar permissões para service role
-- Permitir que o service role acesse user_profiles
GRANT ALL ON public.user_profiles TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 16. Script de verificação
SELECT 
    'user_profiles' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users
FROM public.user_profiles
UNION ALL
SELECT 
    'auth.users' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT id) as unique_users
FROM auth.users;

-- Mostrar tabelas com RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
ORDER BY tablename;

DO $$
BEGIN
    RAISE NOTICE '✅ Configuração de autenticação e multi-tenancy concluída!';
    RAISE NOTICE '📋 Próximos passos:';
    RAISE NOTICE '1. Configure OAuth do Google no painel do Supabase';
    RAISE NOTICE '2. Descomente e execute as seções de migração de dados se necessário';
    RAISE NOTICE '3. Teste o sistema de autenticação na aplicação';
    RAISE NOTICE '4. Verifique se todos os usuários têm perfis criados automaticamente';
END
$$;
