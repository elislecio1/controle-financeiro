import { createClient } from '@supabase/supabase-js'

// Configuração do App Frameworks do Supabase
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eshaahpcddqkeevxpgfk.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD',
  
  // Configurações de autenticação
  auth: {
    persistSession: true,
    storageKey: 'controle-financeiro-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  
  // Configurações de realtime
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  
  // Headers globais
  global: {
    headers: {
      'X-Client-Info': 'controle-financeiro-app-frameworks'
    }
  }
}

// Cliente Supabase otimizado para App Frameworks
export const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey,
  {
    auth: supabaseConfig.auth,
    realtime: supabaseConfig.realtime,
    global: supabaseConfig.global
  }
)

// Função para verificar se o App Frameworks está configurado
export const isAppFrameworksConfigured = () => {
  return supabaseConfig.url !== 'https://your-project.supabase.co' && 
         supabaseConfig.anonKey !== 'your-anon-key'
}

// Função para obter configurações
export const getSupabaseConfig = () => {
  return {
    url: supabaseConfig.url,
    anonKey: supabaseConfig.anonKey ? '***' + supabaseConfig.anonKey.slice(-4) : 'Não configurada',
    isConfigured: isAppFrameworksConfigured()
  }
}
