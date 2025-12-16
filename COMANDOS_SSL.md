# 🔒 Comandos para Obter Certificado SSL via Terminal

## 📋 Pré-requisitos

- Acesso SSH ao servidor
- Domínio apontando para o IP do servidor
- Porta 80 e 443 abertas no firewall

---

## 🚀 Método 1: Certbot (Let's Encrypt) - Recomendado

### Instalar Certbot

```bash
# Para sistemas baseados em Debian/Ubuntu
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Para sistemas baseados em CentOS/RHEL
sudo yum install certbot python3-certbot-nginx -y

# Para aapanel (geralmente já vem instalado)
# Verificar se está instalado:
which certbot
```

### Obter Certificado SSL

```bash
# Opção 1: Certbot com Nginx (automático - configura o Nginx automaticamente)
sudo certbot --nginx -d financeiro.donsantosba.com.br

# Opção 2: Certbot standalone (apenas gera o certificado)
sudo certbot certonly --standalone -d financeiro.donsantosba.com.br

# Opção 3: Certbot com webroot (recomendado para aapanel)
sudo certbot certonly --webroot -w /www/wwwroot/financeiro.donsantosba.com.br -d financeiro.donsantosba.com.br
```

### Renovar Certificado

```bash
# Renovar manualmente
sudo certbot renew

# Testar renovação (dry-run)
sudo certbot renew --dry-run

# Renovar certificado específico
sudo certbot renew --cert-name financeiro.donsantosba.com.br
```

### Verificar Certificados

```bash
# Listar todos os certificados
sudo certbot certificates

# Verificar certificado específico
sudo certbot certificates -d financeiro.donsantosba.com.br

# Verificar data de expiração
sudo openssl x509 -in /etc/letsencrypt/live/financeiro.donsantosba.com.br/cert.pem -noout -dates
```

---

## 🔧 Método 2: Via aapanel (Interface Web)

Se preferir usar a interface do aapanel:

1. Acesse o aapanel
2. **Website** → `financeiro.donsantosba.com.br` → **Settings** → **SSL**
3. Clique em **Let's Encrypt**
4. Clique em **Apply**

O aapanel fará tudo automaticamente via terminal.

---

## 📍 Localização dos Certificados

Após obter o certificado, eles estarão em:

```bash
# Caminho padrão do Let's Encrypt
/etc/letsencrypt/live/financeiro.donsantosba.com.br/

# Arquivos importantes:
# - fullchain.pem (certificado completo)
# - privkey.pem (chave privada)
# - cert.pem (certificado)
# - chain.pem (cadeia de certificados)

# Verificar se os arquivos existem
ls -la /etc/letsencrypt/live/financeiro.donsantosba.com.br/
```

### Caminhos no aapanel

O aapanel geralmente cria links simbólicos ou copia os certificados para:

```bash
# Caminho comum no aapanel
/www/server/panel/vhost/cert/financeiro.donsantosba.com.br/

# Verificar se existe
ls -la /www/server/panel/vhost/cert/financeiro.donsantosba.com.br/

# Se não existir, verificar outros caminhos possíveis
find /www -name "fullchain.pem" 2>/dev/null | grep financeiro
find /www -name "privkey.pem" 2>/dev/null | grep financeiro
```

---

## 🔄 Copiar Certificados para o Caminho do aapanel

Se o certificado foi gerado em `/etc/letsencrypt/` mas o aapanel espera em outro lugar:

```bash
# Criar diretório se não existir
sudo mkdir -p /www/server/panel/vhost/cert/financeiro.donsantosba.com.br

# Copiar certificados
sudo cp /etc/letsencrypt/live/financeiro.donsantosba.com.br/fullchain.pem /www/server/panel/vhost/cert/financeiro.donsantosba.com.br/
sudo cp /etc/letsencrypt/live/financeiro.donsantosba.com.br/privkey.pem /www/server/panel/vhost/cert/financeiro.donsantosba.com.br/

# Ajustar permissões
sudo chown -R www:www /www/server/panel/vhost/cert/financeiro.donsantosba.com.br
sudo chmod 600 /www/server/panel/vhost/cert/financeiro.donsantosba.com.br/privkey.pem
sudo chmod 644 /www/server/panel/vhost/cert/financeiro.donsantosba.com.br/fullchain.pem
```

---

## 🔍 Verificar Certificado

```bash
# Verificar certificado diretamente
sudo openssl x509 -in /etc/letsencrypt/live/financeiro.donsantosba.com.br/cert.pem -text -noout

# Verificar data de expiração
sudo openssl x509 -in /etc/letsencrypt/live/financeiro.donsantosba.com.br/cert.pem -noout -dates

# Verificar se o certificado está válido
sudo openssl x509 -in /etc/letsencrypt/live/financeiro.donsantosba.com.br/cert.pem -noout -checkend 86400

# Testar conexão SSL
openssl s_client -connect financeiro.donsantosba.com.br:443 -servername financeiro.donsantosba.com.br
```

---

## ⚙️ Configurar Renovação Automática

### Verificar se há cron job

```bash
# Verificar cron jobs do certbot
sudo crontab -l | grep certbot

# Ou verificar no sistema
sudo systemctl list-timers | grep certbot
```

### Criar cron job manual (se necessário)

```bash
# Editar crontab
sudo crontab -e

# Adicionar linha (renova diariamente às 3h da manhã)
0 3 * * * /usr/bin/certbot renew --quiet --deploy-hook "systemctl reload nginx"
```

---

## 🐛 Troubleshooting

### Erro: "Could not bind to port 80"

**Causa**: Porta 80 já está em uso

**Solução**:
```bash
# Parar Nginx temporariamente
sudo systemctl stop nginx

# Obter certificado
sudo certbot certonly --standalone -d financeiro.donsantosba.com.br

# Reiniciar Nginx
sudo systemctl start nginx
```

### Erro: "Failed to obtain certificate"

**Causa**: Domínio não está apontando para o servidor ou firewall bloqueando

**Solução**:
```bash
# Verificar DNS
nslookup financeiro.donsantosba.com.br
dig financeiro.donsantosba.com.br

# Verificar se porta 80 está aberta
sudo netstat -tuln | grep :80
sudo ufw status
```

### Erro: "Rate limit exceeded"

**Causa**: Muitas tentativas de obter certificado

**Solução**: Aguardar 1 hora ou usar certificado existente

### Verificar logs do Certbot

```bash
# Logs do certbot
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# Logs detalhados
sudo certbot --verbose certonly --standalone -d financeiro.donsantosba.com.br
```

---

## 📝 Comandos Rápidos (Resumo)

```bash
# 1. Instalar certbot
sudo apt install certbot python3-certbot-nginx -y

# 2. Obter certificado
sudo certbot --nginx -d financeiro.donsantosba.com.br

# 3. Verificar certificado
sudo certbot certificates

# 4. Renovar certificado
sudo certbot renew

# 5. Verificar localização
ls -la /etc/letsencrypt/live/financeiro.donsantosba.com.br/
```

---

## ✅ Após Obter o Certificado

1. **Verificar se o certificado foi criado**:
```bash
ls -la /etc/letsencrypt/live/financeiro.donsantosba.com.br/
```

2. **Atualizar configuração Nginx**:
   - Use o arquivo `nginx-financeiro.conf` (com SSL)
   - Ajuste o caminho dos certificados se necessário

3. **Testar configuração Nginx**:
```bash
sudo nginx -t
```

4. **Recarregar Nginx**:
```bash
sudo systemctl reload nginx
# Ou no aapanel: Website → Settings → Reload
```

---

**✅ Pronto! Seu certificado SSL está configurado!**

