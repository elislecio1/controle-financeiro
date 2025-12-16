# Solução para "Acesso Negado - Não definido"

## Problema
Após fazer login, aparece "Acesso Negado" com "Seu nível de acesso: Não definido".

## Causa
O perfil do usuário não existe na tabela `user_profiles` ou não tem o campo `role` definido.

## Solução Rápida (Execute no Supabase SQL Editor)

### Opção 1: SQL Simples (Recomendado)

```sql
-- Verificar se o perfil existe
SELECT user_id, email, name, role, full_name, metadata
FROM user_profiles
WHERE user_id = '16290525-2b7f-4157-86f5-7e1c165fc070';

-- Criar ou atualizar perfil
INSERT INTO user_profiles (user_id, email, name, role, full_name, metadata, preferences)
VALUES (
  '16290525-2b7f-4157-86f5-7e1c165fc070',
  'elislecio@gmail.com',
  'Elislécio Ferreira',
  'admin',
  'Elislécio Ferreira',
  '{"theme": "light", "currency": "BRL", "language": "pt-BR"}'::jsonb,
  '{"theme": "light", "currency": "BRL", "language": "pt-BR", "dashboard": {"show_stats": true, "show_charts": true, "default_period": "current_month"}, "date_format": "DD/MM/YYYY", "notifications": {"sms": false, "push": true, "email": true}}'::jsonb
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = 'admin',
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Verificar resultado
SELECT user_id, email, name, role, full_name, created_at, updated_at
FROM user_profiles
WHERE user_id = '16290525-2b7f-4157-86f5-7e1c165fc070';
```

### Opção 2: Usar Função RPC (Mais Robusta)

Execute o arquivo `CRIAR_PERFIL_ADMIN_COMPLETO.sql` que cria uma função RPC que contorna as políticas RLS.

## Passos Após Executar o SQL

1. **Limpar cache do navegador:**
   - Pressione `Ctrl + Shift + Delete`
   - Selecione "Cookies e outros dados do site"
   - Clique em "Limpar dados"

2. **Ou usar modo anônimo:**
   - Abra uma janela anônima (`Ctrl + Shift + N`)
   - Acesse o site novamente

3. **Ou limpar Local Storage:**
   - Pressione `F12` para abrir DevTools
   - Vá em "Application" > "Local Storage"
   - Delete todos os itens do domínio

4. **Fazer logout e login novamente:**
   - Use o botão "Sair da conta" na página de erro
   - Faça login novamente

## Verificar se Funcionou

Após fazer login, você deve ver:
- ✅ Seu nível de acesso: **admin** (ou **user**)
- ✅ Acesso ao sistema sem erros

## Se Ainda Não Funcionar

1. **Verifique no Supabase:**
   ```sql
   SELECT * FROM user_profiles WHERE user_id = '16290525-2b7f-4157-86f5-7e1c165fc070';
   ```
   Deve retornar uma linha com `role = 'admin'` ou `role = 'user'`.

2. **Verifique as políticas RLS:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
   ```
   Deve haver uma política que permite SELECT para `auth.uid() = user_id`.

3. **Verifique o console do navegador:**
   - Pressione `F12`
   - Vá em "Console"
   - Procure por mensagens de erro ou logs que começam com 🔍, ⚠️, ✅ ou ❌

4. **Envie os logs do console** para análise.

## Nota Importante

O código agora tenta criar o perfil automaticamente, mas pode falhar devido a políticas RLS. Por isso, é necessário executar o SQL manualmente pelo menos uma vez para criar o perfil inicial.

