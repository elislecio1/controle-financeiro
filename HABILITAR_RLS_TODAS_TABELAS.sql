-- =====================================================
-- HABILITAR RLS EM TODAS AS TABELAS PÚBLICAS
-- =====================================================
-- Este script habilita Row Level Security (RLS) em todas
-- as tabelas que têm políticas criadas mas RLS desabilitado
-- ou que são públicas mas não têm RLS habilitado
--
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. HABILITAR RLS NA TABELA transactions (se ainda não estiver)
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;

-- 2. HABILITAR RLS NA TABELA alertas
ALTER TABLE IF EXISTS public.alertas ENABLE ROW LEVEL SECURITY;

-- 3. HABILITAR RLS NA TABELA cartoes_credito
ALTER TABLE IF EXISTS public.cartoes_credito ENABLE ROW LEVEL SECURITY;

-- 4. HABILITAR RLS NA TABELA categorias
ALTER TABLE IF EXISTS public.categorias ENABLE ROW LEVEL SECURITY;

-- 5. HABILITAR RLS NA TABELA contas_bancarias
ALTER TABLE IF EXISTS public.contas_bancarias ENABLE ROW LEVEL SECURITY;

-- 6. HABILITAR RLS NA TABELA contatos
ALTER TABLE IF EXISTS public.contatos ENABLE ROW LEVEL SECURITY;

-- 7. HABILITAR RLS NA TABELA integracoes_bancarias
ALTER TABLE IF EXISTS public.integracoes_bancarias ENABLE ROW LEVEL SECURITY;

-- 8. HABILITAR RLS NA TABELA investimentos
ALTER TABLE IF EXISTS public.investimentos ENABLE ROW LEVEL SECURITY;

-- 9. HABILITAR RLS NA TABELA logs_sincronizacao
ALTER TABLE IF EXISTS public.logs_sincronizacao ENABLE ROW LEVEL SECURITY;

-- 10. HABILITAR RLS NA TABELA subcategorias
ALTER TABLE IF EXISTS public.subcategorias ENABLE ROW LEVEL SECURITY;

-- 11. HABILITAR RLS NA TABELA transacoes_importadas
ALTER TABLE IF EXISTS public.transacoes_importadas ENABLE ROW LEVEL SECURITY;

-- 12. HABILITAR RLS NA TABELA relatorios
ALTER TABLE IF EXISTS public.relatorios ENABLE ROW LEVEL SECURITY;

-- 13. HABILITAR RLS NA TABELA configuracoes_sistema
ALTER TABLE IF EXISTS public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;

-- 14. HABILITAR RLS NA TABELA notificacoes
ALTER TABLE IF EXISTS public.notificacoes ENABLE ROW LEVEL SECURITY;

-- 15. HABILITAR RLS NA TABELA metas_orcamentos
ALTER TABLE IF EXISTS public.metas_orcamentos ENABLE ROW LEVEL SECURITY;

-- 16. Verificar quais tabelas têm RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'transactions',
    'alertas',
    'cartoes_credito',
    'categorias',
    'contas_bancarias',
    'contatos',
    'integracoes_bancarias',
    'investimentos',
    'logs_sincronizacao',
    'subcategorias',
    'transacoes_importadas',
    'relatorios',
    'configuracoes_sistema',
    'notificacoes',
    'metas_orcamentos'
)
ORDER BY tablename;

-- 17. Verificar políticas RLS existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'transactions',
    'alertas',
    'cartoes_credito',
    'categorias',
    'contas_bancarias',
    'contatos',
    'integracoes_bancarias',
    'investimentos',
    'logs_sincronizacao',
    'subcategorias',
    'transacoes_importadas',
    'relatorios',
    'configuracoes_sistema',
    'notificacoes',
    'metas_orcamentos'
)
ORDER BY tablename, policyname;

-- 18. Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ RLS habilitado em todas as tabelas públicas!';
    RAISE NOTICE '📋 Verifique as políticas RLS acima para garantir que estão corretas';
    RAISE NOTICE '⚠️  Tabelas sem políticas RLS estarão inacessíveis para usuários autenticados';
END $$;
