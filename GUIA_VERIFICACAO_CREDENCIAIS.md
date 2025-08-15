# 🔍 Guia de Verificação de Credenciais

## Problema Identificado

O sistema estava fazendo sincronização simulada quando as credenciais não estavam configuradas. Agora o sistema **sempre tenta sincronização real** e falha se as credenciais não estiverem configuradas corretamente.

## ✅ Correções Implementadas

1. **Removida sincronização simulada** - O sistema não faz mais fallback para simulação
2. **Verificação correta de credenciais** - Para API oficial do Banco Inter, verifica `apiKey` e `apiSecret`
3. **Logs detalhados** - Agora mostra exatamente quais credenciais estão configuradas
4. **Função específica para API oficial** - `obterTokenInterAPI()` usa as credenciais corretas

## 🔧 Como Verificar se as Credenciais Estão Salvas

### 1. Verificar no Console do Navegador

Quando você tentar sincronizar, o console mostrará:

```
🔍 Verificando credenciais configuradas...
🔑 API Key configurada: true/false
🔑 API Secret configurada: true/false
🔑 Client ID configurado: true/false
🔑 Client Secret configurado: true/false
```

### 2. Verificar no Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para sua tabela `integracoes_bancarias`
3. Verifique se a coluna `configuracao` contém:
   ```json
   {
     "apiKey": "sua-api-key-aqui",
     "apiSecret": "seu-api-secret-aqui",
           "baseUrl": "https://api.inter.com.br",
     "ambiente": "producao",
     "certificadoArquivo": {...},
     "tipoCertificado": "pfx"
   }
   ```

### 3. Usar o Script de Verificação

1. Configure as credenciais do Supabase no arquivo `verificar_credenciais.js`
2. Execute: `node verificar_credenciais.js`

## 🏦 Configuração Correta para Banco Inter

### Campos Obrigatórios:

1. **API Key** ✅ - Sua chave da API do Banco Inter
2. **API Secret** ✅ - Seu secret da API do Banco Inter
3. **Base URL** ✅ - `https://api.inter.com.br` (produção) ou `https://api-hml.inter.com.br` (homologação)
4. **Ambiente** ✅ - `producao` ou `homologacao`
5. **Certificado Digital** ✅ - Arquivo .pfx, .p12, .pem ou .crt
6. **Tipo de Integração** ✅ - `api_oficial`

### Campos Opcionais:

- **Senha do Certificado** - Se o certificado tiver senha
- **Chave Privada** - Se separada do certificado
- **Timeout** - Padrão: 30000ms

## 🚨 Possíveis Problemas

### 1. Credenciais Não Salvas
- **Sintoma**: Console mostra "API Key configurada: false"
- **Solução**: Verificar se os campos estão sendo preenchidos no formulário

### 2. Tipo de Integração Incorreto
- **Sintoma**: Sistema tenta usar `clientId/clientSecret` em vez de `apiKey/apiSecret`
- **Solução**: Garantir que o tipo seja `api_oficial`

### 3. Certificado Não Selecionado
- **Sintoma**: Erro de autenticação com o banco
- **Solução**: Fazer upload do certificado digital

### 4. Ambiente Incorreto
- **Sintoma**: Erro de conexão com a API
- **Solução**: Verificar se está usando `producao` ou `homologacao` correto

## 🔄 Próximos Passos

1. **Configure as credenciais** no formulário de integração
2. **Faça upload do certificado** digital
3. **Teste a sincronização** - deve mostrar logs detalhados
4. **Verifique os logs** no console para identificar problemas

## 📞 Suporte

Se ainda houver problemas:
1. Verifique os logs no console do navegador
2. Confirme se as credenciais estão salvas no Supabase
3. Teste com credenciais de homologação primeiro
4. Verifique se o certificado digital é válido
