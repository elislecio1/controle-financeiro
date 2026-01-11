# 🔧 Solução: HTTPS Connection Refused

## 🚨 Problema

- ✅ HTTP (porta 80) está funcionando
- ❌ HTTPS (porta 443) não funciona - `ERR_CONNECTION_REFUSED`
- ⚠️ Nginx está parado (`nginx is stopped`)

## 🔍 Diagnóstico

Execute o script de diagnóstico:

```bash
chmod +x corrigir-https.sh
./corrigir-https.sh
```

## ✅ Soluções

### Solução 1: Iniciar o Nginx

O nginx está parado. Inicie-o:

```bash
# Iniciar nginx
/etc/init.d/nginx start

# Verificar status
/etc/init.d/nginx status

# Verificar se a porta 443 está sendo escutada
ss -tulpn | grep :443
```

### Solução 2: Verificar Configuração SSL

Se o nginx não estiver escutando na porta 443, a configuração SSL pode estar faltando:

1. **No painel do aapanel:**
   - Website → cf.don.cim.br → Settings → Config File
   - Verifique se há um bloco `server` com `listen 443 ssl`

2. **Ou verifique diretamente:**
```bash
grep -A 10 "listen.*443" /www/server/panel/vhost/nginx/cf.don.cim.br.conf
```

### Solução 3: Configurar SSL no aapanel

Se não houver certificado SSL configurado:

1. Acesse o painel do aapanel
2. Website → cf.don.cim.br → Settings → SSL
3. Clique em "Let's Encrypt"
4. Selecione o domínio `cf.don.cim.br`
5. Clique em "Apply" (Aplicar)
6. Aguarde a configuração automática

### Solução 4: Usar Configuração SSL Manual

Se os certificados já existem mas não estão configurados, adicione no aapanel:

**Website → cf.don.cim.br → Settings → Config File**

Cole esta configuração (ajuste os caminhos dos certificados se necessário):

```nginx
# Redirecionamento HTTP para HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name cf.don.cim.br;
    return 301 https://$server_name$request_uri;
}

# Configuração HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name cf.don.cim.br;
    index index.html index.htm default.html;
    root /www/wwwroot/cf.don.cim.br/dist;

    # Certificados SSL
    ssl_certificate /www/server/panel/vhost/cert/cf.don.cim.br/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/cf.don.cim.br/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Configuração para SPA React
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para arquivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Desabilitar cache para index.html
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logs
    access_log /www/wwwlogs/cf.don.cim.br.log;
    error_log /www/wwwlogs/cf.don.cim.br.error.log;
}
```

### Solução 5: Verificar Firewall

Se o firewall estiver bloqueando a porta 443:

```bash
# Verificar regras do firewall
iptables -L -n | grep 443

# Se estiver usando ufw
ufw status | grep 443

# Permitir porta 443 (se necessário)
ufw allow 443/tcp
```

### Solução 6: Verificar Porta 443 no Servidor

Verifique se a porta 443 está realmente aberta:

```bash
# Ver processos escutando na porta 443
ss -tulpn | grep :443
lsof -i :443

# Testar localmente
curl -I https://localhost
# ou
curl -I https://127.0.0.1
```

## 🎯 Solução Rápida Recomendada

Execute estes comandos na ordem:

```bash
# 1. Iniciar nginx
/etc/init.d/nginx start

# 2. Verificar se está rodando
/etc/init.d/nginx status

# 3. Verificar se a porta 443 está sendo escutada
ss -tulpn | grep :443

# 4. Testar configuração
nginx -t

# 5. Se tudo estiver OK, testar HTTPS
curl -I https://cf.don.cim.br
```

## 📝 Nota Importante

Se você ainda não configurou o SSL:
1. **Configure primeiro no aapanel** (Website → SSL → Let's Encrypt)
2. **Depois** adicione a configuração HTTPS no arquivo de configuração
3. **Recarregue** o nginx: `/etc/init.d/nginx reload`

## ✅ Verificação Final

Após corrigir, verifique:

```bash
# Status do nginx
/etc/init.d/nginx status

# Porta 443 escutando
ss -tulpn | grep :443

# Teste HTTP
curl -I http://cf.don.cim.br

# Teste HTTPS
curl -I https://cf.don.cim.br

# Teste no navegador
# Acesse: https://cf.don.cim.br
```

Se tudo estiver funcionando, você verá o site carregando com HTTPS! 🔒

