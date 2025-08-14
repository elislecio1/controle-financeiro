-- =====================================================
-- CORREÇÃO COMPLETA RLS PARA TABELAS DE ALERTAS
-- =====================================================

-- Primeiro, criar as tabelas de alertas se não existirem
-- Tabela de alertas
CREATE TABLE IF NOT EXISTS alertas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('vencimento', 'meta', 'orcamento', 'saldo', 'personalizado')),
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    prioridade VARCHAR(20) NOT NULL CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')),
    status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'lido', 'arquivado')),
    categoria VARCHAR(100),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_vencimento VARCHAR(10), -- DD/MM/AAAA
    data_leitura TIMESTAMP WITH TIME ZONE,
    usuario_id UUID,
    configuracao_id UUID,
    dados_relacionados JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações de alertas
CREATE TABLE IF NOT EXISTS configuracoes_alertas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('vencimento', 'meta', 'orcamento', 'saldo', 'personalizado')),
    ativo BOOLEAN NOT NULL DEFAULT true,
    dias_antes INTEGER CHECK (dias_antes >= 0 AND dias_antes <= 30),
    valor_minimo DECIMAL(15,2),
    percentual_meta INTEGER CHECK (percentual_meta >= 1 AND percentual_meta <= 100),
    categorias TEXT[], -- Array de categorias
    contas TEXT[], -- Array de contas
    horario_notificacao TIME,
    frequencia VARCHAR(20) NOT NULL CHECK (frequencia IN ('diario', 'semanal', 'mensal', 'personalizado')),
    canais TEXT[] NOT NULL DEFAULT '{dashboard}' CHECK (array_length(canais, 1) > 0),
    usuario_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alerta_id UUID NOT NULL REFERENCES alertas(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('email', 'push', 'sms', 'dashboard')),
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviada', 'falha')),
    data_envio TIMESTAMP WITH TIME ZONE,
    dados_envio JSONB,
    tentativas INTEGER NOT NULL DEFAULT 1,
    max_tentativas INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_alertas_tipo ON alertas(tipo);
CREATE INDEX IF NOT EXISTS idx_alertas_status ON alertas(status);
CREATE INDEX IF NOT EXISTS idx_alertas_prioridade ON alertas(prioridade);
CREATE INDEX IF NOT EXISTS idx_alertas_data_criacao ON alertas(data_criacao);
CREATE INDEX IF NOT EXISTS idx_alertas_usuario_id ON alertas(usuario_id);

CREATE INDEX IF NOT EXISTS idx_configuracoes_tipo ON configuracoes_alertas(tipo);
CREATE INDEX IF NOT EXISTS idx_configuracoes_ativo ON configuracoes_alertas(ativo);
CREATE INDEX IF NOT EXISTS idx_configuracoes_usuario_id ON configuracoes_alertas(usuario_id);

CREATE INDEX IF NOT EXISTS idx_notificacoes_alerta_id ON notificacoes(alerta_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_status ON notificacoes(status);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON notificacoes(tipo);

-- Habilitar RLS nas tabelas de alertas
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para as tabelas de alertas
CREATE POLICY "Allow all operations for authenticated users" ON alertas 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON configuracoes_alertas 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON notificacoes 
FOR ALL USING (auth.role() = 'authenticated');

-- Criar triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_alertas_updated_at BEFORE UPDATE ON alertas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_alertas_updated_at BEFORE UPDATE ON configuracoes_alertas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notificacoes_updated_at BEFORE UPDATE ON notificacoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verificar se as tabelas e políticas foram criadas
SELECT 'Tabelas criadas:' as status;
SELECT tablename FROM pg_tables WHERE tablename IN ('alertas', 'configuracoes_alertas', 'notificacoes');

SELECT 'Políticas RLS criadas:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('alertas', 'configuracoes_alertas', 'notificacoes');
