# 👥 Guia: Configuração de Usuários Administradores

## 📋 **Usuários a serem criados:**

### **1. Elislecio - Administrador Principal**
- **Email:** `elislecio@gmail.com`
- **Senha:** `Don@767987`
- **Role:** `admin`
- **Permissões:** Acesso total ao sistema
- **Login:** Email/Senha + Google OAuth

### **2. Don Santos - Administrador Financeiro**
- **Email:** `donsantos.financeiro@gmail.com`
- **Senha:** `Don@767987`
- **Role:** `admin`
- **Permissões:** Acesso total ao sistema
- **Login:** Email/Senha + Google OAuth

## 🛠️ **Métodos de Criação**

### **Método 1: Script Node.js (Recomendado)**
```bash
# Executar o script de criação
node criar_usuarios_admin.js
```

### **Método 2: SQL Direto no Supabase Studio**
1. Acesse o Supabase Studio
2. Vá para SQL Editor
3. Execute o script: `criar_usuarios_admin.sql`

### **Método 3: Interface do Supabase**
1. Acesse Authentication > Users
2. Clique em "Add User"
3. Preencha os dados de cada usuário
4. Configure as permissões

## 🔧 **Configurações Necessárias**

### **1. Variáveis de Ambiente**
Certifique-se de que as seguintes variáveis estão configuradas:

```env
# App Frameworks (Recomendado)
NEXT_PUBLIC_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD

# Vite (Compatibilidade)
VITE_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD

# Service Role Key (para criação de usuários)
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

### **2. Configurações do Supabase**

#### **Authentication Settings:**
- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** 
  - `http://localhost:3000/auth/callback`
  - `https://controle-financeiro-at7dcm6mo-elislecio-8967s-projects.vercel.app/auth/callback`

#### **Google OAuth:**
- Habilitar Google Provider
- Configurar Client ID e Secret
- Adicionar domínios autorizados

#### **Email Templates:**
- Configurar templates de confirmação
- Configurar templates de recuperação de senha

## 📊 **Estrutura do Banco de Dados**

### **Tabela: user_profiles**
```sql
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'inactive')),
    approved BOOLEAN DEFAULT false,
    allow_google_login BOOLEAN DEFAULT true,
    allow_email_login BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Políticas RLS (Row Level Security):**
```sql
-- Política para administradores (acesso total)
CREATE POLICY "Admins have full access" ON user_profiles
    FOR ALL USING (
        role = 'admin' OR 
        auth.uid() = user_id
    );

-- Política para visualização de perfis
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Política para atualização de perfis
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);
```

## 🔍 **Verificação dos Usuários**

### **1. Verificar no Supabase Studio:**
1. Authentication > Users
2. Procurar pelos emails:
   - `elislecio@gmail.com`
   - `donsantos.financeiro@gmail.com`

### **2. Verificar na Tabela user_profiles:**
```sql
SELECT 
    up.user_id,
    up.email,
    up.name,
    up.role,
    up.status,
    up.approved,
    up.allow_google_login,
    up.allow_email_login,
    up.created_at,
    up.updated_at
FROM user_profiles up
WHERE up.email IN ('elislecio@gmail.com', 'donsantos.financeiro@gmail.com')
ORDER BY up.created_at;
```

### **3. Testar Login:**
1. Acesse: `http://localhost:3000/`
2. Tente fazer login com as credenciais
3. Verifique se o usuário tem permissões de administrador
4. Teste o login com Google OAuth

## 🎯 **Funcionalidades de Administrador**

### **Acesso Total:**
- ✅ Gestão de usuários
- ✅ Logs do sistema
- ✅ Configurações avançadas
- ✅ Relatórios gerenciais
- ✅ Backup e restauração

### **Permissões Específicas:**
- ✅ Criar/editar/excluir usuários
- ✅ Gerenciar convites
- ✅ Visualizar logs de auditoria
- ✅ Configurar integrações
- ✅ Acessar dados de todos os usuários

## 🚨 **Troubleshooting**

### **Problema: Usuário não consegue fazer login**
**Solução:**
1. Verificar se o email está confirmado
2. Verificar se o usuário está aprovado
3. Verificar se as permissões estão corretas
4. Verificar logs de autenticação

### **Problema: Usuário não tem permissões de admin**
**Solução:**
1. Verificar se o role está definido como 'admin'
2. Verificar se o status está como 'active'
3. Verificar se o approved está como true
4. Recarregar a página após login

### **Problema: Google OAuth não funciona**
**Solução:**
1. Verificar configurações do Google Provider
2. Verificar domínios autorizados
3. Verificar Client ID e Secret
4. Verificar se allow_google_login está true

## 📞 **Suporte**

### **Comandos Úteis:**
```bash
# Testar configuração
node test-app-frameworks.js

# Criar usuários admin
node criar_usuarios_admin.js

# Verificar logs
vercel logs

# Reiniciar servidor
npm run dev
```

### **Links Importantes:**
- **Sistema:** http://localhost:3000/
- **Supabase Studio:** https://supabase.com/dashboard
- **Documentação:** README.md

---

**📅 Última atualização:** 25/08/2025
**👤 Responsável:** Sistema de Administração
**🔒 Segurança:** Senhas fortes e autenticação multifator recomendada
