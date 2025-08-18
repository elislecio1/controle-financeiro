# 🔍 Guia para URL da API do Banco Inter

## ✅ URLs Oficiais Corretas

### **Produção**
- **Base URL**: `https://cdpj.partners.bancointer.com.br`
- **Extrato**: `https://cdpj.partners.bancointer.com.br/banking/v2/extrato`
- **Pagamentos**: `https://cdpj.partners.bancointer.com.br/banking/v2/pagamentos`
- **PIX**: `https://cdpj.partners.bancointer.com.br/pix/v2`
- **Cobrança**: `https://cdpj.partners.bancointer.com.br/cobranca/v2/boletos`

### **Homologação (Sandbox)**
- **Base URL**: `https://cdpj-sandbox.partners.bancointer.com.br`
- **Extrato**: `https://cdpj-sandbox.partners.bancointer.com.br/banking/v2/extrato`
- **Pagamentos**: `https://cdpj-sandbox.partners.bancointer.com.br/banking/v2/pagamentos`
- **PIX**: `https://cdpj-sandbox.partners.bancointer.com.br/pix/v2`
- **Cobrança**: `https://cdpj-sandbox.partners.bancointer.com.br/cobranca/v2/boletos`

## 🔧 Configuração no Sistema

### 1. **URL Base**
Configure a URL base de acordo com o ambiente:
- **Produção**: `https://cdpj.partners.bancointer.com.br`
- **Homologação**: `https://cdpj-sandbox.partners.bancointer.com.br`

### 2. **Credenciais Necessárias**
- **API Key**: Obrigatória
- **API Secret**: Obrigatória
- **Certificado Digital**: Obrigatório para autenticação

### 3. **Endpoints Principais**
- **Token**: `/oauth/v2/token`
- **Extrato**: `/banking/v2/extrato`
- **Pagamentos**: `/banking/v2/pagamentos`

## 🚀 Como Testar

### Opção 1: Testar no Navegador
1. Abra o navegador
2. Digite: `https://cdpj.partners.bancointer.com.br`
3. Verifique se a página carrega

### Opção 2: Testar via Console
```javascript
// Testar URL de produção
fetch('https://cdpj.partners.bancointer.com.br')
  .then(response => console.log('✅ Produção funciona'))
  .catch(error => console.log('❌ Erro produção:', error.message));

// Testar URL de sandbox
fetch('https://cdpj-sandbox.partners.bancointer.com.br')
  .then(response => console.log('✅ Sandbox funciona'))
  .catch(error => console.log('❌ Erro sandbox:', error.message));
```

## 📚 Documentação Oficial
- **Portal de Desenvolvedores**: https://developers.inter.co/
- **Documentação da API**: https://developers.inter.co/docs/

## ✅ Status Atual
- **URLs Atualizadas**: ✅ Sistema configurado com URLs oficiais
- **Correção Automática**: ✅ Sistema corrige URLs incorretas automaticamente
- **Ambiente Configurável**: ✅ Suporte para produção e sandbox

## 🔄 Próximos Passos
1. **Configurar credenciais** no sistema
2. **Testar conexão** com a API oficial
3. **Verificar sincronização** de transações reais
