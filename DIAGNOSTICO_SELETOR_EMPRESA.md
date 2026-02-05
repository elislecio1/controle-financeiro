# 🔍 DIAGNÓSTICO: Seletor de Empresa Não Aparece

## Problema Reportado
O seletor de empresa não está aparecendo na interface, mesmo após os scripts SQL terem sido executados com sucesso.

## Verificações Implementadas

### 1. ✅ Correções Aplicadas
- ✅ Adicionado import `useNavigate` no `EmpresaSelector.tsx`
- ✅ Adicionados logs de debug no `EmpresaContext` e `EmpresaSelector`

### 2. 🔍 Como Diagnosticar

#### Passo 1: Abrir Console do Navegador
1. Pressione `F12` ou `Ctrl+Shift+I`
2. Vá para a aba "Console"
3. Recarregue a página (`F5`)

#### Passo 2: Verificar Logs
Procure por estas mensagens no console:

```
🔄 EmpresaContext: Carregando empresas do usuário...
✅ EmpresaContext: Empresas carregadas: X [array de empresas]
🔍 EmpresaSelector - Estado: { loading, empresasCount, empresaAtual, error }
```

#### Passo 3: Verificar Erros
Procure por mensagens de erro:
- `❌ Erro ao buscar empresas do usuário`
- `❌ Erro ao carregar empresas`
- `Usuário não autenticado`

### 3. 🐛 Possíveis Causas

#### Causa 1: Usuário Não Autenticado
**Sintoma:** Log mostra "Usuário não autenticado"
**Solução:** Fazer logout e login novamente

#### Causa 2: Erro na Query SQL
**Sintoma:** Erro ao buscar empresas do usuário
**Verificar:**
- Tabela `empresa_usuarios` existe?
- Usuário está na tabela `empresa_usuarios`?
- RLS está bloqueando a query?

#### Causa 3: Empresas Não Carregadas
**Sintoma:** `empresasCount: 0` no log
**Verificar no Supabase SQL Editor:**
```sql
-- Verificar se o usuário está associado à empresa
SELECT 
  e.nome as empresa_nome,
  e.cnpj,
  eu.role,
  eu.ativo,
  u.email
FROM empresas e
JOIN empresa_usuarios eu ON e.id = eu.empresa_id
JOIN auth.users u ON u.id = eu.user_id
WHERE u.email = 'elislecio@gmail.com';
```

#### Causa 4: Componente Não Renderiza
**Sintoma:** Nenhum log aparece
**Verificar:**
- `EmpresaProvider` está envolvendo o `App`? (✅ Sim, em `main.tsx`)
- `EmpresaSelector` está sendo renderizado? (✅ Sim, em `App.tsx` linha 1129)

### 4. 🔧 Soluções Rápidas

#### Solução 1: Limpar Cache e Recarregar
1. Pressione `Ctrl+Shift+R` (hard refresh)
2. Ou limpar cache do navegador

#### Solução 2: Verificar no Supabase
Execute este SQL para verificar associação:
```sql
SELECT 
  e.nome,
  e.cnpj,
  eu.role,
  eu.ativo,
  u.email
FROM empresas e
JOIN empresa_usuarios eu ON e.id = eu.empresa_id
JOIN auth.users u ON u.id = eu.user_id
WHERE u.email = 'elislecio@gmail.com'
  AND eu.ativo = true;
```

#### Solução 3: Verificar RLS
Execute este SQL para verificar políticas RLS:
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'empresa_usuarios';
```

### 5. 📋 Checklist de Verificação

- [ ] Console do navegador aberto
- [ ] Logs de debug aparecem no console
- [ ] Verificar se há erros no console
- [ ] Verificar se `empresasCount > 0` no log
- [ ] Verificar se `empresaAtual` não é `null` no log
- [ ] Verificar no Supabase se usuário está associado
- [ ] Verificar se RLS não está bloqueando

### 6. 🚨 Se Nada Funcionar

1. **Verificar no Network Tab:**
   - Abrir DevTools → Network
   - Filtrar por "empresa"
   - Verificar se há requisições para `empresa_usuarios`
   - Verificar status code (200, 401, 403, etc.)

2. **Verificar no Supabase Dashboard:**
   - Ir para Authentication → Users
   - Verificar se o usuário existe
   - Verificar se o email está correto

3. **Testar Query Diretamente:**
   ```sql
   -- No Supabase SQL Editor
   SELECT * FROM empresa_usuarios 
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'elislecio@gmail.com');
   ```

---

**Próximo Passo:** Após verificar os logs no console, compartilhe o que apareceu para continuarmos o diagnóstico.
