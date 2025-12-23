# 🔒 Como Resolver Problemas SSL

## 📋 Passo a Passo

### 1️⃣ **Diagnosticar o Problema**

Primeiro, execute o diagnóstico para identificar o problema:

```bash
cd /www/wwwroot/cf.don.cim.br
git pull origin main
chmod +x diagnosticar-ssl.sh
bash diagnosticar-ssl.sh
```

O script verifica:
- ✅ Certificados no Aapanel
- ✅ Certificados Let's Encrypt
- ✅ Configuração do Nginx
- ✅ Status do Nginx
- ✅ Logs de erro
- ✅ Conectividade HTTP/HTTPS
- ✅ Validade do certificado SSL

### 2️⃣ **Gerar Novo Certificado SSL**

Se o diagnóstico indicar que é necessário gerar um novo certificado:

```bash
chmod +x gerar-novo-certificado-ssl.sh
bash gerar-novo-certificado-ssl.sh
```

O script:
- 🔧 Instala Certbot (se necessário)
- 🛑 Para o Nginx temporariamente
- 🔒 Gera novo certificado Let's Encrypt
- 📋 Copia para o diretório do Aapanel
- ✅ Atualiza configuração do Nginx
- 🚀 Reinicia o Nginx
- ✅ Testa o certificado

### 3️⃣ **Aplicar Configuração do Nginx**

Se a configuração do Nginx precisa ser atualizada:

```bash
chmod +x aplicar-config-nginx.sh
bash aplicar-config-nginx.sh
```

## ⚠️ Problemas Comuns

### "Website not found"
- **Causa**: Certificado SSL inválido ou expirado
- **Solução**: Execute `gerar-novo-certificado-ssl.sh`

### "HTTPS não está funcionando"
- **Causa**: Certificado não configurado ou Nginx não está rodando
- **Solução**: 
  1. Execute `diagnosticar-ssl.sh` para identificar
  2. Se certificado faltando: `gerar-novo-certificado-ssl.sh`
  3. Se configuração errada: `aplicar-config-nginx.sh`

### "Certificado expirado"
- **Causa**: Certificado Let's Encrypt expirou (válido por 90 dias)
- **Solução**: Execute `gerar-novo-certificado-ssl.sh` para renovar

### "Porta 443 não está aberta"
- **Causa**: Nginx não está rodando ou não está configurado para HTTPS
- **Solução**: 
  1. Verificar: `systemctl status nginx`
  2. Iniciar: `systemctl start nginx`
  3. Verificar configuração: `nginx -t`

## 🔍 Verificações Manuais

### Verificar certificado atual:
```bash
openssl x509 -enddate -noout -in /www/server/panel/vhost/cert/cf.don.cim.br/fullchain.pem
```

### Verificar logs do Nginx:
```bash
tail -50 /www/wwwlogs/cf.don.cim.br.error.log
```

### Testar HTTPS:
```bash
curl -I https://cf.don.cim.br
```

### Verificar portas:
```bash
netstat -tuln | grep -E ":80|:443"
```

## 📝 Notas Importantes

1. **Certbot precisa da porta 80 livre** para gerar certificados
2. **O Nginx será parado temporariamente** durante a geração do certificado
3. **Certificados Let's Encrypt expiram em 90 dias** - configure renovação automática
4. **Sempre faça backup** antes de modificar configurações

## 🔄 Renovação Automática

Para configurar renovação automática do certificado:

```bash
# Testar renovação
certbot renew --dry-run

# Adicionar ao cron (renova automaticamente)
echo "0 0 * * * certbot renew --quiet" | crontab -
```

## 📞 Comandos Rápidos

```bash
# Diagnóstico completo
bash diagnosticar-ssl.sh

# Gerar novo certificado
bash gerar-novo-certificado-ssl.sh

# Aplicar configuração Nginx
bash aplicar-config-nginx.sh

# Ver status do Nginx
systemctl status nginx

# Reiniciar Nginx
systemctl restart nginx

# Ver logs em tempo real
tail -f /www/wwwlogs/cf.don.cim.br.error.log
```

