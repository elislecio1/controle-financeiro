# Guia para Resolver Erro de Triggers Duplicados

## Problema
Ao executar o `supabase_schema.sql`, você está recebendo o erro:
```
ERROR: 42710: trigger "update_transactions_updated_at" for relation "transactions" already exists
```

Este erro ocorre porque o trigger já existe na tabela `transactions` e o PostgreSQL não permite criar triggers com o mesmo nome.

## Solução

### Passo 1: Executar o Script de Limpeza
Execute o script `fix_existing_triggers.sql` **ANTES** de executar o `supabase_schema.sql`:

1. No Supabase Dashboard, vá para **SQL Editor**
2. Abra o arquivo `fix_existing_triggers.sql`
3. Execute o script completo
4. Verifique se a mensagem "Todos os triggers existentes foram verificados e removidos se necessário" aparece

### Passo 2: Executar o Schema Principal
Após executar o script de limpeza com sucesso:

1. Abra o arquivo `supabase_schema.sql`
2. Execute o script completo
3. Agora não deve haver erros de triggers duplicados

## O que o Script Faz

O `fix_existing_triggers.sql`:

1. **Verifica** se cada trigger existe antes de tentar removê-lo
2. **Remove** apenas os triggers que existem, evitando erros
3. **Registra** cada operação com mensagens informativas
4. **Lista** todos os triggers restantes para verificação

## Triggers que Serão Removidos

- `update_transactions_updated_at` (tabela transactions)
- `update_categorias_updated_at` (tabela categorias)
- `update_subcategorias_updated_at` (tabela subcategorias)
- `update_contas_bancarias_updated_at` (tabela contas_bancarias)
- `update_cartoes_credito_updated_at` (tabela cartoes_credito)
- `update_investimentos_updated_at` (tabela investimentos)
- `update_metas_orcamentos_updated_at` (tabela metas_orcamentos)
- `update_contatos_updated_at` (tabela contatos)
- `update_centros_custo_updated_at` (tabela centros_custo)
- `update_negocios_updated_at` (tabela negocios)
- `update_conformidade_fiscal_updated_at` (tabela conformidade_fiscal)
- `update_relatorios_gerenciais_updated_at` (tabela relatorios_gerenciais)
- `update_alertas_updated_at` (tabela alertas)
- `update_configuracoes_alertas_updated_at` (tabela configuracoes_alertas)
- `update_notificacoes_updated_at` (tabela notificacoes)
- `update_integracoes_bancarias_updated_at` (tabela integracoes_bancarias)
- `update_logs_sincronizacao_updated_at` (tabela logs_sincronizacao)
- `update_transacoes_importadas_updated_at` (tabela transacoes_importadas)
- `update_configuracoes_notificacoes_updated_at` (tabela configuracoes_notificacoes)
- `update_historico_notificacoes_updated_at` (tabela historico_notificacoes)

## Por que Isso Acontece

Este problema ocorre quando:
- O schema foi aplicado parcialmente em execuções anteriores
- Triggers foram criados manualmente
- Houve tentativas de aplicar o schema múltiplas vezes

## Verificação

Após executar ambos os scripts, você pode verificar se tudo funcionou:

```sql
-- Verificar se as novas tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'integracoes_bancarias', 
    'logs_sincronizacao', 
    'transacoes_importadas',
    'configuracoes_notificacoes', 
    'historico_notificacoes'
);

-- Verificar se os triggers foram recriados
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname IN (
    'integracoes_bancarias', 
    'logs_sincronizacao', 
    'transacoes_importadas',
    'configuracoes_notificacoes', 
    'historico_notificacoes'
)
ORDER BY c.relname, t.tgname;
```

## Ordem de Execução

1. ✅ `fix_existing_triggers.sql` (limpeza)
2. ✅ `supabase_schema.sql` (schema principal)

## Nota Importante

Este processo é **seguro** e não afeta os dados das suas tabelas. Apenas remove e recria os triggers que controlam o campo `updated_at`.
