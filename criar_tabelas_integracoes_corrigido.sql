-- Script corrigido para criar as tabelas de integrações bancárias
-- Execute este script no SQL Editor do Supabase

-- Habilitar extensão uuid-ossp se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Remover triggers existentes (se houver)
DROP TRIGGER IF EXISTS update_integracoes_bancarias_updated_at ON integracoes_bancarias;
DROP TRIGGER IF EXISTS update_transacoes_importadas_updated_at ON transacoes_importadas;

-- Tabela de configurações de integração bancária
CREATE TABLE IF NOT EXISTS integracoes_bancarias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    banco VARCHAR(100) NOT NULL,
    tipo_integracao VARCHAR(50) NOT NULL CHECK (tipo_integracao IN ('api_oficial', 'open_banking', 'webhook', 'arquivo_csv')),
    status VARCHAR(20) NOT NULL DEFAULT 'inativo' CHECK (status IN ('ativo', 'inativo', 'erro', 'sincronizando')),
    configuracao JSONB NOT NULL, -- Credenciais e configurações específicas
    ultima_sincronizacao TIMESTAMP WITH TIME ZONE,
    proxima_sincronizacao TIMESTAMP WITH TIME ZONE,
    frequencia_sincronizacao INTEGER DEFAULT 24, -- Horas
    conta_bancaria_id UUID REFERENCES contas_bancarias(id),
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de sincronização
CREATE TABLE IF NOT EXISTS logs_sincronizacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integracao_id UUID REFERENCES integracoes_bancarias(id),
    tipo_operacao VARCHAR(50) NOT NULL CHECK (tipo_operacao IN ('importacao', 'exportacao', 'erro', 'info')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('sucesso', 'erro', 'parcial')),
    mensagem TEXT,
    dados_processados INTEGER DEFAULT 0,
    transacoes_importadas INTEGER DEFAULT 0,
    transacoes_atualizadas INTEGER DEFAULT 0,
    transacoes_erro INTEGER DEFAULT 0,
    tempo_execucao_ms INTEGER,
    detalhes_erro JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de transações importadas (para conciliação)
CREATE TABLE IF NOT EXISTS transacoes_importadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integracao_id UUID REFERENCES integracoes_bancarias(id),
    id_externo VARCHAR(100), -- ID da transação no banco
    data_transacao VARCHAR(10) NOT NULL, -- DD/MM/AAAA
    valor DECIMAL(15,2) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('credito', 'debito', 'transferencia')),
    categoria_banco VARCHAR(100), -- Categoria fornecida pelo banco
    conta_origem VARCHAR(100),
    conta_destino VARCHAR(100),
    hash_transacao VARCHAR(255), -- Para evitar duplicatas
    status_conciliacao VARCHAR(20) DEFAULT 'pendente' CHECK (status_conciliacao IN ('pendente', 'conciliada', 'ignorada')),
    transacao_id UUID REFERENCES transactions(id), -- Se foi conciliada
    dados_originais JSONB, -- Dados completos da transação original
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers (após remover os existentes)
CREATE TRIGGER update_integracoes_bancarias_updated_at 
    BEFORE UPDATE ON integracoes_bancarias 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transacoes_importadas_updated_at 
    BEFORE UPDATE ON transacoes_importadas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_integracoes_bancarias_banco ON integracoes_bancarias(banco);
CREATE INDEX IF NOT EXISTS idx_integracoes_bancarias_status ON integracoes_bancarias(status);
CREATE INDEX IF NOT EXISTS idx_integracoes_bancarias_conta_id ON integracoes_bancarias(conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_integracoes_bancarias_ativo ON integracoes_bancarias(ativo);

CREATE INDEX IF NOT EXISTS idx_logs_sincronizacao_integracao ON logs_sincronizacao(integracao_id);
CREATE INDEX IF NOT EXISTS idx_logs_sincronizacao_status ON logs_sincronizacao(status);
CREATE INDEX IF NOT EXISTS idx_logs_sincronizacao_created_at ON logs_sincronizacao(created_at);

CREATE INDEX IF NOT EXISTS idx_transacoes_importadas_integracao ON transacoes_importadas(integracao_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_importadas_status ON transacoes_importadas(status_conciliacao);
CREATE INDEX IF NOT EXISTS idx_transacoes_importadas_hash ON transacoes_importadas(hash_transacao);

-- Desabilitar RLS temporariamente para desenvolvimento
ALTER TABLE integracoes_bancarias DISABLE ROW LEVEL SECURITY;
ALTER TABLE logs_sincronizacao DISABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_importadas DISABLE ROW LEVEL SECURITY;

-- Comentários das tabelas
COMMENT ON TABLE integracoes_bancarias IS 'Configurações de integração com bancos e instituições financeiras';
COMMENT ON TABLE logs_sincronizacao IS 'Logs de sincronização das integrações bancárias';
COMMENT ON TABLE transacoes_importadas IS 'Transações importadas das integrações bancárias para conciliação';

-- Verificar se as tabelas foram criadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('integracoes_bancarias', 'logs_sincronizacao', 'transacoes_importadas')
ORDER BY table_name;

-- Verificar status RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('integracoes_bancarias', 'logs_sincronizacao', 'transacoes_importadas')
AND schemaname = 'public';
