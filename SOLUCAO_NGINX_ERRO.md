# 🔧 Solução para Erro do Nginx

## 🚨 Problema
O nginx não está iniciando com o erro:
```
Job for nginx.service failed because the control process exited with error code.
```

## 📋 Passos de Diagnóstico

### 1. Execute o script de diagnóstico
```bash
cd /www/wwwroot/cf.don.cim.br
chmod +x diagnostico-nginx.sh
./diagnostico-nginx.sh
```

### 2. Verifique os logs detalhados
```bash
journalctl -xeu nginx.service --no-pager -n 50
```

### 3. Teste a sintaxe da configuração
```bash
nginx -t
```

## 🔍 Problemas Comuns e Soluções

### ❌ Problema 1: Certificados SSL não encontrados

**Sintoma:**
```
SSL_CTX_use_certificate_file() failed (SSL: error:02001002:system library:fopen:No such file or directory)
```

**Solução:**
1. Configure o SSL no aapanel primeiro:
   - Website → cf.don.cim.br → Settings → SSL → Let's Encrypt → Apply

2. OU use configuração temporária sem SSL (veja `nginx-cf-don-cim-SEM-SSL.conf`)

3. OU verifique o caminho correto dos certificados:
```bash
# Verificar onde estão os certificados
find /www/server/panel/vhost -name "fullchain.pem" | grep cf.don.cim.br
find /www/server/panel/vhost -name "privkey.pem" | grep cf.don.cim.br
```

### ❌ Problema 2: Erro de sintaxe na configuração

**Sintoma:**
```
nginx: [emerg] unexpected end of file, expecting ";" or "}" in /www/server/panel/vhost/nginx/cf.don.cim.br.conf:XX
```

**Solução:**
1. Verifique a linha indicada no erro
2. Certifique-se de que todas as chaves `{ }` estão fechadas
3. Verifique se não há caracteres especiais ou encoding incorreto

### ❌ Problema 3: Arquivo de extensão não encontrado

**Sintoma:**
```
nginx: [emerg] open() "/www/server/panel/vhost/nginx/extension/cf.don.cim.br/*.conf" failed (2: No such file or directory)
```

**Solução:**
1. Comente a linha `include` na configuração:
```nginx
# include /www/server/panel/vhost/nginx/extension/cf.don.cim.br/*.conf;
```

2. OU crie o diretório:
```bash
mkdir -p /www/server/panel/vhost/nginx/extension/cf.don.cim.br
touch /www/server/panel/vhost/nginx/extension/cf.don.cim.br/.gitkeep
```

### ❌ Problema 4: Diretório root não existe

**Sintoma:**
```
nginx: [emerg] open() "/www/wwwroot/cf.don.cim.br/dist" failed (2: No such file or directory)
```

**Solução:**
1. Verifique se o build foi feito:
```bash
ls -la /www/wwwroot/cf.don.cim.br/
```

2. Se não existir a pasta `dist`, faça o build:
```bash
cd /www/wwwroot/cf.don.cim.br
npm run build
# ou
yarn build
```

### ❌ Problema 5: Porta já em uso

**Sintoma:**
```
nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)
```

**Solução:**
1. Verifique qual processo está usando a porta:
```bash
netstat -tulpn | grep :80
# ou
ss -tulpn | grep :80
```

2. Pare o processo ou configure o nginx para usar outra porta

## 🛠️ Solução Rápida: Configuração Temporária Sem SSL

Se o problema for com os certificados SSL, use temporariamente a configuração sem SSL:

1. No aapanel: Website → cf.don.cim.br → Settings → Config File
2. Cole o conteúdo de `nginx-cf-don-cim-SEM-SSL.conf`
3. Salve e teste:
```bash
nginx -t
systemctl restart nginx
```

## ✅ Após Corrigir

1. Teste a configuração:
```bash
nginx -t
```

2. Se estiver OK, reinicie o nginx:
```bash
systemctl restart nginx
```

3. Verifique o status:
```bash
systemctl status nginx
```

4. Teste o site:
```bash
curl -I http://cf.don.cim.br
# ou
curl -I https://cf.don.cim.br
```

## 📞 Comandos Úteis

```bash
# Ver status do nginx
systemctl status nginx

# Ver logs em tempo real
tail -f /www/wwwlogs/cf.don.cim.br.error.log

# Verificar processos do nginx
ps aux | grep nginx

# Recarregar configuração (sem parar o serviço)
nginx -s reload

# Parar nginx
systemctl stop nginx

# Iniciar nginx
systemctl start nginx

# Reiniciar nginx
systemctl restart nginx
```

