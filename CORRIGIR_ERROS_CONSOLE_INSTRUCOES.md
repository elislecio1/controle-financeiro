# 🔧 Corrigir Erros do Console - Instruções

## ❌ Erros Identificados

1. **Recursão Infinita em RLS**: `infinite recursion detected in policy for relation "user_profiles"`
2. **Tabelas não existem**: `notification_history` e `system_logs` (já tratado no código)

## ✅ Solução

### Passo 1: Corrigir Recursão Infinita nas Políticas RLS

Execute o script SQL no Supabase SQL Editor:

**Arquivo**: `CORRIGIR_RLS_RECURSAO_INFINITA.sql`

Este script:
- Cria uma função auxiliar `is_user_admin()` que usa `SECURITY DEFINER` para evitar recursão
- Remove todas as políticas antigas que causam recursão
- Cria novas políticas RLS usando a função auxiliar

### Passo 2: Verificar se o Script Foi Executado Corretamente

Após executar o script, verifique:

```sql
-- Verificar se a função foi criada
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'is_user_admin';

-- Verificar políticas criadas
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'user_profiles';
```

### Passo 3: Testar

1. Faça logout e login novamente
2. Verifique o console do navegador
3. O erro de recursão infinita deve ter desaparecido

## 📝 Notas

- Os erros de tabelas `notification_history` e `system_logs` não existentes já foram tratados no código (erros 42P01 são ignorados silenciosamente)
- A função `is_user_admin()` usa `SECURITY DEFINER` para bypassar RLS temporariamente e evitar recursão
- As novas políticas RLS são mais eficientes e não causam loops infinitos

## 🔍 Como Funciona

A função `is_user_admin()`:
- Usa `SECURITY DEFINER` para executar com privilégios elevados
- Bypassa RLS temporariamente ao verificar se o usuário é admin
- Retorna `true` ou `false` sem causar recursão

As políticas RLS agora usam:
```sql
USING (public.is_user_admin())  -- Em vez de consultar user_profiles diretamente
```

Isso evita a recursão infinita porque a função usa `SECURITY DEFINER` e não precisa passar pelas políticas RLS.
