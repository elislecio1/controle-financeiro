# Guia para Limpar Alertas de Teste e Verificar Alertas Reais

## Problema Identificado
Os alertas que estão aparecendo são das transações de teste que criamos, não das suas transações reais do banco de dados.

## Solução

### Passo 1: Executar o script de verificação
Execute o script `verificar_transacoes_reais.sql` no SQL Editor do Supabase para:

1. **Ver todas as transações pendentes** no banco
2. **Identificar transações de teste** (que contêm "Teste" na descrição)
3. **Ver transações vencendo hoje** (13/08/2025)
4. **Ver transações vencendo amanhã** (14/08/2025)

### Passo 2: Remover transações de teste
No script `verificar_transacoes_reais.sql`, descomente a linha:
```sql
DELETE FROM transactions WHERE descricao LIKE '%Teste%';
```

E execute novamente para remover as transações de teste.

### Passo 3: Verificar transações reais
Após remover as transações de teste, execute novamente o script para confirmar que só restaram suas transações reais.

### Passo 4: Verificar configurações de alerta
Execute o script `verificar_alertas_hoje.sql` para verificar:
- Se há configurações de alerta ativas
- Se a configuração tem `dias_antes = 0`

### Passo 5: Testar o sistema
1. **Abra o console do navegador** (F12)
2. **Recarregue a página** da aplicação
3. **Procure pelos logs** que mostram:
   - Quantas transações pendentes foram encontradas
   - Quais transações estão sendo analisadas
   - Se há alertas sendo criados

## Logs Esperados

### Se não há transações reais vencendo hoje:
```
📊 Transações pendentes encontradas: 0
📊 Nenhuma transação pendente encontrada
```

### Se há transações reais vencendo hoje:
```
📊 Transações pendentes encontradas: 2
📋 Transação 1: Conta de Luz - R$ 150.00 - Vence: 13/08/2025
📋 Transação 2: Internet - R$ 89.90 - Vence: 14/08/2025
🔍 Analisando transação: Conta de Luz - Vencimento: 13/08/2025
✅ Condição atendida: diasAteVencimento (0) <= diasAntes (0)
🚨 Alerta criado: Conta de Luz vence hoje!
```

## Verificações Importantes

### 1. Transações Reais
- Verifique se você tem transações reais com status 'pendente'
- Verifique se essas transações têm data de vencimento preenchida
- Verifique se as datas estão no formato DD/MM/YYYY

### 2. Configuração de Alerta
- Acesse a aba "Alertas" → "Configurações"
- Verifique se há uma configuração de vencimento ativa
- Confirme que "Dias antes do vencimento" está como 0

### 3. Status das Transações
- Transações devem estar com status 'pendente'
- Transações pagas não geram alertas

## Comandos Úteis

### Verificar transações no console:
```javascript
// No console do navegador
import('./services/alertas').then(({alertasService}) => {
  alertasService.verificarVencimentos().then(alertas => {
    console.log('Alertas gerados:', alertas)
  })
})
```

### Forçar verificação completa:
```javascript
// No console do navegador
location.reload()
```

## Resultado Esperado

Após limpar as transações de teste, o sistema deve:
- ✅ Mostrar apenas alertas de transações reais
- ✅ Gerar alertas baseados na sua configuração
- ✅ Exibir logs detalhados no console
- ✅ Funcionar apenas com dados reais do banco

## Se Não Aparecerem Alertas

Se após limpar as transações de teste não aparecerem alertas, significa que:
1. **Não há transações reais vencendo hoje**
2. **As transações reais não estão com status 'pendente'**
3. **Não há configuração de alerta ativa**
4. **As datas de vencimento estão em formato incorreto**

Neste caso, crie transações reais com vencimento para hoje ou configure o alerta para verificar mais dias antes do vencimento.
