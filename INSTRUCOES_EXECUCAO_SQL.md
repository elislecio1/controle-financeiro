# 📋 Instruções para Executar o Script SQL

## 🚨 **Erro Corrigido**
O erro `syntax error at or near "("` foi corrigido separando os INSERTs em comandos individuais.

## 📝 **Como Executar o Script**

### **Opção 1: Script Completo (Recomendado)**
Use o arquivo: `criar_usuarios_admin.sql`

1. Acesse o Supabase Studio
2. Vá para **SQL Editor**
3. Clique em **New Query**
4. Cole todo o conteúdo do arquivo `criar_usuarios_admin.sql`
5. Clique em **Run**

### **Opção 2: Script Simples (Mais Seguro)**
Use o arquivo: `criar_usuarios_admin_simples.sql`

1. Acesse o Supabase Studio
2. Vá para **SQL Editor**
3. Execute cada bloco separadamente:

#### **Passo 1: Verificar Usuários**
```sql
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE email IN ('elislecio@gmail.com', 'donsantos.financeiro@gmail.com');
```

#### **Passo 2: Criar Perfil Elislecio**
```sql
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
) VALUES (
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
    updated_at = NOW();
```

#### **Passo 3: Criar Perfil Don Santos**
```sql
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
) VALUES (
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
```

#### **Passo 4: Verificar Resultado**
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

## ⚠️ **Importante: Pré-requisitos**

### **1. Usuários Devem Existir**
Antes de executar o script, os usuários devem estar criados em `auth.users`:

- `elislecio@gmail.com`
- `donsantos.financeiro@gmail.com`

### **2. Como Criar Usuários (se não existirem)**

#### **Via Interface Web:**
1. Vá para **Authentication > Users**
2. Clique em **Add User**
3. Preencha:
   - **Email:** `elislecio@gmail.com`
   - **Password:** `Don@767987`
   - **Email Confirm:** ✅ (marcar)
4. Repita para `donsantos.financeiro@gmail.com`

#### **Via SQL (se tiver service role):**
```sql
-- Criar usuário 1
INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
) VALUES (
    'elislecio@gmail.com',
    crypt('Don@767987', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
);

-- Criar usuário 2
INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
) VALUES (
    'donsantos.financeiro@gmail.com',
    crypt('Don@767987', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
);
```

## 🔍 **Verificação de Sucesso**

### **Resultado Esperado:**
Após executar o script, você deve ver:

```
| user_id | email | name | role | status | approved | allow_google_login | allow_email_login |
|---------|-------|------|------|--------|----------|-------------------|-------------------|
| uuid    | elislecio@gmail.com | Elislecio - Administrador | admin | active | true | true | true |
| uuid    | donsantos.financeiro@gmail.com | Don Santos - Administrador | admin | active | true | true | true |
```

### **Se Houver Erro:**
- **Erro:** `null value in column "user_id" violates not-null constraint`
  - **Solução:** Usuário não existe em `auth.users`. Crie primeiro via interface.

- **Erro:** `relation "user_profiles" does not exist`
  - **Solução:** Tabela não existe. Execute o script de criação de tabelas.

## 📞 **Suporte**

### **Se precisar de ajuda:**
1. Verifique se os usuários existem em `auth.users`
2. Verifique se a tabela `user_profiles` existe
3. Execute os comandos um por vez
4. Verifique os logs de erro no Supabase Studio

### **Comandos de Verificação:**
```sql
-- Verificar se tabela existe
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_profiles';

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles';
```

---

**🎯 Objetivo:** Configurar 2 usuários administradores no banco de dados
**🔒 Segurança:** Verificar sempre se os usuários existem antes de executar
**📅 Prazo:** Imediato após correção do erro
