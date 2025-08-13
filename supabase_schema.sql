-- =====================================================
-- SCHEMA DO SISTEMA FINANCEIRO - SUPABASE
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- MÓDULO 1: GESTÃO FINANCEIRA ESSENCIAL
-- =====================================================

-- Tabela principal de transações
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data VARCHAR(10) NOT NULL, -- DD/MM/AAAA
    valor DECIMAL(15,2) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    conta VARCHAR(100) NOT NULL,
    conta_transferencia VARCHAR(100),
    cartao VARCHAR(100),
    categoria VARCHAR(100) NOT NULL,
    subcategoria VARCHAR(100),
    contato VARCHAR(100),
    centro VARCHAR(100),
    projeto VARCHAR(100),
    forma VARCHAR(50) NOT NULL,
    numero_documento VARCHAR(50),
    observacoes TEXT,
    data_competencia VARCHAR(10), -- DD/MM/AAAA
    tags JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente', 'vencido')),
    data_pagamento VARCHAR(10), -- DD/MM/AAAA
    vencimento VARCHAR(10) NOT NULL, -- DD/MM/AAAA
    empresa VARCHAR(100),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('receita', 'despesa', 'transferencia', 'investimento')),
    parcela VARCHAR(20),
    situacao VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de contas bancárias
CREATE TABLE IF NOT EXISTS contas_bancarias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('conta_corrente', 'poupanca', 'investimento', 'cartao_credito', 'cartao_debito')),
    banco VARCHAR(100) NOT NULL,
    agencia VARCHAR(20),
    conta VARCHAR(50),
    saldo DECIMAL(15,2) NOT NULL DEFAULT 0,
    limite DECIMAL(15,2),
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de cartões de crédito
CREATE TABLE IF NOT EXISTS cartoes_credito (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    banco VARCHAR(100) NOT NULL,
    limite DECIMAL(15,2) NOT NULL,
    vencimento INTEGER NOT NULL CHECK (vencimento >= 1 AND vencimento <= 31), -- Dia do vencimento
    conta_id UUID REFERENCES contas_bancarias(id),
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MÓDULO 2: ORGANIZAÇÃO E PLANEJAMENTO
-- =====================================================

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('receita', 'despesa', 'ambos')),
    cor VARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- Código hexadecimal da cor
    icone VARCHAR(50),
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de subcategorias
CREATE TABLE IF NOT EXISTS subcategorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de centros de custo
CREATE TABLE IF NOT EXISTS centros_custo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('custo', 'lucro')),
    descricao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de contatos
CREATE TABLE IF NOT EXISTS contatos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('cliente', 'fornecedor', 'parceiro', 'funcionario')),
    email VARCHAR(255),
    telefone VARCHAR(20),
    cpf_cnpj VARCHAR(18),
    endereco TEXT,
    observacoes TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de metas
CREATE TABLE IF NOT EXISTS metas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('receita', 'despesa', 'investimento')),
    valor_meta DECIMAL(15,2) NOT NULL,
    valor_atual DECIMAL(15,2) NOT NULL DEFAULT 0,
    data_inicio VARCHAR(10) NOT NULL, -- DD/MM/AAAA
    data_fim VARCHAR(10) NOT NULL, -- DD/MM/AAAA
    categoria_id UUID REFERENCES categorias(id),
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de orçamentos
CREATE TABLE IF NOT EXISTS orcamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mes VARCHAR(7) NOT NULL, -- YYYY-MM
    categoria_id UUID NOT NULL REFERENCES categorias(id),
    valor_previsto DECIMAL(15,2) NOT NULL,
    valor_realizado DECIMAL(15,2) NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MÓDULO 3: RECURSOS AVANÇADOS E INTEGRAÇÕES
-- =====================================================

-- Tabela de investimentos
CREATE TABLE IF NOT EXISTS investimentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('acao', 'fiis', 'etfs', 'cdb', 'lci', 'lca', 'poupanca', 'outros')),
    valor DECIMAL(15,2) NOT NULL,
    quantidade DECIMAL(15,4) NOT NULL,
    preco_medio DECIMAL(15,4) NOT NULL,
    data_compra VARCHAR(10), -- DD/MM/AAAA
    instituicao VARCHAR(100),
    observacoes TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    data_criacao VARCHAR(10) NOT NULL, -- DD/MM/AAAA
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MÓDULO 4: RELATÓRIOS E ANÁLISES
-- =====================================================

-- Tabela de relatórios
CREATE TABLE IF NOT EXISTS relatorios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('dre', 'balanco', 'fluxo_caixa', 'categoria', 'centro_custo')),
    parametros JSONB,
    data_geracao VARCHAR(10) NOT NULL, -- DD/MM/AAAA
    dados JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CONFIGURAÇÕES DO SISTEMA
-- =====================================================

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS configuracoes_sistema (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moeda VARCHAR(3) NOT NULL DEFAULT 'BRL',
    formato_data VARCHAR(10) NOT NULL DEFAULT 'DD/MM/AAAA',
    formato_moeda VARCHAR(20) NOT NULL DEFAULT 'R$ #,##0.00',
    regime_contabil VARCHAR(20) NOT NULL DEFAULT 'caixa' CHECK (regime_contabil IN ('caixa', 'competencia')),
    alertas_vencimento INTEGER NOT NULL DEFAULT 7,
    backup_automatico BOOLEAN NOT NULL DEFAULT false,
    tema VARCHAR(10) NOT NULL DEFAULT 'claro' CHECK (tema IN ('claro', 'escuro')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para transactions
CREATE INDEX IF NOT EXISTS idx_transactions_data ON transactions(data);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_tipo ON transactions(tipo);
CREATE INDEX IF NOT EXISTS idx_transactions_categoria ON transactions(categoria);
CREATE INDEX IF NOT EXISTS idx_transactions_vencimento ON transactions(vencimento);

-- Índices para categorias
CREATE INDEX IF NOT EXISTS idx_categorias_tipo ON categorias(tipo);
CREATE INDEX IF NOT EXISTS idx_categorias_ativo ON categorias(ativo);

-- Índices para subcategorias
CREATE INDEX IF NOT EXISTS idx_subcategorias_categoria_id ON subcategorias(categoria_id);
CREATE INDEX IF NOT EXISTS idx_subcategorias_ativo ON subcategorias(ativo);

-- Índices para investimentos
CREATE INDEX IF NOT EXISTS idx_investimentos_tipo ON investimentos(tipo);
CREATE INDEX IF NOT EXISTS idx_investimentos_ativo ON investimentos(ativo);

-- Índices para metas
CREATE INDEX IF NOT EXISTS idx_metas_tipo ON metas(tipo);
CREATE INDEX IF NOT EXISTS idx_metas_ativo ON metas(ativo);

-- Índices para orçamentos
CREATE INDEX IF NOT EXISTS idx_orcamentos_mes ON orcamentos(mes);
CREATE INDEX IF NOT EXISTS idx_orcamentos_categoria_id ON orcamentos(categoria_id);

-- =====================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contas_bancarias_updated_at BEFORE UPDATE ON contas_bancarias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cartoes_credito_updated_at BEFORE UPDATE ON cartoes_credito FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON categorias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subcategorias_updated_at BEFORE UPDATE ON subcategorias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_centros_custo_updated_at BEFORE UPDATE ON centros_custo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contatos_updated_at BEFORE UPDATE ON contatos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_metas_updated_at BEFORE UPDATE ON metas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orcamentos_updated_at BEFORE UPDATE ON orcamentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investimentos_updated_at BEFORE UPDATE ON investimentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_relatorios_updated_at BEFORE UPDATE ON relatorios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracoes_sistema_updated_at BEFORE UPDATE ON configuracoes_sistema FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DADOS INICIAIS (OPCIONAL)
-- =====================================================

-- Inserir categorias padrão
INSERT INTO categorias (nome, tipo, cor) VALUES
('Alimentação', 'despesa', '#EF4444'),
('Transporte', 'despesa', '#F59E0B'),
('Moradia', 'despesa', '#10B981'),
('Saúde', 'despesa', '#3B82F6'),
('Educação', 'despesa', '#8B5CF6'),
('Lazer', 'despesa', '#EC4899'),
('Serviços', 'despesa', '#6B7280'),
('Receitas', 'receita', '#059669'),
('Salário', 'receita', '#10B981'),
('Investimentos', 'receita', '#3B82F6')
ON CONFLICT DO NOTHING;

-- Inserir configuração padrão do sistema
INSERT INTO configuracoes_sistema (moeda, formato_data, formato_moeda, regime_contabil, alertas_vencimento, backup_automatico, tema) VALUES
('BRL', 'DD/MM/AAAA', 'R$ #,##0.00', 'caixa', 7, false, 'claro')
ON CONFLICT DO NOTHING;

-- =====================================================
-- POLÍTICAS DE SEGURANÇA RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartoes_credito ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE centros_custo ENABLE ROW LEVEL SECURITY;
ALTER TABLE contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE investimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todas as operações para usuários autenticados)
-- Nota: Estas políticas devem ser ajustadas conforme as necessidades de segurança

CREATE POLICY "Allow all operations for authenticated users" ON transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON contas_bancarias FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON cartoes_credito FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON categorias FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON subcategorias FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON centros_custo FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON contatos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON metas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON orcamentos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON investimentos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON relatorios FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON configuracoes_sistema FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON alertas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON configuracoes_alertas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON notificacoes FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- SISTEMA DE ALERTAS
-- =====================================================

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
    dias_antes INTEGER CHECK (dias_antes >= 1 AND dias_antes <= 30),
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

-- Índices para melhor performance
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

-- Triggers para atualizar updated_at
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

-- Função para criar alertas automaticamente
CREATE OR REPLACE FUNCTION criar_alerta_automatico()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se há configurações ativas para o tipo de transação
    IF NEW.status = 'pendente' AND NEW.vencimento IS NOT NULL THEN
        -- Criar alerta de vencimento se configurado
        INSERT INTO alertas (
            tipo, titulo, mensagem, prioridade, status, categoria,
            data_vencimento, dados_relacionados
        ) VALUES (
            'vencimento',
            NEW.descricao || ' vence em breve!',
            'A transação ' || NEW.descricao || ' no valor de R$ ' || 
            ABS(NEW.valor)::text || ' vence em ' || NEW.vencimento || '.',
            CASE 
                WHEN NEW.vencimento::date <= CURRENT_DATE THEN 'critica'
                WHEN NEW.vencimento::date <= CURRENT_DATE + INTERVAL '1 day' THEN 'alta'
                WHEN NEW.vencimento::date <= CURRENT_DATE + INTERVAL '3 days' THEN 'media'
                ELSE 'baixa'
            END,
            'ativo',
            NEW.categoria,
            NEW.vencimento,
            jsonb_build_object(
                'transacaoId', NEW.id,
                'valor', NEW.valor,
                'descricao', NEW.descricao,
                'vencimento', NEW.vencimento
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar alertas automaticamente ao inserir/atualizar transações
CREATE TRIGGER trigger_criar_alerta_transacao
    AFTER INSERT OR UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION criar_alerta_automatico();

-- Função para limpar alertas antigos (mais de 30 dias)
CREATE OR REPLACE FUNCTION limpar_alertas_antigos()
RETURNS void AS $$
BEGIN
    DELETE FROM alertas 
    WHERE data_criacao < CURRENT_DATE - INTERVAL '30 days'
    AND status IN ('lido', 'arquivado');
END;
$$ LANGUAGE plpgsql;

-- Agendar limpeza automática (executar diariamente às 02:00)
-- SELECT cron.schedule('limpar-alertas-antigos', '0 2 * * *', 'SELECT limpar_alertas_antigos();');

-- =====================================================
-- COMENTÁRIOS DAS TABELAS
-- =====================================================

COMMENT ON TABLE transactions IS 'Tabela principal de transações financeiras';
COMMENT ON TABLE contas_bancarias IS 'Contas bancárias e cartões';
COMMENT ON TABLE cartoes_credito IS 'Cartões de crédito';
COMMENT ON TABLE categorias IS 'Categorias de receitas e despesas';
COMMENT ON TABLE subcategorias IS 'Subcategorias dependentes das categorias';
COMMENT ON TABLE centros_custo IS 'Centros de custo e lucro';
COMMENT ON TABLE contatos IS 'Contatos, clientes e fornecedores';
COMMENT ON TABLE metas IS 'Metas financeiras';
COMMENT ON TABLE orcamentos IS 'Orçamentos mensais por categoria';
COMMENT ON TABLE investimentos IS 'Carteira de investimentos';
COMMENT ON TABLE relatorios IS 'Relatórios gerados pelo sistema';
COMMENT ON TABLE configuracoes_sistema IS 'Configurações gerais do sistema'; 
COMMENT ON TABLE alertas IS 'Sistema de alertas para notificações financeiras';
COMMENT ON TABLE configuracoes_alertas IS 'Configurações para geração automática de alertas';
COMMENT ON TABLE notificacoes IS 'Histórico de notificações enviadas'; 