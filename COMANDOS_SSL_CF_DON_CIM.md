# 🔒 Comandos para Instalar Certificado SSL - cf.don.cim.br

## 📋 Passo a Passo Completo

### 1. Verificar DNS (Importante!)

Antes de obter o certificado, verifique se o DNS está configurado:

```bash
# Verificar se DNS está resolvendo
dig +short cf.don.cim.br A

# Deve retornar o IP do servidor
# Se retornar vazio, configure o DNS primeiro
```

### 2. Obter Certificado SSL via Certbot

```bash
# Opção 1: Usando webroot (recomendado para aapanel)
sudo certbot certonly --webroot -w /www/wwwroot/cf.don.cim.br -d cf.don.cim.br

# Opção 2: Se webroot não funcionar, use standalone
sudo systemctl stop nginx
sudo certbot certonly --standalone -d cf.don.cim.br
sudo systemctl start nginx
```

### 3. Verificar Certificado Criado

```bash
# Listar certificados
sudo certbot certificates

# Verificar localização
ls -la /etc/letsencrypt/live/cf.don.cim.br/

# Deve mostrar:
# - cert.pem
# - chain.pem
# - fullchain.pem
# - privkey.pem
```

### 4. Copiar Certificados para Caminho do aapanel

```bash
# Criar diretório
sudo mkdir -p /www/server/panel/vhost/cert/cf.don.cim.br

# Copiar certificados
sudo cp /etc/letsencrypt/live/cf.don.cim.br/fullchain.pem /www/server/panel/vhost/cert/cf.don.cim.br/
sudo cp /etc/letsencrypt/live/cf.don.cim.br/privkey.pem /www/server/panel/vhost/cert/cf.don.cim.br/

# Ajustar permissões
sudo chown -R www:www /www/server/panel/vhost/cert/cf.don.cim.br
sudo chmod 600 /www/server/panel/vhost/cert/cf.don.cim.br/privkey.pem
sudo chmod 644 /www/server/panel/vhost/cert/cf.don.cim.br/fullchain.pem
```

### 5. Configurar Nginx com SSL

1. No aapanel: **Website** → `cf.don.cim.br` → **Settings** → **Config File**
2. Copie o conteúdo do arquivo `nginx-cf-don-cim-SSL.conf`
3. **Save** → **Test Config** → **Reload**

### 6. Verificar SSL

```bash
# Testar conexão SSL
openssl s_client -connect cf.don.cim.br:443 -servername cf.don.cim.br

# Verificar data de expiração
sudo openssl x509 -in /etc/letsencrypt/live/cf.don.cim.br/cert.pem -noout -dates
```

---

## 🚀 Script Automático

Ou use o script automático:

```bash
cd /www/wwwroot/cf.don.cim.br
chmod +x obter-ssl-cf-don-cim.sh
sudo ./obter-ssl-cf-don-cim.sh
```

---

## 🔄 Renovação Automática

O certificado Let's Encrypt expira em 90 dias. Configure renovação automática:

```bash
# Testar renovação
sudo certbot renew --dry-run

# Renovar manualmente
sudo certbot renew

# Verificar se há cron job (geralmente já vem configurado)
sudo systemctl list-timers | grep certbot
```

---

## 🐛 Troubleshooting

### Erro: DNS não configurado

```bash
# Verificar DNS
dig +short cf.don.cim.br A

# Se vazio, configure DNS primeiro
```

### Erro: Porta 80 em uso

```bash
# Parar Nginx temporariamente
sudo systemctl stop nginx

# Obter certificado
sudo certbot certonly --standalone -d cf.don.cim.br

# Reiniciar Nginx
sudo systemctl start nginx
```

### Erro: Certificado não encontrado no aapanel

```bash
# Verificar caminho real dos certificados
find /www -name "fullchain.pem" 2>/dev/null | grep cf.don.cim.br

# Ou verificar no aapanel: Website → Settings → SSL → Certificate Path
```

---

## ✅ Comandos Rápidos (Resumo)

```bash
# 1. Verificar DNS
dig +short cf.don.cim.br A

# 2. Obter certificado
sudo certbot certonly --webroot -w /www/wwwroot/cf.don.cim.br -d cf.don.cim.br

# 3. Copiar para aapanel
sudo mkdir -p /www/server/panel/vhost/cert/cf.don.cim.br
sudo cp /etc/letsencrypt/live/cf.don.cim.br/*.pem /www/server/panel/vhost/cert/cf.don.cim.br/
sudo chown -R www:www /www/server/panel/vhost/cert/cf.don.cim.br

# 4. Configurar Nginx (use nginx-cf-don-cim-SSL.conf)
```

---

**✅ Após configurar, acesse: https://cf.don.cim.br**

