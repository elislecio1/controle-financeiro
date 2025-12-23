# 🔍 Diagnosticar "Website not found"

## Problema
O site `https://cf.don.cim.br` está retornando "Website not found".

## Possíveis Causas

1. **Nginx não está configurado corretamente**
2. **Diretório root apontando para local errado**
3. **Site não está ativo no aapanel**
4. **Configuração de domínio incorreta**

## 🔧 Solução Passo a Passo

### 1. Verificar se o site existe no aapanel

```bash
# Verificar se o diretório existe
ls -la /www/wwwroot/cf.don.cim.br

# Verificar se a pasta dist existe
ls -la /www/wwwroot/cf.don.cim.br/dist
```

### 2. Verificar configuração do Nginx no aapanel

1. Acesse o aapanel: `https://181.232.139.201:25936`
2. Vá em **Website** → `cf.don.cim.br` → **Settings**
3. Verifique:
   - **Website Path**: Deve ser `/www/wwwroot/cf.don.cim.br`
   - **Website Status**: Deve estar **Ativo**
   - **PHP Version**: Pode ser qualquer (não usado para React)

### 3. Verificar configuração do Nginx manualmente

```bash
# Verificar arquivo de configuração do Nginx
cat /www/server/panel/vhost/nginx/cf.don.cim.br.conf

# Ou verificar se existe
ls -la /www/server/panel/vhost/nginx/cf.don.cim.br.conf
```

### 4. Verificar se o Nginx está rodando

```bash
# Verificar status
systemctl status nginx

# Verificar processos
ps aux | grep nginx

# Verificar portas
netstat -tulpn | grep :80
netstat -tulpn | grep :443
```

### 5. Verificar configuração do domínio

A configuração do Nginx deve ter algo como:

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name cf.don.cim.br;
    
    root /www/wwwroot/cf.don.cim.br/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 6. Corrigir configuração no aapanel

1. **Website** → `cf.don.cim.br` → **Settings**
2. Em **Website Path**, certifique-se que está: `/www/wwwroot/cf.don.cim.br`
3. Em **Website Directory**, configure para apontar para `dist`:
   - Opção 1: Alterar o **Website Path** para `/www/wwwroot/cf.don.cim.br/dist`
   - Opção 2: Configurar **Run Directory** como `dist`
4. Clique em **Save**
5. Recarregue o Nginx

### 7. Recarregar Nginx

```bash
# Via terminal
systemctl reload nginx

# Ou via aapanel
# Website → cf.don.cim.br → Settings → Reload
```

### 8. Verificar logs

```bash
# Logs de acesso
tail -f /www/wwwlogs/cf.don.cim.br.log

# Logs de erro
tail -f /www/wwwlogs/cf.don.cim.br.error.log

# Logs do Nginx
tail -f /www/server/nginx/logs/error.log
```

## 🚀 Solução Rápida

Execute este script no servidor:

```bash
cd /www/wwwroot/cf.don.cim.br

# 1. Verificar se dist existe
if [ ! -d "dist" ]; then
    echo "❌ Pasta dist não existe! Fazendo build..."
    npm run build
fi

# 2. Verificar permissões
chown -R www:www dist
chmod -R 755 dist

# 3. Verificar configuração do Nginx
echo "Verificando configuração do Nginx..."
nginx -t

# 4. Recarregar Nginx
systemctl reload nginx

# 5. Verificar se está respondendo
curl -I http://localhost
```

## 📝 Configuração Correta no aapanel

### Opção A: Alterar Website Path

1. **Website** → `cf.don.cim.br` → **Settings**
2. **Website Path**: `/www/wwwroot/cf.don.cim.br/dist`
3. **Save**

### Opção B: Usar Run Directory

1. **Website** → `cf.don.cim.br` → **Settings**
2. **Website Path**: `/www/wwwroot/cf.don.cim.br`
3. **Run Directory**: `dist`
4. **Save**

### Opção C: Editar Configuração Nginx Manualmente

1. **Website** → `cf.don.cim.br` → **Settings** → **Config File**
2. Edite o arquivo e certifique-se que `root` aponta para `dist`:
   ```nginx
   root /www/wwwroot/cf.don.cim.br/dist;
   ```
3. **Save** e **Reload**

## ✅ Verificação Final

Após corrigir, verifique:

```bash
# 1. Site responde localmente
curl -I http://localhost

# 2. Site responde pelo domínio
curl -I https://cf.don.cim.br

# 3. Verificar conteúdo
ls -la /www/wwwroot/cf.don.cim.br/dist/
```

## 🔗 Links Úteis

- Logs do aapanel: **Website** → `cf.don.cim.br` → **Logs**
- Configuração: **Website** → `cf.don.cim.br` → **Settings** → **Config File**

