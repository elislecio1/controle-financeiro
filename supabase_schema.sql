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
-- SISTEMA DE INTEGRAÇÕES EXTERNAS
-- =====================================================

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
    status_conciliação VARCHAR(20) DEFAULT 'pendente' CHECK (status_conciliação IN ('pendente', 'conciliada', 'ignorada')),
    transacao_id UUID REFERENCES transactions(id), -- Se foi conciliada
    dados_originais JSONB, -- Dados completos da transação original
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações de notificações
CREATE TABLE IF NOT EXISTS configuracoes_notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('email', 'push', 'sms', 'webhook')),
    nome VARCHAR(100) NOT NULL,
    configuracao JSONB NOT NULL, -- Configurações específicas do tipo
    ativo BOOLEAN NOT NULL DEFAULT true,
    frequencia VARCHAR(20) DEFAULT 'imediato' CHECK (frequencia IN ('imediato', 'diario', 'semanal', 'mensal')),
    horario_envio TIME, -- Para notificações agendadas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de notificações
CREATE TABLE IF NOT EXISTS historico_notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    configuracao_id UUID REFERENCES configuracoes_notificacoes(id),
    tipo_notificacao VARCHAR(50) NOT NULL,
    destinatario VARCHAR(255) NOT NULL,
    assunto VARCHAR(255),
    conteudo TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('enviado', 'erro', 'pendente')),
    data_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    detalhes_erro TEXT,
    dados_adicional JSONB
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

-- Índices para integrações bancárias
CREATE INDEX IF NOT EXISTS idx_integracoes_bancarias_banco ON integracoes_bancarias(banco);
CREATE INDEX IF NOT EXISTS idx_integracoes_bancarias_status ON integracoes_bancarias(status);
CREATE INDEX IF NOT EXISTS idx_integracoes_bancarias_conta_id ON integracoes_bancarias(conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_integracoes_bancarias_ativo ON integracoes_bancarias(ativo);

-- Índices para logs de sincronização
CREATE INDEX IF NOT EXISTS idx_logs_sincronizacao_integracao_id ON logs_sincronizacao(integracao_id);
CREATE INDEX IF NOT EXISTS idx_logs_sincronizacao_status ON logs_sincronizacao(status);
CREATE INDEX IF NOT EXISTS idx_logs_sincronizacao_created_at ON logs_sincronizacao(created_at);

-- Índices para transações importadas
CREATE INDEX IF NOT EXISTS idx_transacoes_importadas_integracao_id ON transacoes_importadas(integracao_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_importadas_hash ON transacoes_importadas(hash_transacao);
CREATE INDEX IF NOT EXISTS idx_transacoes_importadas_status_conciliação ON transacoes_importadas(status_conciliação);
CREATE INDEX IF NOT EXISTS idx_transacoes_importadas_data ON transacoes_importadas(data_transacao);

-- Índices para configurações de notificações
CREATE INDEX IF NOT EXISTS idx_config_notificacoes_tipo ON configuracoes_notificacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_config_notificacoes_ativo ON configuracoes_notificacoes(ativo);

-- Índices para histórico de notificações
CREATE INDEX IF NOT EXISTS idx_historico_notificacoes_config_id ON historico_notificacoes(configuracao_id);
CREATE INDEX IF NOT EXISTS idx_historico_notificacoes_status ON historico_notificacoes(status);
CREATE INDEX IF NOT EXISTS idx_historico_notificacoes_data_envio ON historico_notificacoes(data_envio);

-- =====================================================
-- TRIGGERS AUTOMÁTICOS
-- =====================================================

-- Trigger para atualizar updated_at em todas as tabelas
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

-- Triggers para novas tabelas de integração
CREATE TRIGGER update_integracoes_bancarias_updated_at BEFORE UPDATE ON integracoes_bancarias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transacoes_importadas_updated_at BEFORE UPDATE ON transacoes_importadas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracoes_notificacoes_updated_at BEFORE UPDATE ON configuracoes_notificacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNÇÕES AUTOMÁTICAS
-- =====================================================

-- Função para criar alerta automático quando transação é criada/atualizada
CREATE OR REPLACE FUNCTION criar_alerta_automatico()
RETURNS TRIGGER AS $$
BEGIN
    -- Lógica para criar alertas automáticos baseados em transações
    -- Será implementada posteriormente
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para criar alertas automáticos
CREATE TRIGGER trigger_criar_alerta_transacao
    AFTER INSERT OR UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION criar_alerta_automatico();

-- Função para limpar alertas antigos
CREATE OR REPLACE FUNCTION limpar_alertas_antigos()
RETURNS void AS $$
BEGIN
    -- Lógica para limpar alertas antigos
    -- Será implementada posteriormente
END;
$$ language 'plpgsql';

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
COMMENT ON TABLE metas IS 'Metas financeiras e objetivos';
COMMENT ON TABLE orcamentos IS 'Orçamentos mensais por categoria';
COMMENT ON TABLE investimentos IS 'Carteira de investimentos';
COMMENT ON TABLE relatorios IS 'Relatórios gerados pelo sistema';
COMMENT ON TABLE configuracoes_sistema IS 'Configurações gerais do sistema';
COMMENT ON TABLE alertas IS 'Sistema de alertas para notificações financeiras';
COMMENT ON TABLE configuracoes_alertas IS 'Configurações para geração automática de alertas';
COMMENT ON TABLE notificacoes IS 'Histórico de notificações enviadas';

-- Comentários para tabelas de integração
COMMENT ON TABLE integracoes_bancarias IS 'Configurações de integração com bancos e instituições financeiras';
COMMENT ON TABLE logs_sincronizacao IS 'Logs de todas as operações de sincronização bancária';
COMMENT ON TABLE transacoes_importadas IS 'Transações importadas dos bancos para conciliação';
COMMENT ON TABLE configuracoes_notificacoes IS 'Configurações de notificações por email, push, SMS e webhooks';
COMMENT ON TABLE historico_notificacoes IS 'Histórico de todas as notificações enviadas pelo sistema';

-- Comentários para colunas específicas
COMMENT ON COLUMN integracoes_bancarias.tipo_integracao IS 'Tipo de integração: API oficial, Open Banking, Webhook ou arquivo CSV';
COMMENT ON COLUMN integracoes_bancarias.configuracao IS 'Configurações específicas da integração (credenciais, URLs, etc.)';
COMMENT ON COLUMN integracoes_bancarias.frequencia_sincronizacao IS 'Frequência de sincronização em horas';
COMMENT ON COLUMN transacoes_importadas.hash_transacao IS 'Hash único da transação para evitar duplicatas';
COMMENT ON COLUMN transacoes_importadas.status_conciliação IS 'Status da conciliação: pendente, conciliada ou ignorada';
COMMENT ON COLUMN configuracoes_notificacoes.frequencia IS 'Frequência de envio: imediato, diário, semanal ou mensal';
COMMENT ON COLUMN configuracoes_notificacoes.horario_envio IS 'Horário específico para envio de notificações agendadas';

-- =====================================================
-- FIM DO SCHEMA
-- ===================================================== 