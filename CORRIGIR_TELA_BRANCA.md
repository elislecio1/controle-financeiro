# 🔧 Corrigir Tela em Branco - Erro MIME Type

## ❌ Problema

```
Failed to load module script: Expected a JavaScript-or-Wasm module script 
but the server responded with a MIME type of "application/octet-stream"
```

**Causa**: O Nginx está servindo arquivos JavaScript com o tipo MIME errado (`application/octet-stream` ao invés de `application/javascript`).

---

## ✅ Solução

### Passo 1: Atualizar Configuração Nginx

A configuração precisa incluir tipos MIME corretos para arquivos JavaScript.

**Use o arquivo**: `nginx-cf-don-cim-CORRIGIDO.conf`

### Passo 2: Aplicar no aapanel

1. **Website** → `cf.don.cim.br` → **Settings** → **Config File**
2. Apague todo o conteúdo atual
3. Copie o conteúdo do arquivo `nginx-cf-don-cim-CORRIGIDO.conf`
4. **Save** → **Test Config** → **Reload**

### Passo 3: Limpar Cache do Navegador

Após atualizar a configuração:
- Pressione `Ctrl + Shift + R` (ou `Cmd + Shift + R` no Mac)
- Ou abra em janela anônima/privada

---

## 🔍 O Que Foi Corrigido

### Adicionado na configuração:

```nginx
# Tipos MIME corretos para JavaScript
location ~* \.(js|mjs)$ {
    add_header Content-Type application/javascript;
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# Tipo MIME para CSS
location ~ .*\.css$ {
    add_header Content-Type text/css;
    expires 1y;
    add_header Cache-Control "public, immutable";
    error_log /dev/null;
    access_log /dev/null; 
}

# Tipo MIME para HTML
location = /index.html {
    add_header Content-Type text/html;
    # ... outras configurações
}
```

---

## 🧪 Verificar se Funcionou

1. **Recarregue a página** (Ctrl + Shift + R)
2. **Abra o Console** (F12)
3. **Verifique se não há mais erros de MIME type**
4. **A aplicação deve carregar normalmente**

---

## 🐛 Se Ainda Não Funcionar

### Verificar se build está completo

```bash
cd /www/wwwroot/cf.don.cim.br
ls -la dist/
# Deve mostrar index.html e pasta assets/
```

### Verificar permissões

```bash
chown -R www:www /www/wwwroot/cf.don.cim.br/dist
chmod -R 755 /www/wwwroot/cf.don.cim.br/dist
```

### Verificar logs do Nginx

```bash
tail -f /www/wwwlogs/cf.don.cim.br.error.log
```

### Testar configuração Nginx

```bash
sudo nginx -t
```

---

## 📝 Resumo

1. ✅ Use `nginx-cf-don-cim-CORRIGIDO.conf` (com tipos MIME corretos)
2. ✅ Aplique no aapanel
3. ✅ Limpe cache do navegador
4. ✅ Recarregue a página

**✅ Isso deve resolver o problema da tela em branco!**

