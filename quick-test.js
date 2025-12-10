#!/usr/bin/env node

// Teste Rápido do Sistema
console.log('🧪 Executando teste rápido...')

// Verificar se o servidor está rodando
const http = require('http')

const options = {
  hostname: 'localhost',
  port: 5173,
  path: '/',
  method: 'GET',
  timeout: 5000
}

const req = http.request(options, (res) => {
  console.log('✅ Servidor está rodando!')
  console.log('🌐 Acesse: http://localhost:5173')
  process.exit(0)
})

req.on('error', (err) => {
  console.log('❌ Servidor não está rodando')
  console.log('💡 Execute: npm run dev')
  process.exit(1)
})

req.on('timeout', () => {
  console.log('⏰ Timeout - servidor pode estar iniciando')
  process.exit(1)
})

req.end()
