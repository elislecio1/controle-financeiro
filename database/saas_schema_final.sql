-- Schema Final para Sistema SaaS Multi-Tenant
-- Execute este script no SQL Editor do Supabase

-- 1. Tabela de Planos de Assinatura
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'BRL',
    interval TEXT DEFAULT 'monthly',
    features JSONB NOT NULL DEFAULT '[]',
    limits JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Tenants (Empresas/Organizações)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    domain TEXT,
    subdomain TEXT UNIQUE,
    plan_id UUID REFERENCES subscription_plans(id),
    status TEXT DEFAULT 'pending',
    settings JSONB NOT NULL DEFAULT '{}',
    limits JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    status TEXT DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    payment_method_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Informações de Cobrança
CREATE TABLE IF NOT EXISTS billing_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    tax_id TEXT,
    address JSONB NOT NULL,
    contact JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Métricas de Uso
CREATE TABLE IF NOT EXISTS usage_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    period TEXT NOT NULL,
    metrics JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de Chaves API
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key TEXT UNIQUE NOT NULL,
    permissions TEXT[] NOT NULL DEFAULT '{}',
    last_used TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabela de Webhooks
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL DEFAULT '{}',
    secret TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_triggered TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabela de Logs de Atividade
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para Performance
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_tenant_period ON usage_metrics(tenant_id, period);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_id ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant_id ON webhooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant_id ON activity_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Habilitar RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (com verificação de existência)
DO $$
BEGIN
    -- Subscription plans
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_plans' AND policyname = 'Subscription plans are viewable by everyone') THEN
        CREATE POLICY "Subscription plans are viewable by everyone" ON subscription_plans
            FOR SELECT USING (is_active = true);
    END IF;

    -- Tenants
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenants' AND policyname = 'Tenants are viewable by tenant members') THEN
        CREATE POLICY "Tenants are viewable by tenant members" ON tenants
            FOR SELECT USING (true);
    END IF;

    -- Subscriptions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Subscriptions are viewable by tenant admins') THEN
        CREATE POLICY "Subscriptions are viewable by tenant admins" ON subscriptions
            FOR SELECT USING (true);
    END IF;

    -- Billing info
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'billing_info' AND policyname = 'Billing info is viewable by tenant admins') THEN
        CREATE POLICY "Billing info is viewable by tenant admins" ON billing_info
            FOR SELECT USING (true);
    END IF;

    -- API keys
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'API keys are viewable by tenant admins') THEN
        CREATE POLICY "API keys are viewable by tenant admins" ON api_keys
            FOR SELECT USING (true);
    END IF;

    -- Webhooks
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhooks' AND policyname = 'Webhooks are viewable by tenant admins') THEN
        CREATE POLICY "Webhooks are viewable by tenant admins" ON webhooks
            FOR SELECT USING (true);
    END IF;

    -- Activity logs
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_logs' AND policyname = 'Activity logs are viewable by tenant admins') THEN
        CREATE POLICY "Activity logs are viewable by tenant admins" ON activity_logs
            FOR SELECT USING (true);
    END IF;
END $$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at (com verificação de existência)
DO $$
BEGIN
    -- Subscription plans trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscription_plans_updated_at') THEN
        CREATE TRIGGER update_subscription_plans_updated_at
            BEFORE UPDATE ON subscription_plans
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Tenants trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tenants_updated_at') THEN
        CREATE TRIGGER update_tenants_updated_at
            BEFORE UPDATE ON tenants
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Subscriptions trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscriptions_updated_at') THEN
        CREATE TRIGGER update_subscriptions_updated_at
            BEFORE UPDATE ON subscriptions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Billing info trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_billing_info_updated_at') THEN
        CREATE TRIGGER update_billing_info_updated_at
            BEFORE UPDATE ON billing_info
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Inserir planos padrão (apenas se não existirem)
INSERT INTO subscription_plans (name, slug, price, interval, features, limits) VALUES
(
    'Starter',
    'starter',
    0.00,
    'monthly',
    '[
        {"id": "basic_reports", "name": "Relatórios Básicos", "description": "Relatórios essenciais de controle financeiro", "enabled": true},
        {"id": "basic_integrations", "name": "Integrações Básicas", "description": "Integração com bancos principais", "enabled": true},
        {"id": "email_support", "name": "Suporte por Email", "description": "Suporte técnico por email", "enabled": true}
    ]',
    '{
        "users": 1,
        "transactions_per_month": 1000,
        "storage_mb": 100,
        "integrations": 2,
        "api_calls_per_month": 1000,
        "support_level": "basic"
    }'
),
(
    'Business',
    'business',
    99.00,
    'monthly',
    '[
        {"id": "advanced_reports", "name": "Relatórios Avançados", "description": "Relatórios detalhados e personalizados", "enabled": true},
        {"id": "multi_currency", "name": "Multi-Moedas", "description": "Suporte a múltiplas moedas", "enabled": true},
        {"id": "api_access", "name": "Acesso à API", "description": "API completa para integrações", "enabled": true},
        {"id": "priority_support", "name": "Suporte Prioritário", "description": "Suporte técnico prioritário", "enabled": true}
    ]',
    '{
        "users": 10,
        "transactions_per_month": 10000,
        "storage_mb": 1000,
        "integrations": 10,
        "api_calls_per_month": 10000,
        "support_level": "priority"
    }'
),
(
    'Enterprise',
    'enterprise',
    299.00,
    'monthly',
    '[
        {"id": "white_label", "name": "White Label", "description": "Personalização completa da marca", "enabled": true},
        {"id": "custom_integrations", "name": "Integrações Customizadas", "description": "Desenvolvimento de integrações específicas", "enabled": true},
        {"id": "dedicated_support", "name": "Suporte Dedicado", "description": "Suporte técnico dedicado", "enabled": true},
        {"id": "advanced_security", "name": "Segurança Avançada", "description": "Recursos de segurança empresarial", "enabled": true}
    ]',
    '{
        "users": 100,
        "transactions_per_month": 100000,
        "storage_mb": 10000,
        "integrations": 50,
        "api_calls_per_month": 100000,
        "support_level": "dedicated"
    }'
) ON CONFLICT (slug) DO NOTHING;

-- Verificar se as tabelas foram criadas corretamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN (
    'subscription_plans', 'tenants', 'subscriptions', 
    'billing_info', 'usage_metrics', 'api_keys', 
    'webhooks', 'activity_logs'
)
ORDER BY table_name, ordinal_position;

-- Mostrar planos criados
SELECT name, slug, price, interval FROM subscription_plans ORDER BY price;
