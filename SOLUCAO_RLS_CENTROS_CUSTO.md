# 🔧 Solução para Erro de RLS em Centros de Custo

## ❌ Problemas Identificados

### 1. Erro de Constraint
```
Erro ao salvar: Erro ao salvar centro de custo: new row for relation "centros_custo" violates check constraint "centros_custo_tipo_check"
```

### 2. Política RLS Incorreta
- Usuários precisam ver todos os centros de custo da empresa, não apenas os próprios

## 🔍 Causas dos Problemas

1. **Constraint**: A tabela `centros_custo` tem uma constraint que não permite o valor `'ambos'` no campo `tipo`
2. **Política RLS**: As políticas atuais restringem usuários a ver apenas seus próprios centros de custo

## ✅ Solução

### Passo 1: Corrigir Constraint (Executar primeiro)

#### 1.1 Corrigir constraint do campo tipo
```sql
-- Corrigir constraint do campo tipo na tabela centros_custo
-- Este arquivo deve ser executado no Supabase SQL Editor

-- 1. Verificar a constraint atual
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'centros_custo'::regclass 
AND contype = 'c';

-- 2. Remover a constraint atual (se existir)
DO $$
BEGIN
    -- Verificar se a constraint existe e removê-la
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'centros_custo'::regclass 
        AND conname = 'centros_custo_tipo_check'
    ) THEN
        ALTER TABLE centros_custo DROP CONSTRAINT centros_custo_tipo_check;
        RAISE NOTICE 'Constraint centros_custo_tipo_check removida';
    ELSE
        RAISE NOTICE 'Constraint centros_custo_tipo_check não encontrada';
    END IF;
END $$;

-- 3. Criar nova constraint que permite 'ambos'
ALTER TABLE centros_custo 
ADD CONSTRAINT centros_custo_tipo_check 
CHECK (tipo IN ('custo', 'lucro', 'ambos'));

-- 4. Verificar se a nova constraint foi criada
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'centros_custo'::regclass 
AND contype = 'c';
```

### Passo 2: Atualizar Políticas RLS para Empresa

#### 2.1 Atualizar políticas RLS
```sql
-- Atualizar políticas RLS para centros de custo da empresa
-- Este arquivo deve ser executado no Supabase SQL Editor

-- 1. Remover políticas antigas
DO $$
BEGIN
    -- Remover política de SELECT
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'centros_custo' 
        AND policyname = 'Usuários podem ver seus próprios centros de custo'
    ) THEN
        DROP POLICY "Usuários podem ver seus próprios centros de custo" ON centros_custo;
        RAISE NOTICE 'Política de SELECT removida';
    END IF;
    
    -- Remover política de INSERT
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'centros_custo' 
        AND policyname = 'Usuários podem inserir seus próprios centros de custo'
    ) THEN
        DROP POLICY "Usuários podem inserir seus próprios centros de custo" ON centros_custo;
        RAISE NOTICE 'Política de INSERT removida';
    END IF;
    
    -- Remover política de UPDATE
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'centros_custo' 
        AND policyname = 'Usuários podem atualizar seus próprios centros de custo'
    ) THEN
        DROP POLICY "Usuários podem atualizar seus próprios centros de custo" ON centros_custo;
        RAISE NOTICE 'Política de UPDATE removida';
    END IF;
    
    -- Remover política de DELETE
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'centros_custo' 
        AND policyname = 'Usuários podem deletar seus próprios centros de custo'
    ) THEN
        DROP POLICY "Usuários podem deletar seus próprios centros de custo" ON centros_custo;
        RAISE NOTICE 'Política de DELETE removida';
    END IF;
END $$;

-- 2. Criar novas políticas para empresa

-- Política para SELECT - usuários autenticados podem ver todos os centros de custo da empresa
CREATE POLICY "Usuários podem ver centros de custo da empresa" ON centros_custo
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Política para INSERT - usuários autenticados podem inserir centros de custo
CREATE POLICY "Usuários podem inserir centros de custo da empresa" ON centros_custo
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Política para UPDATE - usuários autenticados podem atualizar centros de custo
CREATE POLICY "Usuários podem atualizar centros de custo da empresa" ON centros_custo
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Política para DELETE - usuários autenticados podem deletar centros de custo
CREATE POLICY "Usuários podem deletar centros de custo da empresa" ON centros_custo
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- 3. Verificar se as novas políticas foram criadas
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
1. **`src/services/supabase.ts`** - Métodos atualizados para trabalhar com centros de custo compartilhados
2. **`src/components/modules/Module2/CentrosCusto.tsx`** - Lógica de salvamento otimizada

### 📋 O que foi corrigido:
- ✅ Constraint do campo `tipo` atualizada para permitir `'ambos'`
- ✅ Políticas RLS atualizadas para permitir acesso compartilhado na empresa
- ✅ Removida necessidade de `user_id` nos centros de custo
- ✅ Verificação de autenticação simplificada
- ✅ Todos os usuários autenticados podem ver, inserir, atualizar e deletar centros de custo

## 🚀 Como Testar

1. **Execute o script de correção da constraint** primeiro
2. **Execute o script de atualização das políticas RLS**
3. **Faça login** no sistema
4. **Tente cadastrar** um novo centro de custo com tipo "Ambos"
5. **Verifique** se não há mais erros de constraint ou RLS

## 🔒 Segurança

- ✅ Apenas usuários autenticados podem acessar centros de custo
- ✅ Todos os usuários da empresa compartilham os mesmos centros de custo
- ✅ Políticas RLS garantem controle de acesso adequado
- ✅ Constraint atualizada permite o tipo "Ambos"

## 📞 Suporte

Se ainda houver problemas após executar os scripts SQL, verifique:
1. Se a constraint foi atualizada corretamente
2. Se as políticas RLS foram criadas
3. Se o usuário está autenticado
4. Se há erros no console do navegador
5. Se o tipo "Ambos" está sendo aceito no banco
