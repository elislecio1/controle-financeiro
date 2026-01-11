# 🔧 Solução: Porta 80 em Uso

## 🚨 Problema Identificado

O nginx não consegue iniciar porque a porta 80 já está em uso por outro processo:

```
nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Unknown error)
```

## 🔍 Diagnóstico

Execute o script de diagnóstico:

```bash
chmod +x resolver-porta-80.sh
./resolver-porta-80.sh
```

Ou execute manualmente:

```bash
# Ver qual processo está usando a porta 80
ss -tulpn | grep :80
# ou
netstat -tulpn | grep :80

# Ver processos do nginx
ps aux | grep nginx | grep -v grep

# Ver detalhes do processo na porta 80
lsof -i :80
# ou
fuser -v 80/tcp
```

## ✅ Soluções

### Solução 1: Parar processos do nginx órfãos

Se houver processos do nginx ainda rodando:

```bash
# Ver processos do nginx
ps aux | grep nginx

# Parar todos os processos do nginx
killall nginx
# ou
pkill nginx

# Tentar iniciar novamente
systemctl start nginx
systemctl status nginx
```

### Solução 2: Parar Apache (se estiver rodando)

Se o Apache estiver usando a porta 80:

```bash
# Verificar se Apache está rodando
systemctl status apache2
# ou
systemctl status httpd

# Parar Apache
systemctl stop apache2
# ou
systemctl stop httpd

# Desabilitar Apache para não iniciar automaticamente
systemctl disable apache2
# ou
systemctl disable httpd

# Iniciar nginx
systemctl start nginx
```

### Solução 3: Nginx do aapanel

Se você estiver usando o aapanel, ele pode ter seu próprio nginx rodando:

```bash
# Verificar processos do nginx do aapanel
ps aux | grep "/www/server/nginx"

# Parar nginx do aapanel
/www/server/nginx/sbin/nginx -s stop

# Ou usar o script do aapanel
/etc/init.d/nginx stop

# Iniciar nginx do systemd
systemctl start nginx
```

### Solução 4: Verificar múltiplas instalações do nginx

Pode haver duas instalações do nginx (uma do sistema e outra do aapanel):

```bash
# Verificar qual nginx está sendo usado
which nginx
nginx -v

# Verificar nginx do aapanel
/www/server/nginx/sbin/nginx -v

# Se o aapanel estiver usando seu próprio nginx, pare-o primeiro
/etc/init.d/nginx stop
# ou
/www/server/nginx/sbin/nginx -s stop

# Depois inicie o nginx do systemd
systemctl start nginx
```

### Solução 5: Matar processo específico na porta 80

Se você identificar o PID do processo:

```bash
# Ver PID do processo na porta 80
lsof -i :80
# ou
fuser -v 80/tcp

# Matar o processo (substitua PID pelo número real)
kill -9 PID

# Ou matar diretamente pelo nome
killall nome-do-processo
```

## 🎯 Solução Rápida Recomendada

Execute estes comandos na ordem:

```bash
# 1. Parar todos os processos do nginx
killall nginx 2>/dev/null
pkill nginx 2>/dev/null

# 2. Parar nginx do aapanel (se existir)
/etc/init.d/nginx stop 2>/dev/null
/www/server/nginx/sbin/nginx -s stop 2>/dev/null

# 3. Verificar o que ainda está na porta 80
ss -tulpn | grep :80

# 4. Se ainda houver algo, matar o processo
# (substitua PID pelo número real do processo)
# kill -9 PID

# 5. Iniciar nginx
systemctl start nginx

# 6. Verificar status
systemctl status nginx
```

## 📝 Nota sobre aapanel

Se você estiver usando o **aapanel**, ele geralmente gerencia o nginx através de seu próprio sistema. Nesse caso:

1. **Use o painel do aapanel** para gerenciar o nginx:
   - Acesse o painel do aapanel
   - Vá em: Software Store → Nginx → Settings
   - Use os controles do painel para iniciar/parar

2. **OU use os scripts do aapanel**:
   ```bash
   /etc/init.d/nginx start
   /etc/init.d/nginx stop
   /etc/init.d/nginx restart
   /etc/init.d/nginx status
   ```

3. **NÃO use systemctl** se o aapanel estiver gerenciando o nginx, pois pode causar conflitos.

## ✅ Verificação Final

Após resolver, verifique:

```bash
# Verificar se nginx está rodando
systemctl status nginx
# ou
/etc/init.d/nginx status

# Verificar se a porta 80 está livre
ss -tulpn | grep :80

# Testar o site
curl -I http://cf.don.cim.br
```

