import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tenant, SubscriptionPlan } from '../types/saas';
import { tenantService } from '../services/tenantService';

interface TenantContextType {
  currentTenant: Tenant | null;
  isLoading: boolean;
  error: string | null;
  refreshTenant: () => Promise<void>;
  updateTenantSettings: (settings: any) => Promise<boolean>;
  checkLimits: () => Promise<{
    within_limits: boolean;
    limits: any;
    exceeded_features: string[];
  }>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCurrentTenant = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const tenant = await tenantService.getCurrentTenant();
      setCurrentTenant(tenant);
      
      if (!tenant) {
        setError('Tenant não encontrado ou inativo');
      }
    } catch (err) {
      console.error('❌ Erro ao carregar tenant:', err);
      setError('Erro ao carregar informações do tenant');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTenant = async () => {
    await loadCurrentTenant();
  };

  const updateTenantSettings = async (settings: any): Promise<boolean> => {
    if (!currentTenant) return false;
    
    try {
      const success = await tenantService.updateTenantSettings(currentTenant.id, settings);
      if (success) {
        await refreshTenant();
      }
      return success;
    } catch (err) {
      console.error('❌ Erro ao atualizar configurações:', err);
      return false;
    }
  };

  const checkLimits = async () => {
    if (!currentTenant) {
      return {
        within_limits: false,
        limits: null,
        exceeded_features: ['no_tenant']
      };
    }

    try {
      return await tenantService.checkTenantLimits(currentTenant.id);
    } catch (err) {
      console.error('❌ Erro ao verificar limites:', err);
      return {
        within_limits: false,
        limits: null,
        exceeded_features: ['error_checking_limits']
      };
    }
  };

  useEffect(() => {
    loadCurrentTenant();
  }, []);

  const value: TenantContextType = {
    currentTenant,
    isLoading,
    error,
    refreshTenant,
    updateTenantSettings,
    checkLimits
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant deve ser usado dentro de um TenantProvider');
  }
  return context;
};
