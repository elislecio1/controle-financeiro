# 🚀 Guia de Deploy no aapanel

Este guia irá te ajudar a hospedar o sistema de controle financeiro em um subdomínio no aapanel.

## 📋 Pré-requisitos

- Servidor com aapanel instalado
- Node.js 16+ instalado no servidor
- Domínio configurado e apontando para o servidor
- Acesso SSH ao servidor (opcional, mas recomendado)

## 🔧 Passo 1: Configurar o Subdomínio no aapanel

1. **Acesse o aapanel** do seu servidor
2. Vá em **Website** → **Add Site**
3. Preencha os dados:
   - **Domain**: `controle-financeiro.seudominio.com` (ou o subdomínio desejado)
   - **Note**: Sistema de Controle Financeiro
   - **Root**: `/www/wwwroot/controle-financeiro` (ou o caminho desejado)
4. Clique em **Submit**

## 📦 Passo 2: Preparar o Projeto no Servidor

### Opção A: Via SSH (Recomendado)

```bash
# Conecte-se ao servidor via SSH
ssh usuario@seu-servidor.com

# Navegue até o diretório do site
cd /www/wwwroot/controle-financeiro

# Clone o repositório (se ainda não tiver)
git clone https://github.com/elislecio1/controle-financeiro.git .

# Ou faça upload dos arquivos via FTP/SFTP
```

### Opção B: Via Upload no aapanel

1. Acesse **File** no aapanel
2. Navegue até `/www/wwwroot/controle-financeiro`
3. Faça upload de todos os arquivos do projeto

## 🔨 Passo 3: Instalar Dependências e Build

### Via Terminal SSH:

```bash
cd /www/wwwroot/controle-financeiro

# Instalar Node.js (se não estiver instalado)
# No aapanel: App Store → Node.js Version Manager → Install

# Instalar dependências
npm install

# Criar arquivo .env com as variáveis de ambiente
nano .env
```

### Configurar Variáveis de Ambiente (.env):

```env
VITE_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
NEXT_PUBLIC_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
```

**Salve o arquivo** (Ctrl+X, depois Y, depois Enter)

```bash
# Fazer o build do projeto
npm run build

# O build será gerado na pasta dist/
```

## ⚙️ Passo 4: Configurar o Nginx no aapanel

1. No aapanel, vá em **Website** → Selecione seu site → **Settings**
2. Clique em **Config File**
3. Substitua a configuração pela seguinte:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name controle-financeiro.seudominio.com;
    index index.html index.htm index.php;
    root /www/wwwroot/controle-financeiro/dist;

    # Configuração para SPA (Single Page Application)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para arquivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Logs
    access_log /www/wwwlogs/controle-financeiro.log;
    error_log /www/wwwlogs/controle-financeiro.error.log;
}
```

4. Clique em **Save**
5. Teste a configuração: **Test Config**
6. Se estiver OK, recarregue o Nginx: **Reload**

## 🔒 Passo 5: Configurar SSL (HTTPS)

1. No aapanel, vá em **Website** → Selecione seu site → **Settings**
2. Clique em **SSL**
3. Selecione **Let's Encrypt**
4. Marque **Force HTTPS**
5. Clique em **Apply**

## 🔄 Passo 6: Atualizar Configuração Nginx para HTTPS

Após configurar o SSL, atualize a configuração do Nginx:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name controle-financeiro.seudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name controle-financeiro.seudominio.com;
    index index.html index.htm index.php;
    root /www/wwwroot/controle-financeiro/dist;

    # Certificados SSL
    ssl_certificate /www/server/panel/vhost/cert/controle-financeiro.seudominio.com/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/controle-financeiro.seudominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Configuração para SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para arquivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Logs
    access_log /www/wwwlogs/controle-financeiro.log;
    error_log /www/wwwlogs/controle-financeiro.error.log;
}
```

## 🔄 Passo 7: Script de Atualização Automática (Opcional)

Crie um script para facilitar atualizações futuras:

```bash
# Criar script de atualização
nano /www/wwwroot/controle-financeiro/update.sh
```

Conteúdo do script:

```bash
#!/bin/bash
cd /www/wwwroot/controle-financeiro
git pull origin main
npm install
npm run build
echo "Atualização concluída!"
```

Tornar executável:

```bash
chmod +x /www/wwwroot/controle-financeiro/update.sh
```

## 📝 Passo 8: Verificar Permissões

```bash
# Ajustar permissões
chown -R www:www /www/wwwroot/controle-financeiro
chmod -R 755 /www/wwwroot/controle-financeiro
```

## ✅ Passo 9: Testar o Deploy

1. Acesse `https://controle-financeiro.seudominio.com`
2. Verifique se a aplicação carrega corretamente
3. Teste o login e funcionalidades principais
4. Verifique o console do navegador para erros

## 🐛 Troubleshooting

### Erro 404 ao navegar entre páginas

- Verifique se a configuração `try_files $uri $uri/ /index.html;` está presente no Nginx

### Erro de variáveis de ambiente

- Verifique se o arquivo `.env` existe e está configurado corretamente
- Certifique-se de que as variáveis começam com `VITE_` ou `NEXT_PUBLIC_`

### Erro de permissões

```bash
chown -R www:www /www/wwwroot/controle-financeiro
chmod -R 755 /www/wwwroot/controle-financeiro
```

### Build não funciona

- Verifique se o Node.js está instalado: `node -v`
- Verifique se o npm está instalado: `npm -v`
- Limpe o cache: `rm -rf node_modules package-lock.json && npm install`

### Verificar logs

```bash
# Logs do Nginx
tail -f /www/wwwlogs/controle-financeiro.error.log

# Logs do aapanel
tail -f /www/server/panel/logs/error.log
```

## 🔄 Atualizações Futuras

Para atualizar o sistema:

```bash
cd /www/wwwroot/controle-financeiro
git pull origin main
npm install
npm run build
# O Nginx servirá automaticamente os novos arquivos da pasta dist/
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do Nginx
2. Verifique o console do navegador (F12)
3. Verifique se todas as variáveis de ambiente estão configuradas
4. Verifique as permissões dos arquivos

---

**✅ Pronto! Seu sistema está hospedado no aapanel!**

