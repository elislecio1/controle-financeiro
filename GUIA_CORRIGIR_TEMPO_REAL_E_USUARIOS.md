# 🔧 Guia Completo: Corrigir Tempo Real e Administração de Usuários

## ✅ O Que Foi Implementado

### 1. Serviço de Tempo Real (`realtimeService.ts`)
- ✅ Criado serviço completo usando Supabase Realtime
- ✅ Sincronização automática de transações entre usuários
- ✅ Listeners configurados no `App.tsx`
- ✅ Atualização automática sem necessidade de refresh

### 2. Atualização do App.tsx
- ✅ Configuração automática de listeners quando usuário faz login
- ✅ Recarregamento automático de dados quando há mudanças
- ✅ Cleanup adequado ao desmontar componente

---

## 🔧 Passo 1: Habilitar Realtime no Supabase

### No Supabase Dashboard:

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Habilitar Realtime na tabela `transactions`**
   - Vá em **Database** → **Replication**
   - Encontre a tabela `transactions`
   - Clique no toggle para **habilitar Realtime**
   - Aguarde a confirmação

3. **Verificar se está habilitado**
   - A tabela deve aparecer com status "Enabled" em Realtime

---

## 🔧 Passo 2: Verificar Políticas RLS

### Verificar se RLS está configurado corretamente:

1. **No Supabase Dashboard**
   - Vá em **Database** → **Tables** → `transactions`
   - Clique em **Policies**

2. **Verificar políticas existentes**
   - Deve haver políticas que permitam:
     - `SELECT` para usuários autenticados (filtrado por `user_id`)
     - `INSERT` para usuários autenticados
     - `UPDATE` para usuários autenticados (apenas suas próprias transações)
     - `DELETE` para usuários autenticados (apenas suas próprias transações)

3. **Se não houver políticas, criar:**
   ```sql
   -- Permitir SELECT apenas das próprias transações
   CREATE POLICY "Users can view own transactions"
   ON transactions FOR SELECT
   USING (auth.uid() = user_id);

   -- Permitir INSERT apenas para usuários autenticados
   CREATE POLICY "Users can insert own transactions"
   ON transactions FOR INSERT
   WITH CHECK (auth.uid() = user_id);

   -- Permitir UPDATE apenas das próprias transações
   CREATE POLICY "Users can update own transactions"
   ON transactions FOR UPDATE
   USING (auth.uid() = user_id)
   WITH CHECK (auth.uid() = user_id);

   -- Permitir DELETE apenas das próprias transações
   CREATE POLICY "Users can delete own transactions"
   ON transactions FOR DELETE
   USING (auth.uid() = user_id);
   ```

---

## 🔧 Passo 3: Corrigir Administração de Usuários

### Problema Identificado:
- Funções RPC (`get_admin_users`, `create_admin_user`, etc.) podem não estar criadas
- Políticas RLS podem estar bloqueando acesso

### Solução: Executar Script SQL

1. **Acesse SQL Editor no Supabase**
   - Vá em **SQL Editor** no dashboard
   - Clique em **New Query**

2. **Executar script de funções RPC**

   Verifique se o arquivo `funcoes_admin_usuarios.sql` existe e execute-o.

   Se não existir, execute este script:

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
       role TEXT
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
           COALESCE(up.role, 'user') as role
       FROM auth.users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       ORDER BY u.created_at DESC;
   END;
   $$;

   -- Função para criar usuário (apenas admins)
   CREATE OR REPLACE FUNCTION create_admin_user(
       user_email TEXT,
       user_password TEXT,
       user_name TEXT,
       user_role TEXT DEFAULT 'user'
   )
   RETURNS JSONB
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
       new_user_id UUID;
       result JSONB;
   BEGIN
       -- Verificar se o usuário atual é admin
       IF NOT EXISTS (
           SELECT 1 FROM user_profiles 
           WHERE user_id = auth.uid() AND role = 'admin'
       ) THEN
           RAISE EXCEPTION 'Acesso negado: apenas administradores podem criar usuários';
       END IF;

       -- Verificar se o email já existe
       IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
           RAISE EXCEPTION 'Email já existe no sistema';
       END IF;

       -- Validar role
       IF user_role NOT IN ('admin', 'user', 'viewer') THEN
           RAISE EXCEPTION 'Role inválido. Use: admin, user ou viewer';
       END IF;

       -- Criar usuário (requer service_role key - executar via API ou Admin)
       -- Esta função precisa ser executada com privilégios de admin
       -- Por segurança, use a API do Supabase Admin para criar usuários
       
       RETURN jsonb_build_object(
           'success', false,
           'message', 'Use a API Admin do Supabase para criar usuários'
       );
   END;
   $$;

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
       VALUES (target_user_id, new_role, COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = target_user_id), ''))
       ON CONFLICT (user_id) 
       DO UPDATE SET role = new_role;

       RETURN jsonb_build_object(
           'success', true,
           'message', 'Role atualizado com sucesso'
       );
   END;
   $$;
   ```

3. **Verificar tabela `user_profiles`**
   - Certifique-se de que a tabela existe
   - Verifique se tem as colunas: `user_id`, `role`, `full_name`

---

## 🧪 Testar Tempo Real

### Teste 1: Abrir duas abas do navegador

1. Abra o sistema em duas abas diferentes (ou dois navegadores)
2. Faça login com o mesmo usuário em ambas
3. Na primeira aba, crie uma nova transação
4. **Resultado esperado**: A segunda aba deve atualizar automaticamente sem refresh

### Teste 2: Verificar logs no console

1. Abra o console do navegador (F12)
2. Crie uma transação
3. **Resultado esperado**: Deve aparecer logs como:
   - "Mudança detectada nas transações: INSERT"
   - "Nova transação criada - recarregando dados..."
   - "Dados carregados com sucesso!"

---

## 🧪 Testar Administração de Usuários

### Teste 1: Acessar página de administração

1. Faça login como administrador
2. Acesse a página de administração de usuários
3. **Resultado esperado**: Deve carregar a lista de usuários

### Teste 2: Criar novo usuário

1. Tente criar um novo usuário
2. **Se der erro**: Verifique se as funções RPC foram criadas
3. **Se funcionar**: Usuário deve aparecer na lista

---

## ❌ Troubleshooting

### Problema: Tempo real não funciona

**Possíveis causas:**
1. Realtime não habilitado no Supabase
2. Políticas RLS bloqueando acesso
3. Erro de conexão

**Solução:**
1. Verificar se Realtime está habilitado (Passo 1)
2. Verificar políticas RLS (Passo 2)
3. Verificar console do navegador para erros
4. Verificar se `user_id` está sendo enviado corretamente nas transações

### Problema: Administração de usuários não funciona

**Possíveis causas:**
1. Funções RPC não foram criadas
2. Usuário não tem role 'admin'
3. Tabela `user_profiles` não existe

**Solução:**
1. Executar script SQL (Passo 3)
2. Verificar se usuário tem role 'admin' na tabela `user_profiles`
3. Criar tabela `user_profiles` se não existir

---

## 📝 Checklist de Verificação

- [ ] Realtime habilitado na tabela `transactions` no Supabase
- [ ] Políticas RLS configuradas corretamente
- [ ] Funções RPC criadas no Supabase
- [ ] Tabela `user_profiles` existe e tem dados
- [ ] Usuário atual tem role 'admin' (para testar admin)
- [ ] Teste de tempo real funcionando (duas abas)
- [ ] Teste de administração de usuários funcionando

---

## 🎯 Próximos Passos

1. **Habilitar Realtime no Supabase** (Passo 1)
2. **Verificar/Corrigir Políticas RLS** (Passo 2)
3. **Executar Script SQL para Admin** (Passo 3)
4. **Testar ambas as funcionalidades** (Testes)
5. **Reportar resultados**

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no console do navegador
2. Verifique os logs no Supabase Dashboard → Logs
3. Verifique se todas as etapas foram seguidas

