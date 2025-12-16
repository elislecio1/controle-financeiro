# Correção: Remoção da coluna `is_active` da tabela `user_profiles`

## Problema Identificado

A tabela `user_profiles` no Supabase **não possui** a coluna `is_active`, mas o código estava tentando usar essa coluna, causando erros SQL.

## Estrutura Real da Tabela `user_profiles`

De acordo com o Schema Visualizer do Supabase, a tabela `user_profiles` possui:

- `id` (uuid)
- `user_id` (uuid, UNIQUE)
- `name` (text)
- `avatar_url` (text, opcional)
- `phone` (text, opcional)
- `document` (text, opcional)
- `birth_date` (date, opcional)
- `role` (text) - 'admin', 'user', 'viewer'
- `preferences` (jsonb)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `full_name` (text, opcional)
- `email` (text, opcional)
- `metadata` (jsonb)

**NÃO possui:**
- ❌ `is_active` (boolean)

## Correções Realizadas

### 1. Arquivo SQL para Atualizar Perfil
Criado arquivo `ATUALIZAR_PERFIL_USUARIO.sql` sem referências a `is_active`.

### 2. Código TypeScript
- ✅ Removido `is_active` da interface `UserProfile` em `src/types/index.ts`
- ✅ Removidas todas as referências a `is_active` em `src/services/auth.ts`
- ✅ Atualizada função `checkUserProfilePermission` para não verificar `is_active`
- ✅ Atualizada função `createDefaultProfile` para não incluir `is_active`
- ✅ Removida verificação de `is_active` em `handleUserSession`

## Como Atualizar Seu Perfil no Supabase

Execute o SQL abaixo no SQL Editor do Supabase:

```sql
-- Verificar perfil atual
SELECT user_id, email, name, role, full_name, metadata
FROM user_profiles
WHERE user_id = '16290525-2b7f-4157-86f5-7e1c165fc070';

-- Atualizar ou criar perfil do usuário
INSERT INTO user_profiles (user_id, email, name, role, full_name, metadata)
VALUES (
  '16290525-2b7f-4157-86f5-7e1c165fc070',
  'elislecio@gmail.com',
  'Elislécio Ferreira',
  'admin',
  'Elislécio Ferreira',
  '{"theme": "light", "currency": "BRL", "language": "pt-BR"}'::jsonb
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = 'admin',
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();
```

## Controle de Acesso

Se você precisar controlar se um usuário está ativo ou inativo, você pode:

1. **Usar a tabela `user_permissions`** - Verificar se o usuário tem a permissão `login` com `granted = true`
2. **Usar o campo `metadata`** - Adicionar um campo `is_active` no JSON `metadata`
3. **Criar a coluna `is_active`** - Se realmente precisar, adicione a coluna via SQL:

```sql
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
```

Mas por enquanto, o sistema funciona apenas verificando se o usuário tem um `role` válido ('admin', 'user', ou 'viewer').

## Próximos Passos

1. Execute o SQL `ATUALIZAR_PERFIL_USUARIO.sql` no Supabase
2. Faça logout e login novamente
3. O sistema deve funcionar corretamente agora

