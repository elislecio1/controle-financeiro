-- Script completo para verificar e criar todas as tabelas do sistema
-- Execute este script no Supabase SQL Editor
-- Este script verifica se as tabelas existem e as cria com todas as colunas necessárias

-- Habilitar extensão uuid-ossp se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- TABELA: transactions (Transações principais)
-- ========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions') THEN
        CREATE TABLE transactions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            data DATE NOT NULL,
            valor DECIMAL(15,2) NOT NULL,
            descricao TEXT NOT NULL,
            conta VARCHAR(100),
            conta_transferencia VARCHAR(100),
            cartao VARCHAR(100),
            categoria VARCHAR(100),
            subcategoria VARCHAR(100),
            contato VARCHAR(100),
            centro VARCHAR(100),
            projeto VARCHAR(100),
            forma VARCHAR(50),
            numero_documento VARCHAR(100),
            observacoes TEXT,
            data_competencia DATE,
            tags JSONB,
            tipo VARCHAR(20) DEFAULT 'despesa',
            vencimento DATE,
            situacao VARCHAR(50),
            data_pagamento DATE,
            parcela VARCHAR(10) DEFAULT '1',
            empresa VARCHAR(200),
            status VARCHAR(20) DEFAULT 'pendente',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Criar índices
        CREATE INDEX idx_transactions_data ON transactions(data);
        CREATE INDEX idx_transactions_tipo ON transactions(tipo);
        CREATE INDEX idx_transactions_status ON transactions(status);
        CREATE INDEX idx_transactions_vencimento ON transactions(vencimento);
        CREATE INDEX idx_transactions_conta ON transactions(conta);
        CREATE INDEX idx_transactions_categoria ON transactions(categoria);
        
        -- Criar trigger para updated_at
        CREATE TRIGGER update_transactions_updated_at 
            BEFORE UPDATE ON transactions 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Tabela transactions criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela transactions já existe';
    END IF;
END $$;

-- ========================================
-- TABELA: categorias
-- ========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'categorias') THEN
        CREATE TABLE categorias (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            nome VARCHAR(100) NOT NULL,
            tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
            cor VARCHAR(7) DEFAULT '#3B82F6',
            ativo BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Criar índices
        CREATE INDEX idx_categorias_tipo ON categorias(tipo);
        CREATE INDEX idx_categorias_ativo ON categorias(ativo);
        
        -- Criar trigger para updated_at
        CREATE TRIGGER update_categorias_updated_at 
            BEFORE UPDATE ON categorias 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Tabela categorias criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela categorias já existe';
    END IF;
END $$;

-- ========================================
-- TABELA: subcategorias
-- ========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subcategorias') THEN
        CREATE TABLE subcategorias (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            nome VARCHAR(100) NOT NULL,
            categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
            ativo BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Criar índices
        CREATE INDEX idx_subcategorias_categoria_id ON subcategorias(categoria_id);
        CREATE INDEX idx_subcategorias_ativo ON subcategorias(ativo);
        
        -- Criar trigger para updated_at
        CREATE TRIGGER update_subcategorias_updated_at 
            BEFORE UPDATE ON subcategorias 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Tabela subcategorias criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela subcategorias já existe';
    END IF;
END $$;

-- ========================================
-- TABELA: investimentos
-- ========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'investimentos') THEN
        CREATE TABLE investimentos (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            nome VARCHAR(100) NOT NULL,
            tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('acao', 'fiis', 'etfs', 'cdb', 'lci', 'lca', 'poupanca', 'outros')),
            valor DECIMAL(15,2) NOT NULL,
            quantidade INTEGER DEFAULT 0,
            preco_medio DECIMAL(15,2) DEFAULT 0,
            data_compra DATE,
            instituicao VARCHAR(100),
            observacoes TEXT,
            ativo BOOLEAN DEFAULT true,
            data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Criar índices
        CREATE INDEX idx_investimentos_tipo ON investimentos(tipo);
        CREATE INDEX idx_investimentos_ativo ON investimentos(ativo);
        CREATE INDEX idx_investimentos_instituicao ON investimentos(instituicao);
        
        -- Criar trigger para updated_at
        CREATE TRIGGER update_investimentos_updated_at 
            BEFORE UPDATE ON investimentos 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Tabela investimentos criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela investimentos já existe';
    END IF;
END $$;

-- ========================================
-- TABELA: contas_bancarias
-- ========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contas_bancarias') THEN
        CREATE TABLE contas_bancarias (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            nome VARCHAR(100) NOT NULL,
            tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('conta_corrente', 'poupanca', 'investimento', 'cartao_credito', 'cartao_debito')),
            banco VARCHAR(100),
            agencia VARCHAR(20),
            conta VARCHAR(20),
            saldo DECIMAL(15,2) DEFAULT 0,
            limite DECIMAL(15,2) DEFAULT 0,
            ativo BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Criar índices
        CREATE INDEX idx_contas_bancarias_tipo ON contas_bancarias(tipo);
        CREATE INDEX idx_contas_bancarias_banco ON contas_bancarias(banco);
        CREATE INDEX idx_contas_bancarias_ativo ON contas_bancarias(ativo);
        
        -- Criar trigger para updated_at
        CREATE TRIGGER update_contas_bancarias_updated_at 
            BEFORE UPDATE ON contas_bancarias 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Tabela contas_bancarias criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela contas_bancarias já existe';
    END IF;
END $$;

-- ========================================
-- TABELA: cartoes_credito
-- ========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cartoes_credito') THEN
        CREATE TABLE cartoes_credito (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            nome VARCHAR(100) NOT NULL,
            banco VARCHAR(100),
            limite DECIMAL(15,2) DEFAULT 0,
            vencimento INTEGER DEFAULT 15,
            conta_id UUID REFERENCES contas_bancarias(id),
            ativo BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Criar índices
        CREATE INDEX idx_cartoes_credito_banco ON cartoes_credito(banco);
        CREATE INDEX idx_cartoes_credito_conta_id ON cartoes_credito(conta_id);
        CREATE INDEX idx_cartoes_credito_ativo ON cartoes_credito(ativo);
        
        -- Criar trigger para updated_at
        CREATE TRIGGER update_cartoes_credito_updated_at 
            BEFORE UPDATE ON cartoes_credito 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Tabela cartoes_credito criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela cartoes_credito já existe';
    END IF;
END $$;

-- ========================================
-- TABELA: contatos
-- ========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contatos') THEN
        CREATE TABLE contatos (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            nome VARCHAR(200) NOT NULL,
            tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('cliente', 'fornecedor', 'funcionario', 'outros')),
            email VARCHAR(200),
            telefone VARCHAR(20),
            cpf_cnpj VARCHAR(20),
            endereco TEXT,
            observacoes TEXT,
            ativo BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Criar índices
        CREATE INDEX idx_contatos_tipo ON contatos(tipo);
        CREATE INDEX idx_contatos_email ON contatos(email);
        CREATE INDEX idx_contatos_cpf_cnpj ON contatos(cpf_cnpj);
        CREATE INDEX idx_contatos_ativo ON contatos(ativo);
        
        -- Criar trigger para updated_at
        CREATE TRIGGER update_contatos_updated_at 
            BEFORE UPDATE ON contatos 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Tabela contatos criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela contatos já existe';
    END IF;
END $$;

-- ========================================
-- TABELA: alertas
-- ========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'alertas') THEN
        CREATE TABLE alertas (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            titulo VARCHAR(200) NOT NULL,
            mensagem TEXT NOT NULL,
            tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('vencimento', 'saldo', 'meta', 'orcamento', 'geral')),
            prioridade VARCHAR(20) DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
            status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'lido')),
            data_vencimento DATE,
            data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            data_leitura TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Criar índices
        CREATE INDEX idx_alertas_tipo ON alertas(tipo);
        CREATE INDEX idx_alertas_status ON alertas(status);
        CREATE INDEX idx_alertas_prioridade ON alertas(prioridade);
        CREATE INDEX idx_alertas_data_vencimento ON alertas(data_vencimento);
        
        -- Criar trigger para updated_at
        CREATE TRIGGER update_alertas_updated_at 
            BEFORE UPDATE ON alertas 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Tabela alertas criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela alertas já existe';
    END IF;
END $$;

-- ========================================
-- TABELA: configuracoes_alertas
-- ========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'configuracoes_alertas') THEN
        CREATE TABLE configuracoes_alertas (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tipo_alerta VARCHAR(20) NOT NULL CHECK (tipo_alerta IN ('vencimento', 'saldo', 'meta', 'orcamento')),
            dias_antes INTEGER DEFAULT 1 CHECK (dias_antes >= 0),
            horario_notificacao TIME,
            ativo BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Criar índices
        CREATE INDEX idx_configuracoes_alertas_tipo ON configuracoes_alertas(tipo_alerta);
        CREATE INDEX idx_configuracoes_alertas_ativo ON configuracoes_alertas(ativo);
        
        -- Criar trigger para updated_at
        CREATE TRIGGER update_configuracoes_alertas_updated_at 
            BEFORE UPDATE ON configuracoes_alertas 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Tabela configuracoes_alertas criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela configuracoes_alertas já existe';
    END IF;
END $$;

-- ========================================
-- TABELA: integracoes_bancarias
-- ========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'integracoes_bancarias') THEN
        CREATE TABLE integracoes_bancarias (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            nome VARCHAR(200) NOT NULL,
            banco VARCHAR(100) NOT NULL,
            tipo_integracao VARCHAR(20) NOT NULL CHECK (tipo_integracao IN ('api_oficial', 'open_banking', 'webhook', 'csv')),
            configuracao JSONB NOT NULL,
            conta_bancaria_id UUID REFERENCES contas_bancarias(id),
            ativo BOOLEAN DEFAULT true,
            ultima_sincronizacao TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Criar índices
        CREATE INDEX idx_integracoes_bancarias_banco ON integracoes_bancarias(banco);
        CREATE INDEX idx_integracoes_bancarias_tipo ON integracoes_bancarias(tipo_integracao);
        CREATE INDEX idx_integracoes_bancarias_conta_id ON integracoes_bancarias(conta_bancaria_id);
        CREATE INDEX idx_integracoes_bancarias_ativo ON integracoes_bancarias(ativo);
        
        -- Criar trigger para updated_at
        CREATE TRIGGER update_integracoes_bancarias_updated_at 
            BEFORE UPDATE ON integracoes_bancarias 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Tabela integracoes_bancarias criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela integracoes_bancarias já existe';
    END IF;
END $$;

-- ========================================
-- TABELA: logs_sincronizacao
-- ========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'logs_sincronizacao') THEN
        CREATE TABLE logs_sincronizacao (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            integracao_id UUID NOT NULL REFERENCES integracoes_bancarias(id) ON DELETE CASCADE,
            tipo_operacao VARCHAR(20) NOT NULL CHECK (tipo_operacao IN ('importacao', 'exportacao', 'conciliacao', 'erro')),
            status VARCHAR(20) NOT NULL CHECK (status IN ('sucesso', 'erro', 'parcial')),
            mensagem TEXT,
            detalhes JSONB,
            data_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            data_fim TIMESTAMP WITH TIME ZONE,
            registros_processados INTEGER DEFAULT 0,
            registros_importados INTEGER DEFAULT 0,
            registros_atualizados INTEGER DEFAULT 0,
            registros_ignorados INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Criar índices
        CREATE INDEX idx_logs_sincronizacao_integracao_id ON logs_sincronizacao(integracao_id);
        CREATE INDEX idx_logs_sincronizacao_tipo ON logs_sincronizacao(tipo_operacao);
        CREATE INDEX idx_logs_sincronizacao_status ON logs_sincronizacao(status);
        CREATE INDEX idx_logs_sincronizacao_data_inicio ON logs_sincronizacao(data_inicio);
        
        RAISE NOTICE 'Tabela logs_sincronizacao criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela logs_sincronizacao já existe';
    END IF;
END $$;

-- ========================================
-- TABELA: transacoes_importadas
-- ========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transacoes_importadas') THEN
        CREATE TABLE transacoes_importadas (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            integracao_id UUID NOT NULL REFERENCES integracoes_bancarias(id) ON DELETE CASCADE,
            id_externo VARCHAR(100),
            data_transacao DATE NOT NULL,
            valor DECIMAL(15,2) NOT NULL,
            descricao TEXT NOT NULL,
            tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('debito', 'credito', 'transferencia')),
            categoria_banco VARCHAR(100),
            conta_origem VARCHAR(100),
            conta_destino VARCHAR(100),
            hash_transacao VARCHAR(255),
            status_conciliacao VARCHAR(20) DEFAULT 'pendente' CHECK (status_conciliacao IN ('pendente', 'conciliado', 'ignorado')),
            dados_originais JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Criar índices
        CREATE INDEX idx_transacoes_importadas_integracao_id ON transacoes_importadas(integracao_id);
        CREATE INDEX idx_transacoes_importadas_data_transacao ON transacoes_importadas(data_transacao);
        CREATE INDEX idx_transacoes_importadas_tipo ON transacoes_importadas(tipo);
        CREATE INDEX idx_transacoes_importadas_status ON transacoes_importadas(status_conciliacao);
        CREATE INDEX idx_transacoes_importadas_hash ON transacoes_importadas(hash_transacao);
        CREATE INDEX idx_transacoes_importadas_id_externo ON transacoes_importadas(id_externo);
        
        -- Criar trigger para updated_at
        CREATE TRIGGER update_transacoes_importadas_updated_at 
            BEFORE UPDATE ON transacoes_importadas 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Tabela transacoes_importadas criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela transacoes_importadas já existe';
    END IF;
END $$;

-- ========================================
-- TABELA: metas_orcamentos
-- ========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'metas_orcamentos') THEN
        CREATE TABLE metas_orcamentos (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            nome VARCHAR(200) NOT NULL,
            tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('meta', 'orcamento')),
            categoria_id UUID REFERENCES categorias(id),
            valor_meta DECIMAL(15,2) NOT NULL,
            valor_atual DECIMAL(15,2) DEFAULT 0,
            data_inicio DATE NOT NULL,
            data_fim DATE NOT NULL,
            descricao TEXT,
            ativo BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Criar índices
        CREATE INDEX idx_metas_orcamentos_tipo ON metas_orcamentos(tipo);
        CREATE INDEX idx_metas_orcamentos_categoria_id ON metas_orcamentos(categoria_id);
        CREATE INDEX idx_metas_orcamentos_data_inicio ON metas_orcamentos(data_inicio);
        CREATE INDEX idx_metas_orcamentos_data_fim ON metas_orcamentos(data_fim);
        CREATE INDEX idx_metas_orcamentos_ativo ON metas_orcamentos(ativo);
        
        -- Criar trigger para updated_at
        CREATE TRIGGER update_metas_orcamentos_updated_at 
            BEFORE UPDATE ON metas_orcamentos 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Tabela metas_orcamentos criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela metas_orcamentos já existe';
    END IF;
END $$;

-- ========================================
-- DESABILITAR RLS PARA TESTES
-- ========================================
DO $$ 
BEGIN
    -- Desabilitar RLS em todas as tabelas
    ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
    ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;
    ALTER TABLE subcategorias DISABLE ROW LEVEL SECURITY;
    ALTER TABLE investimentos DISABLE ROW LEVEL SECURITY;
    ALTER TABLE contas_bancarias DISABLE ROW LEVEL SECURITY;
    ALTER TABLE cartoes_credito DISABLE ROW LEVEL SECURITY;
    ALTER TABLE contatos DISABLE ROW LEVEL SECURITY;
    ALTER TABLE alertas DISABLE ROW LEVEL SECURITY;
    ALTER TABLE configuracoes_alertas DISABLE ROW LEVEL SECURITY;
    ALTER TABLE integracoes_bancarias DISABLE ROW LEVEL SECURITY;
    ALTER TABLE logs_sincronizacao DISABLE ROW LEVEL SECURITY;
    ALTER TABLE transacoes_importadas DISABLE ROW LEVEL SECURITY;
    ALTER TABLE metas_orcamentos DISABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'RLS desabilitado em todas as tabelas para testes';
END $$;

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================
SELECT 
    'TABELAS CRIADAS' as status,
    table_name as tabela,
    'OK' as resultado
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'transactions',
        'categorias', 
        'subcategorias',
        'investimentos',
        'contas_bancarias',
        'cartoes_credito',
        'contatos',
        'alertas',
        'configuracoes_alertas',
        'integracoes_bancarias',
        'logs_sincronizacao',
        'transacoes_importadas',
        'metas_orcamentos'
    )
ORDER BY table_name;

-- Verificar contagem de registros em cada tabela
SELECT 
    'CONTAGEM DE REGISTROS' as status,
    schemaname || '.' || tablename as tabela,
    n_tup_ins as total_registros
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
    AND tablename IN (
        'transactions',
        'categorias', 
        'subcategorias',
        'investimentos',
        'contas_bancarias',
        'cartoes_credito',
        'contatos',
        'alertas',
        'configuracoes_alertas',
        'integracoes_bancarias',
        'logs_sincronizacao',
        'transacoes_importadas',
        'metas_orcamentos'
    )
ORDER BY tablename;

SELECT 'Script de verificação e criação de tabelas concluído com sucesso!' as resultado;
