# ⚠️ Avisos de server_name Conflitantes

## 📋 Situação Atual

O nginx está rodando, mas mostra avisos:
```
nginx: [warn] conflicting server name "wshub.com.br" on 0.0.0.0:80, ignored
nginx: [warn] conflicting server name "www.wshub.com.br" on 0.0.0.0:80, ignored
```

## ✅ Boa Notícia

**Estes são apenas AVISOS, não erros!** O nginx está funcionando normalmente. Os avisos indicam que há múltiplas configurações de `server_name` para os mesmos domínios na porta 80, e o nginx está ignorando as duplicatas.

## 🔍 Verificar se Está Funcionando

Execute estes comandos para verificar:

```bash
# 1. Verificar status
/etc/init.d/nginx status

# 2. Testar o site
curl -I http://cf.don.cim.br

# 3. Verificar se a porta 80 está respondendo
ss -tulpn | grep :80

# 4. Ver logs de acesso
tail -20 /www/wwwlogs/cf.don.cim.br.log
```

## 🛠️ Resolver os Avisos (Opcional)

Se quiser eliminar os avisos, você precisa encontrar e remover as configurações duplicadas:

### 1. Encontrar arquivos com server_name conflitantes

```bash
# Procurar por wshub.com.br nas configurações
grep -r "server_name.*wshub.com.br" /www/server/panel/vhost/nginx/

# Ver todos os arquivos de configuração
ls -la /www/server/panel/vhost/nginx/*.conf
```

### 2. Verificar qual configuração está sendo usada

O nginx usa a primeira configuração que encontrar e ignora as outras. Para ver qual está ativa:

```bash
# Ver configuração carregada
nginx -T 2>/dev/null | grep -A 5 "server_name.*wshub.com.br"
```

### 3. Remover ou comentar duplicatas

No painel do aapanel:
- Website → wshub.com.br → Settings → Config File
- Verifique se há múltiplos blocos `server` com o mesmo `server_name`
- Remova ou comente os duplicados

OU edite diretamente:
```bash
# Fazer backup primeiro
cp /www/server/panel/vhost/nginx/wshub.com.br.conf /www/server/panel/vhost/nginx/wshub.com.br.conf.backup

# Editar o arquivo
nano /www/server/panel/vhost/nginx/wshub.com.br.conf

# Depois de editar, testar
nginx -t

# Se estiver OK, recarregar
/etc/init.d/nginx reload
```

## 💡 Importante

- **Os avisos não afetam o funcionamento** do nginx
- O site `cf.don.cim.br` deve estar funcionando normalmente
- Você pode ignorar os avisos se tudo estiver funcionando
- Resolva apenas se quiser ter logs mais limpos

## ✅ Verificação Final

```bash
# Verificar se o site está acessível
curl -I http://cf.don.cim.br
curl -I https://cf.don.cim.br

# Verificar logs de erro (não deve ter erros, apenas avisos)
tail -50 /www/wwwlogs/cf.don.cim.br.error.log | grep -i error
```

Se não houver erros (apenas avisos), está tudo funcionando! 🎉

