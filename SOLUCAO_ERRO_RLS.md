# Solução para Erro de Row Level Security (RLS)

## Problema
```
Erro ao salvar conta bancária: new row violates row-level security policy for table "contas_bancarias"
```

## Causa
O Supabase tem Row Level Security (RLS) habilitado por padrão, que impede inserções sem políticas de segurança configuradas.

## Solução

### Passo 1: Acesse o Supabase
1. Vá para o [dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **SQL Editor** no menu lateral

### Passo 2: Execute o Script para Desabilitar RLS
1. No SQL Editor, copie e cole o conteúdo do arquivo `disable_rls_for_testing.sql`
2. Clique em **Run** para executar

### Passo 3: Verificar se Funcionou
1. Volte para a aplicação
2. Tente cadastrar uma conta bancária novamente
3. O erro deve ter sido resolvido

## Script Alternativo (se o primeiro não funcionar)

Se ainda houver problemas, execute este script mais específico:

```sql
-- Desabilitar RLS apenas para contas_bancarias
ALTER TABLE contas_bancarias DISABLE ROW LEVEL SECURITY;

-- Verificar se foi desabilitado
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'contas_bancarias';
```

## Importante
- Esta solução é temporária para desenvolvimento
- Em produção, você deve configurar políticas RLS adequadas
- Para reabilitar RLS posteriormente: `ALTER TABLE contas_bancarias ENABLE ROW LEVEL SECURITY;`

## Próximos Passos
Após resolver o RLS, você poderá:
1. Cadastrar contas bancárias normalmente
2. As contas aparecerão no dropdown do formulário de transações
3. Implementar as demais funcionalidades dos módulos 