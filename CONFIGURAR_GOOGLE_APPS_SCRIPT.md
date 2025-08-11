# 🔧 Configuração do Google Apps Script para Resolver Erro 401

## Problema
O erro 401 indica que a API key não tem permissões para **escrever** no Google Sheets. O Google Sheets API requer **OAuth2** para operações de escrita, não apenas uma API key.

## Solução: Google Apps Script

O Google Apps Script resolve este problema porque ele roda com as permissões do usuário que o executa, permitindo operações de leitura e escrita.

## 📋 Passo a Passo para Configurar

### 1. Criar o Google Apps Script

1. **Acesse o Google Apps Script**:
   - Vá para [script.google.com](https://script.google.com)
   - Faça login com a mesma conta Google que possui a planilha

2. **Criar novo projeto**:
   - Clique em "Novo projeto"
   - Renomeie para "Dashboard Planilhas"

3. **Copiar o código**:
   - Abra o arquivo `google-apps-script.js` que foi criado
   - Copie todo o conteúdo
   - Cole no editor do Google Apps Script (substitua o código padrão)

### 2. Configurar o Deploy

1. **Clicar em "Deploy"** (canto superior direito)
2. **Selecionar "New deployment"**
3. **Configurar**:
   - **Type**: Web app
   - **Execute as**: Me (sua conta Google)
   - **Who has access**: Anyone
4. **Clicar em "Deploy"**

### 3. Obter a URL do Script

1. **Após o deploy**, você receberá uma URL como:
   ```
   https://script.google.com/macros/s/AKfycbz.../exec
   ```
2. **Copie esta URL** - você precisará dela

### 4. Atualizar o Dashboard

1. **Abrir o arquivo `dashboard-completo.html`**
2. **Encontrar a linha**:
   ```javascript
   const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz.../exec';
   ```
3. **Substituir pela sua URL** do passo 3

### 5. Testar a Configuração

1. **Abrir o arquivo `test-api-permissions.html`**
2. **Substituir a URL** pela sua URL do Google Apps Script
3. **Executar os testes** para verificar se funciona

## 🔍 Verificação Rápida

### Teste 1: Verificar se o Script está Online
```
GET https://sua-url-do-script/exec
```
**Resposta esperada**:
```json
{
  "status": "success",
  "message": "Google Apps Script está funcionando!",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "1.0.0"
}
```

### Teste 2: Testar Leitura
```javascript
// Enviar via POST para sua URL
{
  "action": "read",
  "spreadsheetId": "18QjPfOiWnkdn-OgdySJ9uugX8nAor7wDbBsPkneVrSE",
  "sheetName": "GERAL"
}
```

### Teste 3: Testar Escrita
```javascript
// Enviar via POST para sua URL
{
  "action": "append",
  "spreadsheetId": "18QjPfOiWnkdn-OgdySJ9uugX8nAor7wDbBsPkneVrSE",
  "sheetName": "GERAL",
  "values": [
    ["01/01/2024", "TESTE", "Sistema", "D", "100", "1/1", "", ""]
  ]
}
```

## ⚠️ Troubleshooting

### Erro: "Script not found"
- Verifique se o deploy foi feito corretamente
- Confirme se a URL está correta

### Erro: "Access denied"
- Verifique se o "Who has access" está configurado como "Anyone"
- Confirme se você está logado com a conta correta

### Erro: "Spreadsheet not found"
- Verifique se o ID da planilha está correto
- Confirme se a planilha está compartilhada com sua conta

### Erro: "Sheet not found"
- Verifique se o nome da aba ("GERAL") está correto
- Confirme se a aba existe na planilha

## 🎯 Benefícios da Solução

1. **✅ Resolve o erro 401** - Google Apps Script tem permissões completas
2. **✅ Sem configuração complexa** - Não precisa de OAuth2
3. **✅ Funciona com planilhas privadas** - Desde que você tenha acesso
4. **✅ Suporte a todas as operações** - Leitura, escrita e atualização
5. **✅ CORS configurado** - Funciona diretamente do navegador

## 📝 Próximos Passos

1. **Configure o Google Apps Script** seguindo os passos acima
2. **Atualize a URL** no dashboard
3. **Teste o cadastro** de novas transações
4. **Teste o "Marcar como Pago"** individual
5. **Verifique se os dados** estão sendo salvos na planilha

## 🔗 Links Úteis

- [Google Apps Script](https://script.google.com)
- [Documentação do Google Apps Script](https://developers.google.com/apps-script)
- [Google Sheets API](https://developers.google.com/sheets/api)

---

**Nota**: Esta solução é mais robusta e confiável que tentar configurar OAuth2 para operações de escrita. O Google Apps Script é a maneira recomendada para este tipo de integração. 