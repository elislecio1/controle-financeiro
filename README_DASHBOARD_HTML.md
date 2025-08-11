# Dashboard Financeiro - HTML Puro

## 📋 Descrição

Este é um dashboard financeiro completo desenvolvido em HTML puro, JavaScript e CSS. Ele se conecta diretamente com o Google Sheets para buscar dados financeiros e apresenta uma interface moderna e responsiva.

## ✨ Funcionalidades

### 🔍 Filtros de Período
- **Todos os Períodos**: Mostra todos os registros
- **Mês Atual**: Filtra apenas registros do mês atual
- **Mês Anterior**: Filtra registros do mês anterior
- **Ano Atual**: Filtra registros do ano atual
- **Período Customizado**: Permite definir datas específicas

### 💰 Cards de Totais (Clicáveis)
- **Total Pago**: Filtra registros com status "pago"
- **Total Pendente**: Filtra registros com status "pendente"
- **Total Vencido**: Filtra registros com status "vencido"
- **Pago Hoje**: Mostra pagamentos realizados hoje
- **Vencido Hoje**: Mostra itens que vencem hoje

### 📊 Gráficos Interativos
- **Gráfico de Linha**: Evolução por status ao longo do tempo
- **Gráfico de Pizza**: Distribuição por status

### 📋 Tabela de Dados
- **Paginação**: 20 registros por página
- **Navegação**: Controles de página com números
- **Informações**: Mostra quantos registros estão sendo exibidos

### 🔄 Sincronização
- **Testar Conexão**: Verifica se a conexão com Google Sheets está funcionando
- **Atualizar**: Busca dados atualizados da planilha
- **Cache Busting**: Evita problemas de cache

## 🚀 Como Usar

### 1. Acesso Local
1. Abra o arquivo `dashboard-completo.html` em qualquer navegador
2. O dashboard carregará automaticamente os dados
3. Use os filtros para navegar pelos dados

### 2. Upload via FTP
1. Faça upload do arquivo `dashboard-completo.html` para seu servidor
2. Acesse via URL: `https://seudominio.com/dashboard-completo.html`
3. O dashboard funcionará normalmente

### 3. Configuração da Planilha
O dashboard espera uma planilha Google Sheets com as seguintes colunas:
- **Vencimento**: Data de vencimento (formato DD/MM/AAAA)
- **Descrição**: Descrição da transação
- **Empresa**: Nome da empresa/fornecedor
- **Tipo**: Tipo da transação
- **Valor**: Valor da transação (formato brasileiro)
- **Parcela**: Número da parcela
- **Situação**: Status da transação
- **Data Pagamento**: Data do pagamento (se aplicável)

## ⚙️ Configuração

### API Key do Google Sheets
O dashboard já está configurado com a API key necessária. Se precisar alterar:

1. Abra o arquivo `dashboard-completo.html`
2. Localize a linha:
   ```javascript
   const GOOGLE_SHEETS_API_KEY = 'AIzaSyBL8UXVkErRmaKbNaLTqJnr05_qAL2aR5Q';
   ```
3. Substitua pela sua API key

### ID da Planilha
Para alterar a planilha:

1. Localize a linha:
   ```javascript
   const SPREADSHEETS_ID = '18QjPfOiWnkdn-OgdySJ9uugX8nAor7wDbBsPkneVrSE';
   ```
2. Substitua pelo ID da sua planilha

## 📱 Responsividade

O dashboard é totalmente responsivo e funciona em:
- ✅ Desktop
- ✅ Tablet
- ✅ Smartphone

## 🎨 Design

- **Interface Moderna**: Design limpo e profissional
- **Cores Intuitivas**: Verde para pago, amarelo para pendente, vermelho para vencido
- **Animações Suaves**: Transições e hover effects
- **Loading States**: Indicadores visuais durante carregamento

## 🔧 Funcionalidades Técnicas

### Cache Busting
```javascript
_t: Date.now() // Evita problemas de cache
```

### Tratamento de Erros
- Conexão com Google Sheets
- Dados inválidos
- Formato de datas brasileiro
- Valores monetários

### Dados Simulados
Se a conexão falhar, o dashboard usa dados simulados para demonstração.

## 📊 Cálculos Automáticos

### Total Vencido
Considera todos os itens com data de vencimento anterior à data atual.

### Pago Hoje
Considera movimentações com data de pagamento igual à data atual.

### Vencido Hoje
Considera itens com data de vencimento igual à data atual.

## 🚀 Pronto para Produção

O arquivo está pronto para:
- ✅ Upload via FTP
- ✅ Acesso local
- ✅ Hospedagem em qualquer servidor web
- ✅ Funcionamento offline (com dados simulados)

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se a planilha está pública
2. Teste a conexão usando o botão "Testar Conexão"
3. Verifique o console do navegador para erros detalhados

---

**Desenvolvido com ❤️ para facilitar o controle financeiro** 