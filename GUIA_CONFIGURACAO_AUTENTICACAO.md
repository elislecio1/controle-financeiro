# 🔐 Guia de Configuração do Sistema de Autenticação

## 📋 Visão Geral

O FinFlow Pro agora possui um sistema completo de autenticação e multi-tenancy que inclui:

- ✅ Login/Registro com email e senha
- ✅ Autenticação via Google OAuth
- ✅ Sistema de perfis de usuário
- ✅ Diferentes níveis de acesso (Admin, Usuário, Visualizador)  
- ✅ Multi-tenancy (isolamento de dados por usuário)
- ✅ Recuperação de senha por email
- ✅ Gerenciamento de perfil e preferências

## 🚀 Configuração Inicial

### 1. Configurar Tabelas no Supabase

Execute o script SQL no painel do Supabase:

```sql
-- Execute o arquivo: setup_auth_tables.sql
```

Este script irá:
- Criar a tabela `user_profiles`
- Configurar triggers automáticos
- Habilitar RLS em todas as tabelas
- Criar políticas de segurança
- Adicionar índices para performance

### 2. Configurar Autenticação Google

No painel do Supabase:

1. Vá em **Authentication > Providers**
2. Habilite **Google**
3. Configure as credenciais OAuth:
   - **Client ID**: Obtido no Google Cloud Console
   - **Client Secret**: Obtido no Google Cloud Console
   - **Redirect URL**: `https://seu-projeto.supabase.co/auth/v1/callback`

### 3. Configurar Variáveis de Ambiente

Certifique-se de que as variáveis estão configuradas:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 4. Configurar Domínio de Redirect

No painel do Supabase, em **Authentication > URL Configuration**:

- **Site URL**: `https://seu-dominio.com`
- **Redirect URLs**: 
  - `https://seu-dominio.com/auth/callback`
  - `https://seu-dominio.com/auth/reset-password`

## 📊 Estrutura de Usuários

### Tipos de Usuário

1. **Admin** (`admin`)
   - Acesso total ao sistema
   - Pode gerenciar outros usuários
   - Vê todos os dados (futuro)

2. **Usuário** (`user`)
   - Acesso completo aos próprios dados
   - Pode criar, editar e excluir transações
   - Acesso a todos os módulos

3. **Visualizador** (`viewer`)
   - Apenas visualização dos dados
   - Não pode editar ou excluir
   - Acesso limitado a relatórios

### Perfil do Usuário

Cada usuário possui um perfil com:

```typescript
interface UserProfile {
  id: string
  user_id: string
  name: string
  avatar_url?: string
  phone?: string
  document?: string
  birth_date?: string
  role: 'admin' | 'user' | 'viewer'
  preferences: UserPreferences
  created_at: string
  updated_at: string
}
```

### Preferências

```typescript
interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  currency: 'BRL' | 'USD' | 'EUR'
  date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  language: 'pt-BR' | 'en-US' | 'es-ES'
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  dashboard: {
    default_period: 'current_month' | 'last_30_days' | 'current_year'
    show_charts: boolean
    show_stats: boolean
  }
}
```

## 🔒 Segurança (RLS)

### Row Level Security

Todas as tabelas principais possuem RLS habilitado:

- `transactions`
- `categorias`
- `subcategorias`
- `contas_bancarias`
- `cartoes_credito`
- `contatos`
- `centros_custo`
- `metas`
- `orcamentos`
- `investimentos`
- `alertas`
- `integracoes_bancarias`

### Políticas de Segurança

Cada usuário só pode:
- **SELECT**: Ver apenas seus próprios dados
- **INSERT**: Inserir dados associados ao seu user_id
- **UPDATE**: Atualizar apenas seus próprios dados
- **DELETE**: Excluir apenas seus próprios dados

## 🛠️ Como Usar no Código

### Hook de Autenticação

```typescript
import { useAuth } from './hooks/useAuth'

function MeuComponente() {
  const { 
    user, 
    profile, 
    isAuthenticated, 
    loading,
    signIn, 
    signOut,
    hasRole,
    hasPermission 
  } = useAuth()

  if (loading) return <div>Carregando...</div>
  if (!isAuthenticated) return <div>Faça login</div>

  return (
    <div>
      <h1>Olá, {profile?.name}!</h1>
      {hasRole('admin') && <AdminPanel />}
      {hasPermission('write') && <EditButton />}
    </div>
  )
}
```

### Proteção de Rotas

```typescript
import { ProtectedRoute } from './components/auth/ProtectedRoute'

function App() {
  return (
    <ProtectedRoute requiredRole="user">
      <Dashboard />
    </ProtectedRoute>
  )
}
```

### Proteção de Componentes

```typescript
import { RequirePermission } from './components/auth/ProtectedRoute'

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      <RequirePermission permission="write">
        <AddTransactionButton />
      </RequirePermission>
      
      <RequirePermission permission="admin">
        <AdminSettings />
      </RequirePermission>
    </div>
  )
}
```

## 📱 Componentes de Autenticação

### Telas Disponíveis

1. **LoginForm**: Formulário de login com email/senha
2. **RegisterForm**: Registro de novo usuário
3. **ForgotPasswordForm**: Recuperação de senha
4. **UserProfile**: Modal de perfil e configurações

### Funcionalidades

- ✅ Validação de formulários
- ✅ Força da senha
- ✅ Login com Google
- ✅ Recuperação de senha
- ✅ Perfil do usuário
- ✅ Preferências personalizáveis
- ✅ Gerenciamento de sessão

## 🔧 Migração de Dados Existentes

### Se você já tem dados no sistema:

1. **Execute o script de migração**:
   ```sql
   -- Descomente as seções de migração no arquivo setup_auth_tables.sql
   ```

2. **Associe dados a um usuário**:
   - Crie um usuário administrador primeiro
   - Execute a migração para associar dados existentes
   - Torne as colunas user_id obrigatórias

### Passos da Migração:

1. Executar script base (sem migração)
2. Criar primeiro usuário via interface
3. Executar migração de dados
4. Tornar user_id obrigatório
5. Verificar se tudo funcionou

## 📈 Monitoramento

### Verificações Importantes

```sql
-- Verificar usuários sem perfil
SELECT u.id, u.email 
FROM auth.users u 
LEFT JOIN public.user_profiles p ON u.id = p.user_id 
WHERE p.id IS NULL;

-- Verificar dados sem user_id
SELECT 'transactions' as tabela, COUNT(*) as sem_user_id 
FROM transactions WHERE user_id IS NULL
UNION ALL
SELECT 'categorias', COUNT(*) FROM categorias WHERE user_id IS NULL;

-- Verificar RLS habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **Usuário não consegue ver dados**:
   - Verificar se RLS está habilitado
   - Verificar se user_id está preenchido
   - Verificar políticas de segurança

2. **Erro ao criar usuário**:
   - Verificar se trigger está funcionando
   - Verificar permissões da função
   - Verificar logs do Supabase

3. **Google OAuth não funciona**:
   - Verificar credenciais no Google Cloud
   - Verificar redirect URLs
   - Verificar configuração no Supabase

### Logs Úteis

```javascript
// No console do navegador
console.log('Auth State:', authService.getAuthState())
console.log('Supabase Session:', await supabase.auth.getSession())
```

## ✅ Checklist de Configuração

- [ ] Script SQL executado no Supabase
- [ ] Google OAuth configurado
- [ ] Variáveis de ambiente definidas
- [ ] Redirect URLs configuradas
- [ ] Primeiro usuário criado e testado
- [ ] Dados migrados (se necessário)
- [ ] RLS funcionando corretamente
- [ ] Testes de login/logout realizados
- [ ] Perfil de usuário funcionando
- [ ] Multi-tenancy testado

## 🎉 Próximos Passos

Após a configuração:

1. Teste todas as funcionalidades de autenticação
2. Configure templates de email personalizados
3. Implemente 2FA (quando disponível)
4. Configure monitoramento de segurança
5. Documente processos para sua equipe

---

**🔒 Lembre-se**: A segurança é fundamental! Sempre teste em ambiente de desenvolvimento antes de aplicar em produção.
