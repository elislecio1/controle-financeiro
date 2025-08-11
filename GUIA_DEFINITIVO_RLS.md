# 🔥 GUIA DEFINITIVO - Resolver Erro de RLS

## O Problema
```
Erro ao salvar conta bancária: new row violates row-level security policy for table "contas_bancarias"
```

## Solução Definitiva

### Passo 1: Acesse o Supabase
1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em **SQL Editor** no menu lateral

### Passo 2: Execute o Script Completo
1. No SQL Editor, copie e cole o conteúdo do arquivo `SOLUCAO_DEFINITIVA_RLS.sql`
2. Clique em **Run** para executar

### Passo 3: Se as Tabelas Não Existem
Se o script mostrar que as tabelas não existem, execute também o `recreate_tables.sql`:

1. Copie e cole o conteúdo do arquivo `recreate_tables.sql`
2. Clique em **Run** para executar
3. Depois execute novamente o `SOLUCAO_DEFINITIVA_RLS.sql`

### Passo 4: Verificar se Funcionou
Execute esta consulta para verificar:

```sql
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'contas_bancarias';
```

O resultado deve mostrar `rowsecurity = false`

### Passo 5: Teste na Aplicação
1. Volte para a aplicação
2. Tente cadastrar uma conta bancária
3. O erro deve ter desaparecido

## Script Alternativo (Se o primeiro não funcionar)

Execute este script mais simples:

```sql
-- Desabilitar RLS apenas para contas_bancarias
ALTER TABLE contas_bancarias DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'contas_bancarias';
```

## Por que isso acontece?
- O Supabase tem Row Level Security (RLS) habilitado por padrão
- RLS impede inserções sem políticas de segurança configuradas
- Para desenvolvimento, podemos desabilitar temporariamente

## Importante
- Esta é uma solução temporária para desenvolvimento
- Em produção, você deve configurar políticas RLS adequadas
- Para reabilitar depois: `ALTER TABLE contas_bancarias ENABLE ROW LEVEL SECURITY;`

## Próximos Passos
Após resolver o RLS:
1. ✅ Cadastrar contas bancárias
2. ✅ As contas aparecerão no dropdown de transações
3. ✅ Continuar com os demais módulos 