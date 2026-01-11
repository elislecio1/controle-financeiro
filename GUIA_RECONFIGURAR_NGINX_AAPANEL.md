# 🔧 Guia: Reconfigurar Nginx para Todos os Sites no aapanel

## 🚨 Problema Identificado

Há um conflito na porta 80, impedindo o nginx do aapanel de iniciar. Isso pode afetar todos os sites.

## 🔍 Diagnóstico Inicial

Execute primeiro para identificar o problema:

```bash
chmod +x identificar-processo-porta-80.sh
./identificar-processo-porta-80.sh
```

## ✅ Solução Passo a Passo

### Passo 1: Parar Todos os Processos Conflitantes

```bash
# Parar todos os processos do nginx
killall nginx 2>/dev/null
pkill nginx 2>/dev/null
/etc/init.d/nginx stop 2>/dev/null

# Verificar se a porta 80 está livre
ss -tulpn | grep :80
```

Se ainda houver processo na porta 80, identifique e pare:

```bash
# Ver qual processo está usando
ss -tulpn | grep :80

# Parar o processo (substitua PID pelo número real)
kill -9 PID
```

### Passo 2: Usar o Script de Reconfiguração

```bash
chmod +x reconfigurar-nginx-todos-sites.sh
./reconfigurar-nginx-todos-sites.sh
```

### Passo 3: Verificar Cada Site Individualmente

Liste todos os sites:

```bash
ls -1 /www/server/panel/vhost/nginx/*.conf
```

Para cada site, verifique:

1. **No painel do aapanel:**
   - Website → [nome-do-site] → Settings → Config File
   - Verifique se a configuração está correta

2. **Verificar SSL:**
   - Website → [nome-do-site] → Settings → SSL
   - Se não tiver SSL, configure: Let's Encrypt → Apply

### Passo 4: Verificar Configuração Principal

```bash
# Testar sintaxe
/www/server/nginx/sbin/nginx -t

# Ver configuração carregada
/www/server/nginx/sbin/nginx -T 2>/dev/null | grep -E "(server_name|listen)" | head -20
```

## 🎯 Solução Rápida (Manual)

Se preferir fazer manualmente:

```bash
# 1. Parar tudo
killall nginx
pkill nginx
/etc/init.d/nginx stop

# 2. Verificar porta 80
ss -tulpn | grep :80

# 3. Se ainda houver algo, matar o processo
# (substitua PID pelo número real)
kill -9 PID

# 4. Iniciar nginx do aapanel
/www/server/nginx/sbin/nginx

# 5. Verificar se iniciou
ps aux | grep nginx | grep -v grep

# 6. Verificar portas
ss -tulpn | grep -E ":(80|443)"

# 7. Testar sites
curl -I http://cf.don.cim.br
curl -I https://cf.don.cim.br
```

## 📋 Checklist para Cada Site

Para cada site no aapanel, verifique:

- [ ] **Configuração HTTP (porta 80)**
  - Bloco `server` com `listen 80`
  - `server_name` correto
  - `root` apontando para o diretório correto

- [ ] **Configuração HTTPS (porta 443)**
  - Bloco `server` com `listen 443 ssl http2`
  - Certificados SSL configurados:
    - `ssl_certificate`
    - `ssl_certificate_key`
  - Certificados existem no sistema

- [ ] **Redirecionamento HTTP → HTTPS**
  - Bloco `server` na porta 80 com `return 301 https://...`

- [ ] **Configuração para SPA (se aplicável)**
  - `location /` com `try_files $uri $uri/ /index.html;`

## 🔒 Configurar SSL para Todos os Sites

No painel do aapanel:

1. Vá em: **Website**
2. Para cada site sem SSL:
   - Clique no site
   - **Settings** → **SSL**
   - **Let's Encrypt**
   - Selecione o domínio
   - Clique em **Apply**
   - Aguarde a configuração

## 🛠️ Script de Verificação Completa

Crie um script para verificar todos os sites:

```bash
#!/bin/bash
echo "Verificando todos os sites..."
for config in /www/server/panel/vhost/nginx/*.conf; do
    site=$(basename "$config" .conf)
    echo ""
    echo "=== $site ==="
    
    # Verificar HTTP
    if grep -q "listen.*80" "$config"; then
        echo "✅ HTTP configurado"
    else
        echo "❌ HTTP não configurado"
    fi
    
    # Verificar HTTPS
    if grep -q "listen.*443" "$config"; then
        echo "✅ HTTPS configurado"
        
        # Verificar certificados
        cert=$(grep "ssl_certificate" "$config" | head -1 | awk '{print $2}' | tr -d ';')
        if [ -f "$cert" ]; then
            echo "✅ Certificado existe: $cert"
        else
            echo "❌ Certificado não existe: $cert"
        fi
    else
        echo "❌ HTTPS não configurado"
    fi
done
```

## ⚠️ Problemas Comuns

### 1. Porta 80 ainda em uso após parar nginx

```bash
# Verificar todos os processos
lsof -i :80
# ou
fuser -v 80/tcp

# Matar processo específico
kill -9 PID
```

### 2. Nginx não inicia após parar

```bash
# Verificar erros
/www/server/nginx/sbin/nginx -t

# Ver logs
tail -50 /www/server/nginx/logs/error.log
```

### 3. SSL não funciona

```bash
# Verificar se certificados existem
ls -la /www/server/panel/vhost/cert/*/

# Verificar configuração SSL
grep -A 5 "listen.*443" /www/server/panel/vhost/nginx/*.conf
```

## ✅ Verificação Final

Após reconfigurar, verifique:

```bash
# 1. Status do nginx
/etc/init.d/nginx status

# 2. Portas
ss -tulpn | grep -E ":(80|443)"

# 3. Testar cada site
for site in cf.don.cim.br nucleo.don.cim.br ceramica.don.cim.br; do
    echo "Testando $site..."
    curl -I http://$site
    curl -I https://$site
    echo ""
done
```

## 📝 Notas Importantes

1. **Sempre faça backup** antes de modificar configurações:
   ```bash
   cp -r /www/server/panel/vhost/nginx /www/server/panel/vhost/nginx.backup.$(date +%Y%m%d)
   ```

2. **Use o painel do aapanel** sempre que possível para gerenciar sites

3. **Não misture** nginx do sistema com nginx do aapanel

4. **Teste sempre** após mudanças: `nginx -t`

5. **Recarregue** em vez de reiniciar quando possível: `/etc/init.d/nginx reload`

