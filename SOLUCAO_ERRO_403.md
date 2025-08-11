# Solução para Erro 403 - Google Sheets API

## Problema
O erro "Request failed with status code 403" indica que a API do Google Sheets não consegue acessar a planilha devido a problemas de permissão.

## Possíveis Causas e Soluções

### 1. Planilha não está pública
**Problema:** A planilha está configurada como privada.

**Solução:**
1. Abra a planilha no Google Sheets
2. Clique em "Compartilhar" (canto superior direito)
3. Clique em "Alterar para qualquer pessoa com o link"
4. Selecione "Visualizador" nas permissões
5. Clique em "Concluído"

### 2. API Key sem permissões
**Problema:** A chave da API não tem as permissões necessárias.

**Solução:**
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione seu projeto
3. Vá para "APIs e Serviços" > "Credenciais"
4. Encontre sua API Key
5. Clique na chave para editar
6. Em "Restrições de API", certifique-se de que "Google Sheets API" está habilitada
7. Em "Restrições de aplicativo", configure conforme necessário

### 3. Google Sheets API não habilitada
**Problema:** A API do Google Sheets não está habilitada no projeto.

**Solução:**
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione seu projeto
3. Vá para "APIs e Serviços" > "Biblioteca"
4. Procure por "Google Sheets API"
5. Clique e habilite a API

### 4. Limite de quota excedido
**Problema:** O projeto atingiu o limite de requisições gratuitas.

**Solução:**
1. Verifique o uso da API em "APIs e Serviços" > "Painel"
2. Se necessário, configure faturamento para aumentar os limites

## Verificação Rápida

### Teste 1: Verificar se a planilha é acessível
1. Abra o link da planilha em uma janela anônima
2. Se conseguir ver a planilha, ela está pública

### Teste 2: Verificar API Key
1. Teste a API Key com uma planilha pública conhecida
2. Use o seguinte comando no navegador:
```
https://sheets.googleapis.com/v4/spreadsheets/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/values/Class%20Data!A2:E?key=SUA_API_KEY
```

### Teste 3: Verificar configurações do projeto
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Verifique se o projeto está ativo
3. Verifique se a API está habilitada
4. Verifique se há restrições de domínio na API Key

## Configuração Alternativa

Se o problema persistir, você pode:

1. **Criar uma nova API Key:**
   - Vá para Google Cloud Console
   - Crie uma nova chave sem restrições (apenas para teste)
   - Atualize o arquivo `config.js`

2. **Usar uma planilha de teste:**
   - Crie uma nova planilha pública
   - Copie os dados para ela
   - Atualize o `SPREADSHEETS_ID` no `config.js`

3. **Configurar um servidor proxy:**
   - Implemente um servidor Node.js simples
   - Configure CORS adequadamente
   - Use o servidor local para fazer as requisições

## Contato para Suporte

Se nenhuma das soluções funcionar, verifique:
- Logs do console do navegador (F12)
- Status da API do Google Sheets
- Configurações de rede/firewall

## Nota Importante

O dashboard continuará funcionando com dados simulados mesmo com o erro 403, mas os valores não refletirão os dados reais da planilha até que o problema seja resolvido. 