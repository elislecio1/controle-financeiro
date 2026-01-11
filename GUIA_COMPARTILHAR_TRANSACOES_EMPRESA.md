# 🏢 Como Configurar Compartilhamento de Transações por Empresa

## 📋 Problema

Usuários não conseguem ver transações de outros usuários da mesma empresa. Cada usuário só vê suas próprias transações.

## ✅ Solução

Configurar RLS (Row Level Security) para permitir que usuários vejam todas as transações da empresa que participam.

---

## 🚀 Passo a Passo

### 1. Executar Script SQL no Supabase

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo: `CONFIGURAR_RLS_EMPRESA_COMPARTILHADA.sql`
6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Aguarde a execução (pode levar alguns segundos)

### 2. Verificar se Funcionou

Após executar o script, você deve ver mensagens de sucesso no final.

Execute esta query para verificar:

```sql
-- Verificar empresas e usuários vinculados
SELECT 
    ue.empresa,
    COUNT(DISTINCT ue.user_id) as total_usuarios,
    COUNT(DISTINCT t.id) as total_transacoes
FROM public.user_empresas ue
LEFT JOIN public.transactions t ON t.empresa = ue.empresa
WHERE ue.is_active = true
GROUP BY ue.empresa
ORDER BY ue.empresa;
```

---

## 🔧 Como Funciona

### Sistema Automático

1. **Quando um usuário cria uma transação com uma empresa:**
   - O usuário é automaticamente adicionado à empresa
   - Pode ver todas as transações dessa empresa
   - Outros usuários da mesma empresa também podem ver essa transação

2. **Políticas RLS:**
   - ✅ Usuários veem suas próprias transações
   - ✅ Usuários veem transações da mesma empresa
   - ✅ Admins veem todas as transações
   - ✅ Transações sem empresa são privadas (apenas do criador)

3. **Tabela `user_empresas`:**
   - Armazena quais usuários pertencem a quais empresas
   - Criada automaticamente quando usuário cria transação
   - Pode ser gerenciada manualmente se necessário

---

## 📊 Estrutura Criada

### Tabela `user_empresas`

```sql
user_empresas
├── id (UUID)
├── user_id (UUID) - Referência ao usuário
├── empresa (VARCHAR) - Nome da empresa
├── role (VARCHAR) - 'owner', 'admin', 'member', 'viewer'
├── is_active (BOOLEAN) - Se está ativo
└── created_at, updated_at
```

### Funções Criadas

- `get_user_empresas(user_uuid)` - Retorna empresas do usuário
- `auto_add_user_to_empresa()` - Adiciona usuário automaticamente

### Triggers Criados

- `trigger_auto_add_user_to_empresa` - Adiciona usuário à empresa ao criar transação

---

## 🎯 Casos de Uso

### Caso 1: Usuário cria transação para empresa existente

1. Usuário A cria transação com `empresa = "Minha Empresa"`
2. Usuário A é automaticamente adicionado à empresa
3. Usuário B cria transação com `empresa = "Minha Empresa"`
4. Usuário B é automaticamente adicionado à empresa
5. **Agora ambos veem todas as transações de "Minha Empresa"**

### Caso 2: Adicionar usuário manualmente a uma empresa

```sql
INSERT INTO public.user_empresas (user_id, empresa, role, is_active)
VALUES (
    'uuid-do-usuario',
    'Nome da Empresa',
    'member',
    true
);
```

### Caso 3: Remover usuário de uma empresa

```sql
UPDATE public.user_empresas
SET is_active = false
WHERE user_id = 'uuid-do-usuario'
AND empresa = 'Nome da Empresa';
```

---

## 🔍 Verificar se Está Funcionando

### 1. Verificar empresas do usuário

```sql
SELECT * FROM public.user_empresas
WHERE user_id = auth.uid()
AND is_active = true;
```

### 2. Verificar transações visíveis

```sql
-- Como usuário logado, execute:
SELECT 
    empresa,
    COUNT(*) as total_transacoes,
    COUNT(DISTINCT user_id) as usuarios_diferentes
FROM public.transactions
WHERE empresa IS NOT NULL AND empresa != ''
GROUP BY empresa
ORDER BY empresa;
```

### 3. Testar com dois usuários

1. **Usuário A (elislecio@gmail.com):**
   - Crie uma transação com `empresa = "Minha Empresa"`
   - Deve ver apenas sua transação inicialmente

2. **Usuário B:**
   - Crie uma transação com `empresa = "Minha Empresa"`
   - Agora ambos devem ver as 2 transações

---

## ⚠️ Importante

### Transações Sem Empresa

- Transações sem campo `empresa` (ou vazio) são **privadas**
- Apenas o criador pode ver
- Não são compartilhadas

### Transações com Empresa

- Transações com campo `empresa` preenchido são **compartilhadas**
- Todos os usuários da mesma empresa podem ver
- Usuários são adicionados automaticamente ao criar transação

---

## 🛠️ Manutenção

### Adicionar Usuário a Empresa Manualmente

```sql
INSERT INTO public.user_empresas (user_id, empresa, role, is_active)
SELECT 
    u.id,
    'Nome da Empresa',
    'member',
    true
FROM auth.users u
WHERE u.email = 'usuario@email.com'
ON CONFLICT (user_id, empresa) 
DO UPDATE SET is_active = true;
```

### Listar Todos os Usuários de uma Empresa

```sql
SELECT 
    u.email,
    up.name,
    ue.role,
    ue.is_active
FROM public.user_empresas ue
JOIN auth.users u ON u.id = ue.user_id
LEFT JOIN public.user_profiles up ON up.user_id = u.id
WHERE ue.empresa = 'Nome da Empresa'
AND ue.is_active = true;
```

### Migrar Transações Existentes

Se você já tem transações e quer que usuários vejam todas:

```sql
-- Adicionar todos os usuários às empresas baseado nas transações existentes
INSERT INTO public.user_empresas (user_id, empresa, role, is_active)
SELECT DISTINCT 
    t.user_id,
    t.empresa,
    'member',
    true
FROM public.transactions t
WHERE t.empresa IS NOT NULL 
AND t.empresa != ''
AND t.user_id IS NOT NULL
ON CONFLICT (user_id, empresa) DO NOTHING;
```

---

## 🐛 Troubleshooting

### Problema: Usuário ainda não vê transações de outros

**Solução:**
1. Verifique se o script SQL foi executado completamente
2. Verifique se o usuário está na tabela `user_empresas`:
   ```sql
   SELECT * FROM public.user_empresas WHERE user_id = auth.uid();
   ```
3. Se não estiver, crie uma transação com a empresa ou adicione manualmente

### Problema: Erro ao executar script SQL

**Solução:**
1. Execute parte por parte
2. Verifique se a tabela `transactions` existe
3. Verifique se a tabela `user_profiles` existe
4. Verifique se há erros de sintaxe

### Problema: Transações duplicadas aparecendo

**Solução:**
- Isso não deve acontecer, mas se acontecer, verifique se há duplicatas na tabela `transactions`

---

## ✅ Checklist

Após executar o script:

- [ ] Script SQL executado com sucesso
- [ ] Tabela `user_empresas` criada
- [ ] Políticas RLS atualizadas
- [ ] Trigger criado
- [ ] Dados existentes migrados
- [ ] Testado com dois usuários diferentes
- [ ] Ambos veem transações da mesma empresa

---

## 📝 Próximos Passos

1. **Testar o sistema:**
   - Faça login com elislecio@gmail.com
   - Crie uma transação com uma empresa
   - Faça login com outro usuário
   - Crie transação com a mesma empresa
   - Ambos devem ver as duas transações

2. **Gerenciar empresas:**
   - Adicione usuários manualmente se necessário
   - Use a tabela `user_empresas` para gerenciar membros

3. **Monitorar:**
   - Verifique se novos usuários são adicionados automaticamente
   - Verifique se as políticas RLS estão funcionando

---

**🎉 Pronto! Agora os usuários podem ver todas as transações da empresa que participam!**

