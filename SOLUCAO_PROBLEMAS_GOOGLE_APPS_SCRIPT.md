# 🔧 Solução de Problemas - Google Apps Script

## ❌ Problemas Comuns e Soluções

### 1. **Network Error**
**Sintoma:** "Network Error" ao tentar salvar ou atualizar transações.

**Possíveis Causas:**
- Google Apps Script não está configurado corretamente
- URL do Apps Script incorreta
- Problemas de CORS
- Apps Script não foi deployado como "Web app"

**Soluções:**

#### A) Verificar se o Apps Script está funcionando:
1. Abra o arquivo `test-simple-connection.html` no navegador
2. Clique em "🔗 Testar GET (Conexão)"
3. Se der erro, o Apps Script não está acessível

#### B) Verificar a URL do Apps Script:
1. A URL deve ser: `https://script.google.com/macros/s/[ID_DO_SCRIPT]/exec`
2. Certifique-se de que o ID está correto
3. Teste a URL diretamente no navegador

#### C) Reconfigurar o Google Apps Script:
1. Vá para [script.google.com](https://script.google.com)
2. Crie um novo projeto
3. Cole o código do arquivo `google-apps-script.js`
4. Clique em "Deploy" → "New deployment"
5. Escolha "Web app"
6. Configure:
   - **Execute as:** Me (sua conta)
   - **Who has access:** Anyone
7. Clique em "Deploy"
8. Copie a nova URL e atualize no `dashboard-completo.html`

### 2. **Erro 401 - Unauthorized**
**Sintoma:** "Request failed with status code 401"

**Causa:** Problema de permissões no Google Apps Script

**Solução:**
1. Verifique se o Apps Script tem permissão para acessar a planilha
2. Certifique-se de que a planilha está compartilhada com sua conta
3. Refaça o deploy do Apps Script

### 3. **Erro 403 - Forbidden**
**Sintoma:** "Request failed with status code 403"

**Causa:** Planilha não está acessível ou não foi compartilhada

**Solução:**
1. Abra a planilha no Google Sheets
2. Clique em "Compartilhar" (canto superior direito)
3. Adicione sua conta com permissão de "Editor"
4. Ou torne a planilha pública (não recomendado para dados sensíveis)

### 4. **Dados não são salvos na planilha**
**Sintoma:** Transações são salvas apenas localmente

**Possíveis Causas:**
- Apps Script não está processando corretamente
- Dados estão sendo enviados em formato incorreto
- Planilha não tem a aba "GERAL"

**Soluções:**

#### A) Verificar a estrutura da planilha:
1. Abra a planilha no Google Sheets
2. Certifique-se de que existe uma aba chamada "GERAL"
3. Verifique se a primeira linha tem os cabeçalhos corretos

#### B) Verificar os logs do Apps Script:
1. Vá para [script.google.com](https://script.google.com)
2. Abra seu projeto
3. Clique em "Executions" no menu lateral
4. Verifique se há erros nas execuções

#### C) Testar manualmente:
1. Use o arquivo `test-google-apps-script.html`
2. Execute todos os testes
3. Verifique se os dados aparecem na planilha

### 5. **Problemas de CORS**
**Sintoma:** Erro de CORS no console do navegador

**Solução:**
1. Certifique-se de que o Apps Script está configurado com os headers CORS corretos
2. Verifique se o código do `google-apps-script.js` está correto
3. Refaça o deploy do Apps Script

## 🔍 Diagnóstico Passo a Passo

### Passo 1: Testar Conexão Básica
```bash
# Abra no navegador:
test-simple-connection.html
```

### Passo 2: Verificar Configuração
1. Abra `dashboard-completo.html`
2. Pressione F12 para abrir o console
3. Tente salvar uma transação
4. Verifique os logs no console

### Passo 3: Verificar Apps Script
1. Vá para [script.google.com](https://script.google.com)
2. Abra seu projeto
3. Clique em "Deploy" → "Manage deployments"
4. Verifique se o status está "Active"

### Passo 4: Testar Permissões
1. Abra a planilha no Google Sheets
2. Verifique se você tem permissão de "Editor"
3. Teste se consegue editar manualmente

## 🛠️ Soluções Rápidas

### Solução 1: Reconfigurar Apps Script
1. Delete o projeto atual no Google Apps Script
2. Crie um novo projeto
3. Cole o código do `google-apps-script.js`
4. Faça o deploy como "Web app"
5. Atualize a URL no dashboard

### Solução 2: Verificar Planilha
1. Abra a planilha no Google Sheets
2. Verifique se a aba "GERAL" existe
3. Verifique se os dados estão na primeira linha
4. Compartilhe a planilha com sua conta

### Solução 3: Limpar Cache
1. Pressione Ctrl+Shift+R no navegador
2. Ou abra em uma aba anônima
3. Teste novamente

## 📞 Logs Importantes

### Logs do Console (F12)
- ✅ **Sucesso:** "Transações salvas via Google Apps Script"
- ❌ **Erro:** "Erro ao salvar via Google Apps Script"
- 🌐 **Network:** "Network Error"

### Logs do Apps Script
1. Vá para [script.google.com](https://script.google.com)
2. Abra seu projeto
3. Clique em "Executions"
4. Verifique os logs de cada execução

## 🎯 Checklist de Verificação

- [ ] Google Apps Script está deployado como "Web app"
- [ ] URL do Apps Script está correta no dashboard
- [ ] Planilha tem a aba "GERAL"
- [ ] Planilha está compartilhada com permissão de "Editor"
- [ ] Apps Script tem permissão para acessar a planilha
- [ ] Não há erros no console do navegador
- [ ] Teste simples de conexão funciona

## 🆘 Se Nada Funcionar

1. **Crie um novo projeto do zero:**
   - Delete tudo e comece novamente
   - Siga o guia `CONFIGURAR_GOOGLE_APPS_SCRIPT.md`

2. **Use dados locais temporariamente:**
   - O dashboard funciona com dados locais
   - As funcionalidades de salvar/atualizar podem ser implementadas depois

3. **Contate o suporte:**
   - Forneça os logs de erro
   - Inclua screenshots dos problemas 