# 🚀 Comandos Rápidos para Deploy

## ⚡ Deploy Completo (Recomendado)

Faz tudo: atualiza código, instala dependências, build, SSL e reinicia serviços.

```bash
cd /www/wwwroot/cf.don.cim.br && git pull origin main && chmod +x deploy-completo-aapanel.sh && bash deploy-completo-aapanel.sh
```

## 🔧 Comandos Individuais

### 1. Deploy Completo (com resolução de conflitos)
```bash
cd /www/wwwroot/cf.don.cim.br && git pull origin main && chmod +x resolver-e-deploy.sh && bash resolver-e-deploy.sh
```

### 2. Apenas Atualizar Código
```bash
cd /www/wwwroot/cf.don.cim.br && git pull origin main
```

### 3. Apenas Build (sem atualizar código)
```bash
cd /www/wwwroot/cf.don.cim.br && npm install && npm run build
```

### 4. Deploy Manual (passo a passo)
```bash
cd /www/wwwroot/cf.don.cim.br && git pull origin main && chmod +x deploy-manual-aapanel.sh && bash deploy-manual-aapanel.sh
```

### 5. Diagnosticar Site Offline
```bash
cd /www/wwwroot/cf.don.cim.br && git pull origin main && chmod +x diagnosticar-e-corrigir-site-offline.sh && bash diagnosticar-e-corrigir-site-offline.sh
```

### 6. Corrigir SSL
```bash
cd /www/wwwroot/cf.don.cim.br && git pull origin main && chmod +x corrigir-certificado-ssl.sh && bash corrigir-certificado-ssl.sh
```

### 7. Adicionar SSL ao Nginx
```bash
cd /www/wwwroot/cf.don.cim.br && chmod +x adicionar-ssl-nginx.sh && bash adicionar-ssl-nginx.sh
```

## 🔄 Reiniciar Serviços

### Reiniciar Nginx
```bash
systemctl reload nginx
```

### Reiniciar Nginx (forçado)
```bash
systemctl restart nginx
```

### Verificar Status do Nginx
```bash
systemctl status nginx
```

## ✅ Verificar se Está Funcionando

### Testar HTTP
```bash
curl -I http://cf.don.cim.br
```

### Testar HTTPS
```bash
curl -I https://cf.don.cim.br
```

### Verificar Portas
```bash
netstat -tuln | grep -E ":(80|443) "
```

### Verificar Configuração do Nginx
```bash
nginx -t
```

## 📋 Ver Logs

### Logs do Deploy
```bash
tail -f /www/wwwlogs/cf.don.cim.br-deploy-completo.log
```

### Logs de Erro do Nginx
```bash
tail -50 /var/log/nginx/error.log
```

### Status do Nginx
```bash
systemctl status nginx --no-pager
```

## 🎯 Fluxo Completo (Copiar e Colar)

```bash
# 1. Ir para o diretório
cd /www/wwwroot/cf.don.cim.br

# 2. Atualizar código
git pull origin main

# 3. Deploy completo
chmod +x deploy-completo-aapanel.sh
bash deploy-completo-aapanel.sh

# 4. Verificar se funcionou
curl -I http://cf.don.cim.br
curl -I https://cf.don.cim.br
```

## 🆘 Se Algo Der Errado

### Site offline?
```bash
cd /www/wwwroot/cf.don.cim.br && bash diagnosticar-e-corrigir-site-offline.sh
```

### Erro de SSL?
```bash
cd /www/wwwroot/cf.don.cim.br && bash corrigir-certificado-ssl.sh
```

### Nginx não inicia?
```bash
# Ver erros
tail -50 /var/log/nginx/error.log

# Tentar iniciar
systemctl start nginx

# Verificar
systemctl status nginx
```

## 📝 Checklist Rápido

```bash
# Verificar se Nginx está rodando
systemctl is-active nginx && echo "✅ Nginx rodando" || echo "❌ Nginx parado"

# Verificar se está escutando nas portas
netstat -tuln | grep -q ":80 " && echo "✅ Porta 80 aberta" || echo "❌ Porta 80 fechada"
netstat -tuln | grep -q ":443 " && echo "✅ Porta 443 aberta" || echo "❌ Porta 443 fechada"

# Verificar se dist existe
[ -d "/www/wwwroot/cf.don.cim.br/dist" ] && echo "✅ dist existe" || echo "❌ dist não existe"

# Verificar se index.html existe
[ -f "/www/wwwroot/cf.don.cim.br/dist/index.html" ] && echo "✅ index.html existe" || echo "❌ index.html não existe"
```

