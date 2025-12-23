# ⚙️ Ajustes Necessários na Configuração Nginx

## 🔍 Análise da Configuração Atual

Sua configuração atual tem alguns pontos que precisam ser ajustados para funcionar corretamente com uma aplicação React SPA (Single Page Application).

---

## ❌ Problemas Identificados

### 1. **Root apontando para diretório errado**
```nginx
root /www/wwwroot/cf.don.cim.br;  # ❌ ERRADO
```
**Problema**: O build do React fica na pasta `dist/`, não na raiz.

**Correção**:
```nginx
root /www/wwwroot/cf.don.cim.br/dist;  # ✅ CORRETO
```

### 2. **Falta configuração para SPA**
**Problema**: Sem `try_files`, o React Router não funciona. Ao acessar rotas como `/dashboard`, o Nginx retorna 404.

**Correção**: Adicionar dentro de `location /`:
```nginx
location / {
    try_files $uri $uri/ /index.html;  # ✅ ESSENCIAL
}
```

### 3. **Error page 404 apontando para arquivo inexistente**
```nginx
error_page 404 /404.html;  # ❌ Este arquivo não existe no build
```
**Correção**:
```nginx
error_page 404 /index.html;  # ✅ Redireciona para o React
```

### 4. **PHP habilitado (desnecessário)**
```nginx
include enable-php-83.conf;  # ❌ Não precisa para React estático
```
**Correção**: Comentar ou remover.

### 5. **Rewrite rules podem interferir**
```nginx
include /www/server/panel/vhost/rewrite/cf.don.cim.br.conf;
```
**Problema**: Pode interferir com o React Router.

**Correção**: Comentar se não for necessário.

---

## ✅ Configuração Corrigida

Use o arquivo `nginx-cf-don-cim-AJUSTADO.conf` que contém todas as correções necessárias.

### Principais mudanças:

1. ✅ `root` apontando para `/dist`
2. ✅ `try_files` adicionado para SPA
3. ✅ `error_page 404` redirecionando para `/index.html`
4. ✅ PHP comentado (não necessário)
5. ✅ Rewrite rules comentadas
6. ✅ Cache otimizado para arquivos estáticos
7. ✅ Headers de segurança adicionados
8. ✅ Gzip compression adicionado

---

## 📝 Como Aplicar

### Opção 1: Substituir Configuração Completa

1. No aapanel: **Website** → `cf.don.cim.br` → **Settings** → **Config File**
2. Apague todo o conteúdo atual
3. Copie o conteúdo do arquivo `nginx-cf-don-cim-AJUSTADO.conf`
4. **Save** → **Test Config** → **Reload**

### Opção 2: Ajustes Manuais (Mínimos)

Se preferir manter mais da configuração original, faça apenas estes ajustes:

```nginx
# 1. Mudar root
root /www/wwwroot/cf.don.cim.br/dist;

# 2. Adicionar try_files no location /
location / {
    try_files $uri $uri/ /index.html;
}

# 3. Mudar error_page 404
error_page 404 /index.html;

# 4. Comentar PHP (opcional)
#include enable-php-83.conf;
```

---

## ⚠️ Importante

### Antes de aplicar:

1. **Certifique-se de que o build foi feito**:
```bash
cd /www/wwwroot/cf.don.cim.br
ls -la dist/
# Deve mostrar index.html e outros arquivos
```

2. **Se a pasta dist não existir**:
```bash
npm run build
```

3. **Verificar permissões**:
```bash
chown -R www:www /www/wwwroot/cf.don.cim.br
chmod -R 755 /www/wwwroot/cf.don.cim.br/dist
```

---

## 🧪 Testar Após Ajustes

1. **Testar configuração Nginx**:
```bash
sudo nginx -t
```

2. **Recarregar Nginx**:
```bash
sudo systemctl reload nginx
# Ou no aapanel: Reload
```

3. **Testar no navegador**:
   - Acesse: `http://cf.don.cim.br`
   - Deve carregar a aplicação React
   - Teste navegar entre rotas (ex: `/dashboard`, `/transactions`)
   - Todas as rotas devem funcionar sem erro 404

---

## 🐛 Troubleshooting

### Erro 404 em todas as rotas

**Causa**: Falta `try_files` ou `root` errado

**Solução**: Verifique se:
- `root` aponta para `/dist`
- `try_files $uri $uri/ /index.html;` está presente

### Erro 403 Forbidden

**Causa**: Permissões incorretas

**Solução**:
```bash
chown -R www:www /www/wwwroot/cf.don.cim.br
chmod -R 755 /www/wwwroot/cf.don.cim.br/dist
```

### Página em branco

**Causa**: Build não foi feito ou `root` errado

**Solução**:
```bash
cd /www/wwwroot/cf.don.cim.br
npm run build
ls -la dist/  # Verificar se index.html existe
```

---

**✅ Use a configuração ajustada e tudo funcionará perfeitamente!**

