# Guia de Diagnóstico - Sistema de Alertas

## Problema Reportado
"criei com dias antes do vencimento '0'. tenho tranzações vencendo hoje. Mas nenhum alerta foi gerato ou mestrado na tela."

## Scripts de Diagnóstico

### 1. Execute o script `verificar_alertas_hoje.sql` no SQL Editor do Supabase

Este script irá:
- Verificar configurações de alerta ativas
- Listar transações pendentes com vencimento
- Identificar transações vencendo hoje (13/08/2025)
- Verificar se há alertas na tabela
- Testar inserção de configuração com `dias_antes = 0`

### 2. Execute o script `teste_parse_date.sql` no SQL Editor do Supabase

Este script irá:
- Verificar o formato das datas de vencimento no banco
- Testar conversão de datas brasileiras
- Calcular dias até vencimento para datas específicas
- Identificar transações vencendo hoje

### 3. Execute o script `criar_transacao_teste.sql` no SQL Editor do Supabase

Este script irá:
- Criar uma transação de teste vencendo hoje (13/08/2025)
- Criar uma transação de teste vencendo amanhã (14/08/2025)
- Verificar se as transações foram criadas corretamente

## Passos para Diagnóstico

### Passo 1: Verificar Configurações
1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Execute o script `verificar_alertas_hoje.sql`
4. Verifique se há configurações de alerta com `dias_antes = 0`

### Passo 2: Verificar Transações
1. Execute o script `teste_parse_date.sql`
2. Execute o script `criar_transacao_teste.sql` para criar dados de teste
3. Verifique se há transações com vencimento em 13/08/2025
4. Confirme se as datas estão no formato correto

### Passo 3: Verificar Logs
1. Abra o console do navegador (F12)
2. Recarregue a página
3. Procure por logs que começam com:
   - 🔍 Iniciando verificação de vencimentos...
   - ⚙️ Configurações encontradas:
   - 📊 Transações pendentes encontradas:
   - 🔍 Analisando transação:
   - ✅ Condição atendida:
   - 🚨 Alerta criado:

### Passo 4: Verificar Interface
1. Verifique se os alertas aparecem no canto superior direito
2. Confirme se o ícone de sino tem notificações
3. Acesse a aba "Alertas" para ver configurações

## Possíveis Causas

### 1. Problema de Configuração
- Configuração não foi salva corretamente
- `dias_antes` não está como `0`
- Configuração não está ativa

### 2. Problema de Dados
- Não há transações vencendo hoje
- Datas estão em formato incorreto
- Transações não estão com status 'pendente'

### 3. Problema de Parsing
- Função `parseBrazilianDate` não consegue interpretar as datas
- Formato de data diferente do esperado

### 4. Problema de Exibição
- Alertas são gerados mas não aparecem na tela
- Problema no componente `ToastContainer`

## Soluções

### Se não há configurações:
1. Acesse a aba "Alertas"
2. Crie uma nova configuração
3. Defina "Dias antes do vencimento" como `0`
4. Salve a configuração

### Se não há transações vencendo hoje:
1. Verifique se há transações com vencimento 13/08/2025
2. Confirme se estão com status 'pendente'
3. Se necessário, crie uma transação de teste

### Se há problemas de parsing:
1. Verifique o formato das datas no banco
2. Execute o script `teste_parse_date.sql`
3. Corrija as datas se necessário

### Se os alertas não aparecem:
1. Verifique o console do navegador
2. Confirme se há erros JavaScript
3. Teste em outro navegador

## Comandos Úteis

### Verificar logs no console:
```javascript
// No console do navegador
console.log('Teste de alertas')
```

### Forçar verificação de alertas:
```javascript
// No console do navegador
import('./services/alertas').then(({alertasService}) => {
  alertasService.verificarVencimentos().then(alertas => {
    console.log('Alertas gerados:', alertas)
  })
})
```

## Contato para Suporte

Se o problema persistir após seguir este guia, forneça:
1. Resultados dos scripts SQL
2. Screenshots do console do navegador
3. Lista de transações vencendo hoje
4. Configurações de alerta ativas
