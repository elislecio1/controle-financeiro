// Script de Configuração Rápida para Testes
// Execute com: node setup-test.js

const fs = require('fs')
const path = require('path')

console.log('🚀 Configurando ambiente de teste...')

// 1. Verificar se .env existe
const envPath = path.join(__dirname, '.env')
if (!fs.existsSync(envPath)) {
  console.log('📝 Criando arquivo .env...')
  
  const envContent = `# Configurações do Supabase
# Copie este arquivo para .env e substitua pelos valores reais

# URL do projeto Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Chave pública anônima do Supabase
VITE_SUPABASE_ANON_KEY=your-anon-key

# Configurações de desenvolvimento
NODE_ENV=development
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=Controle Financeiro

# Configurações de email (opcional)
VITE_EMAIL_SERVICE=supabase
VITE_EMAIL_FROM=noreply@exemplo.com

# Configurações de backup (opcional)
VITE_BACKUP_ENABLED=true
VITE_BACKUP_INTERVAL=24

# Configurações de notificação (opcional)
VITE_NOTIFICATIONS_ENABLED=true
VITE_PUSH_NOTIFICATIONS_ENABLED=true
`
  
  fs.writeFileSync(envPath, envContent)
  console.log('✅ Arquivo .env criado!')
  console.log('⚠️  IMPORTANTE: Configure suas credenciais do Supabase no arquivo .env')
} else {
  console.log('✅ Arquivo .env já existe')
}

// 2. Verificar dependências
console.log('📦 Verificando dependências...')
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const requiredDeps = [
  '@supabase/supabase-js',
  'react',
  'react-dom',
  'vite',
  'typescript',
  'tailwindcss'
]

const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep] && !packageJson.devDependencies[dep])

if (missingDeps.length > 0) {
  console.log('⚠️  Dependências faltando:', missingDeps.join(', '))
  console.log('Execute: npm install')
} else {
  console.log('✅ Todas as dependências estão instaladas')
}

// 3. Verificar estrutura de pastas
console.log('📁 Verificando estrutura de pastas...')
const requiredDirs = [
  'src',
  'src/components',
  'src/services',
  'src/types',
  'src/utils',
  'public'
]

const missingDirs = requiredDirs.filter(dir => !fs.existsSync(path.join(__dirname, dir)))

if (missingDirs.length > 0) {
  console.log('⚠️  Pastas faltando:', missingDirs.join(', '))
} else {
  console.log('✅ Estrutura de pastas OK')
}

// 4. Verificar arquivos de configuração
console.log('⚙️  Verificando arquivos de configuração...')
const configFiles = [
  'vite.config.ts',
  'tsconfig.json',
  'tailwind.config.js',
  'package.json'
]

const missingConfigs = configFiles.filter(file => !fs.existsSync(path.join(__dirname, file)))

if (missingConfigs.length > 0) {
  console.log('⚠️  Arquivos de configuração faltando:', missingConfigs.join(', '))
} else {
  console.log('✅ Arquivos de configuração OK')
}

// 5. Criar script de teste rápido
console.log('🧪 Criando script de teste rápido...')
const quickTestScript = `#!/usr/bin/env node

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
`

fs.writeFileSync('quick-test.js', quickTestScript)
console.log('✅ Script de teste rápido criado!')

// 6. Criar README de teste
console.log('📚 Criando README de teste...')
const testReadme = `# 🧪 Guia de Teste Rápido

## 🚀 Iniciar o Sistema

1. **Configure o Supabase:**
   \`\`\`bash
   # Edite o arquivo .env com suas credenciais
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anonima
   \`\`\`

2. **Instale as dependências:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Inicie o servidor:**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Acesse a aplicação:**
   - Abra: http://localhost:5173
   - Faça login ou registre-se
   - Teste as funcionalidades

## 🧪 Testes Automatizados

### Teste Rápido
\`\`\`bash
node quick-test.js
\`\`\`

### Teste Completo
\`\`\`bash
node test-automation.js
\`\`\`

## 📋 Checklist de Teste

### ✅ Funcionalidades Básicas
- [ ] Login/Logout
- [ ] Cadastro de transações
- [ ] Edição de transações
- [ ] Exclusão de transações
- [ ] Filtros e busca

### ✅ Funcionalidades Avançadas
- [ ] Notificações
- [ ] Monitoramento
- [ ] IA Financeira
- [ ] Backup
- [ ] Tempo real

## 🐛 Problemas Comuns

### Erro de Conexão com Supabase
- Verifique se as credenciais no .env estão corretas
- Verifique se o projeto Supabase está ativo
- Verifique se as tabelas foram criadas

### Erro de Compilação
- Execute: npm run build
- Verifique se há erros de TypeScript
- Verifique se todas as dependências estão instaladas

### Erro de Permissão
- Verifique se o RLS está configurado
- Verifique se o usuário tem permissões adequadas
- Verifique se as políticas estão corretas

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do console
2. Execute os testes automatizados
3. Consulte a documentação
4. Verifique as configurações

---

**Boa sorte com os testes! 🎉**
`

fs.writeFileSync('TESTE-README.md', testReadme)
console.log('✅ README de teste criado!')

// 7. Resumo final
console.log('\n' + '='.repeat(60))
console.log('🎉 CONFIGURAÇÃO CONCLUÍDA!')
console.log('='.repeat(60))
console.log('')
console.log('📋 PRÓXIMOS PASSOS:')
console.log('1. Configure suas credenciais do Supabase no arquivo .env')
console.log('2. Execute: npm install')
console.log('3. Execute: npm run dev')
console.log('4. Acesse: http://localhost:5173')
console.log('5. Execute os testes: node quick-test.js')
console.log('')
console.log('📚 DOCUMENTAÇÃO:')
console.log('- Guia completo: GUIA_TESTE_COMPLETO.md')
console.log('- Teste rápido: TESTE-README.md')
console.log('- Testes automatizados: test-automation.js')
console.log('')
console.log('🚀 SISTEMA PRONTO PARA TESTE!')
console.log('='.repeat(60))
