# 🔧 Corrigir Contas Bancárias Não Aparecendo

## Problema Identificado

As contas bancárias cadastradas não estão aparecendo nos dropdowns e filtros do sistema.

## Possíveis Causas

1. **Campo `ativo = false` ou `NULL`**: O sistema filtra apenas contas com `ativo = true`
2. **Problemas de RLS (Row Level Security)**: Políticas de segurança podem estar bloqueando a visualização
3. **Erro na consulta ao banco de dados**

## Solução Passo a Passo

### Passo 1: Executar Script de Diagnóstico

1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em **SQL Editor** no menu lateral
4. Copie e cole o conteúdo do arquivo `CORRIGIR_CONTAS_BANCARIAS.sql`
5. Clique em **Run** para executar

Este script irá:
- ✅ Verificar se a tabela existe
- ✅ Contar quantas contas existem e seus status
- ✅ Listar todas as contas
- ✅ Verificar configurações de RLS
- ✅ Criar políticas RLS se necessário
- ✅ Atualizar contas com `ativo = NULL` para `ativo = true`

### Passo 2: Verificar os Resultados

Após executar o script, verifique:

1. **Total de contas**: Deve mostrar quantas contas existem no banco
2. **Contas ativas**: Deve mostrar quantas têm `ativo = true`
3. **Contas inativas**: Se houver contas inativas, elas não aparecerão no sistema
4. **RLS habilitado**: Se estiver habilitado, as políticas devem permitir visualização

### Passo 3: Ativar Contas Inativas (se necessário)

Se você encontrar contas com `ativo = false` que devem aparecer, execute:

```sql
-- Ativar todas as contas
UPDATE contas_bancarias 
SET ativo = true;
```

Ou para ativar contas específicas:

```sql
-- Ativar conta específica por nome
UPDATE contas_bancarias 
SET ativo = true 
WHERE nome = 'Nome da Conta';
```

### Passo 4: Verificar no Console do Navegador

1. Abra a aplicação no navegador
2. Pressione `F12` para abrir o DevTools
3. Vá para a aba **Console**
4. Procure por mensagens como:
   - `📊 Buscando contas bancárias no Supabase...`
   - `📊 Total de contas no banco: X`
   - `📊 Contas ativas: X`
   - `✅ Contas bancárias ativas carregadas: X registros`

### Passo 5: Testar a Aplicação

1. Recarregue a página (F5)
2. Verifique se as contas aparecem nos dropdowns:
   - Filtro por Conta Bancária
   - Cadastro de Transações
   - Formulários que usam contas

## Melhorias Implementadas no Código

O código foi atualizado para:

1. **Diagnóstico melhorado**: Agora mostra quantas contas existem no total, quantas estão ativas, inativas e sem status
2. **Fallback automático**: Se houver erro ao buscar contas ativas, tenta buscar todas as contas
3. **Tratamento de NULL**: Contas com `ativo = NULL` são tratadas como ativas no fallback

## Se Ainda Não Funcionar

### Verificar RLS Manualmente

Execute no SQL Editor:

```sql
-- Verificar se RLS está bloqueando
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'contas_bancarias';

-- Se rowsecurity = true, desabilitar temporariamente para teste
ALTER TABLE contas_bancarias DISABLE ROW LEVEL SECURITY;
```

### Verificar se as Contas Existem

```sql
SELECT 
    id,
    nome,
    tipo,
    banco,
    ativo,
    created_at
FROM contas_bancarias
ORDER BY created_at DESC;
```

### Verificar Erros no Console

Se houver erros no console do navegador, eles podem indicar:
- Problemas de autenticação
- Problemas de conexão com Supabase
- Erros de permissão

## Próximos Passos

Após corrigir, as contas devem aparecer automaticamente em:
- ✅ Filtro por Conta Bancária (no dashboard principal)
- ✅ Dropdown de Conta (no cadastro de transações)
- ✅ Módulo de Contas Bancárias
- ✅ Formulários de integração bancária

---

**Nota**: Se você precisar manter algumas contas inativas (não aparecerem), deixe-as com `ativo = false`. Apenas contas com `ativo = true` aparecerão no sistema.
