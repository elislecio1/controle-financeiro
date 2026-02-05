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
  console.log('🔍 ============================================')
  console.log('🔍 DIAGNÓSTICO DE EMPRESA_ID')
  console.log('🔍 ============================================')
  
  const empresaIdStorage = getEmpresaIdFromStorage()
  console.log('📦 empresa_id no localStorage:', empresaIdStorage)
  console.log('📦 localStorage completo relacionado a empresa:', {
    empresa_atual_id: localStorage.getItem('empresa_atual_id'),
    todas_chaves_empresa: Object.keys(localStorage).filter(k => k.toLowerCase().includes('empresa'))
  })
  
  // Buscar todas as empresas
  console.log('\n🏢 Buscando empresas no banco de dados...')
  const { data: empresas, error: empresasError } = await supabase
    .from('empresas')
    .select('id, nome, ativo')
    .eq('ativo', true)
  
  if (empresasError) {
    console.error('❌ Erro ao buscar empresas:', empresasError)
    throw empresasError
  }
  
  console.log(`✅ Empresas encontradas: ${empresas?.length || 0}`)
  if (empresas && empresas.length > 0) {
    empresas.forEach((emp, idx) => {
      const isSelected = emp.id === empresaIdStorage
      console.log(`   ${idx + 1}. ${emp.nome} (ID: ${emp.id}) ${isSelected ? '✅ SELECIONADA' : ''}`)
    })
  }
  
  // Buscar categorias
  console.log('\n📋 Buscando categorias no banco de dados...')
  const { data: todasCategorias, error: categoriasError } = await supabase
    .from('categorias')
    .select('id, nome, empresa_id, ativo')
    .eq('ativo', true)
  
  if (categoriasError) {
    console.error('❌ Erro ao buscar categorias:', categoriasError)
  } else {
    console.log(`✅ Total de categorias ativas: ${todasCategorias?.length || 0}`)
  }
  
  const categoriasSemEmpresa = (todasCategorias || []).filter(c => !c.empresa_id)
  const categoriasComEmpresaDiferente = empresaIdStorage 
    ? (todasCategorias || []).filter(c => c.empresa_id && c.empresa_id !== empresaIdStorage)
    : []
  const categoriasComEmpresaCorreta = empresaIdStorage
    ? (todasCategorias || []).filter(c => c.empresa_id === empresaIdStorage)
    : []
  
  console.log(`   - Categorias com empresa_id correto (${empresaIdStorage}): ${categoriasComEmpresaCorreta.length}`)
  console.log(`   - Categorias sem empresa_id: ${categoriasSemEmpresa.length}`)
  console.log(`   - Categorias com empresa_id diferente: ${categoriasComEmpresaDiferente.length}`)
  
  if (categoriasSemEmpresa.length > 0) {
    console.log('   ⚠️ Primeiras categorias sem empresa_id:')
    categoriasSemEmpresa.slice(0, 5).forEach(c => {
      console.log(`      - ${c.nome} (ID: ${c.id})`)
    })
  }
  
  if (categoriasComEmpresaCorreta.length > 0) {
    console.log('   ✅ Primeiras categorias com empresa_id correto:')
    categoriasComEmpresaCorreta.slice(0, 5).forEach(c => {
      console.log(`      - ${c.nome} (ID: ${c.id})`)
    })
  }
  
  // Buscar contatos
  console.log('\n👥 Buscando contatos no banco de dados...')
  const { data: todosContatos, error: contatosError } = await supabase
    .from('contatos')
    .select('id, nome, empresa_id, ativo')
    .eq('ativo', true)
  
  if (contatosError) {
    console.error('❌ Erro ao buscar contatos:', contatosError)
  } else {
    console.log(`✅ Total de contatos ativos: ${todosContatos?.length || 0}`)
  }
  
  const contatosSemEmpresa = (todosContatos || []).filter(c => !c.empresa_id)
  const contatosComEmpresaDiferente = empresaIdStorage
    ? (todosContatos || []).filter(c => c.empresa_id && c.empresa_id !== empresaIdStorage)
    : []
  const contatosComEmpresaCorreta = empresaIdStorage
    ? (todosContatos || []).filter(c => c.empresa_id === empresaIdStorage)
    : []
  
  console.log(`   - Contatos com empresa_id correto (${empresaIdStorage}): ${contatosComEmpresaCorreta.length}`)
  console.log(`   - Contatos sem empresa_id: ${contatosSemEmpresa.length}`)
  console.log(`   - Contatos com empresa_id diferente: ${contatosComEmpresaDiferente.length}`)
  
  if (contatosSemEmpresa.length > 0) {
    console.log('   ⚠️ Primeiros contatos sem empresa_id:')
    contatosSemEmpresa.slice(0, 5).forEach(c => {
      console.log(`      - ${c.nome} (ID: ${c.id})`)
    })
  }
  
  if (contatosComEmpresaCorreta.length > 0) {
    console.log('   ✅ Primeiros contatos com empresa_id correto:')
    contatosComEmpresaCorreta.slice(0, 5).forEach(c => {
      console.log(`      - ${c.nome} (ID: ${c.id})`)
    })
  }
  
  // Gerar recomendação
  let recomendacao = ''
  if (!empresaIdStorage) {
    recomendacao = '⚠️ Nenhuma empresa selecionada no localStorage. Selecione uma empresa no seletor.'
  } else if (categoriasSemEmpresa.length > 0 || contatosSemEmpresa.length > 0) {
    recomendacao = `⚠️ Existem ${categoriasSemEmpresa.length} categorias e ${contatosSemEmpresa.length} contatos sem empresa_id. Use window.migrarDadosParaEmpresa('${empresaIdStorage}') para corrigir.`
  } else if (categoriasComEmpresaDiferente.length > 0 || contatosComEmpresaDiferente.length > 0) {
    recomendacao = `⚠️ Existem registros com empresa_id diferente do armazenado. Verifique se a empresa selecionada está correta.`
  } else if (categoriasComEmpresaCorreta.length === 0 && contatosComEmpresaCorreta.length === 0) {
    recomendacao = `⚠️ Nenhuma categoria ou contato encontrado para a empresa selecionada (${empresaIdStorage}). Verifique se o ID da empresa está correto.`
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
  
  console.log('\n📊 ============================================')
  console.log('📊 RESUMO DO DIAGNÓSTICO')
  console.log('📊 ============================================')
  console.log('📦 Empresa selecionada:', empresaIdStorage || 'NENHUMA')
  console.log('🏢 Total de empresas:', empresas?.length || 0)
  console.log('📋 Total de categorias:', todasCategorias?.length || 0)
  console.log('   - Com empresa_id correto:', categoriasComEmpresaCorreta.length)
  console.log('   - Sem empresa_id:', categoriasSemEmpresa.length)
  console.log('   - Com empresa_id diferente:', categoriasComEmpresaDiferente.length)
  console.log('👥 Total de contatos:', todosContatos?.length || 0)
  console.log('   - Com empresa_id correto:', contatosComEmpresaCorreta.length)
  console.log('   - Sem empresa_id:', contatosSemEmpresa.length)
  console.log('   - Com empresa_id diferente:', contatosComEmpresaDiferente.length)
  console.log('\n💡 RECOMENDAÇÃO:')
  console.log('   ' + recomendacao)
  console.log('\n🔍 ============================================')
  
  return resultado
}

/**
 * Migrar categorias e contatos sem empresa_id para uma empresa específica
 * ATENÇÃO: Use com cuidado! Isso altera dados no banco.
 */
export async function migrarDadosParaEmpresa(empresaId?: string): Promise<{ success: boolean; message: string }> {
  try {
    const empresaIdParaMigrar = empresaId || getEmpresaIdFromStorage()
    
    if (!empresaIdParaMigrar) {
      return { 
        success: false, 
        message: 'Nenhuma empresa especificada. Use: window.migrarDadosParaEmpresa("id-da-empresa") ou selecione uma empresa primeiro.' 
      }
    }
    
    console.log('🔄 ============================================')
    console.log('🔄 INICIANDO MIGRAÇÃO DE DADOS')
    console.log('🔄 ============================================')
    console.log('📦 Empresa ID para migração:', empresaIdParaMigrar)
    
    // Verificar se a empresa existe
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('id, nome')
      .eq('id', empresaIdParaMigrar)
      .single()
    
    if (empresaError || !empresa) {
      console.error('❌ Empresa não encontrada:', empresaError)
      return { success: false, message: `Empresa não encontrada: ${empresaError?.message || 'ID inválido'}` }
    }
    
    console.log('✅ Empresa encontrada:', empresa.nome)
    
    // Contar categorias sem empresa_id antes da migração
    const { count: countCategoriasAntes } = await supabase
      .from('categorias')
      .select('*', { count: 'exact', head: true })
      .is('empresa_id', null)
      .eq('ativo', true)
    
    console.log(`📋 Categorias sem empresa_id encontradas: ${countCategoriasAntes || 0}`)
    
    // Migrar categorias sem empresa_id
    const { data: categoriasMigradas, error: categoriasError } = await supabase
      .from('categorias')
      .update({ empresa_id: empresaIdParaMigrar })
      .is('empresa_id', null)
      .eq('ativo', true)
      .select('id, nome')
    
    if (categoriasError) {
      console.error('❌ Erro ao migrar categorias:', categoriasError)
      return { success: false, message: `Erro ao migrar categorias: ${categoriasError.message}` }
    } else {
      console.log(`✅ Categorias migradas: ${categoriasMigradas?.length || 0}`)
      if (categoriasMigradas && categoriasMigradas.length > 0) {
        console.log('   Primeiras categorias migradas:')
        categoriasMigradas.slice(0, 5).forEach(c => {
          console.log(`      - ${c.nome} (ID: ${c.id})`)
        })
      }
    }
    
    // Contar contatos sem empresa_id antes da migração
    const { count: countContatosAntes } = await supabase
      .from('contatos')
      .select('*', { count: 'exact', head: true })
      .is('empresa_id', null)
      .eq('ativo', true)
    
    console.log(`👥 Contatos sem empresa_id encontrados: ${countContatosAntes || 0}`)
    
    // Migrar contatos sem empresa_id
    const { data: contatosMigrados, error: contatosError } = await supabase
      .from('contatos')
      .update({ empresa_id: empresaIdParaMigrar })
      .is('empresa_id', null)
      .eq('ativo', true)
      .select('id, nome')
    
    if (contatosError) {
      console.error('❌ Erro ao migrar contatos:', contatosError)
      return { success: false, message: `Erro ao migrar contatos: ${contatosError.message}` }
    } else {
      console.log(`✅ Contatos migrados: ${contatosMigrados?.length || 0}`)
      if (contatosMigrados && contatosMigrados.length > 0) {
        console.log('   Primeiros contatos migrados:')
        contatosMigrados.slice(0, 5).forEach(c => {
          console.log(`      - ${c.nome} (ID: ${c.id})`)
        })
      }
    }
    
    const totalMigrado = (categoriasMigradas?.length || 0) + (contatosMigrados?.length || 0)
    
    console.log('\n✅ ============================================')
    console.log('✅ MIGRAÇÃO CONCLUÍDA')
    console.log('✅ ============================================')
    console.log(`📋 Categorias migradas: ${categoriasMigradas?.length || 0}`)
    console.log(`👥 Contatos migrados: ${contatosMigrados?.length || 0}`)
    console.log(`📊 Total de registros migrados: ${totalMigrado}`)
    console.log('💡 Agora recarregue a página (F5) para ver as mudanças.')
    console.log('✅ ============================================\n')
    
    return {
      success: true,
      message: `Migração concluída! ${categoriasMigradas?.length || 0} categorias e ${contatosMigrados?.length || 0} contatos migrados para ${empresa.nome}. Recarregue a página (F5) para ver as mudanças.`
    }
  } catch (error: any) {
    console.error('❌ Erro na migração:', error)
    return { success: false, message: error.message || 'Erro ao migrar dados' }
  }
}

// Expor funções globalmente para uso no console do navegador
// Usar múltiplas estratégias para garantir que funcione
const exposeDiagnosticFunctions = () => {
  if (typeof window === 'undefined') return
  
  try {
    // Estratégia 1: Expor diretamente
    ;(window as any).diagnosticoEmpresa = executarDiagnostico
    ;(window as any).migrarDadosParaEmpresa = migrarDadosParaEmpresa
    
    // Estratégia 2: Também expor em window.diagnostico para compatibilidade
    if (!(window as any).diagnostico) {
      ;(window as any).diagnostico = {}
    }
    ;(window as any).diagnostico.empresa = executarDiagnostico
    ;(window as any).diagnostico.migrar = migrarDadosParaEmpresa
    
    // Log apenas uma vez quando o módulo é carregado
    if (!(window as any).__diagnosticoEmpresaLoaded) {
      console.log('💡 ============================================')
      console.log('💡 FUNÇÕES DE DIAGNÓSTICO DISPONÍVEIS')
      console.log('💡 ============================================')
      console.log('   🔍 window.diagnosticoEmpresa()')
      console.log('      Executa diagnóstico completo de empresa_id')
      console.log('')
      console.log('   🔄 window.migrarDadosParaEmpresa(empresaId?)')
      console.log('      Migra categorias e contatos sem empresa_id')
      console.log('      Se não passar empresaId, usa a empresa selecionada')
      console.log('      Exemplo: window.migrarDadosParaEmpresa()')
      console.log('      Exemplo: window.migrarDadosParaEmpresa("id-da-empresa")')
      console.log('💡 ============================================\n')
      ;(window as any).__diagnosticoEmpresaLoaded = true
    }
  } catch (error) {
    console.error('❌ Erro ao expor funções de diagnóstico:', error)
  }
}

// Tentar expor imediatamente
if (typeof window !== 'undefined') {
  exposeDiagnosticFunctions()
} else {
  // Se window não estiver disponível ainda, tentar quando estiver
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', exposeDiagnosticFunctions)
  }
}

// Também tentar após um pequeno delay para garantir
if (typeof window !== 'undefined') {
  setTimeout(exposeDiagnosticFunctions, 100)
  setTimeout(exposeDiagnosticFunctions, 1000)
}
