# 🚀 PLANO DE AÇÃO - TRANSFORMAÇÃO PARA SaaS EMPRESARIAL

## 📊 RESUMO EXECUTIVO

**Situação Atual:** Sistema financeiro funcional, mas sem estrutura multi-tenant empresarial.

**Objetivo:** Transformar em SaaS onde:
- ✅ Usuários podem pertencer a múltiplas empresas
- ✅ Dados completamente isolados por empresa
- ✅ Alternância fácil entre empresas
- ✅ Gestão de usuários por empresa

**Prazo Estimado:** 3-4 semanas para MVP funcional

---

## 🎯 PRIORIDADES

### 🔴 CRÍTICO (Fazer Primeiro)
1. Estrutura de banco de dados (empresas + vínculos)
2. RLS (Row Level Security) por empresa
3. Contexto de empresa no frontend
4. Seletor de empresa

### 🟡 IMPORTANTE (Fazer Depois)
1. Gestão de empresas (CRUD)
2. Sistema de convites
3. Migração de dados existentes
4. Testes de isolamento

### 🟢 DESEJÁVEL (Melhorias)
1. Dashboard por empresa
2. Relatórios por empresa
3. Permissões granulares
4. Auditoria de ações

---

## 📅 CRONOGRAMA DETALHADO

### SEMANA 1: Fundação (Banco de Dados)

#### Dia 1-2: Estrutura de Dados
- [ ] Executar `database/implementar_empresas.sql`
- [ ] Verificar criação de tabelas
- [ ] Criar índices
- [ ] Testar constraints

#### Dia 3-4: RLS e Segurança
- [ ] Implementar políticas RLS para todas as tabelas
- [ ] Testar isolamento de dados
- [ ] Validar que usuários não veem dados de outras empresas
- [ ] Criar funções auxiliares

#### Dia 5: Migração de Dados (se necessário)
- [ ] Script para criar empresa padrão
- [ ] Script para vincular usuários existentes
- [ ] Script para migrar transações existentes
- [ ] Validação de integridade

### SEMANA 2: Backend e Serviços

#### Dia 1-2: Serviço de Empresas
- [ ] Criar `src/services/empresaService.ts`
- [ ] Métodos: criar, listar, atualizar, deletar
- [ ] Métodos: vincular usuário, remover usuário
- [ ] Métodos: listar empresas do usuário
- [ ] Métodos: verificar permissões

#### Dia 3-4: Atualizar Serviços Existentes
- [ ] Atualizar `supabaseService.ts` para incluir `empresa_id`
- [ ] Todas as queries devem filtrar por `empresa_id`
- [ ] Atualizar métodos de criação
- [ ] Atualizar métodos de busca

#### Dia 5: Testes de Backend
- [ ] Testar criação de empresa
- [ ] Testar vínculo de usuários
- [ ] Testar isolamento de dados
- [ ] Testar permissões

### SEMANA 3: Frontend - Contexto e Componentes

#### Dia 1-2: Contexto de Empresa
- [ ] Criar `src/contexts/EmpresaContext.tsx`
- [ ] Implementar seleção de empresa
- [ ] Persistir empresa selecionada (localStorage)
- [ ] Atualizar estado global quando empresa muda

#### Dia 3: Integração com App
- [ ] Integrar `EmpresaContext` no `App.tsx`
- [ ] Carregar empresas do usuário no login
- [ ] Mostrar seletor se tiver múltiplas empresas
- [ ] Redirecionar se não tiver empresa

#### Dia 4-5: Componentes de UI
- [ ] Criar `EmpresaSelector.tsx` (dropdown no header)
- [ ] Criar `EmpresasPage.tsx` (gestão de empresas)
- [ ] Criar `ConvitesPage.tsx` (sistema de convites)
- [ ] Atualizar header com seletor

### SEMANA 4: Refinamento e Testes

#### Dia 1-2: Testes Completos
- [ ] Testes de isolamento (2 empresas, dados não se misturam)
- [ ] Testes de alternância entre empresas
- [ ] Testes de permissões por empresa
- [ ] Testes de performance

#### Dia 3: Otimizações
- [ ] Otimizar queries
- [ ] Implementar cache
- [ ] Melhorar loading states
- [ ] Otimizar RLS

#### Dia 4: Documentação
- [ ] Atualizar README
- [ ] Documentar API de empresas
- [ ] Criar guia de uso
- [ ] Documentar migração

#### Dia 5: Deploy e Validação Final
- [ ] Deploy em staging
- [ ] Testes de aceitação
- [ ] Correção de bugs
- [ ] Deploy em produção

---

## 🔧 TAREFAS TÉCNICAS DETALHADAS

### 1. Banco de Dados

#### Arquivo: `database/implementar_empresas.sql`
- ✅ Criar tabela `empresas`
- ✅ Criar tabela `empresa_usuarios`
- ✅ Adicionar `empresa_id` em todas as tabelas
- ✅ Criar índices
- ✅ Implementar RLS
- ✅ Criar funções auxiliares

### 2. Backend - Serviços

#### Novo Arquivo: `src/services/empresaService.ts`
```typescript
class EmpresaService {
  // CRUD de empresas
  async criarEmpresa(dados: NovaEmpresa): Promise<Empresa>
  async listarEmpresasDoUsuario(): Promise<Empresa[]>
  async obterEmpresa(id: string): Promise<Empresa>
  async atualizarEmpresa(id: string, dados: Partial<Empresa>): Promise<boolean>
  async deletarEmpresa(id: string): Promise<boolean>
  
  // Gestão de usuários
  async vincularUsuario(empresaId: string, userId: string, role: string): Promise<boolean>
  async removerUsuario(empresaId: string, userId: string): Promise<boolean>
  async listarUsuariosDaEmpresa(empresaId: string): Promise<UsuarioEmpresa[]>
  async atualizarRoleUsuario(empresaId: string, userId: string, role: string): Promise<boolean>
  
  // Convites
  async enviarConvite(empresaId: string, email: string, role: string): Promise<string>
  async aceitarConvite(token: string): Promise<boolean>
  async listarConvitesPendentes(empresaId: string): Promise<Convite[]>
  async revogarConvite(conviteId: string): Promise<boolean>
  
  // Permissões
  async verificarPermissao(empresaId: string, acao: string): Promise<boolean>
  async obterRoleNaEmpresa(empresaId: string): Promise<string>
}
```

#### Atualizar: `src/services/supabase.ts`
- Adicionar `empresa_id` em todas as queries
- Filtrar por `empresa_id` automaticamente
- Validar que `empresa_id` está presente

### 3. Frontend - Contexto

#### Novo Arquivo: `src/contexts/EmpresaContext.tsx`
```typescript
interface EmpresaContextType {
  empresaAtual: Empresa | null;
  empresas: Empresa[];
  loading: boolean;
  error: string | null;
  
  // Ações
  alternarEmpresa: (empresaId: string) => Promise<void>;
  criarEmpresa: (dados: NovaEmpresa) => Promise<Empresa>;
  atualizarEmpresa: (id: string, dados: Partial<Empresa>) => Promise<void>;
  deletarEmpresa: (id: string) => Promise<void>;
  
  // Usuários
  listarUsuarios: () => Promise<UsuarioEmpresa[]>;
  convidarUsuario: (email: string, role: string) => Promise<void>;
  removerUsuario: (userId: string) => Promise<void>;
  
  // Permissões
  podeGerenciarEmpresa: () => boolean;
  podeGerenciarUsuarios: () => boolean;
}
```

### 4. Frontend - Componentes

#### Novo: `src/components/EmpresaSelector.tsx`
- Dropdown no header
- Lista empresas do usuário
- Indicador visual da empresa atual
- Botão para criar nova empresa

#### Novo: `src/pages/EmpresasPage.tsx`
- Listar empresas do usuário
- Criar nova empresa
- Editar empresa
- Deletar empresa
- Gerenciar usuários

#### Novo: `src/pages/ConvitesPage.tsx`
- Enviar convites
- Listar convites pendentes
- Aceitar convites
- Revogar convites

---

## 🧪 TESTES NECESSÁRIOS

### Testes de Isolamento
1. Criar 2 empresas (Empresa A e Empresa B)
2. Criar usuário 1 vinculado à Empresa A
3. Criar usuário 2 vinculado à Empresa B
4. Criar transações em cada empresa
5. **Validar:** Usuário 1 não vê transações da Empresa B
6. **Validar:** Usuário 2 não vê transações da Empresa A

### Testes de Multi-Empresa
1. Criar usuário vinculado a 2 empresas
2. Alternar entre empresas
3. **Validar:** Dados mudam corretamente
4. **Validar:** Cache funciona
5. **Validar:** Performance aceitável

### Testes de Permissões
1. Criar admin na Empresa A
2. Criar user na Empresa A
3. **Validar:** Admin pode gerenciar empresa
4. **Validar:** User não pode gerenciar empresa
5. **Validar:** Ambos veem transações da empresa

---

## 📋 CHECKLIST DE VALIDAÇÃO

### Funcionalidades Core
- [ ] Usuário pode criar empresa
- [ ] Usuário pode alternar entre empresas
- [ ] Dados isolados por empresa
- [ ] Usuários podem ser convidados
- [ ] Permissões funcionam por empresa
- [ ] Todas as transações vinculadas à empresa
- [ ] Relatórios por empresa

### Segurança
- [ ] RLS funcionando corretamente
- [ ] Não há vazamento de dados entre empresas
- [ ] Permissões validadas no backend
- [ ] Autenticação segura

### Performance
- [ ] Queries otimizadas (< 2s)
- [ ] Índices criados
- [ ] Cache implementado
- [ ] RLS não degrada performance

### UX/UI
- [ ] Interface intuitiva
- [ ] Seletor de empresa visível
- [ ] Feedback visual adequado
- [ ] Responsivo
- [ ] Loading states adequados

---

## 🚨 RISCOS E MITIGAÇÕES

### Risco 1: Migração de Dados
**Problema:** Dados existentes sem `empresa_id`  
**Solução:** Script de migração que cria empresa padrão e vincula tudo

### Risco 2: Performance do RLS
**Problema:** RLS pode ser lento com muitas empresas  
**Solução:** Índices adequados + cache + otimização de queries

### Risco 3: Complexidade de Código
**Problema:** Código pode ficar complexo  
**Solução:** Abstrações claras + documentação + testes

---

## 📚 DOCUMENTAÇÃO NECESSÁRIA

1. **README.md** - Atualizar com informações de empresas
2. **GUIA_EMPRESAS.md** - Como usar o sistema de empresas
3. **API_EMPRESAS.md** - Documentação da API
4. **MIGRACAO_DADOS.md** - Como migrar dados existentes
5. **ARQUITETURA.md** - Arquitetura do sistema multi-tenant

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

1. ✅ **Revisar análise completa** (`ANALISE_COMPLETA_SISTEMA_SAAS.md`)
2. ✅ **Aprovar arquitetura proposta**
3. ⏭️ **Executar script SQL** (`database/implementar_empresas.sql`)
4. ⏭️ **Criar serviço de empresas** (`src/services/empresaService.ts`)
5. ⏭️ **Criar contexto de empresa** (`src/contexts/EmpresaContext.tsx`)
6. ⏭️ **Implementar seletor de empresa** (`src/components/EmpresaSelector.tsx`)

---

**Status:** 📝 Documentação criada - Pronto para iniciar implementação
