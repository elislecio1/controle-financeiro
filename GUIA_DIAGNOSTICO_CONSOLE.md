# Guia para Diagnosticar Alertas no Console

## Passo 1: Abrir o Console do Navegador

1. **Pressione F12** no navegador
2. **Clique na aba "Console"**
3. **Recarregue a página** (F5 ou Ctrl+R)

## Passo 2: Procurar pelos Logs de Alerta

Procure por estas mensagens no console:

### ✅ Se está funcionando corretamente:
```
🔍 Iniciando verificação de vencimentos...
📅 Data atual: 13/08/2025
⚙️ Configurações encontradas: 1
⚙️ Configuração de vencimento: {tipo: "vencimento", ativo: true, diasAntes: 0, ...}
🔍 Verificando vencimentos - dias antes: 0
📊 Transações pendentes encontradas: 2
📋 Transação 1: Conta de Luz - R$ 150.00 - Vence: 13/08/2025
📋 Transação 2: Internet - R$ 89.90 - Vence: 14/08/2025
🔍 Analisando transação: Conta de Luz - Vencimento: 13/08/2025
✅ Condição atendida: diasAteVencimento (0) <= diasAntes (0)
🚨 Alerta criado: Conta de Luz vence hoje!
✅ Total de alertas de vencimento criados: 1
```

### ❌ Se há problemas:

#### Problema 1: Nenhuma configuração encontrada
```
⚙️ Configurações encontradas: 0
⚙️ Configuração de vencimento: undefined
```

#### Problema 2: Nenhuma transação pendente
```
📊 Transações pendentes encontradas: 0
📊 Nenhuma transação pendente encontrada
```

#### Problema 3: Transações com formato de data incorreto
```
⚠️ Não foi possível parsear a data de vencimento: 13/8/2025
```

#### Problema 4: Transações não atendem aos critérios
```
❌ Condição não atendida: diasAteVencimento (5) > diasAntes (0)
```

## Passo 3: Executar Comandos de Teste

### Teste 1: Verificar configurações
```javascript
// No console do navegador
import('./services/alertas').then(({alertasService}) => {
  alertasService.getConfiguracoes().then(configs => {
    console.log('Configurações:', configs)
  })
})
```

### Teste 2: Verificar transações
```javascript
// No console do navegador
import('./services/alertas').then(({alertasService}) => {
  alertasService.verificarVencimentos().then(alertas => {
    console.log('Alertas gerados:', alertas)
  })
})
```

### Teste 3: Forçar verificação completa
```javascript
// No console do navegador
location.reload()
```

## Passo 4: Executar Script SQL

Execute o script `diagnostico_alertas_hoje.sql` no Supabase para verificar:

1. **Se há configurações ativas**
2. **Se há transações pendentes**
3. **Se há transações vencendo hoje**
4. **Se o formato das datas está correto**

## Possíveis Causas do Problema

### 1. Não há transações reais vencendo hoje
- **Solução**: Crie transações com vencimento para hoje (13/08/2025)

### 2. Transações estão com status diferente de 'pendente'
- **Solução**: Verifique se as transações estão com status 'pendente'

### 3. Formato de data incorreto
- **Solução**: As datas devem estar no formato DD/MM/YYYY (ex: 13/08/2025)

### 4. Transações de teste ainda no banco
- **Solução**: Execute o script para remover transações de teste

### 5. Configuração não está ativa
- **Solução**: Verifique se a configuração está marcada como "Ativo"

## Comandos para Testar Manualmente

### Criar uma transação de teste real:
```sql
INSERT INTO transactions (
    descricao,
    valor,
    tipo,
    categoria,
    subcategoria,
    conta,
    data,
    vencimento,
    status,
    forma,
    observacoes,
    created_at,
    updated_at
) VALUES (
    'Teste Real - Vencendo Hoje',
    100.00,
    'despesa',
    'Serviços',
    'Teste',
    'Conta Corrente Principal',
    '13/08/2025',
    '13/08/2025',
    'pendente',
    'pix',
    'Transação de teste real para verificar alertas',
    NOW(),
    NOW()
);
```

## Resultado Esperado

Após seguir estes passos, você deve ver no console:
- ✅ Configurações sendo carregadas
- ✅ Transações sendo encontradas
- ✅ Alertas sendo criados
- ✅ Alertas aparecendo na interface

Se não aparecer nenhum log, significa que há um problema na conexão com o banco ou na configuração do Supabase.
