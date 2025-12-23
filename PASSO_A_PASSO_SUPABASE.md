# 📋 Passo a Passo Completo - Configurar Supabase

## 🎯 Objetivo

1. Habilitar Realtime para sincronização automática
2. Verificar/corrigir políticas RLS (Row Level Security)
3. Criar funções SQL para administração de usuários

---

## ✅ PASSO 1: Habilitar Realtime no Supabase Dashboard

### 1.1. Acessar o Supabase Dashboard

1. Abra seu navegador e acesse: **https://supabase.com/dashboard**
2. Faça login na sua conta
3. Selecione o projeto: **eshaahpcddqkeevxpgfk** (ou seu projeto)

### 1.2. Navegar até a tabela `transactions`

**⚠️ IMPORTANTE:** A página "Replication" que você está vendo é para replicação externa (data warehouses). O Realtime que precisamos é diferente!

1. No menu lateral esquerdo, clique em **"Database"**
2. No submenu, clique em **"Tables"** (não "Replication")
3. Na lista de tabelas, encontre e clique na tabela **`transactions`**

### 1.3. Habilitar Realtime na tabela

1. Na página da tabela `transactions`, procure por uma seção chamada **"Realtime"** ou **"Enable Realtime"**
2. Você verá um toggle (interruptor) ou um botão para habilitar Realtime
3. **Ative o toggle** ou clique no botão para habilitar
4. Aguarde alguns segundos até aparecer a confirmação

**📍 Onde encontrar:**
- Pode estar na parte superior da página da tabela
- Ou em uma aba/section chamada "Realtime" ou "Settings"
- Ou como um toggle ao lado do nome da tabela

**✅ Resultado esperado:**
- O toggle deve estar **ativado/verde**
- Status deve mostrar **"Enabled"** ou **"Realtime enabled"**

### 1.4. Se não encontrar o toggle na interface

Se não encontrar a opção na interface, você pode habilitar via SQL:

1. Vá em **SQL Editor** → **New Query**
2. Execute este comando:

```sql
-- Habilitar Realtime na tabela transactions
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
```

3. Clique em **"Run"** ou pressione `Ctrl+Enter`
4. Deve aparecer "Success" ✅

### 1.5. Verificar se funcionou

1. Volte para a página da tabela `transactions`
2. Verifique se o Realtime está habilitado
3. Ou execute este comando no SQL Editor:

```sql
-- Verificar se Realtime está habilitado
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'transactions';
```

4. Se retornar uma linha com `transactions`, está funcionando! ✅

---

## ✅ PASSO 2: Verificar/Corrigir Políticas RLS

### 2.1. Acessar a tabela `transactions`

1. No menu lateral, clique em **"Database"**
2. Clique em **"Tables"**
3. Encontre e clique na tabela **`transactions`**

### 2.2. Verificar se RLS está habilitado

1. Na página da tabela, procure pela seção **"Row Level Security (RLS)"**
2. Verifique se está **habilitado** (toggle ativado)
3. Se não estiver, **ative o toggle**

### 2.3. Verificar políticas existentes

1. Clique na aba **"Policies"** (ao lado de "Columns", "Indexes", etc.)
2. Você verá uma lista de políticas

**Políticas necessárias:**
- `Users can view own transactions` (SELECT)
- `Users can insert own transactions` (INSERT)
- `Users can update own transactions` (UPDATE)
- `Users can delete own transactions` (DELETE)

### 2.4. Se as políticas não existirem, criar:

1. Clique em **"New Policy"** ou **"Create Policy"**
2. Selecione **"Create policy from scratch"** ou **"For full customization"**

#### Política 1: SELECT (Visualizar)

**Nome da política:** `Users can view own transactions`

**Comando SQL:**
```sql
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);
```

**Como criar:**
1. Clique em "New Policy"
2. Nome: `Users can view own transactions`
3. Allowed operation: **SELECT**
4. Policy definition: Cole o código acima
5. Clique em "Review" e depois "Save policy"

#### Política 2: INSERT (Inserir)

**Nome da política:** `Users can insert own transactions`

**Comando SQL:**
```sql
CREATE POLICY "Users can insert own transactions"
ON transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Como criar:**
1. Clique em "New Policy"
2. Nome: `Users can insert own transactions`
3. Allowed operation: **INSERT**
4. Policy definition: Cole o código acima
5. Clique em "Review" e depois "Save policy"

#### Política 3: UPDATE (Atualizar)

**Nome da política:** `Users can update own transactions`

**Comando SQL:**
```sql
CREATE POLICY "Users can update own transactions"
ON transactions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

**Como criar:**
1. Clique em "New Policy"
2. Nome: `Users can update own transactions`
3. Allowed operation: **UPDATE**
4. Policy definition: Cole o código acima
5. Clique em "Review" e depois "Save policy"

#### Política 4: DELETE (Excluir)

**Nome da política:** `Users can delete own transactions`

**Comando SQL:**
```sql
CREATE POLICY "Users can delete own transactions"
ON transactions FOR DELETE
USING (auth.uid() = user_id);
```

**Como criar:**
1. Clique em "New Policy"
2. Nome: `Users can delete own transactions`
3. Allowed operation: **DELETE**
4. Policy definition: Cole o código acima
5. Clique em "Review" e depois "Save policy"

### 2.5. Verificar se todas as políticas foram criadas

1. Volte para a aba **"Policies"**
2. Você deve ver 4 políticas listadas
3. Todas devem estar **"Active"** ou **"Ativa"**

---

## ✅ PASSO 3: Executar Scripts SQL para Funções de Administração

### 3.1. Acessar SQL Editor

1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New query"** ou **"Nova consulta"**

### 3.2. Verificar se a tabela `user_profiles` existe

Antes de criar as funções, vamos verificar se a tabela existe:

```sql
-- Verificar se a tabela user_profiles existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'user_profiles'
);
```

**Execute este comando:**
1. Cole o código acima no SQL Editor
2. Clique em **"Run"** ou pressione `Ctrl+Enter`
3. Se retornar `true`, a tabela existe ✅
4. Se retornar `false`, precisamos criá-la (veja passo 3.3)

### 3.3. Criar tabela `user_profiles` (se não existir)

Se a tabela não existir, execute este script:

```sql
-- Criar tabela user_profiles se não existir
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem seus próprios perfis
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = user_id);

-- Política para admins verem todos os perfis
CREATE POLICY "Admins can view all profiles"
ON user_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Política para usuários atualizarem seus próprios perfis
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para admins atualizarem qualquer perfil
CREATE POLICY "Admins can update any profile"
ON user_profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);
```

**Execute este script:**
1. Cole todo o código acima no SQL Editor
2. Clique em **"Run"** ou pressione `Ctrl+Enter`
3. Deve aparecer "Success. No rows returned" ✅

### 3.4. Criar função para buscar usuários (apenas admins)

```sql
-- Função para buscar usuários (apenas admins)
CREATE OR REPLACE FUNCTION get_admin_users()
RETURNS TABLE(
    id UUID,
    email TEXT,
    email_confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    raw_user_meta_data JSONB,
    role TEXT,
    full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem acessar esta função';
    END IF;

    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.email_confirmed_at,
        u.created_at,
        u.last_sign_in_at,
        u.raw_user_meta_data,
        COALESCE(up.role, 'user') as role,
        COALESCE(up.full_name, u.raw_user_meta_data->>'full_name', '') as full_name
    FROM auth.users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    ORDER BY u.created_at DESC;
END;
$$;
```

**Execute este script:**
1. Cole o código acima no SQL Editor
2. Clique em **"Run"**
3. Deve aparecer "Success. No rows returned" ✅

### 3.5. Criar função para atualizar role do usuário

```sql
-- Função para atualizar role do usuário
CREATE OR REPLACE FUNCTION update_user_role(
    target_user_id UUID,
    new_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem atualizar roles';
    END IF;

    -- Validar role
    IF new_role NOT IN ('admin', 'user', 'viewer') THEN
        RAISE EXCEPTION 'Role inválido. Use: admin, user ou viewer';
    END IF;

    -- Atualizar ou inserir role no user_profiles
    INSERT INTO user_profiles (user_id, role, full_name)
    VALUES (
        target_user_id, 
        new_role, 
        COALESCE(
            (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = target_user_id),
            ''
        )
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = new_role,
        updated_at = NOW();

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Role atualizado com sucesso'
    );
END;
$$;
```

**Execute este script:**
1. Cole o código acima no SQL Editor
2. Clique em **"Run"**
3. Deve aparecer "Success. No rows returned" ✅

### 3.6. Criar função para deletar usuário (opcional)

```sql
-- Função para deletar usuário (apenas admins)
CREATE OR REPLACE FUNCTION delete_admin_user(
    target_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem deletar usuários';
    END IF;

    -- Não permitir deletar a si mesmo
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Você não pode deletar seu próprio usuário';
    END IF;

    -- Deletar perfil (cascade deletará o usuário se configurado)
    DELETE FROM user_profiles WHERE user_id = target_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Usuário deletado com sucesso'
    );
END;
$$;
```

**Execute este script:**
1. Cole o código acima no SQL Editor
2. Clique em **"Run"**
3. Deve aparecer "Success. No rows returned" ✅

### 3.7. Verificar se as funções foram criadas

Execute este comando para listar todas as funções:

```sql
-- Listar funções criadas
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%admin%' OR routine_name LIKE '%user%'
ORDER BY routine_name;
```

**Você deve ver:**
- `get_admin_users`
- `update_user_role`
- `delete_admin_user`

---

## ✅ PASSO 4: Criar Perfil de Admin (Se Necessário)

### 4.1. Verificar se você tem perfil de admin

Execute este comando (substitua `SEU_USER_ID` pelo seu ID de usuário):

```sql
-- Verificar seu role atual
SELECT 
    u.email,
    COALESCE(up.role, 'user') as role,
    up.full_name
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.id = auth.uid();
```

### 4.2. Se não for admin, criar perfil de admin

**Opção A: Via SQL (se você tiver acesso direto)**

```sql
-- Criar perfil de admin para seu usuário
INSERT INTO user_profiles (user_id, role, full_name)
VALUES (
    auth.uid(), 
    'admin',
    COALESCE(
        (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth.uid()),
        'Administrador'
    )
)
ON CONFLICT (user_id) 
DO UPDATE SET 
    role = 'admin',
    updated_at = NOW();
```

**Opção B: Via Supabase Dashboard**

1. Vá em **Database** → **Tables** → **`user_profiles`**
2. Clique em **"Insert row"** ou **"Inserir linha"**
3. Preencha:
   - `user_id`: Seu ID de usuário (encontre em **Authentication** → **Users**)
   - `role`: `admin`
   - `full_name`: Seu nome
4. Clique em **"Save"**

---

## ✅ PASSO 5: Testar Tudo

### 5.1. Testar Realtime

1. Abra o sistema em **duas abas** diferentes do navegador
2. Faça login com o mesmo usuário em ambas
3. Na primeira aba, **crie uma nova transação**
4. **Resultado esperado**: A segunda aba deve atualizar automaticamente sem refresh ✅

### 5.2. Testar Administração de Usuários

1. Faça login como administrador
2. Acesse a página de administração de usuários
3. **Resultado esperado**: Deve carregar a lista de usuários ✅

---

## 📋 Checklist Final

- [ ] Realtime habilitado na tabela `transactions`
- [ ] RLS habilitado na tabela `transactions`
- [ ] 4 políticas RLS criadas (SELECT, INSERT, UPDATE, DELETE)
- [ ] Tabela `user_profiles` existe
- [ ] Função `get_admin_users` criada
- [ ] Função `update_user_role` criada
- [ ] Função `delete_admin_user` criada
- [ ] Perfil de admin criado para seu usuário
- [ ] Teste de Realtime funcionando (duas abas)
- [ ] Teste de administração funcionando

---

## 🆘 Problemas Comuns

### Erro: "permission denied for table"

**Solução:** Verifique se RLS está habilitado e as políticas foram criadas corretamente.

### Erro: "function does not exist"

**Solução:** Verifique se executou todos os scripts SQL na ordem correta.

### Realtime não funciona

**Solução:** 
1. Verifique se Realtime está habilitado na tabela
2. Verifique o console do navegador para erros
3. Verifique se `user_id` está sendo enviado nas transações

### Não consigo acessar administração de usuários

**Solução:**
1. Verifique se você tem role 'admin' na tabela `user_profiles`
2. Execute o script do Passo 4 para criar perfil de admin

---

## 📞 Próximos Passos

Depois de completar todos os passos:

1. **Teste o sistema** em duas abas diferentes
2. **Verifique os logs** no console do navegador
3. **Reporte qualquer problema** encontrado

**Tudo pronto! 🎉**

