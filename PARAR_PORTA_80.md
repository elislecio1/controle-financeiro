# 🔧 Parar Processo na Porta 80

## ❌ Problema

```
Could not bind TCP port 80 because it is already in use
```

**Causa**: Nginx ou outro processo ainda está usando a porta 80.

---

## ✅ Solução: Verificar e Parar Processo

### 1. Verificar o que está usando a porta 80

```bash
sudo lsof -i :80
# Ou
sudo netstat -tulpn | grep :80
# Ou
sudo ss -tulpn | grep :80
```

### 2. Parar Nginx (métodos)

```bash
# Método 1: systemctl
sudo systemctl stop nginx

# Método 2: service
sudo service nginx stop

# Método 3: killall (se os métodos acima não funcionarem)
sudo killall nginx

# Método 4: Matar processo específico (se souber o PID)
sudo kill -9 $(sudo lsof -t -i:80)
```

### 3. Verificar se porta 80 está livre

```bash
sudo lsof -i :80
# Não deve retornar nada
```

### 4. Obter certificado

```bash
sudo certbot certonly --standalone -d cf.don.cim.br
```

### 5. Reiniciar Nginx

```bash
sudo systemctl start nginx
```

---

## 🚀 Comandos Completos (Copiar e Colar)

```bash
cd /www/wwwroot/cf.don.cim.br

# Verificar o que está usando porta 80
sudo lsof -i :80

# Parar Nginx (tentar todos os métodos)
sudo systemctl stop nginx
sudo service nginx stop
sudo killall nginx 2>/dev/null

# Verificar se porta está livre
sudo lsof -i :80

# Obter certificado
sudo certbot certonly --standalone -d cf.don.cim.br

# Reiniciar Nginx
sudo systemctl start nginx

# Verificar certificado
sudo certbot certificates

# Copiar certificados
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

## 🔍 Se Ainda Não Funcionar

### Matar processo específico na porta 80

```bash
# Ver PID do processo
sudo lsof -t -i:80

# Matar processo (substitua PID pelo número retornado)
sudo kill -9 PID

# Ou matar diretamente
sudo kill -9 $(sudo lsof -t -i:80)
```

### Verificar se há outros servidores web

```bash
# Verificar Apache
sudo systemctl status apache2

# Verificar outros servidores
sudo systemctl list-units --type=service | grep -E 'nginx|apache|httpd'
```

---

**Execute os comandos acima para parar o processo na porta 80!**

