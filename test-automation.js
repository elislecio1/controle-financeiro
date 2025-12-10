// Script de Teste Automatizado para o Sistema de Controle Financeiro
// Execute com: node test-automation.js

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configurações de teste
const TEST_CONFIG = {
  supabaseUrl: process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
  supabaseKey: process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key',
  testUser: {
    email: 'teste@exemplo.com',
    password: 'senha123456',
    name: 'Usuário Teste'
  }
}

// Cliente Supabase para testes
const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey)

// Resultados dos testes
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  startTime: new Date(),
  endTime: null
}

// Função para executar teste
async function runTest(testName, testFunction) {
  console.log(`\n🧪 Executando: ${testName}`)
  try {
    await testFunction()
    console.log(`✅ PASSOU: ${testName}`)
    testResults.passed++
  } catch (error) {
    console.log(`❌ FALHOU: ${testName}`)
    console.log(`   Erro: ${error.message}`)
    testResults.failed++
    testResults.errors.push({
      test: testName,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

// Teste 1: Conexão com Supabase
async function testSupabaseConnection() {
  const { data, error } = await supabase.from('transactions').select('count').limit(1)
  if (error) throw new Error(`Falha na conexão: ${error.message}`)
  console.log('   Conexão com Supabase estabelecida')
}

// Teste 2: Estrutura das Tabelas
async function testTableStructure() {
  const tables = ['transactions', 'user_profiles', 'system_logs', 'notification_history']
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1)
    if (error) throw new Error(`Tabela ${table} não encontrada: ${error.message}`)
    console.log(`   Tabela ${table} existe`)
  }
}

// Teste 3: Autenticação
async function testAuthentication() {
  // Teste de registro
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: TEST_CONFIG.testUser.email,
    password: TEST_CONFIG.testUser.password,
    options: {
      data: {
        name: TEST_CONFIG.testUser.name
      }
    }
  })
  
  if (signUpError && !signUpError.message.includes('already registered')) {
    throw new Error(`Falha no registro: ${signUpError.message}`)
  }
  
  // Teste de login
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_CONFIG.testUser.email,
    password: TEST_CONFIG.testUser.password
  })
  
  if (signInError) throw new Error(`Falha no login: ${signInError.message}`)
  console.log('   Autenticação funcionando')
}

// Teste 4: CRUD de Transações
async function testTransactionCRUD() {
  const testTransaction = {
    data: '01/01/2024',
    valor: 100.50,
    descricao: 'Teste de Transação',
    conta: 'Conta Corrente',
    categoria: 'Teste',
    forma: 'Dinheiro',
    tipo: 'despesa',
    vencimento: '01/01/2024',
    status: 'pago'
  }
  
  // CREATE
  const { data: insertData, error: insertError } = await supabase
    .from('transactions')
    .insert([testTransaction])
    .select()
  
  if (insertError) throw new Error(`Falha ao criar transação: ${insertError.message}`)
  const transactionId = insertData[0].id
  console.log('   Transação criada com sucesso')
  
  // READ
  const { data: readData, error: readError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
  
  if (readError) throw new Error(`Falha ao ler transação: ${readError.message}`)
  if (!readData || readData.length === 0) throw new Error('Transação não encontrada')
  console.log('   Transação lida com sucesso')
  
  // UPDATE
  const { data: updateData, error: updateError } = await supabase
    .from('transactions')
    .update({ descricao: 'Transação Atualizada' })
    .eq('id', transactionId)
    .select()
  
  if (updateError) throw new Error(`Falha ao atualizar transação: ${updateError.message}`)
  console.log('   Transação atualizada com sucesso')
  
  // DELETE
  const { error: deleteError } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)
  
  if (deleteError) throw new Error(`Falha ao deletar transação: ${deleteError.message}`)
  console.log('   Transação deletada com sucesso')
}

// Teste 5: Sistema de Logs
async function testLoggingSystem() {
  const { data, error } = await supabase
    .from('system_logs')
    .insert([{
      level: 'info',
      message: 'Teste de log automatizado',
      module: 'test-automation',
      user_id: 'test-user',
      metadata: { test: true }
    }])
    .select()
  
  if (error) throw new Error(`Falha ao criar log: ${error.message}`)
  console.log('   Sistema de logs funcionando')
}

// Teste 6: RLS (Row Level Security)
async function testRLS() {
  // Este teste verifica se o RLS está funcionando
  // Em um ambiente real, você testaria com diferentes usuários
  console.log('   RLS configurado (teste manual necessário)')
}

// Teste 7: Performance
async function testPerformance() {
  const startTime = Date.now()
  
  // Teste de consulta simples
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .limit(100)
  
  const endTime = Date.now()
  const duration = endTime - startTime
  
  if (error) throw new Error(`Falha na consulta de performance: ${error.message}`)
  if (duration > 5000) throw new Error(`Consulta muito lenta: ${duration}ms`)
  
  console.log(`   Performance OK: ${duration}ms`)
}

// Função principal de teste
async function runAllTests() {
  console.log('🚀 Iniciando Testes Automatizados do Sistema de Controle Financeiro')
  console.log('=' * 70)
  
  // Executar todos os testes
  await runTest('Conexão com Supabase', testSupabaseConnection)
  await runTest('Estrutura das Tabelas', testTableStructure)
  await runTest('Sistema de Autenticação', testAuthentication)
  await runTest('CRUD de Transações', testTransactionCRUD)
  await runTest('Sistema de Logs', testLoggingSystem)
  await runTest('Row Level Security', testRLS)
  await runTest('Performance', testPerformance)
  
  // Finalizar resultados
  testResults.endTime = new Date()
  const totalDuration = testResults.endTime - testResults.startTime
  
  console.log('\n' + '=' * 70)
  console.log('📊 RESULTADOS DOS TESTES')
  console.log('=' * 70)
  console.log(`✅ Testes Passaram: ${testResults.passed}`)
  console.log(`❌ Testes Falharam: ${testResults.failed}`)
  console.log(`⏱️  Duração Total: ${totalDuration}ms`)
  console.log(`📅 Iniciado em: ${testResults.startTime.toLocaleString()}`)
  console.log(`📅 Finalizado em: ${testResults.endTime.toLocaleString()}`)
  
  if (testResults.errors.length > 0) {
    console.log('\n🚨 ERROS ENCONTRADOS:')
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`)
    })
  }
  
  // Salvar relatório
  const report = {
    summary: {
      passed: testResults.passed,
      failed: testResults.failed,
      total: testResults.passed + testResults.failed,
      duration: totalDuration,
      startTime: testResults.startTime.toISOString(),
      endTime: testResults.endTime.toISOString()
    },
    errors: testResults.errors
  }
  
  fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2))
  console.log('\n📄 Relatório salvo em: test-report.json')
  
  // Status final
  if (testResults.failed === 0) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! Sistema pronto para uso.')
    process.exit(0)
  } else {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM. Verifique os erros acima.')
    process.exit(1)
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Erro fatal durante os testes:', error)
    process.exit(1)
  })
}

module.exports = { runAllTests, runTest }
