-- Script SIMPLES para criar as tabelas de integrações bancárias
-- Execute este script no SQL Editor do Supabase

-- Habilitar extensão uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Criar tabela integracoes_bancarias
CREATE TABLE IF NOT EXISTS integracoes_bancarias (
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

-- 2. Criar tabela logs_sincronizacao
CREATE TABLE IF NOT EXISTS logs_sincronizacao (
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

-- 3. Criar tabela transacoes_importadas
CREATE TABLE IF NOT EXISTS transacoes_importadas (
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

-- 4. Desabilitar RLS
ALTER TABLE integracoes_bancarias DISABLE ROW LEVEL SECURITY;
ALTER TABLE logs_sincronizacao DISABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_importadas DISABLE ROW LEVEL SECURITY;

-- 5. Verificar se as tabelas foram criadas
SELECT 'Tabelas criadas:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('integracoes_bancarias', 'logs_sincronizacao', 'transacoes_importadas')
ORDER BY table_name;

-- 6. Verificar colunas da tabela transacoes_importadas
SELECT 'Colunas da tabela transacoes_importadas:' as info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'transacoes_importadas' 
AND table_schema = 'public'
ORDER BY ordinal_position;
