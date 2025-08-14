# 🚀 Guia Prático: Configurando Banco Inter na Plataforma

## ✅ Você já tem:
- ✅ **ClientID** e **ClientSecret** do Banco Inter
- ✅ **Certificado**: `Inter API_Certificado.crt`
- ✅ **Chave Privada**: `Inter API_Chave.key`

## 📋 Passo a Passo na Plataforma

### **Passo 1: Acessar Integrações**
1. Abra o sistema de controle financeiro
2. Clique na aba **"Integrações"** no menu superior
3. Clique em **"Nova Integração Bancária"**

### **Passo 2: Selecionar Banco Inter**
1. No campo **"Banco"**, selecione: **"077 - Banco Inter S.A."**
2. No campo **"Tipo de Integração"**, selecione: **"API Oficial"**
3. No campo **"Ambiente"**, selecione: **"Homologação"** (para testes)

### **Passo 3: Configurar Credenciais**
1. **ClientID**: Cole o seu ClientID do Banco Inter
2. **ClientSecret**: Cole o seu ClientSecret do Banco Inter
3. **Base URL**: 
   - **Homologação**: `https://cdp.inter.com.br`
   - **Produção**: `https://cdp.inter.com.br`
   - **Nota**: Mesma URL para ambos os ambientes
   - (O sistema preenche automaticamente)

### **Passo 4: Configurar Certificado Digital**
1. **Tipo de Certificado**: Selecione **"CRT"** (já que você tem arquivo .crt)
2. **Senha do Certificado**: Digite a senha (se houver)
3. **Upload do Certificado**: 
   - Clique em **"Escolher arquivo"**
   - Selecione o arquivo: `Inter API_Certificado.crt`
4. **Upload da Chave Privada**:
   - Clique em **"Escolher arquivo"**
   - Selecione o arquivo: `Inter API_Chave.key`

### **Passo 5: Configurações Adicionais**
1. **Frequência de Sincronização**: 24 horas (recomendado)
2. **Integração Ativa**: Marque a caixa para ativar
3. **Timeout**: 30 segundos (padrão)

### **Passo 6: Salvar e Testar**
1. Clique em **"Salvar Integração"**
2. Após salvar, clique em **"Testar Conexão"**
3. Verifique se aparece: **"Conexão testada com sucesso!"**

## 🔧 Configuração Detalhada

### **URLs do Banco Inter:**
- **Base URL (Homologação)**: `https://cdp.inter.com.br`
- **Base URL (Produção)**: `https://cdp.inter.com.br`
- **Documentação**: `https://developers.inter.co/docs/category/introdução`
- **Portal do Desenvolvedor**: `https://developers.inter.co`

**Nota**: O Banco Inter usa a mesma URL (`https://cdp.inter.com.br`) tanto para homologação quanto para produção. A diferenciação entre ambientes é feita através das credenciais e certificados específicos de cada ambiente.

### **Dados do Formulário:**
```json
{
  "nome": "Banco Inter - Minha Empresa",
  "banco": "077",
  "tipoIntegracao": "api_oficial",
  "ambiente": "homologacao",
  "configuracao": {
    "nomeInstituicao": "Inter",
    "ambiente": "homologacao",
    "clientId": "SEU_CLIENT_ID_AQUI",
    "clientSecret": "SEU_CLIENT_SECRET_AQUI",
    "baseUrl": "https://cdp.inter.com.br",
    "tipoCertificado": "crt",
    "senhaCertificado": "SENHA_SE_HOUVER",
    "certificadoArquivo": "Inter API_Certificado.crt",
    "chavePrivadaArquivo": "Inter API_Chave.key",
    "timeout": 30000
  },
  "frequenciaSincronizacao": 24,
  "ativo": true
}
```

## 🧪 Testando a Integração

### **Teste 1: Conexão Básica**
1. Clique em **"Testar Conexão"**
2. **Resultado esperado**: "Conexão testada com sucesso!"

### **Teste 2: Sincronização Manual**
1. Clique em **"Sincronizar"**
2. **Resultado esperado**: "Sincronização concluída: X transações importadas"

### **Teste 3: Verificar Logs**
1. Vá para a aba **"Logs"**
2. Verifique se aparecem logs de sucesso
3. **Status esperado**: "sucesso"

## 🚨 Possíveis Problemas e Soluções

### **Problema: "Erro de autenticação"**
**Solução:**
- Verifique se o ClientID e ClientSecret estão corretos
- Confirme se os arquivos de certificado foram enviados
- Teste primeiro no ambiente de homologação

### **Problema: "Certificado inválido"**
**Solução:**
- Verifique se o arquivo .crt não está corrompido
- Confirme se a senha do certificado está correta
- Tente converter para formato PFX se necessário

### **Problema: "Timeout na conexão"**
**Solução:**
- Aumente o timeout para 60 segundos
- Verifique sua conexão com a internet
- Teste em horário de menor movimento

## 📊 Após a Configuração

### **O que acontece automaticamente:**
- ✅ **Sincronização**: A cada 24 horas (configurável)
- ✅ **Importação**: Transações do período configurado
- ✅ **Conciliação**: Automática com transações existentes
- ✅ **Logs**: Registro de todas as operações

### **Como monitorar:**
1. **Dashboard**: Status da integração em tempo real
2. **Logs**: Histórico completo de sincronizações
3. **Transações**: Verificar transações importadas
4. **Alertas**: Notificações de problemas

## 🔄 Migrando para Produção

### **URLs de Produção:**
- **Base URL**: `https://cdp.inter.com.br` (mesma URL da homologação)
- **Diferenciação**: Através das credenciais e certificados específicos de produção

### **Quando estiver funcionando em homologação:**
1. **Altere o ambiente** para **"Produção"**
2. **Atualize as credenciais** de produção (ClientID e ClientSecret de produção)
3. **Atualize os certificados** de produção (se diferentes)
4. **Teste novamente** a conexão
5. **Monitore** as primeiras sincronizações

### **Importante:**
- A URL permanece a mesma: `https://cdp.inter.com.br`
- A diferenciação entre ambientes é feita pelas credenciais
- Use sempre certificados e credenciais específicos de produção

## 📞 Suporte

### **Se precisar de ajuda:**
- **Logs do sistema**: Verifique a aba "Logs" para detalhes
- **Documentação**: Consulte o guia completo
- **Banco Inter**: 3003 4070 (suporte técnico)

---

**🎯 Próximo passo**: Após configurar, você poderá ver suas transações do Banco Inter sendo importadas automaticamente no sistema!
