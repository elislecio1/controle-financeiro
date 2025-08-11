# 🚀 Guia de Deploy - Google Apps Script

## ✅ Passo 1: Deploy do Apps Script

1. **Acesse o Google Apps Script:**
   - Vá para [script.google.com](https://script.google.com)
   - Faça login com sua conta Google

2. **Abra seu projeto:**
   - Você já criou o arquivo `FinanceiroDS.gs`
   - Certifique-se de que o código está salvo

3. **Faça o Deploy:**
   - Clique no botão **"Deploy"** (canto superior direito)
   - Selecione **"New deployment"**

4. **Configure o Deploy:**
   - **Type:** Web app
   - **Execute as:** Me (sua conta)
   - **Who has access:** Anyone
   - Clique em **"Deploy"**

5. **Autorize o Script:**
   - Uma janela de autorização aparecerá
   - Clique em **"Continue"**
   - Selecione sua conta Google
   - Clique em **"Advanced"** → **"Go to [Nome do Projeto] (unsafe)"**
   - Clique em **"Allow"**

6. **Copie a URL:**
   - Após o deploy, uma URL será gerada
   - Copie essa URL (algo como: `https://script.google.com/macros/s/[ID]/exec`)

## ✅ Passo 2: Atualizar o Dashboard

1. **Abra o arquivo `dashboard-completo.html`**

2. **Localize a linha com a URL do Apps Script:**
   ```javascript
   const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby2thUW_aIfFLNSh2MSmbI669X7wbLg-LLJb3TMYNJnNjywYy1VeFNX_seGf3kFM-FeBg/exec';
   ```

3. **Substitua pela nova URL:**
   - Cole a URL que você copiou no Passo 1
   - Salve o arquivo

## ✅ Passo 3: Testar a Conexão

1. **Abra o arquivo `test-simple-connection.html` no navegador**

2. **Clique em "🔗 Testar GET (Conexão)"**
   - Deve aparecer: "✅ GET bem-sucedido!"

3. **Clique em "📝 Testar POST (Leitura)"**
   - Deve aparecer: "✅ POST bem-sucedido!"

## ✅ Passo 4: Testar o Dashboard

1. **Abra o arquivo `dashboard-completo.html` no navegador**

2. **Teste o cadastro de transação:**
   - Vá para a aba "Cadastro"
   - Preencha os dados
   - Clique em "Salvar"
   - Verifique se aparece: "✅ Transações salvas via Google Apps Script"

3. **Teste marcar como pago:**
   - Vá para a aba "Transações"
   - Clique em "Marcar como Pago" em uma transação
   - Verifique se o status muda na planilha

## ❌ Se Houver Problemas

### Problema 1: "Network Error"
**Solução:**
- Verifique se o deploy foi feito corretamente
- Certifique-se de que "Who has access" está como "Anyone"
- Teste a URL diretamente no navegador

### Problema 2: "401 Unauthorized"
**Solução:**
- Verifique se você autorizou o script corretamente
- Refaça o deploy
- Verifique se a planilha está compartilhada com sua conta

### Problema 3: "403 Forbidden"
**Solução:**
- Abra a planilha no Google Sheets
- Clique em "Compartilhar" (canto superior direito)
- Adicione sua conta com permissão de "Editor"

## 🔍 Verificação Final

Após seguir todos os passos, você deve conseguir:
- ✅ Salvar novas transações na planilha
- ✅ Marcar transações como pagas
- ✅ Ver os dados atualizados em tempo real

Se tudo funcionar, o dashboard estará completamente integrado com o Google Sheets! 