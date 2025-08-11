# 📊 Dashboard Financeiro - Versão HTML

Dashboard completo em HTML puro para controle financeiro conectado ao Google Sheets.

## 🚀 Como Usar

### 1. **Executar Localmente**
- Abra o arquivo `dashboard.html` em qualquer navegador
- Não precisa de servidor ou instalação
- Funciona offline (com dados simulados)

### 2. **Enviar via FTP**
- Faça upload dos arquivos para seu servidor
- Coloque em qualquer pasta do seu domínio
- Acesse via URL: `https://seudominio.com/pasta/dashboard.html`

## 📁 Arquivos Necessários

```
📁 dashboard/
├── 📄 dashboard.html     # Dashboard principal
├── 📄 config.js         # Configurações
└── 📄 README_HTML.md    # Este arquivo
```

## ⚙️ Configuração

### 1. **Editar Credenciais**
Abra o arquivo `dashboard.html` e altere estas linhas:

```javascript
const API_KEY = 'SUA_API_KEY_AQUI';
const SPREADSHEET_ID = 'SEU_SPREADSHEET_ID_AQUI';
const SHEET_NAME = 'NOME_DA_ABA_AQUI';
```

### 2. **Estrutura da Planilha**
Sua planilha deve ter estas colunas:
```
| VENCIMENTO | DESCRIÇÃO | EMPRESA | TIPO | VALOR | PARCELA | SITUAÇÃO | DATA PAGAMENTO |
```

## 🎯 Funcionalidades

### ✅ **Dashboard Completo**
- **Estatísticas em tempo real** (Pago, Pendente, Vencido, Total)
- **Gráficos interativos** (Linha, Pizza, Barras)
- **Tabela detalhada** com cores por status
- **Navegação por abas** (Visão Geral, Análises, Relatórios)

### ✅ **Conexão Google Sheets**
- **API Key configurada** para sua planilha
- **Detecção automática** de status de pagamento
- **Tratamento de erros** com dados simulados
- **Logs detalhados** no console

### ✅ **Interface Responsiva**
- **Design moderno** e profissional
- **Funciona em mobile** e desktop
- **Cores intuitivas** (verde=pago, amarelo=pendente, vermelho=vencido)
- **Loading states** e feedback visual

## 🔧 Personalização

### **Cores**
Edite as cores no CSS:
```css
.status-pago { background: #10b981; }
.status-pendente { background: #f59e0b; }
.status-vencido { background: #ef4444; }
```

### **Layout**
Modifique o CSS para ajustar:
- Tamanho dos cards
- Espaçamentos
- Cores do tema
- Tipografia

### **Funcionalidades**
Adicione no JavaScript:
- Filtros por data
- Exportação de dados
- Notificações
- Auto-refresh

## 📊 Exemplo de Dados

O dashboard funciona com dados como:
```
Vencimento    | Descrição                    | Empresa        | Valor   | Status
15/07/2025    | DIFERENÇA DE ALUGUEL BTN    | FRANCISCO     | R$ 300  | Pago
18/07/2025    | DARF PREVIDENCIÁRIO         | DARF          | R$ 612  | Vencido
21/07/2025    | ALUGUEL CENTRO              | JOSE GOMES    | R$ 3500 | Pago
```

## 🚀 Deploy

### **Via FTP**
1. Faça upload dos arquivos para seu servidor
2. Acesse via URL do seu domínio
3. Configure as credenciais no arquivo HTML

### **Via GitHub Pages**
1. Crie um repositório no GitHub
2. Faça upload dos arquivos
3. Ative GitHub Pages
4. Acesse via URL gerada

### **Via Netlify/Vercel**
1. Faça upload dos arquivos
2. Configure domínio personalizado
3. Acesse via URL configurada

## 🔍 Debug

### **Console do Navegador**
Pressione F12 e veja:
- Logs de conexão
- Erros de API
- Dados recebidos
- Status de carregamento

### **Teste de Conexão**
Clique em "Testar Conexão" para verificar:
- ✅ API Key válida
- ✅ Planilha acessível
- ✅ Permissões corretas

## 📱 Compatibilidade

- ✅ **Chrome/Edge** (recomendado)
- ✅ **Firefox**
- ✅ **Safari**
- ✅ **Mobile browsers**

## 🆘 Solução de Problemas

### **Erro: "Acesso negado"**
- Torne a planilha pública
- Verifique a API Key
- Confirme as permissões

### **Erro: "Planilha não encontrada"**
- Verifique o Spreadsheet ID
- Confirme o nome da aba
- Teste a URL da planilha

### **Dados não aparecem**
- Verifique o console (F12)
- Confirme a estrutura da planilha
- Teste com dados simulados

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique o console do navegador
2. Confirme as configurações
3. Teste a conexão primeiro
4. Use dados simulados para debug

---

**🎯 Dica:** Comece testando localmente, depois faça o deploy no seu servidor! 