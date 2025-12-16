# 🔧 Corrigir Erro: "detected dubious ownership in repository"

## ❌ Erro

```
fatal: detected dubious ownership in repository at '/www/wwwroot/cf.don.cim.br'
To add an exception for this directory, call:
	git config --global --add safe.directory /www/wwwroot/cf.don.cim.br
```

## ✅ Solução Rápida

Execute no terminal do servidor:

```bash
git config --global --add safe.directory /www/wwwroot/cf.don.cim.br
```

## ✅ Verificar se Funcionou

```bash
cd /www/wwwroot/cf.don.cim.br
git status
```

Não deve mais aparecer o erro de "dubious ownership".

## 🧪 Testar Deploy Novamente

Depois de corrigir, teste o webhook novamente:

```bash
# Ignorar erro de SSL do curl (usar -k)
curl -k -X POST "https://181.232.139.201:25936/hook?access_key=OjdV16tkuhIb8GyGEWvIsiTFxn9rHS6cy2Wmw8w86Ltuqwq3&site_id=15"
```

Ou acesse a URL no navegador (ignorando o aviso de SSL).

## 📝 Nota sobre SSL

O erro do curl sobre SSL auto-assinado não impede o webhook de funcionar. O aapanel usa um certificado auto-assinado na porta 25936, o que é normal.

Para ignorar o erro no curl, use `-k`:
```bash
curl -k -X POST "URL_DO_WEBHOOK"
```

## ✅ Script Atualizado

O script `webhook-deploy-avancado.sh` foi atualizado para corrigir automaticamente esse problema nas próximas execuções.

