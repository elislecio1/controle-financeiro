# 🔒 Como Corrigir Certificado SSL no aapanel

## 📋 Passo a Passo

### 1. Conectar ao servidor via SSH
```bash
ssh root@181.232.139.201
```

### 2. Baixar o script
```bash
cd /www/wwwroot/cf.don.cim.br
git pull origin main
```

### 3. Executar o script
```bash
chmod +x corrigir-certificado-ssl.sh
sudo bash corrigir-certificado-ssl.sh
```

## 🔧 O que o script faz:

1. ✅ Verifica se o domínio está acessível
2. ✅ Para o Nginx temporariamente (para liberar porta 80)
3. ✅ Instala/renova certificado Let's Encrypt
4. ✅ Copia certificados para diretório do aapanel
5. ✅ Atualiza configuração do Nginx
6. ✅ Testa configuração do Nginx
7. ✅ Reinicia Nginx
8. ✅ Verifica se certificado está válido

## ⚠️ Se o script falhar:

### Erro: "Porta 80 em uso"
```bash
# Verificar processos usando porta 80
sudo lsof -i :80

# Parar processos manualmente
sudo kill -9 <PID>
```

### Erro: "Certbot não encontrado"
```bash
# Instalar certbot
sudo apt-get update
sudo apt-get install -y certbot
```

### Erro: "Certificado inválido"
```bash
# Verificar certificado manualmente
echo | openssl s_client -connect cf.don.cim.br:443 -servername cf.don.cim.br

# Verificar configuração do Nginx
sudo nginx -t

# Ver logs do Nginx
sudo tail -f /www/wwwlogs/cf.don.cim.br.log
```

## 🔍 Verificação Manual

### Verificar certificado
```bash
curl -I https://cf.don.cim.br
```

### Verificar arquivos de certificado
```bash
ls -la /www/server/panel/vhost/cert/cf.don.cim.br/
ls -la /etc/letsencrypt/live/cf.don.cim.br/
```

### Verificar configuração do Nginx
```bash
cat /www/server/panel/vhost/nginx/cf.don.cim.br.conf | grep ssl_certificate
```

## 📝 Notas Importantes

- O script precisa ser executado como **root** ou com **sudo**
- O Nginx será parado temporariamente durante a instalação do certificado
- O script cria backup automático da configuração do Nginx
- Se algo der errado, o script tenta restaurar o backup

## 🆘 Suporte

Se o problema persistir, verifique:
1. DNS do domínio apontando corretamente
2. Porta 80 e 443 abertas no firewall
3. Configuração do Nginx no aapanel
4. Logs do Nginx e Certbot

