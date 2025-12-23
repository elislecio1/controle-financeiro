# 🚀 Como Usar o Script de Deploy Completo

## Script: `deploy-completo-aapanel.sh`

Este script faz tudo automaticamente:
- ✅ Atualiza o repositório Git
- ✅ Instala dependências npm
- ✅ Faz build do projeto
- ✅ Configura SSL automaticamente
- ✅ Reinicia o Nginx
- ✅ Verifica se está funcionando

## 📋 Como Executar no Terminal do aapanel

### 1. Conectar ao servidor via SSH

```bash
ssh root@seu-servidor
```

### 2. Navegar para o diretório do projeto

```bash
cd /www/wwwroot/cf.don.cim.br
```

### 3. Atualizar o repositório (primeira vez)

```bash
git pull origin main
```

### 4. Dar permissão de execução ao script

```bash
chmod +x deploy-completo-aapanel.sh
```

### 5. Executar o deploy completo

```bash
bash deploy-completo-aapanel.sh
```

## 🔧 O que o script faz:

1. **Atualiza repositório**: Faz `git pull` e salva mudanças locais se necessário
2. **Instala dependências**: Executa `npm install` com permissões corretas
3. **Faz build**: Executa `npm run build` e ajusta permissões
4. **Configura SSL**: 
   - Procura certificado Let's Encrypt
   - Copia para diretório do aapanel
   - Adiciona configuração SSL ao Nginx (porta 443)
5. **Testa Nginx**: Valida a configuração antes de reiniciar
6. **Reinicia serviços**: Recarrega/reinicia o Nginx
7. **Verifica**: Testa se HTTP e HTTPS estão funcionando

## 📝 Logs

Os logs são salvos em:
```
/www/wwwlogs/cf.don.cim.br-deploy-completo.log
```

Para ver os logs em tempo real:
```bash
tail -f /www/wwwlogs/cf.don.cim.br-deploy-completo.log
```

## ⚠️ Troubleshooting

### Se o script falhar:

1. **Verificar logs**:
   ```bash
   tail -50 /www/wwwlogs/cf.don.cim.br-deploy-completo.log
   ```

2. **Verificar status do Nginx**:
   ```bash
   systemctl status nginx
   ```

3. **Verificar configuração do Nginx**:
   ```bash
   nginx -t
   ```

4. **Verificar se está escutando nas portas**:
   ```bash
   netstat -tuln | grep nginx
   ```

5. **Verificar certificado SSL**:
   ```bash
   ls -la /www/server/panel/vhost/cert/cf.don.cim.br/
   ```

### Se o Nginx não iniciar:

```bash
# Ver logs de erro
tail -50 /var/log/nginx/error.log

# Tentar iniciar manualmente
systemctl start nginx

# Verificar se iniciou
systemctl status nginx
```

### Se o SSL não funcionar:

1. **Verificar se certificado existe**:
   ```bash
   ls -la /etc/letsencrypt/live/ | grep cf.don.cim.br
   ```

2. **Copiar certificado manualmente** (se necessário):
   ```bash
   # Encontrar diretório do certificado
   CERT_DIR=$(find /etc/letsencrypt/live -maxdepth 1 -type d -name "cf.don.cim.br*" | head -1)
   
   # Copiar
   cp $CERT_DIR/fullchain.pem /www/server/panel/vhost/cert/cf.don.cim.br/
   cp $CERT_DIR/privkey.pem /www/server/panel/vhost/cert/cf.don.cim.br/
   
   # Ajustar permissões
   chown -R www:www /www/server/panel/vhost/cert/cf.don.cim.br/
   chmod 644 /www/server/panel/vhost/cert/cf.don.cim.br/fullchain.pem
   chmod 600 /www/server/panel/vhost/cert/cf.don.cim.br/privkey.pem
   ```

3. **Verificar configuração SSL no Nginx**:
   ```bash
   cat /www/server/panel/vhost/nginx/cf.don.cim.br.conf | grep -A 5 "listen 443"
   ```

## 🎯 Comandos Rápidos

### Deploy completo (recomendado):
```bash
cd /www/wwwroot/cf.don.cim.br && git pull origin main && chmod +x deploy-completo-aapanel.sh && bash deploy-completo-aapanel.sh
```

### Apenas atualizar código (sem rebuild):
```bash
cd /www/wwwroot/cf.don.cim.br && git pull origin main
```

### Apenas rebuild (sem atualizar código):
```bash
cd /www/wwwroot/cf.don.cim.br && npm install && npm run build
```

### Apenas reiniciar Nginx:
```bash
systemctl reload nginx
```

### Verificar se está funcionando:
```bash
curl -I http://cf.don.cim.br
curl -I https://cf.don.cim.br
```

## ✅ Checklist Pós-Deploy

- [ ] Site acessível via HTTP (porta 80)
- [ ] Site acessível via HTTPS (porta 443)
- [ ] Certificado SSL válido (sem avisos no navegador)
- [ ] Nginx escutando nas portas 80 e 443
- [ ] Build atualizado (verificar data dos arquivos em `/www/wwwroot/cf.don.cim.br/dist`)

