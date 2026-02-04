# 🔄 Guia de Atualizações em Tempo Real

Este guia explica como o sistema de atualizações em tempo real funciona e como configurá-lo.

## 📋 Visão Geral

O sistema utiliza **Supabase Realtime** para sincronizar automaticamente as mudanças entre todos os usuários da mesma empresa. Quando um usuário cria, atualiza ou exclui uma transação, todos os outros usuários da empresa veem a mudança **imediatamente**, sem precisar dar refresh na página.

## 🚀 Como Funciona

### 1. **Realtime Subscriptions**

O sistema se inscreve em mudanças nas seguintes tabelas:
- `transactions` - Transações financeiras
- `categorias` - Categorias de transações
- `contas_bancarias` - Contas bancárias
- `cartoes_credito` - Cartões de crédito
- E outras tabelas relevantes

### 2. **Eventos Monitorados**

Para cada tabela, o sistema monitora:
- **INSERT** - Quando um novo registro é criado
- **UPDATE** - Quando um registro é atualizado
- **DELETE** - Quando um registro é excluído

### 3. **Atualização Automática da Interface**

Quando um evento é detectado:
1. O sistema recebe a notificação do Supabase
2. Atualiza o estado local do React automaticamente
3. A interface é re-renderizada com os novos dados
4. Todos os usuários da empresa veem a mudança simultaneamente

## ⚙️ Configuração

### 1. Habilitar RLS em Todas as Tabelas

**IMPORTANTE**: Antes de usar o Realtime, você precisa habilitar RLS em todas as tabelas.

Execute o script SQL no Supabase:

```sql
-- Execute o arquivo: HABILITAR_RLS_TODAS_TABELAS.sql
```

Este script habilita RLS em todas as tabelas públicas que precisam de segurança.

### 2. Verificar Configuração do Supabase

O Realtime já está configurado no cliente Supabase em `src/services/supabase.ts`:

```typescript
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
```

### 3. Habilitar Realtime no Supabase Dashboard

1. Acesse o **Supabase Dashboard**
2. Vá em **Database** → **Replication**
3. Certifique-se de que a replicação está habilitada para as tabelas:
   - `transactions`
   - `categorias`
   - `contas_bancarias`
   - `cartoes_credito`
   - E outras tabelas que você quer sincronizar

## 📝 Uso no Código

### Serviço de Realtime

O serviço está em `src/services/realtimeService.ts`:

```typescript
import { realtimeService } from './services/realtimeService'

// Inscrever-se em mudanças de transações
const unsubscribe = realtimeService.subscribeToTransactions(
  (newTransaction) => {
    // Nova transação criada
    console.log('Nova transação:', newTransaction)
  },
  (updatedTransaction) => {
    // Transação atualizada
    console.log('Transação atualizada:', updatedTransaction)
  },
  (deletedId) => {
    // Transação deletada
    console.log('Transação deletada:', deletedId)
  }
)

// Cancelar subscription
unsubscribe()
```

### No App.tsx

O `App.tsx` já está configurado para usar Realtime automaticamente:

```typescript
useEffect(() => {
  if (!isAuthenticated || !user) {
    return
  }

  // Subscription para transações
  const unsubscribe = realtimeService.subscribeToTransactions(
    (newTransaction) => {
      // Atualizar estado automaticamente
      setData((prevData) => [...prevData, newTransaction])
    },
    (updatedTransaction) => {
      // Atualizar transação existente
      setData((prevData) => 
        prevData.map(item => 
          item.id === updatedTransaction.id ? updatedTransaction : item
        )
      )
    },
    (deletedId) => {
      // Remover transação
      setData((prevData) => prevData.filter(item => item.id !== deletedId))
    }
  )

  return () => {
    unsubscribe()
  }
}, [isAuthenticated, user])
```

## 🔒 Segurança e RLS

### Como Funciona com RLS

O Realtime respeita as políticas RLS (Row Level Security):

- **Usuários só recebem eventos** de transações que podem ver
- **Transações de outras empresas** não são enviadas
- **RLS filtra automaticamente** os eventos antes de enviá-los

### Políticas RLS Necessárias

Certifique-se de que as políticas RLS estão configuradas corretamente:

1. **SELECT** - Usuários podem ver transações da empresa
2. **INSERT** - Usuários podem criar transações na empresa
3. **UPDATE** - Usuários podem atualizar transações da empresa
4. **DELETE** - Usuários podem excluir transações da empresa

Veja o arquivo `CONFIGURAR_RLS_EMPRESA_COMPARTILHADA.sql` para exemplos.

## 🧪 Testando

### Teste Local

1. Abra a aplicação em **duas janelas diferentes** do navegador
2. Faça login com **dois usuários diferentes** da mesma empresa
3. Em uma janela, **crie uma nova transação**
4. Na outra janela, a transação deve aparecer **automaticamente** (sem refresh)

### Verificar Logs

Abra o console do navegador (F12) e procure por:

```
🔄 Configurando subscriptions Realtime...
✅ Subscriptions Realtime configuradas com sucesso!
🆕 Nova transação recebida em tempo real!
```

## 🐛 Troubleshooting

### Problema: Atualizações não aparecem

**Solução:**
1. Verifique se o RLS está habilitado nas tabelas
2. Verifique se a replicação está habilitada no Supabase Dashboard
3. Verifique o console do navegador para erros
4. Verifique se os usuários estão na mesma empresa

### Problema: Erro de conexão Realtime

**Solução:**
1. Verifique as credenciais do Supabase no `.env`
2. Verifique se o Supabase está acessível
3. Verifique se há limites de conexão no plano do Supabase

### Problema: Muitas atualizações (spam)

**Solução:**
O sistema já tem proteção contra duplicatas. Se ainda assim houver problemas:
1. Aumente o debounce nas atualizações
2. Verifique se não há loops infinitos no código

## 📊 Performance

### Limites do Supabase

- **Free Plan**: 2 conexões simultâneas
- **Pro Plan**: 200 conexões simultâneas
- **Events per second**: Configurado para 10 eventos/segundo

### Otimizações

1. **Cache local**: O sistema usa cache para evitar requisições desnecessárias
2. **Debounce**: Atualizações são agrupadas quando possível
3. **Cleanup**: Subscriptions são canceladas quando não são mais necessárias

## 🔄 Próximos Passos

1. ✅ Habilitar RLS em todas as tabelas
2. ✅ Configurar Realtime no Supabase Dashboard
3. ✅ Testar com múltiplos usuários
4. ✅ Monitorar performance e ajustar se necessário

## 📚 Referências

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Replication](https://www.postgresql.org/docs/current/logical-replication.html)
