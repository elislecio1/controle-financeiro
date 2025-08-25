// Tipos para sistema SaaS Multi-Tenant

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  subdomain?: string;
  plan: SubscriptionPlan;
  status: 'active' | 'suspended' | 'cancelled' | 'pending';
  settings: TenantSettings;
  limits: TenantLimits;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: PlanFeature[];
  limits: PlanLimits;
  is_active: boolean;
}

export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface PlanLimits {
  users: number;
  transactions_per_month: number;
  storage_mb: number;
  integrations: number;
  api_calls_per_month: number;
  support_level: 'basic' | 'priority' | 'dedicated';
}

export interface TenantSettings {
  branding: {
    logo_url?: string;
    primary_color: string;
    company_name: string;
    support_email: string;
  };
  features: {
    multi_currency: boolean;
    advanced_reports: boolean;
    api_access: boolean;
    custom_integrations: boolean;
    white_label: boolean;
  };
  security: {
    mfa_required: boolean;
    session_timeout_minutes: number;
    ip_whitelist?: string[];
  };
}

export interface TenantLimits {
  current_users: number;
  current_transactions_this_month: number;
  current_storage_mb: number;
  current_api_calls_this_month: number;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  payment_method?: PaymentMethod;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'pix' | 'bank_transfer';
  last4?: string;
  brand?: string;
  expiry_month?: number;
  expiry_year?: number;
}

export interface BillingInfo {
  id: string;
  tenant_id: string;
  company_name: string;
  tax_id: string;
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface UsageMetrics {
  tenant_id: string;
  period: string;
  metrics: {
    users: number;
    transactions: number;
    storage_mb: number;
    api_calls: number;
  };
  created_at: string;
}

export interface ApiKey {
  id: string;
  tenant_id: string;
  name: string;
  key: string;
  permissions: string[];
  last_used?: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

export interface Webhook {
  id: string;
  tenant_id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  last_triggered?: string;
  created_at: string;
}
