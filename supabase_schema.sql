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