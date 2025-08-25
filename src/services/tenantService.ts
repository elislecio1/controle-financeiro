import { supabase } from './supabase';
import { 
  Tenant, 
  SubscriptionPlan, 
  TenantSettings, 
  TenantLimits,
  Subscription,
  BillingInfo,
  UsageMetrics,
  ApiKey,
  Webhook
} from '../types/saas';

class TenantService {
  // Obter tenant atual baseado no domínio/subdomínio
  async getCurrentTenant(): Promise<Tenant | null> {
    try {
      const hostname = window.location.hostname;
      const subdomain = this.extractSubdomain(hostname);
      
      if (!subdomain) {
        return null;
      }

      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('subdomain', subdomain)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('❌ Erro ao obter tenant:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao obter tenant atual:', error);
      return null;
    }
  }

  // Extrair subdomínio do hostname
  private extractSubdomain(hostname: string): string | null {
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      return parts[0];
    }
    return null;
  }

  // Criar novo tenant
  async createTenant(tenantData: {
    name: string;
    slug: string;
    subdomain: string;
    plan_id: string;
    settings: Partial<TenantSettings>;
  }): Promise<Tenant | null> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .insert({
          name: tenantData.name,
          slug: tenantData.slug,
          subdomain: tenantData.subdomain,
          plan_id: tenantData.plan_id,
          status: 'pending',
          settings: {
            branding: {
              primary_color: '#3182CE',
              company_name: tenantData.name,
              support_email: `support@${tenantData.subdomain}.${this.getMainDomain()}`
            },
            features: {
              multi_currency: false,
              advanced_reports: false,
              api_access: false,
              custom_integrations: false,
              white_label: false
            },
            security: {
              mfa_required: false,
              session_timeout_minutes: 60
            },
            ...tenantData.settings
          },
          limits: {
            current_users: 0,
            current_transactions_this_month: 0,
            current_storage_mb: 0,
            current_api_calls_this_month: 0
          }
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar tenant:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao criar tenant:', error);
      return null;
    }
  }

  // Obter domínio principal
  private getMainDomain(): string {
    return process.env.NODE_ENV === 'production' 
      ? 'controlefinanceiro.com.br' 
      : 'localhost:3000';
  }

  // Atualizar configurações do tenant
  async updateTenantSettings(tenantId: string, settings: Partial<TenantSettings>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ 
          settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (error) {
        console.error('❌ Erro ao atualizar configurações:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar configurações:', error);
      return false;
    }
  }

  // Verificar limites do tenant
  async checkTenantLimits(tenantId: string): Promise<{
    within_limits: boolean;
    limits: TenantLimits;
    exceeded_features: string[];
  }> {
    try {
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('id', tenantId)
        .single();

      if (error || !tenant) {
        return {
          within_limits: false,
          limits: tenant?.limits || {
            current_users: 0,
            current_transactions_this_month: 0,
            current_storage_mb: 0,
            current_api_calls_this_month: 0
          },
          exceeded_features: ['tenant_not_found']
        };
      }

      const exceeded_features: string[] = [];
      const limits = tenant.limits;
      const plan_limits = tenant.plan.limits;

      if (limits.current_users >= plan_limits.users) {
        exceeded_features.push('users');
      }

      if (limits.current_transactions_this_month >= plan_limits.transactions_per_month) {
        exceeded_features.push('transactions');
      }

      if (limits.current_storage_mb >= plan_limits.storage_mb) {
        exceeded_features.push('storage');
      }

      if (limits.current_api_calls_this_month >= plan_limits.api_calls_per_month) {
        exceeded_features.push('api_calls');
      }

      return {
        within_limits: exceeded_features.length === 0,
        limits,
        exceeded_features
      };
    } catch (error) {
      console.error('❌ Erro ao verificar limites:', error);
      return {
        within_limits: false,
        limits: {
          current_users: 0,
          current_transactions_this_month: 0,
          current_storage_mb: 0,
          current_api_calls_this_month: 0
        },
        exceeded_features: ['error_checking_limits']
      };
    }
  }

  // Incrementar métricas de uso
  async incrementUsage(tenantId: string, metric: keyof TenantLimits, value: number = 1): Promise<boolean> {
    try {
      // Buscar limites atuais
      const { data: currentTenant, error: fetchError } = await supabase
        .from('tenants')
        .select('limits')
        .eq('id', tenantId)
        .single();

      if (fetchError) {
        console.error('❌ Erro ao buscar tenant:', fetchError);
        return false;
      }

      // Atualizar limites
      const currentLimits = currentTenant?.limits || {};
      const newValue = (currentLimits[metric] || 0) + value;
      const updatedLimits = { ...currentLimits, [metric]: newValue };

      const { error } = await supabase
        .from('tenants')
        .update({
          limits: updatedLimits,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (error) {
        console.error('❌ Erro ao incrementar uso:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao incrementar uso:', error);
      return false;
    }
  }

  // Obter planos disponíveis
  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (error) {
        console.error('❌ Erro ao obter planos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erro ao obter planos:', error);
      return [];
    }
  }

  // Criar assinatura
  async createSubscription(subscriptionData: {
    tenant_id: string;
    plan_id: string;
    payment_method_id?: string;
  }): Promise<Subscription | null> {
    try {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          tenant_id: subscriptionData.tenant_id,
          plan_id: subscriptionData.plan_id,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          payment_method_id: subscriptionData.payment_method_id
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar assinatura:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao criar assinatura:', error);
      return null;
    }
  }

  // Obter informações de cobrança
  async getBillingInfo(tenantId: string): Promise<BillingInfo | null> {
    try {
      const { data, error } = await supabase
        .from('billing_info')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (error) {
        console.error('❌ Erro ao obter informações de cobrança:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao obter informações de cobrança:', error);
      return null;
    }
  }

  // Atualizar informações de cobrança
  async updateBillingInfo(tenantId: string, billingData: Partial<BillingInfo>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('billing_info')
        .upsert({
          tenant_id: tenantId,
          ...billingData,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Erro ao atualizar informações de cobrança:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar informações de cobrança:', error);
      return false;
    }
  }

  // Gerar chave API
  async generateApiKey(tenantId: string, name: string, permissions: string[]): Promise<ApiKey | null> {
    try {
      const key = this.generateSecureKey();
      
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          tenant_id: tenantId,
          name,
          key,
          permissions,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao gerar chave API:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao gerar chave API:', error);
      return null;
    }
  }

  // Gerar chave segura
  private generateSecureKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Criar webhook
  async createWebhook(tenantId: string, webhookData: {
    name: string;
    url: string;
    events: string[];
  }): Promise<Webhook | null> {
    try {
      const secret = this.generateSecureKey();
      
      const { data, error } = await supabase
        .from('webhooks')
        .insert({
          tenant_id: tenantId,
          name: webhookData.name,
          url: webhookData.url,
          events: webhookData.events,
          secret,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar webhook:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao criar webhook:', error);
      return null;
    }
  }
}

export const tenantService = new TenantService();
