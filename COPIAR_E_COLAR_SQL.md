# 📋 Script SQL Completo - Copiar e Colar

## 🎯 Instruções

1. **Copie TODO o código abaixo** (do início ao fim)
2. Vá no **Supabase SQL Editor**
3. **Cole** no editor
4. Clique em **"Run"** ou pressione `Ctrl+Enter`
5. Aguarde a execução (pode levar alguns segundos)

---

## 📝 Script Completo

```sql
-- ============================================
-- SCRIPTS SQL COMPLETOS PARA SUPABASE
-- Sistema de Controle Financeiro
-- ============================================

-- ============================================
-- SEÇÃO 1: CRIAR TABELA user_profiles
-- ============================================

-- Criar tabela user_profiles se não existir
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Habilitar RLS na tabela user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem seus próprios perfis
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = user_id);

-- Política para admins verem todos os perfis
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
ON user_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Política para usuários atualizarem seus próprios perfis
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para admins atualizarem qualquer perfil
DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;
CREATE POLICY "Admins can update any profile"
ON user_profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Política para admins inserirem perfis
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
CREATE POLICY "Admins can insert profiles"
ON user_profiles FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- SEÇÃO 2: POLÍTICAS RLS PARA TABELA transactions
-- ============================================

-- Habilitar RLS na tabela transactions (se ainda não estiver)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem (para evitar duplicatas)
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

-- Política 1: SELECT (Visualizar)
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

-- Política 2: INSERT (Inserir)
CREATE POLICY "Users can insert own transactions"
ON transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política 3: UPDATE (Atualizar)
CREATE POLICY "Users can update own transactions"
ON transactions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política 4: DELETE (Excluir)
CREATE POLICY "Users can delete own transactions"
ON transactions FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- SEÇÃO 3: FUNÇÕES RPC PARA ADMINISTRAÇÃO DE USUÁRIOS
-- ============================================

-- Função 1: Buscar usuários (apenas admins)
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

-- Função 2: Atualizar role do usuário
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

-- Função 3: Deletar usuário (apenas admins)
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

    -- Deletar perfil
    DELETE FROM user_profiles WHERE user_id = target_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Usuário deletado com sucesso'
    );
END;
$$;

-- ============================================
-- SEÇÃO 4: CRIAR PERFIL DE ADMIN PARA SEU USUÁRIO
-- ============================================

-- Criar perfil de admin para seu usuário atual
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

-- ============================================
-- SEÇÃO 5: VERIFICAÇÕES E TESTES
-- ============================================

-- Verificar se a tabela user_profiles existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'user_profiles'
) as user_profiles_exists;

-- Verificar seu role atual
SELECT 
    u.email,
    COALESCE(up.role, 'user') as role,
    up.full_name
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.id = auth.uid();
```

---

## ✅ O que este script faz:

1. ✅ Cria a tabela `user_profiles` (se não existir)
2. ✅ Configura políticas RLS para `user_profiles` e `transactions`
3. ✅ Cria funções RPC para administração de usuários:
   - `get_admin_users()` - Listar usuários (apenas admins)
   - `update_user_role()` - Atualizar role de usuário
   - `delete_admin_user()` - Deletar usuário
4. ✅ Cria perfil de admin para seu usuário atual
5. ✅ Executa verificações finais

---

## 🎯 Após executar:

1. Verifique se apareceu "Success" ou "No rows returned"
2. Execute a última query (verificação) para confirmar seu role de admin
3. Teste o sistema em 2 abas diferentes para ver o Realtime funcionando

---

**Copie tudo acima e cole no SQL Editor!** 🚀

