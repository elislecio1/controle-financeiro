# 🔧 Resolver Erro SSL - 404 em .well-known

## ❌ Problema

```
Invalid response from http://cf.don.cim.br/.well-known/acme-challenge/...: 404
```

**Causa**: O Nginx não está permitindo acesso ao diretório `.well-known` necessário para validação do Let's Encrypt.

---

## ✅ Solução 1: Criar Diretório e Ajustar Nginx

### Passo 1: Criar Diretório .well-known

```bash
cd /www/wwwroot/cf.don.cim.br
mkdir -p .well-known/acme-challenge
chown -R www:www .well-known
chmod -R 755 .well-known
```

### Passo 2: Ajustar Configuração Nginx

A configuração precisa permitir acesso ao `.well-known` **ANTES** de qualquer redirecionamento.

No aapanel: **Website** → `cf.don.cim.br` → **Settings** → **Config File**

Adicione esta regra **ANTES** do `location /`:

```nginx
# Permitir acesso ao .well-known para validação SSL
location ~ \.well-known {
    root /www/wwwroot/cf.don.cim.br;
    allow all;
}
```

Ou use o arquivo `nginx-cf-don-cim-CORRIGIDO.conf` que já tem essa configuração.

### Passo 3: Recarregar Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Passo 4: Tentar Obter Certificado Novamente

```bash
sudo certbot certonly --webroot -w /www/wwwroot/cf.don.cim.br -d cf.don.cim.br
```

---

## ✅ Solução 2: Usar Método Standalone (Mais Simples)

Se a solução 1 não funcionar, use o método standalone:

```bash
# Parar Nginx temporariamente
sudo systemctl stop nginx

# Obter certificado
sudo certbot certonly --standalone -d cf.don.cim.br

# Reiniciar Nginx
sudo systemctl start nginx
```

**Depois continue com os comandos de copiar certificados.**

---

## 🚀 Comandos Completos (Solução 2 - Recomendada)

```bash
cd /www/wwwroot/cf.don.cim.br

# Parar Nginx
sudo systemctl stop nginx

# Obter certificado SSL
sudo certbot certonly --standalone -d cf.don.cim.br

# Reiniciar Nginx
sudo systemctl start nginx

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

## 🔍 Verificar se .well-known Está Acessível

Após ajustar o Nginx, teste:

```bash
# Criar arquivo de teste
echo "test" > /www/wwwroot/cf.don.cim.br/.well-known/acme-challenge/test.txt

# Testar acesso
curl http://cf.don.cim.br/.well-known/acme-challenge/test.txt

# Deve retornar: test
```

Se retornar 404, a configuração Nginx precisa ser ajustada.

---

## 📝 Configuração Nginx Correta para .well-known

Certifique-se de que sua configuração Nginx tenha:

```nginx
# Esta regra DEVE vir ANTES do location /
location ~ \.well-known {
    root /www/wwwroot/cf.don.cim.br;  # Sem /dist aqui!
    allow all;
}

# Depois vem o location /
location / {
    try_files $uri $uri/ /index.html;
    root /www/wwwroot/cf.don.cim.br/dist;
}
```

**Importante**: O `.well-known` deve apontar para a raiz (`/www/wwwroot/cf.don.cim.br`), não para `/dist`!

---

## ✅ Recomendação

**Use a Solução 2 (standalone)** - é mais simples e não requer ajustes no Nginx durante a obtenção do certificado.

---

**Execute os comandos da Solução 2 e o certificado será obtido com sucesso!**

