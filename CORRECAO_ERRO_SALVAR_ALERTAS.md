# Correção do Erro "erro ao salvar" nas Configurações de Alertas

## Problema Identificado

O erro "erro ao salvar" nas configurações de alertas estava ocorrendo porque as tabelas de alertas (`alertas`, `configuracoes_alertas`, `notificacoes`) não tinham as políticas RLS (Row Level Security) configuradas corretamente no Supabase.

## Causa Raiz

1. **RLS não habilitado**: As tabelas de alertas não tinham RLS habilitado
2. **Políticas ausentes**: Não havia políticas RLS definidas para permitir operações
3. **Bloqueio de acesso**: Sem políticas, o Supabase bloqueia todas as operações por padrão

## Solução Implementada

### 1. Atualização do Schema SQL

Adicionamos ao `supabase_schema.sql`:

```sql
-- Habilitar RLS nas tabelas de alertas
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Allow all operations for authenticated users" ON alertas 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON configuracoes_alertas 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON notificacoes 
FOR ALL USING (auth.role() = 'authenticated');
```

### 2. Script de Correção

Criamos o arquivo `fix_alertas_rls.sql` para aplicar as correções:

```sql
-- =====================================================
-- CORREÇÃO RLS PARA TABELAS DE ALERTAS
-- =====================================================

-- Habilitar RLS nas tabelas de alertas
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para as tabelas de alertas
CREATE POLICY "Allow all operations for authenticated users" ON alertas 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON configuracoes_alertas 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON notificacoes 
FOR ALL USING (auth.role() = 'authenticated');

-- Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('alertas', 'configuracoes_alertas', 'notificacoes');
```

### 3. Logs de Debug Melhorados

Adicionamos logs mais detalhados no `src/services/alertas.ts`:

```typescript
console.log('🔧 Supabase configurado:', this.isSupabaseConfigured())
console.log('🔧 URL Supabase:', SUPABASE_URL)
console.log('📊 Tabela:', this.TABLE_CONFIGURACOES)

// Em caso de erro:
console.error('❌ Código do erro:', error.code)
console.error('❌ Detalhes do erro:', error.details)
console.error('❌ Hint do erro:', error.hint)
console.error('❌ Stack trace:', error.stack)
```

## Como Aplicar a Correção

### Opção 1: Via Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para o projeto do controle financeiro
3. Acesse **SQL Editor**
4. Execute o conteúdo do arquivo `fix_alertas_rls.sql`

### Opção 2: Via CLI do Supabase

```bash
# Se você tem o Supabase CLI instalado
supabase db push --include-all
```

### Opção 3: Via psql

```bash
psql "postgresql://postgres:[password]@[host]:5432/postgres" -f fix_alertas_rls.sql
```

## Verificação da Correção

Após aplicar as correções, você pode verificar se funcionou:

1. **No console do navegador**: Abra as ferramentas de desenvolvedor (F12)
2. **Tente salvar uma configuração**: Vá para Sistema de Alertas → Nova Configuração
3. **Verifique os logs**: Procure por mensagens de sucesso como "✅ Configuração salva com sucesso"
4. **Teste a funcionalidade**: Verifique se as configurações aparecem na lista

## Logs Esperados

### Sucesso:
```
🔧 Salvando configuração: {tipo: "vencimento", ativo: true, ...}
🔧 Supabase configurado: true
🔧 URL Supabase: https://eshaahpcddqkeevxpgfk.supabase.co
📊 Dados para inserção: {tipo: "vencimento", ativo: true, ...}
📊 Tabela: configuracoes_alertas
✅ Configuração salva com sucesso: {id: "...", tipo: "vencimento", ...}
```

### Erro (se ainda houver problemas):
```
❌ Erro ao salvar configuração: {message: "...", code: "...", details: "..."}
❌ Código do erro: 42501
❌ Detalhes do erro: new row violates row-level security policy
```

## Próximos Passos

1. **Aplicar o script SQL** no Supabase
2. **Testar o salvamento** de configurações
3. **Verificar se os alertas** estão sendo gerados corretamente
4. **Monitorar os logs** para garantir que não há mais erros

## Arquivos Modificados

- `supabase_schema.sql` - Adicionadas políticas RLS
- `src/services/alertas.ts` - Logs de debug melhorados
- `fix_alertas_rls.sql` - Script de correção (novo)

## Status

✅ **Deploy concluído** - As correções foram enviadas para produção
⏳ **Aguardando aplicação** - O script SQL precisa ser executado no Supabase
