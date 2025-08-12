# 🔥 SOLUÇÃO RÁPIDA - Erro de RLS na Tabela Categorias

## O Problema
```
Erro ao salvar categoria: new row violates row-level security policy for table "categorias"
```

## Solução Imediata

### 1. Acesse o Supabase Dashboard
- Vá para: https://supabase.com/dashboard
- Selecione seu projeto
- Clique em **SQL Editor** no menu lateral

### 2. Execute este script EXATO:

```sql
-- Desabilitar RLS para categorias
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;

-- Verificar se funcionou
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'categorias';
```

### 3. Teste Imediatamente
- Volte para a aplicação
- Vá para o Módulo 2 → Categorias
- Tente cadastrar uma nova categoria
- O erro deve desaparecer

## Se ainda não funcionar:

### Alternativa 1 - Script mais completo:
Execute o conteúdo do arquivo `SOLUCAO_RLS_CATEGORIAS.sql` no SQL Editor do Supabase.

### Alternativa 2 - Desabilitar RLS em todas as tabelas:
Execute o conteúdo do arquivo `SOLUCAO_DEFINITIVA_RLS.sql` no SQL Editor do Supabase.

## Por que isso acontece?
- O Supabase tem RLS habilitado por padrão
- RLS impede inserções sem políticas de segurança
- Para desenvolvimento, podemos desabilitar temporariamente

## Importante
- Esta é uma solução temporária para desenvolvimento
- Em produção, você deve configurar políticas RLS adequadas
- Para reabilitar depois: `ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;`

## Próximos Passos
Após resolver o RLS:
1. As categorias serão salvas no banco de dados
2. As categorias aparecerão no dropdown do formulário de transações
3. As subcategorias também funcionarão corretamente
