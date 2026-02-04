# 🔧 Corrigir Administração de Usuários

## Problemas Identificados

1. **Erro ao deletar**: `Could not find the function public.delete_admin_user(user_id)`
2. **Status "Pendente"**: Usuários aparecem como pendentes porque o email não foi confirmado
3. **Sem edição**: Não há opção para editar informações dos usuários

## Solução Passo a Passo

### Passo 1: Executar Script SQL

1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em **SQL Editor** no menu lateral
4. Copie e cole o conteúdo do arquivo `CORRIGIR_ADMIN_USUARIOS_COMPLETO.sql`
5. Clique em **Run** para executar

Este script irá:
- ✅ Criar a função `delete_admin_user` que estava faltando
- ✅ Criar a função `confirm_user_email` para resolver status "Pendente"
- ✅ Criar a função `update_admin_user` para editar usuários
- ✅ Atualizar status de usuários pendentes

### Passo 2: Confirmar Emails Pendentes

Após executar o script, você tem duas opções:

#### Opção A: Via Dashboard do Supabase (Recomendado)
1. Vá para **Authentication** → **Users**
2. Encontre o usuário com status "Pendente"
3. Clique no usuário
4. Clique em **Confirm Email** ou marque **Email Confirmed**

#### Opção B: Via SQL (Alternativa)
Execute para cada usuário pendente:
```sql
SELECT confirm_user_email('user_id_aqui');
```

Ou confirme todos de uma vez:
```sql
-- Listar usuários pendentes
SELECT user_id, email 
FROM public.user_profiles up
LEFT JOIN auth.users u ON u.id = up.user_id
WHERE u.email_confirmed_at IS NULL;

-- Para cada user_id retornado, execute:
SELECT confirm_user_email('user_id');
```

### Passo 3: Testar Funcionalidades

Após executar o script e atualizar a aplicação:

1. **Deletar Usuário**:
   - Clique no ícone de lixeira (🗑️) ao lado do usuário
   - Confirme a exclusão
   - O usuário deve ser removido da lista

2. **Confirmar Email**:
   - Para usuários com status "Pendente", aparecerá um ícone de email (✉️)
   - Clique no ícone para confirmar o email
   - O status deve mudar para "Confirmado"

3. **Editar Usuário**:
   - Clique no ícone de edição (✏️) ao lado do usuário
   - Um modal abrirá com os campos editáveis:
     - Nome
     - Nome Completo
     - Email
     - Role (Usuário/Administrador/Visualizador)
   - Faça as alterações e clique em "Salvar"

4. **Alterar Role**:
   - Use o dropdown na coluna "Role" para alterar rapidamente
   - Ou use o modal de edição para mais opções

## Funcionalidades Adicionadas

### 1. Deletar Usuário
- ✅ Função `delete_admin_user` criada
- ✅ Fallback para deletar diretamente da tabela `user_profiles`
- ✅ Confirmação antes de deletar
- ✅ Prevenção de auto-exclusão

### 2. Confirmar Email
- ✅ Função `confirm_user_email` criada
- ✅ Botão de confirmação para usuários pendentes
- ✅ Atualiza status no perfil
- ⚠️ **Nota**: Para confirmar completamente no `auth.users`, use o dashboard do Supabase

### 3. Editar Usuário
- ✅ Função `update_admin_user` criada
- ✅ Modal de edição com todos os campos
- ✅ Validação de dados
- ✅ Fallback para atualizar diretamente na tabela

## Status "Pendente" - Explicação

O status "Pendente" aparece quando:
- O campo `email_confirmed_at` no `auth.users` é `NULL`
- Isso significa que o usuário ainda não confirmou o email

**Como resolver:**
1. **Via Dashboard Supabase** (melhor opção):
   - Authentication → Users → Selecionar usuário → Confirm Email

2. **Via Código**:
   - Use a função `confirm_user_email` criada no script
   - Ou atualize manualmente no dashboard

3. **Para novos usuários**:
   - Configure o Supabase para não exigir confirmação de email
   - Ou envie email de confirmação automaticamente

## Verificações

Após executar o script, verifique:

```sql
-- Verificar se as funções foram criadas
SELECT routine_name 
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('delete_admin_user', 'confirm_user_email', 'update_admin_user');

-- Verificar usuários pendentes
SELECT 
    up.user_id,
    up.email,
    up.role,
    CASE 
        WHEN u.email_confirmed_at IS NULL THEN 'Pendente'
        ELSE 'Confirmado'
    END as status
FROM public.user_profiles up
LEFT JOIN auth.users u ON u.id = up.user_id
ORDER BY up.created_at DESC;
```

## Próximos Passos

1. ✅ Execute o script SQL
2. ✅ Confirme emails pendentes
3. ✅ Teste deletar usuário
4. ✅ Teste editar usuário
5. ✅ Teste confirmar email

---

**Nota Importante**: 
- A função `delete_admin_user` deleta o perfil do usuário, mas pode não deletar o usuário do `auth.users` (requer permissões especiais do Supabase)
- Para deletar completamente, use o dashboard do Supabase: Authentication → Users → Delete User
- A confirmação de email via função atualiza o perfil, mas para confirmar no `auth.users`, use o dashboard do Supabase
