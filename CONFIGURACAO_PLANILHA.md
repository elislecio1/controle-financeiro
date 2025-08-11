# 📊 Configuração da Planilha Google Sheets

## 🔧 Passos para Conectar sua Planilha Real

### 1. **Estrutura da Planilha**

Sua planilha deve ter pelo menos uma das seguintes estruturas:

#### Opção A: Estrutura Básica (Recomendada)
```
| A (Nome/Descrição) | B (Valor) | C (Categoria) | D (Data) |
|-------------------|-----------|---------------|----------|
| Vendas Janeiro    | 15000     | Vendas        | 2024-01  |
| Despesas Janeiro  | 8000      | Despesas      | 2024-01  |
| Marketing         | 5000      | Marketing      | 2024-01  |
```

#### Opção B: Estrutura Flexível
O dashboard detecta automaticamente colunas com nomes como:
- **Nome/Descrição:** "Nome", "Descrição", "Item"
- **Valor:** "Valor", "Preço", "Quantidade"
- **Categoria:** "Categoria", "Tipo", "Grupo"
- **Data:** "Data", "Mês", "Período"

### 2. **Configurar Permissões da Planilha**

#### Método 1: Tornar Pública (Mais Fácil)
1. Abra sua planilha no Google Sheets
2. Clique em "Compartilhar" (canto superior direito)
3. Clique em "Alterar para qualquer pessoa com o link"
4. Selecione "Visualizador"
5. Clique em "Concluído"

#### Método 2: Configurar API (Mais Seguro)
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto ou selecione um existente
3. Ative a API do Google Sheets
4. Crie credenciais (API Key)
5. Configure as permissões da API key

### 3. **Testar a Conexão**

1. **Acesse o dashboard:** `http://localhost:3000`
2. **Clique em "Testar Conexão"** (botão verde)
3. **Verifique o console do navegador** (F12) para logs detalhados
4. **Aguarde a mensagem de status** na tela

### 4. **Solução de Problemas**

#### ❌ Erro: "Acesso negado"
- **Solução:** Torne a planilha pública ou configure permissões da API

#### ❌ Erro: "Planilha não encontrada"
- **Solução:** Verifique se o Spreadsheet ID está correto

#### ❌ Erro: "API Key inválida"
- **Solução:** Verifique se a chave está correta no arquivo `.env`

#### ❌ Erro: "Dados não encontrados"
- **Solução:** Verifique se a planilha tem dados e cabeçalhos

### 5. **Exemplo de Planilha Funcional**

Crie uma planilha com esta estrutura:

```
| Nome              | Valor | Categoria | Data   |
|-------------------|-------|-----------|--------|
| Vendas Janeiro    | 15000 | Vendas    | 2024-01|
| Vendas Fevereiro  | 18000 | Vendas    | 2024-02|
| Vendas Março      | 22000 | Vendas    | 2024-03|
| Despesas Janeiro  | 8000  | Despesas  | 2024-01|
| Despesas Fevereiro| 9500  | Despesas  | 2024-02|
| Despesas Março    | 11000 | Despesas  | 2024-03|
| Marketing Janeiro | 5000  | Marketing | 2024-01|
| Marketing Fevereiro| 6000 | Marketing | 2024-02|
| Marketing Março   | 7500  | Marketing | 2024-03|
```

### 6. **Logs de Debug**

O dashboard mostra logs detalhados no console do navegador:
- 🔍 Conectando com Google Sheets
- 📊 Spreadsheet ID
- 📋 Dados recebidos
- 📝 Cabeçalhos encontrados
- 🔍 Índices mapeados

### 7. **Personalização**

Para personalizar o mapeamento de colunas, edite o arquivo:
`src/services/googleSheets.ts`

Procure por:
```typescript
const nameIndex = headers.findIndex((h: string) => 
  h.toLowerCase().includes('nome') || 
  h.toLowerCase().includes('descrição') || 
  h.toLowerCase().includes('item')
)
```

E adicione seus próprios termos de busca.

### 8. **Suporte**

Se ainda tiver problemas:
1. Verifique o console do navegador (F12)
2. Confirme que a planilha está acessível
3. Teste com dados de exemplo primeiro
4. Verifique se a API key tem permissões corretas

---

**🎯 Dica:** Comece com uma planilha simples para testar, depois adicione seus dados reais! 