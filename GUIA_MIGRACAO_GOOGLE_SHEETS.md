# 🚀 Guia de Migração: Google Sheets → Supabase

Este guia explica como migrar todas as movimentações financeiras da sua planilha do Google Sheets para o Supabase.

## 📋 Pré-requisitos

1. **Node.js** instalado no seu computador
2. **Conta Google Cloud** com Google Sheets API habilitada
3. **Credenciais de Service Account** do Google
4. **Acesso ao Supabase** com chaves de API

## 🔑 Configuração do Google Cloud

### 1. Criar Projeto no Google Cloud Console
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Habilite a **Google Sheets API**

### 2. Criar Service Account
1. No menu lateral, vá para **IAM & Admin** → **Service Accounts**
2. Clique em **Create Service Account**
3. Dê um nome (ex: "migracao-planilha")
4. Clique em **Create and Continue**
5. Pule as permissões por enquanto
6. Clique em **Done**

### 3. Gerar Chave de Autenticação
1. Clique no service account criado
2. Vá para a aba **Keys**
3. Clique em **Add Key** → **Create new key**
4. Selecione **JSON**
5. Baixe o arquivo JSON

### 4. Compartilhar a Planilha
1. Abra sua planilha: [PLANEJAMENTO FINANCEIRO 2025](https://docs.google.com/spreadsheets/d/18QjPfOiWnkdn-OgdySJ9uugX8nAor7wDbBsPkneVrSE/edit?gid=633951027#gid=633951027)
2. Clique em **Compartilhar** (canto superior direito)
3. Adicione o email do service account (ex: `migracao-planilha@seu-projeto.iam.gserviceaccount.com`)
4. Dê permissão de **Visualizador**

## 📦 Instalação das Dependências

```bash
npm install googleapis @supabase/supabase-js dotenv
```

## ⚙️ Configuração do Ambiente

### 1. Arquivo .env
Adicione estas variáveis ao seu arquivo `.env`:

```env
# Supabase
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase

# Google Sheets
GOOGLE_APPLICATION_CREDENTIALS=./google-sheets-credentials.json
```

### 2. Arquivo de Credenciais
1. Renomeie o arquivo JSON baixado do Google Cloud para `google-sheets-credentials.json`
2. Coloque-o na raiz do projeto
3. **IMPORTANTE**: Adicione `google-sheets-credentials.json` ao `.gitignore` para não expor suas credenciais

## 🔧 Executando a Migração

### 1. Executar o Script
```bash
node migracao_google_sheets.js
```

### 2. Monitorar o Progresso
O script mostrará:
- ✅ Leitura da planilha
- 🔄 Conversão dos dados
- 🚀 Inserção no Supabase
- 📊 Resumo final

## 📊 Estrutura dos Dados Migrados

### Mapeamento da Planilha para Supabase:

| Planilha | Supabase | Descrição |
|----------|----------|-----------|
| Coluna A | `vencimento` | Data de vencimento (DD/MM/YYYY → YYYY-MM-DD) |
| Coluna B | `descricao` | Descrição da transação |
| Coluna C | `conta` | Empresa/Conta bancária |
| Coluna D | `tipo` | Tipo (determinado automaticamente) |
| Coluna E | `valor` | Valor (convertido para número) |
| Coluna F | `parcela` | Informação de parcela (vai para observações) |
| Coluna G | `status` | Status (PAGO → pago, VENCIDO → vencido) |
| Coluna H | `data_pagamento` | Data de pagamento (DD/MM/YYYY → YYYY-MM-DD) |

### Conversões Automáticas:
- **Tipo**: Baseado no valor (positivo = receita, negativo = despesa)
- **Status**: PAGO → pago, VENCIDO → vencido, outros → pendente
- **Valor**: Convertido para número com sinal correto
- **Datas**: Convertidas de DD/MM/YYYY para YYYY-MM-DD

## 🚨 Tratamento de Erros

### Erros Comuns e Soluções:

1. **"Permission denied"**
   - Verifique se a planilha foi compartilhada com o service account
   - Confirme se as credenciais estão corretas

2. **"Invalid date format"**
   - Verifique se as datas na planilha estão no formato DD/MM/YYYY
   - Linhas com datas inválidas serão puladas

3. **"Supabase connection error"**
   - Verifique as variáveis de ambiente do Supabase
   - Confirme se as chaves de API estão corretas

4. **"Rate limit exceeded"**
   - O script insere em lotes de 50 para evitar limites
   - Aguarde alguns minutos e execute novamente

## 📈 Monitoramento e Verificação

### 1. Verificar no Supabase
1. Acesse o dashboard do Supabase
2. Vá para **Table Editor** → **transactions**
3. Verifique se os dados foram inseridos corretamente

### 2. Verificar no Sistema
1. Abra o sistema de controle financeiro
2. Vá para a aba **Transações**
3. Confirme se as transações aparecem com:
   - Valores corretos
   - Datas formatadas
   - Status correto
   - Contas mapeadas

## 🔄 Executar Novamente

Se precisar executar a migração novamente:

1. **Limpar dados existentes** (opcional):
   ```sql
   DELETE FROM transactions WHERE observacoes LIKE '%Migrado da planilha%';
   ```

2. **Executar o script**:
   ```bash
   node migracao_google_sheets.js
   ```

## 🎯 Personalizações

### Modificar Mapeamento de Contas
Edite a função `convertRowToTransaction` para mapear empresas específicas para contas:

```javascript
// Exemplo: mapear empresas para contas específicas
const mapeamentoContas = {
  'NEONEGIA': 'Energia',
  'BUREAU': 'Honorários',
  'INTER': 'Cartão de Crédito'
};

const conta = mapeamentoContas[empresa] || empresa || 'Conta Padrão';
```

### Adicionar Categorias
Para incluir categorias baseadas na descrição:

```javascript
const determinarCategoria = (descricao) => {
  if (descricao.toLowerCase().includes('energia')) return 'Serviços Públicos';
  if (descricao.toLowerCase().includes('honorarios')) return 'Profissionais';
  return 'Outros';
};
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs de erro no console
2. Confirme as configurações de credenciais
3. Verifique as permissões da planilha
4. Teste a conexão com o Supabase

## 🎉 Próximos Passos

Após a migração bem-sucedida:
1. **Verificar dados** no sistema
2. **Ajustar categorias** se necessário
3. **Configurar contas bancárias** reais
4. **Testar funcionalidades** do sistema
5. **Fazer backup** dos dados migrados

---

**⚠️ Importante**: Sempre teste a migração em um ambiente de desenvolvimento antes de executar em produção!
