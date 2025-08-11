# Solução para Erro 401 - Permissões de Escrita no Google Sheets

## Problema
O erro "Request failed with status code 401" indica que a API key não tem permissões para **escrever** na planilha do Google Sheets.

## Diferença entre 403 e 401
- **403 (Forbidden)**: Problema de CORS ou acesso negado para leitura
- **401 (Unauthorized)**: API key não tem permissões de escrita

## Soluções

### 1. Verificar Permissões da API Key

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Vá para "APIs & Services" > "Credentials"
3. Encontre sua API key e clique nela
4. Verifique se as seguintes APIs estão habilitadas:
   - **Google Sheets API**
   - **Google Drive API** (se necessário)

### 2. Configurar Permissões da Planilha

**IMPORTANTE**: A planilha deve estar configurada para permitir acesso público ou a API key deve ter acesso específico.

#### Opção A: Tornar a Planilha Pública (Mais Simples)
1. Abra sua planilha no Google Sheets
2. Clique em "Compartilhar" (canto superior direito)
3. Clique em "Alterar para qualquer pessoa com o link"
4. Selecione "Editor" nas permissões
5. Clique em "Concluído"

#### Opção B: Configurar Permissões Específicas
1. Na planilha, clique em "Compartilhar"
2. Adicione o email associado à sua API key como "Editor"
3. Ou configure permissões específicas para a API key

### 3. Verificar Configuração da API Key

Certifique-se de que sua API key tem as restrições corretas:

1. No Google Cloud Console, vá para sua API key
2. Em "Application restrictions", escolha:
   - "None" (para testes)
   - "HTTP referrers" (para produção)
3. Em "API restrictions", selecione:
   - "Restrict key"
   - Marque "Google Sheets API"

### 4. Testar a API Key

Crie um arquivo de teste para verificar se a API key funciona:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Teste API Google Sheets</title>
</head>
<body>
    <h1>Teste de Permissões da API</h1>
    <button onclick="testarAPI()">Testar API</button>
    <div id="resultado"></div>

    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script>
        const API_KEY = 'SUA_API_KEY_AQUI';
        const SPREADSHEET_ID = '18QjPfOiWnkdn-OgdySJ9uugX8nAor7wDbBsPkneVrSE';
        const SHEET_NAME = 'GERAL';

        async function testarAPI() {
            const resultado = document.getElementById('resultado');
            resultado.innerHTML = 'Testando...';

            try {
                // Teste 1: Ler dados
                const urlRead = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:Z`;
                const responseRead = await axios.get(urlRead, {
                    params: { key: API_KEY }
                });
                
                resultado.innerHTML += '<br>✅ Leitura funcionou!';

                // Teste 2: Tentar escrever dados
                const urlWrite = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:append?valueInputOption=USER_ENTERED`;
                const testData = [['TESTE', 'API', 'FUNCIONA', 'D', '100', '1/1', '', '']];
                
                const responseWrite = await axios.post(urlWrite, {
                    values: testData
                }, {
                    params: { key: API_KEY }
                });
                
                resultado.innerHTML += '<br>✅ Escrita funcionou!';
                resultado.innerHTML += '<br>🎉 API key tem todas as permissões necessárias!';

            } catch (error) {
                resultado.innerHTML += `<br>❌ Erro: ${error.message}`;
                
                if (error.response) {
                    resultado.innerHTML += `<br>Código: ${error.response.status}`;
                    resultado.innerHTML += `<br>Detalhes: ${JSON.stringify(error.response.data)}`;
                }
            }
        }
    </script>
</body>
</html>
```

### 5. Alternativas se o Problema Persistir

#### Opção A: Usar Google Apps Script
Se a API key continuar com problemas, você pode usar Google Apps Script como intermediário.

#### Opção B: Implementar Fallback Local
Manter os dados localmente e sincronizar quando possível.

## Verificação Rápida

Para verificar se o problema foi resolvido:

1. Execute o arquivo de teste acima
2. Se ambos os testes (leitura e escrita) passarem, o problema está resolvido
3. Se apenas a leitura funcionar, ainda há problemas de permissão de escrita
4. Se nenhum funcionar, há problemas com a API key ou configuração

## Próximos Passos

1. Execute o teste acima
2. Configure as permissões da planilha
3. Teste novamente o dashboard
4. Se ainda houver problemas, considere usar Google Apps Script 