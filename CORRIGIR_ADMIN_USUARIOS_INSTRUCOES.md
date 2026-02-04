# 🔧 Corrigir Administração de Usuários

## Problema
A página de "Administração de Usuários" está mostrando erro "Erro ao carregar usuários" e não consegue listar os usuários do sistema.

## Causa
- Políticas RLS muito restritivas na tabela `user_profiles`
- Função RPC `get_admin_users` pode não existir
- Admins não têm permissão para ver todos os usuários

## Solução

### 1. Execute o Script SQL no Supabase

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `CORRIGIR_ADMINISTRACAO_USUARIOS.sql`
4. Clique em **Run** (ou pressione Ctrl+Enter)

Este script irá:
- ✅ Criar/corrigir a tabela `user_profiles`
- ✅ Habilitar RLS corretamente
- ✅ Criar políticas RLS que permitem admins verem todos os usuários
- ✅ Criar funções RPC necessárias
- ✅ Sincronizar perfis existentes

### 2. Verificar se Funcionou

Após executar o script:

1. Recarregue a página de Administração de Usuários
2. Os usuários devem aparecer na lista
3. Você deve conseguir:
   - Ver todos os usuários
   - Alterar roles
   - Criar novos usuários
   - Deletar usuários

### 3. Se Ainda Não Funcionar

O código foi atualizado para ter um **fallback**:
- Primeiro tenta usar a função RPC `get_admin_users`
- Se falhar, busca diretamente da tabela `user_profiles`
- Isso garante que funcione mesmo sem as funções RPC

## O que foi Corrigido no Código

### `src/pages/AdminUserManagement.tsx`

1. **loadUsers()** - Agora tem fallback:
   - Tenta RPC primeiro
   - Se falhar, busca diretamente de `user_profiles`
   - Melhor tratamento de erros

2. **updateUserRole()** - Agora tem fallback:
   - Tenta RPC primeiro
   - Se falhar, atualiza diretamente na tabela

## Verificação

Após executar o script SQL, verifique:

```sql
-- Verificar políticas RLS
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Verificar funções RPC
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_admin_users', 'update_user_role');

-- Verificar se há usuários
SELECT COUNT(*) FROM public.user_profiles;
```

## Próximos Passos

1. ✅ Execute o script SQL
2. ✅ Recarregue a página
3. ✅ Teste criar/editar/deletar usuários
4. ✅ Se funcionar, faça commit das alterações

## Troubleshooting

### Erro: "Acesso negado"
- Verifique se seu usuário tem role 'admin' na tabela `user_profiles`
- Execute: `SELECT * FROM user_profiles WHERE user_id = auth.uid();`

### Erro: "Tabela não existe"
- O script cria a tabela automaticamente
- Verifique se executou o script completo

### Erro: "Função não existe"
- O código agora tem fallback, deve funcionar mesmo sem as funções RPC
- Mas é recomendado executar o script SQL para criar as funções
