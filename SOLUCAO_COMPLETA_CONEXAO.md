# 🔧 Solução Completa: Conexão com Banco de Dados

## ✅ **Status Atual**
- ✅ **Conexão com Supabase:** Funcionando
- ✅ **Usuários existem:** 2 usuários confirmados
- ❌ **Tabela user_profiles:** Não existe ou estrutura incorreta
- ❌ **Script SQL:** Erro na coluna 'email'

## 🎯 **Problema Identificado**
```
ERROR: 42703: column "email" of relation "user_profiles" does not exist
```

A tabela `user_profiles` não tem a estrutura correta ou não existe.

## 🛠️ **Solução Passo a Passo**

### **Passo 1: Verificar Estrutura da Tabela**
Execute no SQL Editor do Supabase:
```sql
-- Verificar se a tabela existe
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_profiles';

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;
```

### **Passo 2: Criar Tabela Correta**
Execute o script: `criar_tabela_user_profiles.sql`

Este script irá:
- ✅ Criar a tabela `user_profiles` com estrutura correta
- ✅ Adicionar todas as colunas necessárias
- ✅ Configurar índices para performance
- ✅ Habilitar Row Level Security (RLS)
- ✅ Criar políticas de segurança
- ✅ Configurar triggers automáticos

### **Passo 3: Configurar Usuários Administradores**
Execute o script: `criar_usuarios_admin_final.js`

```bash
node criar_usuarios_admin_final.js
```

Este script irá:
- ✅ Verificar usuários existentes
- ✅ Criar perfis de administrador
- ✅ Configurar permissões
- ✅ Testar a configuração

## 📋 **Scripts Disponíveis**

### **1. Verificar Estrutura**
- **Arquivo:** `verificar_estrutura_tabela.sql`
- **Função:** Verificar se a tabela existe e sua estrutura

### **2. Criar Tabela**
- **Arquivo:** `criar_tabela_user_profiles.sql`
- **Função:** Criar tabela com estrutura completa

### **3. Configurar Usuários**
- **Arquivo:** `criar_usuarios_admin_final.js`
- **Função:** Configurar usuários administradores

### **4. Script SQL Corrigido**
- **Arquivo:** `criar_usuarios_admin_simples.sql`
- **Função:** Script SQL para criar perfis (após criar tabela)

## 🔍 **Verificação de Sucesso**

### **Após executar os scripts, você deve ver:**

#### **1. Tabela user_profiles criada:**
```
| column_name | data_type | is_nullable |
|-------------|-----------|-------------|
| id | integer | NO |
| user_id | uuid | NO |
| email | text | NO |
| name | text | NO |
| role | text | YES |
| status | text | YES |
| approved | boolean | YES |
| allow_google_login | boolean | YES |
| allow_email_login | boolean | YES |
| created_at | timestamp with time zone | YES |
| updated_at | timestamp with time zone | YES |
```

#### **2. Usuários administradores configurados:**
```
| user_id | email | name | role | status | approved |
|---------|-------|------|------|--------|----------|
| uuid | elislecio@gmail.com | Elislecio - Administrador | admin | active | true |
| uuid | donsantos.financeiro@gmail.com | Don Santos - Administrador | admin | active | true |
```

## 🚀 **Comandos para Executar**

### **1. No Supabase Studio (SQL Editor):**
```sql
-- Execute este script primeiro
-- Conteúdo do arquivo: criar_tabela_user_profiles.sql
```

### **2. No Terminal:**
```bash
# Testar conexão
node test-supabase-connection-fixed.js

# Configurar usuários
node criar_usuarios_admin_final.js
```

### **3. Verificar Resultado:**
```sql
-- Verificar usuários configurados
SELECT * FROM user_profiles 
WHERE email IN ('elislecio@gmail.com', 'donsantos.financeiro@gmail.com');
```

## 📊 **Credenciais do Supabase**

### **Configurações Corretas:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
SUPABASE_SERVICE_ROLE_KEY=sb_secret_ku5hM79z9JTOfK4K3B8-DQ_60SnmG_q
```

### **Usuários Administradores:**
- **Email:** `elislecio@gmail.com` / **Senha:** `Don@767987`
- **Email:** `donsantos.financeiro@gmail.com` / **Senha:** `Don@767987`

## 🎯 **Próximos Passos**

### **1. Execute os Scripts:**
1. `criar_tabela_user_profiles.sql` (no Supabase Studio)
2. `criar_usuarios_admin_final.js` (no terminal)

### **2. Teste o Sistema:**
1. Acesse: `http://localhost:3000/`
2. Faça login com as credenciais
3. Verifique permissões de administrador

### **3. Configure Google OAuth:**
1. No Supabase Studio: Authentication > Providers > Google
2. Configure Client ID e Secret
3. Teste login com Google

## 📞 **Suporte**

### **Se houver problemas:**
1. Verifique se a tabela foi criada corretamente
2. Verifique se os usuários existem em `auth.users`
3. Verifique se os perfis foram criados em `user_profiles`
4. Teste a conexão com o script de teste

### **Comandos de Verificação:**
```sql
-- Verificar tabela
SELECT COUNT(*) FROM user_profiles;

-- Verificar usuários
SELECT * FROM auth.users WHERE email LIKE '%@gmail.com';

-- Verificar perfis
SELECT * FROM user_profiles WHERE role = 'admin';
```

---

**🎯 Objetivo:** Configurar sistema completo com usuários administradores
**🔒 Segurança:** Row Level Security e políticas configuradas
**📅 Prazo:** Imediato após execução dos scripts
