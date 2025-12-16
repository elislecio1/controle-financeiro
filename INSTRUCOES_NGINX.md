# ⚙️ Instruções de Configuração do Nginx

## ⚠️ IMPORTANTE: Ordem Correta de Configuração

### Passo 1: Configurar Nginx SEM SSL (Primeiro)

1. No aapanel, vá em **Website** → `financeiro.donsantosba.com.br` → **Settings** → **Config File**
2. **Apague todo o conteúdo** da configuração atual
3. Copie o conteúdo do arquivo **`nginx-financeiro-SEM-SSL.conf`**
4. Clique em **Save**
5. Clique em **Test Config** (deve mostrar "Test successful")
6. Clique em **Reload**

✅ Agora o site deve funcionar em **HTTP** (http://financeiro.donsantosba.com.br)

---

### Passo 2: Configurar SSL no aapanel

1. No aapanel, vá em **Website** → `financeiro.donsantosba.com.br` → **Settings** → **SSL**
2. Clique em **Let's Encrypt**
3. Marque **Force HTTPS** (opcional, mas recomendado)
4. Clique em **Apply**
5. Aguarde alguns segundos enquanto o certificado é gerado

✅ O certificado SSL será criado automaticamente

---

### Passo 3: Atualizar Nginx COM SSL (Depois)

1. No aapanel, vá em **Website** → `financeiro.donsantosba.com.br` → **Settings** → **Config File**
2. **Apague todo o conteúdo** da configuração atual
3. Copie o conteúdo do arquivo **`nginx-financeiro.conf`**
4. **IMPORTANTE**: Verifique o caminho dos certificados SSL
   - O caminho padrão é: `/www/server/panel/vhost/cert/financeiro.donsantosba.com.br/`
   - Se der erro, verifique o caminho real no aapanel: **SSL** → **Certificate Path**
5. Clique em **Save**
6. Clique em **Test Config** (deve mostrar "Test successful")
7. Clique em **Reload**

✅ Agora o site deve funcionar em **HTTPS** (https://financeiro.donsantosba.com.br)

---

## 🔍 Como Verificar o Caminho Correto dos Certificados

Se você receber erro sobre certificados não encontrados:

1. No aapanel, vá em **Website** → `financeiro.donsantosba.com.br` → **Settings** → **SSL**
2. Procure por **Certificate Path** ou **Certificate File**
3. Anote o caminho completo
4. Atualize a configuração Nginx com o caminho correto

Exemplos de caminhos comuns no aapanel:
- `/www/server/panel/vhost/cert/financeiro.donsantosba.com.br/fullchain.pem`
- `/www/server/panel/vhost/ssl/financeiro.donsantosba.com.br/fullchain.pem`
- `/www/server/panel/vhost/ssl/financeiro.donsantosba.com.br/cert.pem`

---

## 🐛 Troubleshooting

### Erro: "cannot load certificate"

**Causa**: SSL ainda não foi configurado ou caminho incorreto

**Solução**:
1. Use primeiro a configuração **SEM SSL** (`nginx-financeiro-SEM-SSL.conf`)
2. Configure o SSL no aapanel
3. Depois use a configuração **COM SSL** (`nginx-financeiro.conf`)

### Erro: "Test Config failed"

**Causa**: Erro de sintaxe na configuração

**Solução**:
1. Verifique se copiou todo o conteúdo corretamente
2. Verifique se não há caracteres especiais
3. Use o botão **Test Config** antes de salvar

### Site não carrega após configurar SSL

**Causa**: Redirecionamento HTTP para HTTPS pode estar causando loop

**Solução**:
1. Verifique se o certificado foi gerado corretamente
2. Acesse diretamente via HTTPS: `https://financeiro.donsantosba.com.br`
3. Verifique os logs: `/www/wwwlogs/financeiro.donsantosba.com.br.error.log`

---

## 📝 Resumo Rápido

```bash
# 1. Primeiro: Use nginx-financeiro-SEM-SSL.conf
# 2. Configure SSL no aapanel
# 3. Depois: Use nginx-financeiro.conf
```

---

**✅ Siga esta ordem e tudo funcionará perfeitamente!**

