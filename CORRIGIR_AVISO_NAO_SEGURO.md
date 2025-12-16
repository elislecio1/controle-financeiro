# 🔒 Corrigir Aviso "Não Seguro" no Navegador

## ❌ Problema

Mesmo com HTTPS funcionando, o navegador mostra "Não seguro".

**Possíveis causas**:
1. Conteúdo misto (HTTP e HTTPS)
2. Certificado não reconhecido corretamente
3. Configuração Nginx não forçando HTTPS
4. Headers de segurança faltando

---

## ✅ Solução 1: Verificar Configuração Nginx

### Verificar se está usando HTTPS

No aapanel:
1. **Website** → `cf.don.cim.br` → **Settings** → **Config File**
2. Certifique-se de que está usando o arquivo `nginx-cf-don-cim-SSL.conf`
3. Verifique se tem:
   ```nginx
   listen 443 ssl http2;
   ssl_certificate /www/server/panel/vhost/cert/cf.don.cim.br/fullchain.pem;
   ssl_certificate_key /www/server/panel/vhost/cert/cf.don.cim.br/privkey.pem;
   ```

### Verificar Redirecionamento HTTP → HTTPS

Certifique-se de que há um bloco `server` que redireciona HTTP para HTTPS:
```nginx
server {
    listen 80;
    server_name cf.don.cim.br;
    return 301 https://$server_name$request_uri;
}
```

---

## ✅ Solução 2: Verificar Certificado

### No terminal:

```bash
# Verificar certificado
sudo openssl s_client -connect cf.don.cim.br:443 -servername cf.don.cim.br | grep -A 5 "Certificate chain"

# Verificar se certificado está válido
sudo certbot certificates
```

### Verificar no navegador:

1. Clique no cadeado na barra de endereço
2. Clique em **"Certificado"** ou **"Connection is secure"**
3. Verifique se mostra:
   - **Emitido para**: cf.don.cim.br
   - **Emitido por**: Let's Encrypt
   - **Válido até**: 2026-03-10

---

## ✅ Solução 3: Verificar Conteúdo Misto

### No Console do Navegador (F12):

1. Abra o Console (F12)
2. Procure por erros como:
   - `Mixed Content: The page was loaded over HTTPS, but requested an insecure resource`
   - `Blocked loading mixed active content`

### Se encontrar erros:

Verifique se há recursos carregando via HTTP:
- Imagens
- Scripts
- CSS
- Fontes
- APIs externas

Todos devem usar HTTPS ou caminhos relativos.

---

## ✅ Solução 4: Adicionar Headers de Segurança

Certifique-se de que a configuração Nginx inclui:

```nginx
# Headers de segurança
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

---

## ✅ Solução 5: Forçar HTTPS no aapanel

1. No aapanel: **Website** → `cf.don.cim.br` → **Settings** → **SSL**
2. Marque **"Force HTTPS"**
3. Clique em **"Save"**

---

## 🧪 Testar

### 1. Limpar Cache do Navegador
- `Ctrl + Shift + Delete`
- Limpe cache e cookies
- Ou use janela anônima

### 2. Testar Acesso
1. Acesse: `http://cf.don.cim.br` (deve redirecionar para HTTPS)
2. Acesse: `https://cf.don.cim.br` (deve mostrar cadeado verde)

### 3. Verificar no Console
- Abra Console (F12)
- Verifique se há erros de conteúdo misto
- Verifique se todos os recursos carregam via HTTPS

---

## 🔍 Verificar Configuração Atual

### No terminal:

```bash
# Verificar se Nginx está servindo HTTPS
curl -I https://cf.don.cim.br

# Deve retornar:
# HTTP/2 200
# (não HTTP/1.1)

# Verificar certificado
openssl s_client -connect cf.don.cim.br:443 -servername cf.don.cim.br < /dev/null 2>/dev/null | openssl x509 -noout -dates
```

---

## 📝 Checklist

- [ ] Configuração Nginx está usando `nginx-cf-don-cim-SSL.conf`
- [ ] Certificado SSL está instalado e válido
- [ ] Redirecionamento HTTP → HTTPS está configurado
- [ ] "Force HTTPS" está marcado no aapanel
- [ ] Headers de segurança estão configurados
- [ ] Não há conteúdo misto (todos recursos via HTTPS)
- [ ] Cache do navegador foi limpo

---

## 🐛 Se Ainda Não Funcionar

### Verificar logs do Nginx:

```bash
tail -f /www/wwwlogs/cf.don.cim.br.error.log
```

### Verificar configuração Nginx:

```bash
sudo nginx -t
```

### Recarregar Nginx:

```bash
sudo systemctl reload nginx
```

---

**✅ Após verificar todas as configurações, o aviso "Não seguro" deve desaparecer!**

