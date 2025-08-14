-- Script para FORÇAR a recriação das tabelas de integrações
-- Execute este script no SQL Editor do Supabase

-- 1. REMOVER tabelas existentes (se houver)
DROP TABLE IF EXISTS transacoes_importadas CASCADE;
DROP TABLE IF EXISTS logs_sincronizacao CASCADE;
DROP TABLE IF EXISTS integracoes_bancarias CASCADE;

-- 2. Habilitar extensão uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. CRIAR tabela integracoes_bancarias
CREATE TABLE integracoes_bancarias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    banco VARCHAR(100) NOT NULL,
    tipo_integracao VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'inativo',
    configuracao JSONB NOT NULL,
    ultima_sincronizacao TIMESTAMP WITH TIME ZONE,
    proxima_sincronizacao TIMESTAMP WITH TIME ZONE,
    frequencia_sincronizacao INTEGER DEFAULT 24,
    conta_bancaria_id UUID,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRIAR tabela logs_sincronizacao
CREATE TABLE logs_sincronizacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integracao_id UUID,
    tipo_operacao VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    mensagem TEXT,
    dados_processados INTEGER DEFAULT 0,
    transacoes_importadas INTEGER DEFAULT 0,
    transacoes_atualizadas INTEGER DEFAULT 0,
    transacoes_erro INTEGER DEFAULT 0,
    tempo_execucao_ms INTEGER,
    detalhes_erro JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CRIAR tabela transacoes_importadas (COM A COLUNA status_conciliacao)
CREATE TABLE transacoes_importadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integracao_id UUID,
    id_externo VARCHAR(100),
    data_transacao VARCHAR(10) NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    categoria_banco VARCHAR(100),
    conta_origem VARCHAR(100),
    conta_destino VARCHAR(100),
    hash_transacao VARCHAR(255),
    status_conciliacao VARCHAR(20) DEFAULT 'pendente',
    transacao_id UUID,
    dados_originais JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Desabilitar RLS
ALTER TABLE integracoes_bancarias DISABLE ROW LEVEL SECURITY;
ALTER TABLE logs_sincronizacao DISABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_importadas DISABLE ROW LEVEL SECURITY;

-- 7. Verificar se as tabelas foram criadas
SELECT '=== TABELAS CRIADAS ===' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('integracoes_bancarias', 'logs_sincronizacao', 'transacoes_importadas')
ORDER BY table_name;

-- 8. Verificar colunas da tabela transacoes_importadas
SELECT '=== COLUNAS DA TABELA transacoes_importadas ===' as info;
SELECT column_name, data_type, is_nullable FROM information_schema.columns 
WHERE table_name = 'transacoes_importadas' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Verificar se a coluna status_conciliacao existe especificamente
SELECT '=== VERIFICANDO COLUNA status_conciliacao ===' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'transacoes_importadas' 
            AND column_name = 'status_conciliacao'
            AND table_schema = 'public'
        ) 
        THEN '✅ Coluna status_conciliacao EXISTE'
        ELSE '❌ Coluna status_conciliacao NÃO EXISTE'
    END as resultado;

-- 10. Teste de inserção
SELECT '=== TESTE DE INSERÇÃO ===' as info;
INSERT INTO transacoes_importadas (
    integracao_id,
    id_externo,
    data_transacao,
    valor,
    descricao,
    tipo,
    categoria_banco,
    status_conciliacao
) VALUES (
    uuid_generate_v4(),
    'TESTE_001',
    '14/08/2025',
    100.00,
    'Teste de inserção',
    'debito',
    'Teste',
    'pendente'
);

SELECT '✅ Inserção de teste realizada com sucesso!' as resultado;

-- 11. Limpar dados de teste
DELETE FROM transacoes_importadas WHERE descricao = 'Teste de inserção';

SELECT '=== SCRIPT CONCLUÍDO ===' as info;
