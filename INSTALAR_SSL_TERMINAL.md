# 🔒 Comandos para Instalar SSL - Terminal aapanel

## 📂 Diretório de Trabalho
```bash
cd /www/wwwroot/cf.don.cim.br
```

---

## 📋 Comandos para Copiar e Colar

### 1. Navegar para o Diretório
```bash
cd /www/wwwroot/cf.don.cim.br
```

### 2. Verificar DNS (Importante!)

```bash
dig +short cf.don.cim.br A
```

**Se retornar um IP**: DNS está OK, pode continuar  
**Se retornar vazio**: Configure o DNS primeiro

---

### 3. Instalar Certbot (se não estiver instalado)

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

---

### 4. Obter Certificado SSL

```bash
sudo certbot certonly --webroot -w /www/wwwroot/cf.don.cim.br -d cf.don.cim.br
```

**Se der erro de DNS**, use standalone:
```bash
sudo systemctl stop nginx
sudo certbot certonly --standalone -d cf.don.cim.br
sudo systemctl start nginx
```

---

### 5. Verificar se Certificado Foi Criado

```bash
sudo certbot certificates
ls -la /etc/letsencrypt/live/cf.don.cim.br/
```

**Deve mostrar**:
- cert.pem
- chain.pem
- fullchain.pem
- privkey.pem

---

### 6. Copiar Certificados para Caminho do aapanel

```bash
sudo mkdir -p /www/server/panel/vhost/cert/cf.don.cim.br
sudo cp /etc/letsencrypt/live/cf.don.cim.br/fullchain.pem /www/server/panel/vhost/cert/cf.don.cim.br/
sudo cp /etc/letsencrypt/live/cf.don.cim.br/privkey.pem /www/server/panel/vhost/cert/cf.don.cim.br/
sudo chown -R www:www /www/server/panel/vhost/cert/cf.don.cim.br
sudo chmod 600 /www/server/panel/vhost/cert/cf.don.cim.br/privkey.pem
sudo chmod 644 /www/server/panel/vhost/cert/cf.don.cim.br/fullchain.pem
```

---

### 7. Verificar Certificados Copiados

```bash
ls -la /www/server/panel/vhost/cert/cf.don.cim.br/
```

**Deve mostrar**:
- fullchain.pem
- privkey.pem

---

### 8. Verificar Data de Expiração

```bash
sudo openssl x509 -in /etc/letsencrypt/live/cf.don.cim.br/cert.pem -noout -dates
```

---

## 🚀 Todos os Comandos de Uma Vez (Copiar e Colar)

```bash
# Navegar para o diretório
cd /www/wwwroot/cf.don.cim.br

# Verificar DNS
dig +short cf.don.cim.br A

# Instalar certbot (se necessário)
sudo apt update && sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot certonly --webroot -w /www/wwwroot/cf.don.cim.br -d cf.don.cim.br

# Verificar certificado
sudo certbot certificates

# Copiar para aapanel
sudo mkdir -p /www/server/panel/vhost/cert/cf.don.cim.br
sudo cp /etc/letsencrypt/live/cf.don.cim.br/fullchain.pem /www/server/panel/vhost/cert/cf.don.cim.br/
sudo cp /etc/letsencrypt/live/cf.don.cim.br/privkey.pem /www/server/panel/vhost/cert/cf.don.cim.br/
sudo chown -R www:www /www/server/panel/vhost/cert/cf.don.cim.br
sudo chmod 600 /www/server/panel/vhost/cert/cf.don.cim.br/privkey.pem
sudo chmod 644 /www/server/panel/vhost/cert/cf.don.cim.br/fullchain.pem

# Verificar
ls -la /www/server/panel/vhost/cert/cf.don.cim.br/
```

---

## 📝 Após Executar os Comandos

1. **No aapanel**: Website → `cf.don.cim.br` → Settings → Config File
2. **Copie** o conteúdo do arquivo `nginx-cf-don-cim-SSL.conf`
3. **Save** → **Test Config** → **Reload**

---

## 🐛 Se Der Erro

### Erro: DNS não configurado
```bash
# Verificar DNS
dig +short cf.don.cim.br A

# Se vazio, configure DNS primeiro no seu provedor
```

### Erro: Porta 80 em uso
```bash
# Parar Nginx
sudo systemctl stop nginx

# Obter certificado
sudo certbot certonly --standalone -d cf.don.cim.br

# Reiniciar Nginx
sudo systemctl start nginx
```

### Erro: Certificado não encontrado
```bash
# Verificar se foi criado
sudo certbot certificates

# Verificar localização
ls -la /etc/letsencrypt/live/cf.don.cim.br/
```

---

## ✅ Verificar se Funcionou

```bash
# Testar conexão SSL
openssl s_client -connect cf.don.cim.br:443 -servername cf.don.cim.br
```

**Ou acesse no navegador**: `https://cf.don.cim.br`

---

**✅ Execute os comandos na ordem e o SSL será instalado!**
