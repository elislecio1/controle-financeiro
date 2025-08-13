-- =====================================================
-- CORREÇÃO URGENTE RLS - PERMITIR OPERAÇÕES SEM AUTH
-- =====================================================

-- Primeiro, remover as políticas existentes que estão causando problemas
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON alertas;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON configuracoes_alertas;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON notificacoes;

-- Desabilitar RLS temporariamente para permitir operações
ALTER TABLE alertas DISABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_alertas DISABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes DISABLE ROW LEVEL SECURITY;

-- Verificar se as tabelas existem e têm dados
SELECT 'Verificando tabelas:' as status;
SELECT tablename FROM pg_tables WHERE tablename IN ('alertas', 'configuracoes_alertas', 'notificacoes');

-- Verificar se RLS está desabilitado
SELECT 'Verificando RLS:' as status;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('alertas', 'configuracoes_alertas', 'notificacoes');

-- Teste de inserção direta para verificar se funciona
INSERT INTO configuracoes_alertas (
    tipo, 
    ativo, 
    dias_antes, 
    frequencia, 
    canais
) VALUES (
    'vencimento',
    true,
    3,
    'diario',
    '{dashboard}'
) ON CONFLICT DO NOTHING;

-- Verificar se a inserção funcionou
SELECT 'Teste de inserção:' as status;
SELECT COUNT(*) as total_configuracoes FROM configuracoes_alertas;

-- Mostrar configurações existentes
SELECT 'Configurações existentes:' as status;
SELECT id, tipo, ativo, dias_antes, frequencia FROM configuracoes_alertas LIMIT 5;
