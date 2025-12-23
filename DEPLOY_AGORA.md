# 🚀 Deploy Imediato

## Opção 1: Acionar Webhook Manualmente (Recomendado)

### No Windows (PowerShell):
```powershell
# Ignorar erro de certificado SSL
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
Invoke-WebRequest -Uri "https://181.232.139.201:25936/hook?access_key=OjdV16tkuhIb8GyGEWvIsiTFxn9rHS6cy2Wmw8w86Ltuqwq3&site_id=15" -Method POST
```

### No Linux/Mac ou via SSH:
```bash
curl -k -X POST "https://181.232.139.201:25936/hook?access_key=OjdV16tkuhIb8GyGEWvIsiTFxn9rHS6cy2Wmw8w86Ltuqwq3&site_id=15"
```

### Via Navegador:
Acesse esta URL no navegador (pode dar erro de certificado, mas o webhook será acionado):
```
https://181.232.139.201:25936/hook?access_key=OjdV16tkuhIb8GyGEWvIsiTFxn9rHS6cy2Wmw8w86Ltuqwq3&site_id=15
```

## Opção 2: Deploy Manual via aapanel

1. Acesse o aapanel: `https://181.232.139.201:25936`
2. Vá em **Website** → `cf.don.cim.br` → **Settings** → **Git Manager**
3. Clique em **"Pull"** ou **"Deploy"**
4. Aguarde o processo concluir

## Opção 3: Deploy Manual via SSH

Conecte-se ao servidor via SSH e execute:

```bash
cd /www/wwwroot/cf.don.cim.br
git pull origin main
npm install
npm run build
chown -R www:www dist
chmod -R 755 dist
systemctl reload nginx
```

## Verificar Logs do Deploy

```bash
# Via SSH
tail -f /www/wwwlogs/cf.don.cim.br-deploy.log

# Ou no aapanel
Website → cf.don.cim.br → Settings → Git Manager → Logs
```

## Status do Deploy

Após acionar o webhook, você pode verificar:
- ✅ Logs em `/www/wwwlogs/cf.don.cim.br-deploy.log`
- ✅ Status no aapanel (Git Manager → Logs)
- ✅ Site em `https://cf.don.cim.br`

## Nota

O webhook é acionado automaticamente quando você faz push para o repositório GitHub. Se você já fez o push, o deploy pode já estar em andamento ou concluído.

