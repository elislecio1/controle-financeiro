import { createClient, AuthError as SupabaseAuthError, User as SupabaseUser, Session } from '@supabase/supabase-js'
import { 
  User, 
  UserProfile, 
  AuthState, 
  LoginCredentials, 
  RegisterCredentials, 
  ResetPasswordRequest,
  UpdatePasswordRequest,
  AuthError,
  UserPreferences
} from '../types'

// Configurações do Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Cliente Supabase para autenticação
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storageKey: 'controle-financeiro-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

class AuthService {
  private authState: AuthState = {
    user: null,
    profile: null,
    loading: true,
    error: null,
    isAuthenticated: false
  }

  private listeners: Array<(state: AuthState) => void> = []

  constructor() {
    this.initialize()
  }

  // Inicializar serviço de autenticação
  private async initialize() {
    try {
      // Verificar sessão atual
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Erro ao obter sessão:', error)
        this.updateAuthState({ 
          loading: false, 
          error: this.formatError(error).message 
        })
        return
      }

      if (session?.user) {
        await this.handleUserSession(session.user)
      } else {
        this.updateAuthState({ 
          loading: false, 
          isAuthenticated: false 
        })
      }

      // Escutar mudanças de autenticação
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event)
        
        if (event === 'SIGNED_IN' && session?.user) {
          await this.handleUserSession(session.user)
        } else if (event === 'SIGNED_OUT') {
          this.handleSignOut()
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          await this.handleUserSession(session.user)
        }
      })
    } catch (error) {
      console.error('Erro na inicialização da autenticação:', error)
      this.updateAuthState({ 
        loading: false, 
        error: 'Erro ao inicializar sistema de autenticação' 
      })
    }
  }

  // Gerenciar sessão do usuário
  private async handleUserSession(supabaseUser: SupabaseUser) {
    try {
      const user = this.mapSupabaseUser(supabaseUser)
      const profile = await this.getUserProfile(user.id)
      
      // Verificar se o usuário tem permissão para acessar o sistema
      if (profile) {
        const hasPermission = await this.checkUserLoginPermission(user.email)
        if (!hasPermission) {
          console.error('❌ Usuário sem permissão de acesso:', user.email)
          await this.signOut()
          this.updateAuthState({
            user: null,
            profile: null,
            loading: false,
            error: 'Acesso negado. Entre em contato com o administrador.',
            isAuthenticated: false
          })
          return
        }
      }
      
      this.updateAuthState({
        user,
        profile,
        loading: false,
        error: null,
        isAuthenticated: true
      })
    } catch (error) {
      console.error('Erro ao processar sessão do usuário:', error)
      this.updateAuthState({ 
        loading: false, 
        error: 'Erro ao carregar dados do usuário' 
      })
    }
  }

  // Gerenciar logout
  private handleSignOut() {
    this.updateAuthState({
      user: null,
      profile: null,
      loading: false,
      error: null,
      isAuthenticated: false
    })
  }

  // Mapear usuário do Supabase para nosso tipo
  private mapSupabaseUser(supabaseUser: SupabaseUser): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name,
      avatar_url: supabaseUser.user_metadata?.avatar_url,
      role: 'user', // Padrão, será atualizado pelo perfil
      created_at: supabaseUser.created_at,
      updated_at: supabaseUser.updated_at || supabaseUser.created_at,
      last_sign_in_at: supabaseUser.last_sign_in_at,
      email_confirmed_at: supabaseUser.email_confirmed_at
    }
  }

  // Atualizar estado de autenticação
  private updateAuthState(updates: Partial<AuthState>) {
    this.authState = { ...this.authState, ...updates }
    this.notifyListeners()
  }

  // Notificar ouvintes sobre mudanças
  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.authState }))
  }

  // Formatar erro
  private formatError(error: SupabaseAuthError | Error): AuthError {
    if ('status' in error) {
      return {
        message: error.message,
        status: error.status,
        code: (error as any).code
      }
    }
    return {
      message: error.message
    }
  }

  // Verificar permissão de login do usuário
  private async checkUserLoginPermission(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('check_user_login_permission', { user_email: email })

      if (error) {
        console.error('Erro ao verificar permissão de login:', error)
        return false
      }

      if (data && data.length > 0) {
        const permission = data[0]
        console.log('🔐 Verificação de permissão:', permission)
        return permission.can_login
      }

      return false
    } catch (error) {
      console.error('Erro ao verificar permissão de login:', error)
      return false
    }
  }

  // ============ MÉTODOS PÚBLICOS ============

  // Obter estado atual
  getAuthState(): AuthState {
    return { ...this.authState }
  }

  // Subscrever a mudanças
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener)
    
    // Retornar função de unsubscribe
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // Login com email e senha
  async signIn(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateAuthState({ loading: true, error: null })

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (error) {
        const authError = this.formatError(error)
        this.updateAuthState({ loading: false, error: authError.message })
        return { success: false, error: authError.message }
      }

      // A sessão será tratada pelo onAuthStateChange
      return { success: true }
    } catch (error) {
      const errorMsg = 'Erro inesperado ao fazer login'
      this.updateAuthState({ loading: false, error: errorMsg })
      return { success: false, error: errorMsg }
    }
  }

  // Login com Google
  async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateAuthState({ loading: true, error: null })

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        const authError = this.formatError(error)
        this.updateAuthState({ loading: false, error: authError.message })
        return { success: false, error: authError.message }
      }

      return { success: true }
    } catch (error) {
      const errorMsg = 'Erro ao conectar com Google'
      this.updateAuthState({ loading: false, error: errorMsg })
      return { success: false, error: errorMsg }
    }
  }

  // Registro de novo usuário
  async signUp(credentials: RegisterCredentials): Promise<{ success: boolean; error?: string }> {
    try {
      if (credentials.password !== credentials.confirmPassword) {
        return { success: false, error: 'As senhas não coincidem' }
      }

      if (credentials.password.length < 6) {
        return { success: false, error: 'A senha deve ter pelo menos 6 caracteres' }
      }

      this.updateAuthState({ loading: true, error: null })

      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            name: credentials.name,
            full_name: credentials.name
          }
        }
      })

      if (error) {
        const authError = this.formatError(error)
        this.updateAuthState({ loading: false, error: authError.message })
        return { success: false, error: authError.message }
      }

      if (data.user && !data.session) {
        // Usuário criado, mas precisa confirmar email
        this.updateAuthState({ loading: false })
        return { 
          success: true, 
          error: 'Conta criada! Verifique seu email para ativar a conta.' 
        }
      }

      return { success: true }
    } catch (error) {
      const errorMsg = 'Erro inesperado ao criar conta'
      this.updateAuthState({ loading: false, error: errorMsg })
      return { success: false, error: errorMsg }
    }
  }

  // Logout
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateAuthState({ loading: true })

      const { error } = await supabase.auth.signOut()

      if (error) {
        const authError = this.formatError(error)
        this.updateAuthState({ loading: false, error: authError.message })
        return { success: false, error: authError.message }
      }

      return { success: true }
    } catch (error) {
      const errorMsg = 'Erro ao fazer logout'
      this.updateAuthState({ loading: false, error: errorMsg })
      return { success: false, error: errorMsg }
    }
  }

  // Recuperar senha
  async resetPassword(request: ResetPasswordRequest): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateAuthState({ loading: true, error: null })

      const { error } = await supabase.auth.resetPasswordForEmail(request.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      this.updateAuthState({ loading: false })

      if (error) {
        const authError = this.formatError(error)
        return { success: false, error: authError.message }
      }

      return { 
        success: true, 
        error: 'Email de recuperação enviado! Verifique sua caixa de entrada.' 
      }
    } catch (error) {
      this.updateAuthState({ loading: false })
      return { success: false, error: 'Erro ao enviar email de recuperação' }
    }
  }

  // Atualizar senha
  async updatePassword(request: UpdatePasswordRequest): Promise<{ success: boolean; error?: string }> {
    try {
      if (request.newPassword !== request.confirmPassword) {
        return { success: false, error: 'As senhas não coincidem' }
      }

      if (request.newPassword.length < 6) {
        return { success: false, error: 'A nova senha deve ter pelo menos 6 caracteres' }
      }

      this.updateAuthState({ loading: true, error: null })

      const { error } = await supabase.auth.updateUser({
        password: request.newPassword
      })

      this.updateAuthState({ loading: false })

      if (error) {
        const authError = this.formatError(error)
        return { success: false, error: authError.message }
      }

      return { success: true }
    } catch (error) {
      this.updateAuthState({ loading: false })
      return { success: false, error: 'Erro ao atualizar senha' }
    }
  }

  // Obter perfil do usuário
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Perfil não encontrado, criar um padrão
          return await this.createDefaultProfile(userId)
        }
        console.error('Erro ao buscar perfil:', error)
        return null
      }

      return {
        ...data,
        preferences: typeof data.preferences === 'string' 
          ? JSON.parse(data.preferences) 
          : data.preferences
      }
    } catch (error) {
      console.error('Erro ao obter perfil do usuário:', error)
      return null
    }
  }

  // Criar perfil padrão
  private async createDefaultProfile(userId: string): Promise<UserProfile> {
    const defaultPreferences: UserPreferences = {
      theme: 'light',
      currency: 'BRL',
      date_format: 'DD/MM/YYYY',
      language: 'pt-BR',
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      dashboard: {
        default_period: 'current_month',
        show_charts: true,
        show_stats: true
      }
    }

    const profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      name: this.authState.user?.name || 'Usuário',
      avatar_url: this.authState.user?.avatar_url,
      role: 'user',
      preferences: defaultPreferences
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profile)
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar perfil padrão:', error)
      throw error
    }

    return {
      ...data,
      preferences: defaultPreferences
    }
  }

  // Atualizar perfil
  async updateProfile(updates: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.authState.user) {
        return { success: false, error: 'Usuário não autenticado' }
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          preferences: updates.preferences ? JSON.stringify(updates.preferences) : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', this.authState.user.id)

      if (error) {
        console.error('Erro ao atualizar perfil:', error)
        return { success: false, error: 'Erro ao atualizar perfil' }
      }

      // Recarregar perfil
      const updatedProfile = await this.getUserProfile(this.authState.user.id)
      if (updatedProfile) {
        this.updateAuthState({ profile: updatedProfile })
      }

      return { success: true }
    } catch (error) {
      console.error('Erro inesperado ao atualizar perfil:', error)
      return { success: false, error: 'Erro inesperado ao atualizar perfil' }
    }
  }

  // Obter cliente Supabase
  getSupabaseClient() {
    return supabase
  }
}

// Instância singleton do serviço de autenticação
export const authService = new AuthService()
export default authService
