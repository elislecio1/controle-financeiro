-- =====================================================
-- IMPLEMENTAÇÃO DE SISTEMA DE EMPRESAS (MULTI-TENANT)
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- Este script cria a estrutura necessária para SaaS empresarial

-- =====================================================
-- 1. TABELA DE EMPRESAS
-- =====================================================
CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    razao_social TEXT,
    email TEXT,
    telefone TEXT,
    endereco JSONB DEFAULT '{}',
    configuracoes JSONB DEFAULT '{}',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. TABELA DE RELACIONAMENTO USUÁRIO-EMPRESA
-- =====================================================
CREATE TABLE IF NOT EXISTS empresa_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    ativo BOOLEAN DEFAULT true,
    convite_token TEXT,
    convite_expira_em TIMESTAMP WITH TIME ZONE,
    aceito_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(empresa_id, user_id)
);

-- =====================================================
-- 3. ADICIONAR empresa_id NAS TABELAS PRINCIPAIS
-- =====================================================

-- Transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- Contas Bancárias
ALTER TABLE contas_bancarias 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- Categorias
ALTER TABLE categorias 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- Subcategorias
ALTER TABLE subcategorias 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- Centros de Custo
ALTER TABLE centros_custo 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- Contatos
ALTER TABLE contatos 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- Metas
ALTER TABLE metas 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- Orçamentos
ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- Investimentos
ALTER TABLE investimentos 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- Cartões de Crédito
ALTER TABLE cartoes_credito 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- =====================================================
-- 4. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Empresas
CREATE INDEX IF NOT EXISTS idx_empresas_ativo ON empresas(ativo);
CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON empresas(cnpj) WHERE cnpj IS NOT NULL;

-- Empresa Usuários
CREATE INDEX IF NOT EXISTS idx_empresa_usuarios_user_id ON empresa_usuarios(user_id);
CREATE INDEX IF NOT EXISTS idx_empresa_usuarios_empresa_id ON empresa_usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_empresa_usuarios_ativo ON empresa_usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_empresa_usuarios_convite_token ON empresa_usuarios(convite_token) WHERE convite_token IS NOT NULL;

-- Transactions
CREATE INDEX IF NOT EXISTS idx_transactions_empresa_id ON transactions(empresa_id);
CREATE INDEX IF NOT EXISTS idx_transactions_empresa_data ON transactions(empresa_id, data);

-- Contas Bancárias
CREATE INDEX IF NOT EXISTS idx_contas_bancarias_empresa_id ON contas_bancarias(empresa_id);

-- Categorias
CREATE INDEX IF NOT EXISTS idx_categorias_empresa_id ON categorias(empresa_id);

-- Subcategorias
CREATE INDEX IF NOT EXISTS idx_subcategorias_empresa_id ON subcategorias(empresa_id);

-- Centros de Custo
CREATE INDEX IF NOT EXISTS idx_centros_custo_empresa_id ON centros_custo(empresa_id);

-- Contatos
CREATE INDEX IF NOT EXISTS idx_contatos_empresa_id ON contatos(empresa_id);

-- Metas
CREATE INDEX IF NOT EXISTS idx_metas_empresa_id ON metas(empresa_id);

-- Orçamentos
CREATE INDEX IF NOT EXISTS idx_orcamentos_empresa_id ON orcamentos(empresa_id);

-- Investimentos
CREATE INDEX IF NOT EXISTS idx_investimentos_empresa_id ON investimentos(empresa_id);

-- Cartões de Crédito
CREATE INDEX IF NOT EXISTS idx_cartoes_credito_empresa_id ON cartoes_credito(empresa_id);

-- =====================================================
-- 5. HABILITAR RLS
-- =====================================================
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa_usuarios ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. POLÍTICAS RLS PARA EMPRESAS
-- =====================================================

-- Usuários podem ver empresas que pertencem
CREATE POLICY "Users can view their companies" ON empresas
    FOR SELECT
    USING (
        id IN (
            SELECT empresa_id FROM empresa_usuarios
            WHERE user_id = auth.uid() AND ativo = true
        )
    );

-- Admins podem criar empresas
CREATE POLICY "Users can create companies" ON empresas
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Admins da empresa podem atualizar
CREATE POLICY "Company admins can update companies" ON empresas
    FOR UPDATE
    USING (
        id IN (
            SELECT empresa_id FROM empresa_usuarios
            WHERE user_id = auth.uid() 
            AND role = 'admin' 
            AND ativo = true
        )
    );

-- =====================================================
-- 7. POLÍTICAS RLS PARA EMPRESA_USUARIOS
-- =====================================================

-- Usuários podem ver seus próprios vínculos
CREATE POLICY "Users can view their company memberships" ON empresa_usuarios
    FOR SELECT
    USING (user_id = auth.uid());

-- Admins podem ver todos os vínculos da empresa
CREATE POLICY "Company admins can view all memberships" ON empresa_usuarios
    FOR SELECT
    USING (
        empresa_id IN (
            SELECT empresa_id FROM empresa_usuarios
            WHERE user_id = auth.uid() 
            AND role = 'admin' 
            AND ativo = true
        )
    );

-- Admins podem criar vínculos
CREATE POLICY "Company admins can add users" ON empresa_usuarios
    FOR INSERT
    WITH CHECK (
        empresa_id IN (
            SELECT empresa_id FROM empresa_usuarios
            WHERE user_id = auth.uid() 
            AND role = 'admin' 
            AND ativo = true
        )
    );

-- Admins podem atualizar vínculos
CREATE POLICY "Company admins can update memberships" ON empresa_usuarios
    FOR UPDATE
    USING (
        empresa_id IN (
            SELECT empresa_id FROM empresa_usuarios
            WHERE user_id = auth.uid() 
            AND role = 'admin' 
            AND ativo = true
        )
    );

-- Admins podem remover vínculos
CREATE POLICY "Company admins can remove users" ON empresa_usuarios
    FOR DELETE
    USING (
        empresa_id IN (
            SELECT empresa_id FROM empresa_usuarios
            WHERE user_id = auth.uid() 
            AND role = 'admin' 
            AND ativo = true
        )
    );

-- =====================================================
-- 8. ATUALIZAR POLÍTICAS RLS EXISTENTES
-- =====================================================

-- Transactions: Usuários veem apenas transações de suas empresas
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view transactions from their companies" ON transactions
    FOR SELECT
    USING (
        empresa_id IN (
            SELECT empresa_id FROM empresa_usuarios
            WHERE user_id = auth.uid() AND ativo = true
        )
    );

DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
CREATE POLICY "Users can insert transactions in their companies" ON transactions
    FOR INSERT
    WITH CHECK (
        empresa_id IN (
            SELECT empresa_id FROM empresa_usuarios
            WHERE user_id = auth.uid() AND ativo = true
        )
    );

DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
CREATE POLICY "Users can update transactions in their companies" ON transactions
    FOR UPDATE
    USING (
        empresa_id IN (
            SELECT empresa_id FROM empresa_usuarios
            WHERE user_id = auth.uid() AND ativo = true
        )
    );

DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;
CREATE POLICY "Users can delete transactions in their companies" ON transactions
    FOR DELETE
    USING (
        empresa_id IN (
            SELECT empresa_id FROM empresa_usuarios
            WHERE user_id = auth.uid() AND ativo = true
        )
    );

-- Contas Bancárias
DROP POLICY IF EXISTS "Users can view their own accounts" ON contas_bancarias;
CREATE POLICY "Users can view accounts from their companies" ON contas_bancarias
    FOR SELECT
    USING (
        empresa_id IN (
            SELECT empresa_id FROM empresa_usuarios
            WHERE user_id = auth.uid() AND ativo = true
        )
    );

-- Similar para todas as outras tabelas...

-- =====================================================
-- 9. FUNÇÕES ÚTEIS
-- =====================================================

-- Função para obter empresas do usuário
CREATE OR REPLACE FUNCTION get_user_companies(user_uuid UUID)
RETURNS TABLE (
    empresa_id UUID,
    empresa_nome TEXT,
    role TEXT,
    ativo BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.nome,
        eu.role,
        eu.ativo
    FROM empresas e
    INNER JOIN empresa_usuarios eu ON e.id = eu.empresa_id
    WHERE eu.user_id = user_uuid
    AND e.ativo = true
    AND eu.ativo = true
    ORDER BY e.nome;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário pertence à empresa
CREATE OR REPLACE FUNCTION user_belongs_to_company(user_uuid UUID, company_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM empresa_usuarios
        WHERE user_id = user_uuid
        AND empresa_id = company_uuid
        AND ativo = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter role do usuário na empresa
CREATE OR REPLACE FUNCTION get_user_company_role(user_uuid UUID, company_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM empresa_usuarios
    WHERE user_id = user_uuid
    AND empresa_id = company_uuid
    AND ativo = true;
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_empresas_updated_at
    BEFORE UPDATE ON empresas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_empresa_usuarios_updated_at
    BEFORE UPDATE ON empresa_usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 11. VERIFICAÇÃO
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('empresas', 'empresa_usuarios')
ORDER BY table_name, ordinal_position;

-- Verificar índices
SELECT 
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('empresas', 'empresa_usuarios', 'transactions', 'contas_bancarias')
ORDER BY tablename, indexname;
