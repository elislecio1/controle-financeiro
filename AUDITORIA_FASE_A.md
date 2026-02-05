# 🔍 FASE A - AUDITORIA COMPLETA DO SISTEMA

**Data:** 2026-02-05  
**Objetivo:** Mapear estrutura atual antes de implementar multi-tenancy empresarial

---

## ✅ ENCONTRADO NO REPOSITÓRIO

### 1. Cliente Supabase
- **Arquivo:** `src/services/supabase.ts` (linhas 1-45)
- **Instância única:** `export const supabase = supabaseClient`
- **Configuração:** Variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- **Autenticação:** Persistência de sessão habilitada

### 2. Serviço de Autenticação
- **Arquivo:** `src/services/auth.ts`
- **Classe:** `AuthService` (singleton)
- **Estado:** `AuthState` com `user`, `profile`, `loading`, `error`, `isAuthenticated`
- **Hook:** `useAuth()` disponível (provavelmente em `src/hooks/useAuth.ts`)
- **Perfil:** `UserProfile` com `user_id`, `role`, `is_active`

### 3. Services de Dados
- **Arquivo principal:** `src/services/supabase.ts`
- **Classe:** `SupabaseService` (singleton exportado como `supabaseService`)
- **Tabelas usadas:**
  - `transactions` (principal)
  - `categorias`
  - `subcategorias`
  - `centros_custo`
  - `contatos`
  - `contas_bancarias`
  - `cartoes_credito`
  - `investimentos`
  - `metas`
  - `orcamentos`

### 4. Queries Atuais (Filtro por `user_id`)
- **Arquivo:** `src/services/supabase.ts`
- **Padrão atual:**
  - `addUserIdToData()` adiciona `user_id` automaticamente (linha 57-60)
  - Queries **NÃO filtram por `user_id` explicitamente** - confiam no RLS
  - Comentários indicam que RLS já filtra por empresa (linhas 200-201, 274, 312, 391)
  - **PROBLEMA:** Não há filtro explícito por `empresa_id` nas queries

### 5. Layout/Header
- **Arquivo:** `src/App.tsx` (linhas 1117-1366)
- **Localização:** Header fixo no topo
- **Estrutura:**
  - Logo "Neofin" à esquerda
  - Botões de ação no centro (Testar Conexão, Atualizar, Backup, Exportar, Importar)
  - Menu do usuário à direita (dropdown com avatar)
- **Menu do usuário:** Linhas 1186-1350
  - Opções admin (Gestão de Usuários, Logs, Monitoramento, IA)
  - Opções gerais (Perfil, Notificações)
  - Botão de Logout

### 6. TenantContext Existente
- **Arquivo:** `src/contexts/TenantContext.tsx`
- **Problema:** Baseado em **subdomínio** (não serve para nosso caso)
- **Service:** `src/services/tenantService.ts` usa `tenants` table (não `empresas`)
- **Ação:** Criar novo `EmpresaContext` (não reutilizar TenantContext)

### 7. Tipos TypeScript
- **Arquivo:** `src/types/index.ts`
- **Tipos existentes:** `User`, `UserProfile`, `AuthState`, `SheetData`, etc.
- **Arquivo:** `src/types/saas.ts`
- **Tipos SaaS:** `Tenant`, `SubscriptionPlan` (não usar - baseado em subdomínio)
- **Ação:** Criar novos tipos `Empresa`, `EmpresaUsuario` em `src/types/index.ts`

### 8. Estrutura do Banco (Confirmada)
- **Script SQL:** `database/implementar_empresas.sql` (já executado)
- **Tabelas criadas:**
  - `empresas` (id, nome, cnpj, razao_social, etc.)
  - `empresa_usuarios` (empresa_id, user_id, role, ativo)
- **Colunas adicionadas:** `empresa_id` em todas as tabelas principais
- **RLS:** Já implementado no banco (confirmado pelo usuário)

---

## ⚠️ RISCOS E PONTOS DE QUEBRA

### 🔴 CRÍTICO

1. **Queries sem filtro explícito por `empresa_id`**
   - **Risco:** Dados podem aparecer de múltiplas empresas se RLS falhar
   - **Impacto:** Vazamento de dados entre empresas
   - **Solução:** Adicionar `.eq('empresa_id', empresaAtual.id)` em todas as queries

2. **Inserções sem `empresa_id`**
   - **Risco:** Novas transações/categorias podem ser criadas sem empresa
   - **Impacto:** Dados órfãos, quebra de isolamento
   - **Solução:** Garantir que `empresa_id` seja sempre incluído no `insert`

3. **Cache sem contexto de empresa**
   - **Risco:** Cache pode retornar dados de empresa errada após alternância
   - **Impacto:** UX confusa, dados incorretos
   - **Solução:** Incluir `empresa_id` nas chaves de cache

4. **Dados existentes sem `empresa_id`**
   - **Risco:** Transações antigas ficam órfãs
   - **Impacto:** Dados não aparecem após migração
   - **Solução:** Script de migração para associar dados à empresa "Don Santos"

### 🟡 MÉDIO

5. **TenantContext pode causar confusão**
   - **Risco:** Código pode tentar usar TenantContext em vez de EmpresaContext
   - **Impacto:** Erros de runtime
   - **Solução:** Criar EmpresaContext com nome claro, documentar diferença

6. **Services sem validação de empresa**
   - **Risco:** Services podem ser chamados sem empresa selecionada
   - **Impacto:** Erros 500, UX ruim
   - **Solução:** Helper `getEmpresaIdOrThrow()` que valida antes de usar

7. **Header pode ficar sobrecarregado**
   - **Risco:** Seletor de empresa + menu usuário pode ficar apertado
   - **Impacto:** UX ruim em telas pequenas
   - **Solução:** Design responsivo, considerar dropdown combinado

### 🟢 BAIXO

8. **Tipos TypeScript podem estar desatualizados**
   - **Risco:** Tipos não refletem coluna `empresa_id`
   - **Impacto:** Erros de compilação
   - **Solução:** Atualizar tipos conforme necessário

9. **Testes manuais necessários**
   - **Risco:** Isolamento pode não funcionar corretamente
   - **Impacto:** Bugs em produção
   - **Solução:** Roteiro de testes manuais obrigatório

---

## 📋 PLANO DE ALTERAÇÕES EM ARQUIVOS (CHECKLIST)

### Fase B - Contexto de Empresa

- [ ] **Criar:** `src/types/index.ts` (adicionar tipos `Empresa`, `EmpresaUsuario`, `RoleEmpresa`)
- [ ] **Criar:** `src/services/empresaService.ts` (CRUD de empresas, buscar empresas do usuário)
- [ ] **Criar:** `src/contexts/EmpresaContext.tsx` (contexto React com estado de empresa)
- [ ] **Criar:** `src/hooks/useEmpresa.ts` (hook para usar EmpresaContext)
- [ ] **Atualizar:** `src/App.tsx` (envolver app com `EmpresaProvider`, bootstrap no login)

### Fase C - Services com `empresa_id`

- [ ] **Criar:** `src/utils/empresaHelper.ts` (helper `getEmpresaIdOrThrow()`, `withEmpresa()`)
- [ ] **Atualizar:** `src/services/supabase.ts`
  - [ ] `getData()` - adicionar filtro `.eq('empresa_id', empresaId)`
  - [ ] `getDataPaginated()` - adicionar filtro
  - [ ] `searchTransactions()` - adicionar filtro
  - [ ] `saveTransaction()` - adicionar `empresa_id` no insert
  - [ ] `updateTransaction()` - validar `empresa_id`
  - [ ] `deleteTransaction()` - validar `empresa_id`
  - [ ] `getCategorias()` - adicionar filtro
  - [ ] `saveCategoria()` - adicionar `empresa_id`
  - [ ] `getSubcategorias()` - adicionar filtro
  - [ ] `getContatos()` - adicionar filtro
  - [ ] `getCentrosCusto()` - adicionar filtro
  - [ ] `getContasBancarias()` - adicionar filtro
  - [ ] Todos os outros métodos que consultam tabelas com `empresa_id`
- [ ] **Atualizar:** `src/services/monitoringService.ts` (adicionar filtro por empresa)
- [ ] **Atualizar:** `src/services/aiFinancialService.ts` (adicionar filtro por empresa)
- [ ] **Atualizar:** `src/services/smartAlertsService.ts` (adicionar filtro por empresa)
- [ ] **Atualizar:** `src/services/reportsService.ts` (adicionar filtro por empresa)
- [ ] **Atualizar:** `src/services/backupService.ts` (adicionar filtro por empresa)
- [ ] **Atualizar:** Cache keys em `src/services/cacheService.ts` (incluir `empresa_id`)

### Fase D - Seletor de Empresa no Header

- [ ] **Criar:** `src/components/EmpresaSelector.tsx` (dropdown com empresas)
- [ ] **Atualizar:** `src/App.tsx` (adicionar `EmpresaSelector` no header, linha ~1126)
- [ ] **Atualizar:** `src/App.tsx` (limpar cache ao alternar empresa)

### Fase E - Gestão Mínima de Empresas

- [ ] **Criar:** `src/pages/EmpresasPage.tsx` (listar, criar empresa)
- [ ] **Atualizar:** `src/services/empresaService.ts` (método `createEmpresa()` com vínculo automático)
- [ ] **Atualizar:** Rotas (adicionar `/empresas`)

### Fase F - Migração de Dados Existentes

- [ ] **Criar:** `database/migrar_dados_empresa_don_santos.sql` (associar dados existentes)
- [ ] **Executar:** Script SQL no Supabase

### Fase G - Testes e Validação

- [ ] **Criar:** `TESTES_MANUAIS_ISOLAMENTO.md` (roteiro de testes)
- [ ] **Executar:** Testes manuais conforme roteiro

---

## 📊 RESUMO DE TABELAS E USO

| Tabela | Uso Atual | Precisa `empresa_id`? | Service |
|--------|-----------|----------------------|---------|
| `transactions` | ✅ Muito usado | ✅ SIM | `supabaseService` |
| `categorias` | ✅ Usado | ✅ SIM | `supabaseService` |
| `subcategorias` | ✅ Usado | ✅ SIM | `supabaseService` |
| `centros_custo` | ✅ Usado | ✅ SIM | `supabaseService` |
| `contatos` | ✅ Usado | ✅ SIM | `supabaseService` |
| `contas_bancarias` | ✅ Usado | ✅ SIM | `supabaseService` |
| `cartoes_credito` | ✅ Usado | ✅ SIM | `supabaseService` |
| `investimentos` | ✅ Usado | ✅ SIM | `supabaseService` |
| `metas` | ✅ Usado | ✅ SIM | `supabaseService` |
| `orcamentos` | ✅ Usado | ✅ SIM | `supabaseService` |
| `empresas` | ❌ Não usado | ✅ NOVA | `empresaService` (criar) |
| `empresa_usuarios` | ❌ Não usado | ✅ NOVA | `empresaService` (criar) |

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

1. ✅ **AUDITORIA CONCLUÍDA** (este documento)
2. ⏭️ **FASE B:** Criar `EmpresaContext` e `empresaService`
3. ⏭️ **FASE C:** Atualizar todos os services para usar `empresa_id`
4. ⏭️ **FASE D:** Adicionar seletor no header
5. ⏭️ **FASE E:** Criar página de gestão de empresas
6. ⏭️ **FASE F:** Migrar dados existentes
7. ⏭️ **FASE G:** Testes manuais

---

## ✅ CRITÉRIOS DE SUCESSO DA FASE A

- [x] Mapeado cliente Supabase
- [x] Mapeados services de dados
- [x] Mapeado auth state
- [x] Mapeado layout/header
- [x] Identificado TenantContext (não usar)
- [x] Listadas tabelas usadas
- [x] Identificados pontos de quebra
- [x] Criado checklist de alterações

**STATUS: ✅ FASE A CONCLUÍDA**
