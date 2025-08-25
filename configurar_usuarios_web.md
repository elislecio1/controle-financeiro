# 🌐 Configuração de Usuários Administradores via Interface Web

## 🚨 **Problema Identificado**
A URL do Supabase está incorreta: `eshaahpcddqkevxpgfk.supabase.co`
Precisamos encontrar a URL correta do projeto.

## 🔍 **Passos para Resolver**

### **1. Encontrar a URL Correta do Supabase**

#### **Opção A: Dashboard do Supabase**
1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto "controle-financeiro"
4. Vá para Settings > API
5. Copie a **Project URL** correta

#### **Opção B: Verificar nos Logs**
```bash
# Verificar se há outras URLs nos arquivos
grep -r "supabase.co" .
```

#### **Opção C: Verificar no Vercel**
1. Acesse: https://vercel.com/elislecio-8967s-projects/controle-financeiro
2. Vá para Settings > Environment Variables
3. Verifique as variáveis VITE_SUPABASE_URL

### **2. Configurar Usuários via Supabase Studio**

#### **Passo 1: Acessar o Supabase Studio**
1. Vá para: https://supabase.com/dashboard
2. Selecione o projeto correto
3. Acesse o **Supabase Studio**

#### **Passo 2: Criar Usuários via Authentication**
1. No menu lateral, clique em **Authentication**
2. Clique em **Users**
3. Clique em **Add User**

#### **Passo 3: Criar Usuário 1 - Elislecio**
```
Email: elislecio@gmail.com
Password: Don@767987
Email Confirm: ✅ (marcar)
User Metadata:
  - name: "Elislecio - Administrador"
  - role: "admin"
```

#### **Passo 4: Criar Usuário 2 - Don Santos**
```
Email: donsantos.financeiro@gmail.com
Password: Don@767987
Email Confirm: ✅ (marcar)
User Metadata:
  - name: "Don Santos - Administrador"
  - role: "admin"
```

### **3. Configurar Perfis via SQL Editor**

#### **Passo 1: Abrir SQL Editor**
1. No Supabase Studio, clique em **SQL Editor**
2. Clique em **New Query**

#### **Passo 2: Executar Script SQL**
```sql
-- Script para configurar perfis de administradores
-- Execute este script no SQL Editor

-- 1. Verificar usuários existentes
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE email IN ('elislecio@gmail.com', 'donsantos.financeiro@gmail.com');

-- 2. Criar/atualizar perfis de usuário
INSERT INTO user_profiles (
    user_id,
    email,
    name,
    role,
    status,
    approved,
    allow_google_login,
    allow_email_login,
    created_at,
    updated_at
) VALUES 
-- Usuário 1: elislecio@gmail.com
(
    (SELECT id FROM auth.users WHERE email = 'elislecio@gmail.com' LIMIT 1),
    'elislecio@gmail.com',
    'Elislecio - Administrador',
    'admin',
    'active',
    true,
    true,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    approved = EXCLUDED.approved,
    allow_google_login = EXCLUDED.allow_google_login,
    allow_email_login = EXCLUDED.allow_email_login,
    updated_at = NOW(),

-- Usuário 2: donsantos.financeiro@gmail.com
(
    (SELECT id FROM auth.users WHERE email = 'donsantos.financeiro@gmail.com' LIMIT 1),
    'donsantos.financeiro@gmail.com',
    'Don Santos - Administrador',
    'admin',
    'active',
    true,
    true,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    approved = EXCLUDED.approved,
    allow_google_login = EXCLUDED.allow_google_login,
    allow_email_login = EXCLUDED.allow_email_login,
    updated_at = NOW();

-- 3. Verificar resultado
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

### **4. Configurar Google OAuth**

#### **Passo 1: Configurar Google Provider**
1. No Supabase Studio, vá para **Authentication > Providers**
2. Clique em **Google**
3. Configure:
   - **Enabled**: ✅
   - **Client ID**: (do Google Cloud Console)
   - **Client Secret**: (do Google Cloud Console)

#### **Passo 2: Configurar URLs de Redirecionamento**
1. Vá para **Authentication > URL Configuration**
2. Configure:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: 
     - `http://localhost:3000/auth/callback`
     - `https://controle-financeiro-at7dcm6mo-elislecio-8967s-projects.vercel.app/auth/callback`

### **5. Testar Configuração**

#### **Teste 1: Login Local**
1. Acesse: `http://localhost:3000/`
2. Tente fazer login com:
   - Email: `elislecio@gmail.com`
   - Senha: `Don@767987`

#### **Teste 2: Login Google**
1. Clique em "Entrar com Google"
2. Use a conta Google associada aos emails

#### **Teste 3: Verificar Permissões**
1. Após login, verifique se aparece o menu de administrador
2. Acesse "Gestão de Usuários"
3. Verifique se tem acesso total

## 🔧 **Correção da URL do Supabase**

### **Atualizar arquivo .env**
```env
# URL correta do Supabase (substitua pela URL real)
NEXT_PUBLIC_SUPABASE_URL=https://URL_CORRETA.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=CHAVE_CORRETA

VITE_SUPABASE_URL=https://URL_CORRETA.supabase.co
VITE_SUPABASE_ANON_KEY=CHAVE_CORRETA
```

### **Atualizar no Vercel**
1. Acesse: https://vercel.com/elislecio-8967s-projects/controle-financeiro
2. Vá para Settings > Environment Variables
3. Atualize as variáveis com os valores corretos

## 📞 **Suporte**

### **Se precisar de ajuda:**
1. Verifique a documentação do Supabase
2. Consulte os logs de erro
3. Teste a conectividade com o projeto
4. Verifique se o projeto está ativo

### **Comandos para verificar:**
```bash
# Testar conectividade
curl -I https://URL_CORRETA.supabase.co

# Verificar variáveis
echo $NEXT_PUBLIC_SUPABASE_URL
echo $VITE_SUPABASE_URL
```

---

**🎯 Objetivo:** Configurar 2 usuários administradores com acesso total ao sistema
**🔒 Segurança:** Senhas fortes e autenticação multifator
**�� Prazo:** Imediato
