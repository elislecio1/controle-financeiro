# 📊 Sistema de Logs de Atividades - Guia Completo

## 🎯 Visão Geral

O sistema de logs implementado registra automaticamente todas as atividades dos usuários no sistema financeiro, permitindo auditoria completa e possibilidade de desfazer ações por administradores.

## 🏗️ Estrutura do Sistema

### 📋 Tabelas Criadas

#### 1. `user_activity_logs` - Log Principal
- **Propósito**: Log geral de todas as atividades
- **Campos principais**:
  - `user_id`: ID do usuário que executou a ação
  - `user_email`: Email do usuário
  - `action_type`: Tipo de ação (create, update, delete)
  - `table_name`: Nome da tabela afetada
  - `record_id`: ID do registro afetado
  - `old_values`: Valores anteriores (JSONB)
  - `new_values`: Valores novos (JSONB)
  - `description`: Descrição da ação
  - `ip_address`: IP do usuário
  - `can_be_undone`: Se a ação pode ser desfeita
  - `undone_at`: Data/hora que foi desfeita
  - `undone_by`: Quem desfez a ação

#### 2. `transaction_logs` - Log de Transações
- **Propósito**: Log detalhado de operações com transações
- **Campos específicos**:
  - `transaction_id`: ID da transação
  - `old_status`: Status anterior
  - `new_status`: Status novo
  - `action_type`: create, update, delete, mark_paid, mark_unpaid

#### 3. `system_config_logs` - Log de Configurações
- **Propósito**: Log de configurações do sistema
- **Campos específicos**:
  - `config_type`: Tipo de configuração (categoria, conta_bancaria, etc.)
  - `action_type`: create, update, delete

### 🔧 Triggers Automáticos

O sistema utiliza triggers PostgreSQL para capturar automaticamente:

1. **Transações**: Todas as operações INSERT, UPDATE, DELETE na tabela `transactions`
2. **Categorias**: Todas as operações na tabela `categorias`
3. **Contas Bancárias**: Todas as operações na tabela `contas_bancarias`

### 🛡️ Segurança (RLS)

- **Admins**: Podem ver todos os logs de todos os usuários
- **Usuários**: Podem ver apenas seus próprios logs
- **Desfazer ações**: Apenas administradores podem desfazer ações

## 🚀 Como Usar

### 1. Executar o Script SQL

```sql
-- Execute o arquivo setup_sistema_logs.sql no Supabase
-- Este script cria todas as tabelas, triggers e funções
```

### 2. Acessar os Logs

1. **Login como administrador**
2. **Clicar no avatar do usuário** (canto superior direito)
3. **Selecionar "Logs do Sistema"** no menu dropdown

### 3. Interface de Logs

#### 📊 Abas Disponíveis

1. **Transações**: Logs de todas as operações com transações
2. **Configurações**: Logs de categorias, contas bancárias, etc.
3. **Atividades**: Logs gerais de atividades
4. **Estatísticas**: Resumo e métricas dos logs

#### 🔍 Filtros Disponíveis

- **Data Início/Fim**: Filtrar por período
- **Tipo de Ação**: create, update, delete, mark_paid, mark_unpaid
- **Limite**: Quantidade de registros por página (25, 50, 100, 200)

#### ⚡ Ações Disponíveis

- **Ver Detalhes**: Visualizar valores antigos e novos
- **Desfazer Ação**: Reverter uma ação (apenas admins)
- **Exportar**: Baixar logs em formato JSON

## 📈 Funcionalidades

### 🔄 Desfazer Ações

O sistema permite desfazer ações de forma inteligente:

#### Para Transações:
- **CREATE**: Exclui a transação criada
- **UPDATE**: Restaura os valores anteriores
- **DELETE**: Recria a transação excluída

#### Para Configurações:
- **CREATE**: Exclui a configuração criada
- **UPDATE**: Restaura os valores anteriores
- **DELETE**: Recria a configuração excluída

### 📊 Estatísticas

O sistema fornece estatísticas em tempo real:
- Total de ações no período
- Ações por tipo
- Ações por usuário
- Atividades recentes

### 📤 Exportação

- Exporta todos os logs filtrados em formato JSON
- Inclui transações, configurações e atividades
- Arquivo nomeado com data atual

## 🛠️ Implementação Técnica

### Backend (PostgreSQL)

#### Funções Principais:

1. **`log_transaction_activity()`**
   - Trigger para transações
   - Captura automaticamente todas as mudanças

2. **`log_categoria_activity()`**
   - Trigger para categorias
   - Registra operações de configuração

3. **`log_conta_activity()`**
   - Trigger para contas bancárias
   - Monitora mudanças em contas

4. **`undo_transaction_action(log_id)`**
   - Desfaz ações de transações
   - Apenas para administradores

5. **`undo_config_action(log_id)`**
   - Desfaz ações de configuração
   - Apenas para administradores

6. **`get_log_statistics(start_date, end_date)`**
   - Retorna estatísticas dos logs
   - Agrega dados por período

### Frontend (React/TypeScript)

#### Serviço: `logService.ts`

```typescript
// Principais métodos:
- getTransactionLogs(filters)
- getSystemConfigLogs(filters)
- getActivityLogs(filters)
- getLogStatistics(startDate, endDate)
- undoTransactionAction(logId)
- undoConfigAction(logId)
- exportLogs()
```

#### Componente: `SystemLogs.tsx`

- Interface completa para visualização
- Filtros avançados
- Ações de desfazer
- Modal de detalhes
- Exportação de dados

## 🔍 Exemplos de Uso

### 1. Visualizar Logs de Transações

```typescript
// Buscar logs de transações dos últimos 7 dias
const logs = await logService.getTransactionLogs({
  start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  end_date: new Date().toISOString(),
  limit: 100
})
```

### 2. Desfazer uma Ação

```typescript
// Desfazer ação de transação (apenas admin)
const success = await logService.undoTransactionAction(logId)
if (success) {
  console.log('Ação desfeita com sucesso!')
}
```

### 3. Obter Estatísticas

```typescript
// Estatísticas dos últimos 30 dias
const stats = await logService.getLogStatistics(
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  new Date().toISOString()
)
```

## 🚨 Ações Registradas

### Transações
- ✅ Criar transação
- ✏️ Editar transação
- 🗑️ Excluir transação
- ✅ Marcar como pago
- ❌ Desmarcar como pago

### Configurações
- ✅ Criar categoria
- ✏️ Editar categoria
- 🗑️ Excluir categoria
- ✅ Criar conta bancária
- ✏️ Editar conta bancária
- 🗑️ Excluir conta bancária

### Atividades Gerais
- 📝 Login/Logout
- 🔄 Importação OFX
- 📤 Exportação de dados
- ⚙️ Mudanças de configuração

## 🔧 Configuração

### Variáveis de Ambiente

Não são necessárias variáveis adicionais. O sistema usa as mesmas configurações do Supabase.

### Permissões

O sistema automaticamente:
- Verifica se o usuário é admin para desfazer ações
- Aplica RLS para filtrar logs por usuário
- Registra IP e user agent automaticamente

## 📋 Checklist de Implementação

- [x] Executar script SQL no Supabase
- [x] Verificar se os triggers estão ativos
- [x] Testar criação de transação (deve gerar log)
- [x] Testar edição de transação (deve gerar log)
- [x] Testar exclusão de transação (deve gerar log)
- [x] Testar acesso aos logs como admin
- [x] Testar acesso aos logs como usuário comum
- [x] Testar desfazer ação como admin
- [x] Testar exportação de logs
- [x] Verificar estatísticas

## 🐛 Troubleshooting

### Problema: Logs não aparecem
**Solução**: Verificar se os triggers estão ativos no Supabase

### Problema: Erro ao desfazer ação
**Solução**: Verificar se o usuário tem permissão de admin

### Problema: Performance lenta
**Solução**: Verificar se os índices foram criados corretamente

### Problema: Logs duplicados
**Solução**: Verificar se não há triggers duplicados

## 🔮 Próximas Melhorias

1. **Logs de Login/Logout**: Registrar tentativas de acesso
2. **Logs de Importação OFX**: Detalhar importações
3. **Notificações**: Alertar admins sobre ações críticas
4. **Backup Automático**: Backup periódico dos logs
5. **Retenção**: Política de retenção de logs antigos
6. **Relatórios**: Relatórios automáticos por email
7. **API REST**: Endpoints para integração externa

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs do console do navegador
2. Verificar logs do Supabase
3. Consultar esta documentação
4. Contatar o administrador do sistema

---

**Sistema de Logs v1.0** - Implementado com segurança e auditoria completa 🛡️
