# 🔧 Solução para Erro de RLS em Centros de Custo

## ❌ Problema Identificado
```
Erro ao salvar: Erro ao salvar centro de custo: new row violates row-level security policy for table "centros_custo"
```

## 🔍 Causa do Problema
O Supabase tem **Row Level Security (RLS)** ativado por padrão na tabela `centros_custo`, mas não há políticas configuradas para permitir que usuários autenticados insiram, atualizem ou deletem registros.

## ✅ Solução

### Passo 1: Executar no Supabase SQL Editor

#### 1.1 Adicionar coluna user_id (se não existir)
```sql
-- Adicionar coluna user_id na tabela centros_custo se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'centros_custo' 
        AND column_name = 'user_id'
    ) THEN
        -- Adicionar a coluna user_id
        ALTER TABLE centros_custo ADD COLUMN user_id UUID REFERENCES auth.users(id);
        
        -- Adicionar índice para melhor performance
        CREATE INDEX idx_centros_custo_user_id ON centros_custo(user_id);
        
        RAISE NOTICE 'Coluna user_id adicionada com sucesso na tabela centros_custo';
    ELSE
        RAISE NOTICE 'Coluna user_id já existe na tabela centros_custo';
    END IF;
END $$;
```

#### 1.2 Configurar políticas RLS
```sql
-- Habilitar RLS na tabela centros_custo
ALTER TABLE centros_custo ENABLE ROW LEVEL SECURITY;

-- Política para SELECT - usuários veem apenas seus próprios centros de custo
CREATE POLICY "Usuários podem ver seus próprios centros de custo" ON centros_custo
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política para INSERT - usuários podem inserir seus próprios centros de custo
CREATE POLICY "Usuários podem inserir seus próprios centros de custo" ON centros_custo
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE - usuários podem atualizar seus próprios centros de custo
CREATE POLICY "Usuários podem atualizar seus próprios centros de custo" ON centros_custo
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política para DELETE - usuários podem deletar seus próprios centros de custo
CREATE POLICY "Usuários podem deletar seus próprios centros de custo" ON centros_custo
    FOR DELETE
    USING (auth.uid() = user_id);
```

### Passo 2: Verificar se as políticas foram criadas
```sql
-- Verificar se as políticas foram criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'centros_custo'
ORDER BY policyname;
```

### Passo 3: Verificar se RLS está habilitado
```sql
-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'centros_custo';
```

## 🔄 Alterações no Código

### ✅ Já Implementado:
1. **`src/services/supabase.ts`** - Métodos atualizados para incluir `user_id` automaticamente
2. **`src/components/modules/Module2/CentrosCusto.tsx`** - Lógica de salvamento otimizada

### 📋 O que foi corrigido:
- ✅ Adicionado `user_id` automaticamente em todas as operações
- ✅ Verificação de autenticação em todos os métodos
- ✅ Políticas RLS configuradas para segurança
- ✅ Filtragem por usuário em todas as consultas

## 🚀 Como Testar

1. **Execute os scripts SQL** no Supabase SQL Editor
2. **Faça login** no sistema
3. **Tente cadastrar** um novo centro de custo
4. **Verifique** se não há mais erros de RLS

## 🔒 Segurança

- ✅ Cada usuário só vê seus próprios centros de custo
- ✅ Usuários não podem acessar dados de outros usuários
- ✅ Todas as operações são validadas por autenticação
- ✅ Políticas RLS garantem isolamento de dados

## 📞 Suporte

Se ainda houver problemas após executar os scripts SQL, verifique:
1. Se o usuário está autenticado
2. Se as políticas RLS foram criadas corretamente
3. Se a coluna `user_id` existe na tabela
4. Se há erros no console do navegador
