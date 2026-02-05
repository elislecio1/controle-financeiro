import { supabase } from './supabase'
import { Empresa, EmpresaUsuario, RoleEmpresa } from '../types'

class EmpresaService {
  /**
   * Buscar todas as empresas do usuário autenticado
   */
  async getEmpresasDoUsuario(): Promise<Empresa[]> {
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session?.user) {
        throw new Error('Usuário não autenticado')
      }

      // Buscar empresas através da tabela empresa_usuarios
      const { data, error } = await supabase
        .from('empresa_usuarios')
        .select(`
          empresa:empresas(*)
        `)
        .eq('user_id', session.user.id)
        .eq('ativo', true)

      if (error) {
        console.error('❌ Erro ao buscar empresas do usuário:', error)
        throw new Error(`Erro ao buscar empresas: ${error.message}`)
      }

      // Extrair empresas do resultado
      const empresas: Empresa[] = (data || [])
        .map((item: any) => item.empresa)
        .filter((empresa: any) => empresa && empresa.ativo !== false)
        .map((empresa: any) => ({
          id: empresa.id,
          nome: empresa.nome,
          cnpj: empresa.cnpj,
          razao_social: empresa.razao_social,
          email: empresa.email,
          telefone: empresa.telefone,
          endereco: empresa.endereco || {},
          configuracoes: empresa.configuracoes || {},
          ativo: empresa.ativo !== false,
          created_at: empresa.created_at,
          updated_at: empresa.updated_at
        }))

      console.log(`✅ Empresas do usuário carregadas: ${empresas.length}`)
      return empresas
    } catch (error: any) {
      console.error('❌ Erro ao buscar empresas do usuário:', error)
      throw error
    }
  }

  /**
   * Buscar empresa por ID (com validação de acesso)
   */
  async getEmpresaPorId(empresaId: string): Promise<Empresa | null> {
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session?.user) {
        throw new Error('Usuário não autenticado')
      }

      // Verificar se o usuário tem acesso à empresa
      const { data: acesso, error: acessoError } = await supabase
        .from('empresa_usuarios')
        .select('empresa_id')
        .eq('user_id', session.user.id)
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .single()

      if (acessoError || !acesso) {
        console.warn('⚠️ Usuário não tem acesso à empresa:', empresaId)
        return null
      }

      // Buscar dados da empresa
      const { data: empresa, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', empresaId)
        .eq('ativo', true)
        .single()

      if (error) {
        console.error('❌ Erro ao buscar empresa:', error)
        return null
      }

      return {
        id: empresa.id,
        nome: empresa.nome,
        cnpj: empresa.cnpj,
        razao_social: empresa.razao_social,
        email: empresa.email,
        telefone: empresa.telefone,
        endereco: empresa.endereco || {},
        configuracoes: empresa.configuracoes || {},
        ativo: empresa.ativo !== false,
        created_at: empresa.created_at,
        updated_at: empresa.updated_at
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar empresa:', error)
      return null
    }
  }

  /**
   * Criar nova empresa e associar usuário como admin
   */
  async createEmpresa(dados: {
    nome: string
    cnpj?: string
    razao_social?: string
    email?: string
    telefone?: string
    endereco?: Record<string, any>
  }): Promise<{ success: boolean; empresa?: Empresa; error?: string }> {
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session?.user) {
        return { success: false, error: 'Usuário não autenticado' }
      }

      // Criar empresa
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .insert({
          nome: dados.nome,
          cnpj: dados.cnpj,
          razao_social: dados.razao_social,
          email: dados.email,
          telefone: dados.telefone,
          endereco: dados.endereco || {},
          ativo: true
        })
        .select()
        .single()

      if (empresaError || !empresa) {
        console.error('❌ Erro ao criar empresa:', empresaError)
        return { success: false, error: empresaError?.message || 'Erro ao criar empresa' }
      }

      // Associar usuário como admin
      const { error: vínculoError } = await supabase
        .from('empresa_usuarios')
        .insert({
          empresa_id: empresa.id,
          user_id: session.user.id,
          role: 'admin',
          ativo: true,
          aceito_em: new Date().toISOString()
        })

      if (vínculoError) {
        console.error('❌ Erro ao associar usuário à empresa:', vínculoError)
        // Tentar deletar a empresa criada
        await supabase.from('empresas').delete().eq('id', empresa.id)
        return { success: false, error: 'Erro ao associar usuário à empresa' }
      }

      const empresaFormatada: Empresa = {
        id: empresa.id,
        nome: empresa.nome,
        cnpj: empresa.cnpj,
        razao_social: empresa.razao_social,
        email: empresa.email,
        telefone: empresa.telefone,
        endereco: empresa.endereco || {},
        configuracoes: empresa.configuracoes || {},
        ativo: empresa.ativo !== false,
        created_at: empresa.created_at,
        updated_at: empresa.updated_at
      }

      console.log('✅ Empresa criada com sucesso:', empresaFormatada.nome)
      return { success: true, empresa: empresaFormatada }
    } catch (error: any) {
      console.error('❌ Erro ao criar empresa:', error)
      return { success: false, error: error.message || 'Erro inesperado ao criar empresa' }
    }
  }

  /**
   * Atualizar empresa (apenas admin)
   */
  async updateEmpresa(
    empresaId: string,
    dados: Partial<Omit<Empresa, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session?.user) {
        return { success: false, error: 'Usuário não autenticado' }
      }

      // Verificar se o usuário é admin da empresa
      const { data: acesso, error: acessoError } = await supabase
        .from('empresa_usuarios')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .single()

      if (acessoError || !acesso || acesso.role !== 'admin') {
        return { success: false, error: 'Acesso negado. Apenas administradores podem atualizar a empresa.' }
      }

      // Atualizar empresa
      const { error } = await supabase
        .from('empresas')
        .update({
          ...dados,
          updated_at: new Date().toISOString()
        })
        .eq('id', empresaId)

      if (error) {
        console.error('❌ Erro ao atualizar empresa:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Empresa atualizada com sucesso')
      return { success: true }
    } catch (error: any) {
      console.error('❌ Erro ao atualizar empresa:', error)
      return { success: false, error: error.message || 'Erro inesperado ao atualizar empresa' }
    }
  }

  /**
   * Verificar se usuário tem acesso à empresa
   */
  async verificarAcesso(empresaId: string): Promise<boolean> {
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session?.user) {
        return false
      }

      const { data, error } = await supabase
        .from('empresa_usuarios')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .single()

      return !error && !!data
    } catch (error) {
      console.error('❌ Erro ao verificar acesso:', error)
      return false
    }
  }

  /**
   * Obter role do usuário na empresa
   */
  async getRoleNaEmpresa(empresaId: string): Promise<RoleEmpresa | null> {
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session?.user) {
        return null
      }

      const { data, error } = await supabase
        .from('empresa_usuarios')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .single()

      if (error || !data) {
        return null
      }

      return data.role as RoleEmpresa
    } catch (error) {
      console.error('❌ Erro ao obter role:', error)
      return null
    }
  }
}

export const empresaService = new EmpresaService()
