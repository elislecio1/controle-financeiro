# Solução: Erro de Recursão Infinita nas Políticas RLS

## Erro
```
infinite recursion detected in policy for relation "user_profiles"
```

## Causa
Uma política RLS está tentando verificar o `role` do usuário na tabela `user_profiles`, mas para fazer isso, precisa acessar a própria tabela `user_profiles`, criando um loop infinito.

## Solução

Execute o arquivo `CORRIGIR_POLITICAS_RLS_RECURSAO.sql` no Supabase SQL Editor.

Este script:
1. ✅ Remove todas as políticas problemáticas
2. ✅ Cria políticas simples que não causam recursão
3. ✅ Usa função SECURITY DEFINER para verificar admin (evita recursão)

## Passos

1. **Abra o Supabase SQL Editor**
2. **Execute o script `CORRIGIR_POLITICAS_RLS_RECURSAO.sql`**
3. **Depois execute o script `ATUALIZAR_PERFIL_USUARIO.sql`** para criar seu perfil
4. **Limpe o cache do navegador** e faça login novamente

## Verificação

Após executar os scripts, teste com:

```sql
-- Deve retornar seu perfil sem erro
SELECT * FROM user_profiles WHERE user_id = auth.uid();
```

Se retornar sem erro, as políticas estão corretas!

