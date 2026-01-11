# 🏢 Instruções: Compartilhar Transações por Empresa

## 🎯 Objetivo

Permitir que usuários vejam **todas as transações da empresa** que participam, não apenas as próprias.

---

## ✅ Solução Implementada

### 1. Script SQL Criado

**Arquivo**: `CONFIGURAR_RLS_EMPRESA_COMPARTILHADA.sql`

Este script:
- ✅ Cria tabela `user_empresas` (relacionamento usuário-empresa)
- ✅ Ajusta políticas RLS para compartilhar por empresa
- ✅ Cria trigger para adicionar usuário automaticamente à empresa
- ✅ Migra dados existentes

### 2. Código TypeScript Atualizado

**Arquivo**: `src/services/supabase.ts`

Removidos filtros `.eq('user_id', ...)` para que o RLS faça o filtro automaticamente.

---

## 🚀 Como Executar

### Passo 1: Executar Script SQL

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Clique em **New Query**
5. Abra o arquivo: `CONFIGURAR_RLS_EMPRESA_COMPARTILHADA.sql`
6. Copie TODO o conteúdo
7. Cole no SQL Editor
8. Clique em **Run** (ou Ctrl+Enter)
9. Aguarde a execução (pode levar 10-30 segundos)

### Passo 2: Verificar Execução

Você deve ver no final:
```
✅ RLS configurado para compartilhar transações por empresa!
```

### Passo 3: Testar

1. Faça login com `elislecio@gmail.com`
2. Crie uma transação com campo `empresa` preenchido
   - Exemplo: `empresa = "Minha Empresa"`
3. Faça login com outro usuário
4. Crie outra transação com a mesma empresa
5. **Ambos devem ver as 2 transações!**

---

## 🔧 Como Funciona

### Sistema Automático

1. **Usuário cria transação com empresa:**
   ```
   Transação criada → empresa = "Minha Empresa"
   → Trigger adiciona usuário à empresa automaticamente
   → Usuário pode ver todas as transações dessa empresa
   ```

2. **Políticas RLS:**
   - ✅ Usuário vê suas próprias transações
   - ✅ Usuário vê transações da mesma empresa
   - ✅ Admin vê todas as transações
   - ✅ Transações sem empresa são privadas

3. **Tabela `user_empresas`:**
   - Armazena: `user_id` + `empresa`
   - Criada automaticamente
   - Pode ser gerenciada manualmente

---

## 📊 Estrutura

### Tabela `user_empresas`

```sql
user_empresas
├── id (UUID)
├── user_id (UUID) → auth.users
├── empresa (VARCHAR) → Nome da empresa
├── role (VARCHAR) → 'owner', 'admin', 'member', 'viewer'
├── is_active (BOOLEAN)
└── created_at, updated_at
```

### Políticas RLS

**SELECT (Visualizar):**
- Próprias transações
- Transações da mesma empresa
- Todas se for admin

**INSERT/UPDATE/DELETE:**
- Mesmas condições de visualização

---

## 🎯 Casos de Uso

### Caso 1: Usuários da Mesma Empresa

**Cenário:**
- Usuário A cria transação: `empresa = "Empresa X"`
- Usuário B cria transação: `empresa = "Empresa X"`

**Resultado:**
- ✅ Ambos veem as 2 transações
- ✅ Automático (sem configuração manual)

### Caso 2: Adicionar Usuário Manualmente

Se quiser adicionar um usuário a uma empresa sem criar transação:

```sql
INSERT INTO public.user_empresas (user_id, empresa, role, is_active)
SELECT 
    u.id,
    'Nome da Empresa',
    'member',
    true
FROM auth.users u
WHERE u.email = 'usuario@email.com';
```

### Caso 3: Múltiplas Empresas

Um usuário pode participar de várias empresas:
- Empresa A → vê transações da Empresa A
- Empresa B → vê transações da Empresa B
- Transações sem empresa → privadas

---

## 🔍 Verificações

### 1. Verificar se Script Foi Executado

```sql
-- Verificar se tabela existe
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_empresas'
) as tabela_existe;

-- Verificar políticas RLS
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'transactions';
```

### 2. Verificar Empresas do Usuário

```sql
SELECT * FROM public.user_empresas
WHERE user_id = auth.uid()
AND is_active = true;
```

### 3. Verificar Transações Visíveis

```sql
-- Como usuário logado, execute:
SELECT 
    empresa,
    COUNT(*) as total,
    COUNT(DISTINCT user_id) as usuarios
FROM public.transactions
WHERE empresa IS NOT NULL AND empresa != ''
GROUP BY empresa;
```

---

## ⚠️ Importante

### Transações Sem Empresa

- **Privadas**: Apenas o criador vê
- **Não compartilhadas**: Não aparecem para outros usuários

### Transações Com Empresa

- **Compartilhadas**: Todos da mesma empresa veem
- **Automático**: Usuário é adicionado ao criar transação

---

## 🐛 Troubleshooting

### Problema: Usuário ainda não vê transações

**Solução:**
1. Verifique se executou o script SQL completamente
2. Verifique se o usuário está na empresa:
   ```sql
   SELECT * FROM public.user_empresas 
   WHERE user_id = auth.uid();
   ```
3. Se não estiver, crie uma transação com a empresa ou adicione manualmente

### Problema: Erro ao executar script

**Solução:**
- Execute parte por parte
- Verifique se tabelas `transactions` e `user_profiles` existem
- Verifique erros de sintaxe no SQL Editor

---

## ✅ Checklist

- [ ] Script SQL executado no Supabase
- [ ] Tabela `user_empresas` criada
- [ ] Políticas RLS atualizadas
- [ ] Trigger criado
- [ ] Código TypeScript atualizado (filtros removidos)
- [ ] Testado com dois usuários
- [ ] Ambos veem transações da mesma empresa

---

## 📝 Próximos Passos

1. **Execute o script SQL** no Supabase
2. **Teste com dois usuários** da mesma empresa
3. **Verifique se está funcionando**
4. **Adicione usuários manualmente** se necessário

---

**🎉 Pronto! Após executar o script, os usuários verão todas as transações da empresa!**

