# 🔍 Guia para URL da API do Banco Inter

## Problema Identificado
O sistema está tentando conectar com `https://api.inter.com.br` mas recebe erro `ERR_NAME_NOT_RESOLVED`.

## URLs Possíveis da API do Inter

### 1. **API Oficial (Produção)**
- **URL**: `https://cdp.inter.com.br` (URL original que funcionava)
- **Status**: ✅ Funcionava anteriormente
- **Observação**: Esta era a URL que estava funcionando antes

### 2. **API de Desenvolvimento**
- **URL**: `https://api-hml.inter.com.br`
- **Status**: ❓ Precisa testar
- **Observação**: URL de homologação

### 3. **API Alternativa**
- **URL**: `https://api.inter.co`
- **Status**: ❓ Precisa testar
- **Observação**: Possível URL alternativa

### 4. **API via Open Banking**
- **URL**: `https://openbanking.inter.com.br`
- **Status**: ❓ Precisa testar
- **Observação**: Para integração via Open Banking

## Como Testar

### Opção 1: Testar no Navegador
1. Abra o navegador
2. Digite cada URL para ver se carrega
3. Exemplo: `https://api.inter.com.br`

### Opção 2: Testar via Console
```javascript
// Testar cada URL
fetch('https://api.inter.com.br')
  .then(response => console.log('✅ Funciona'))
  .catch(error => console.log('❌ Erro:', error.message));

fetch('https://cdp.inter.com.br')
  .then(response => console.log('✅ Funciona'))
  .catch(error => console.log('❌ Erro:', error.message));
```

### Opção 3: Verificar Documentação Oficial
- Acesse: https://developers.inter.co/
- Verifique a documentação da API
- Procure pela URL base correta

## Próximos Passos

1. **Testar as URLs** listadas acima
2. **Verificar a documentação** oficial do Inter
3. **Atualizar a configuração** com a URL correta
4. **Testar a sincronização** novamente

## Recomendação

**Voltar para a URL original** `https://cdp.inter.com.br` que estava funcionando antes das correções.
