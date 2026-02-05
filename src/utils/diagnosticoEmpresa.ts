/**
 * Utilitário de diagnóstico para problemas com empresa_id
 * Pode ser chamado do console do navegador: window.diagnosticoEmpresa()
 */

import { supabase } from '../services/supabase'
import { getEmpresaIdFromStorage } from './empresaHelper'

export interface DiagnosticoResult {
  empresaIdStorage: string | null
  empresasNoBanco: Array<{ id: string; nome: string }>
  categoriasSemEmpresa: number
  categoriasComEmpresaDiferente: number
  contatosSemEmpresa: number
  contatosComEmpresaDiferente: number
  totalCategorias: number
  totalContatos: number
  recomendacao: string
}

/**
 * Executar diagnóstico completo de empresa_id
 */
export async function executarDiagnostico(): Promise<DiagnosticoResult> {
  console.log('🔍 Iniciando diagnóstico de empresa_id...')
  
  const empresaIdStorage = getEmpresaIdFromStorage()
  console.log('📦 empresa_id no localStorage:', empresaIdStorage)
  
  // Buscar todas as empresas
  const { data: empresas, error: empresasError } = await supabase
    .from('empresas')
    .select('id, nome')
    .eq('ativo', true)
  
  if (empresasError) {
    console.error('❌ Erro ao buscar empresas:', empresasError)
    throw empresasError
  }
  
  console.log('🏢 Empresas encontradas:', empresas?.length || 0)
  
  // Buscar categorias
  const { data: todasCategorias, error: categoriasError } = await supabase
    .from('categorias')
    .select('id, nome, empresa_id, ativo')
    .eq('ativo', true)
  
  if (categoriasError) {
    console.error('❌ Erro ao buscar categorias:', categoriasError)
  }
  
  const categoriasSemEmpresa = (todasCategorias || []).filter(c => !c.empresa_id)
  const categoriasComEmpresaDiferente = empresaIdStorage 
    ? (todasCategorias || []).filter(c => c.empresa_id && c.empresa_id !== empresaIdStorage)
    : []
  
  // Buscar contatos
  const { data: todosContatos, error: contatosError } = await supabase
    .from('contatos')
    .select('id, nome, empresa_id, ativo')
    .eq('ativo', true)
  
  if (contatosError) {
    console.error('❌ Erro ao buscar contatos:', contatosError)
  }
  
  const contatosSemEmpresa = (todosContatos || []).filter(c => !c.empresa_id)
  const contatosComEmpresaDiferente = empresaIdStorage
    ? (todosContatos || []).filter(c => c.empresa_id && c.empresa_id !== empresaIdStorage)
    : []
  
  // Gerar recomendação
  let recomendacao = ''
  if (!empresaIdStorage) {
    recomendacao = '⚠️ Nenhuma empresa selecionada no localStorage. Selecione uma empresa no seletor.'
  } else if (categoriasSemEmpresa.length > 0 || contatosSemEmpresa.length > 0) {
    recomendacao = `⚠️ Existem ${categoriasSemEmpresa.length} categorias e ${contatosSemEmpresa.length} contatos sem empresa_id. Execute a migração SQL para corrigir.`
  } else if (categoriasComEmpresaDiferente.length > 0 || contatosComEmpresaDiferente.length > 0) {
    recomendacao = `⚠️ Existem registros com empresa_id diferente do armazenado. Verifique se a empresa selecionada está correta.`
  } else {
    recomendacao = '✅ Tudo parece estar correto! Se ainda houver problemas, limpe o cache e recarregue a página.'
  }
  
  const resultado: DiagnosticoResult = {
    empresaIdStorage,
    empresasNoBanco: (empresas || []).map(e => ({ id: e.id, nome: e.nome })),
    categoriasSemEmpresa: categoriasSemEmpresa.length,
    categoriasComEmpresaDiferente: categoriasComEmpresaDiferente.length,
    contatosSemEmpresa: contatosSemEmpresa.length,
    contatosComEmpresaDiferente: contatosComEmpresaDiferente.length,
    totalCategorias: todasCategorias?.length || 0,
    totalContatos: todosContatos?.length || 0,
    recomendacao
  }
  
  console.log('📊 Resultado do diagnóstico:', resultado)
  console.log('💡 Recomendação:', recomendacao)
  
  return resultado
}

/**
 * Migrar categorias e contatos sem empresa_id para uma empresa específica
 * ATENÇÃO: Use com cuidado! Isso altera dados no banco.
 */
export async function migrarDadosParaEmpresa(empresaId: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔄 Iniciando migração de dados para empresa:', empresaId)
    
    // Verificar se a empresa existe
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('id, nome')
      .eq('id', empresaId)
      .single()
    
    if (empresaError || !empresa) {
      return { success: false, message: 'Empresa não encontrada' }
    }
    
    console.log('✅ Empresa encontrada:', empresa.nome)
    
    // Migrar categorias sem empresa_id
    const { data: categoriasMigradas, error: categoriasError } = await supabase
      .from('categorias')
      .update({ empresa_id: empresaId })
      .is('empresa_id', null)
      .select('id')
    
    if (categoriasError) {
      console.error('❌ Erro ao migrar categorias:', categoriasError)
    } else {
      console.log('✅ Categorias migradas:', categoriasMigradas?.length || 0)
    }
    
    // Migrar contatos sem empresa_id
    const { data: contatosMigrados, error: contatosError } = await supabase
      .from('contatos')
      .update({ empresa_id: empresaId })
      .is('empresa_id', null)
      .select('id')
    
    if (contatosError) {
      console.error('❌ Erro ao migrar contatos:', contatosError)
    } else {
      console.log('✅ Contatos migrados:', contatosMigrados?.length || 0)
    }
    
    return {
      success: true,
      message: `Migração concluída! ${categoriasMigradas?.length || 0} categorias e ${contatosMigrados?.length || 0} contatos migrados.`
    }
  } catch (error: any) {
    console.error('❌ Erro na migração:', error)
    return { success: false, message: error.message || 'Erro ao migrar dados' }
  }
}

// Expor funções globalmente para uso no console do navegador
if (typeof window !== 'undefined') {
  (window as any).diagnosticoEmpresa = executarDiagnostico
  ;(window as any).migrarDadosParaEmpresa = migrarDadosParaEmpresa
  console.log('💡 Funções de diagnóstico disponíveis:')
  console.log('   - window.diagnosticoEmpresa() - Executar diagnóstico')
  console.log('   - window.migrarDadosParaEmpresa(empresaId) - Migrar dados para empresa')
}
