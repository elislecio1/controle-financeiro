# ✅ Verificar e Corrigir Site "Not Found"

## Comandos Rápidos para Executar no Servidor

```bash
cd /www/wwwroot/cf.don.cim.br

# 1. Verificar estrutura
echo "=== Estrutura do diretório ==="
ls -la
echo ""
echo "=== Conteúdo da pasta dist ==="
ls -la dist/ | head -20

# 2. Verificar se index.html existe
if [ -f "dist/index.html" ]; then
    echo "✅ index.html existe"
    echo "Tamanho: $(du -h dist/index.html | cut -f1)"
else
    echo "❌ index.html NÃO existe!"
    echo "Fazendo build..."
    npm run build
fi

# 3. Verificar configuração do Nginx
echo ""
echo "=== Verificando configuração do Nginx ==="
if [ -f "/www/server/panel/vhost/nginx/cf.don.cim.br.conf" ]; then
    echo "Arquivo de configuração encontrado:"
    grep -E "root|server_name|listen" /www/server/panel/vhost/nginx/cf.don.cim.br.conf | head -10
else
    echo "❌ Arquivo de configuração não encontrado!"
fi

# 4. Verificar se Nginx está rodando
echo ""
echo "=== Status do Nginx ==="
systemctl status nginx --no-pager | head -10

# 5. Testar localmente
echo ""
echo "=== Testando localmente ==="
curl -I http://localhost 2>&1 | head -5

# 6. Verificar permissões
echo ""
echo "=== Verificando permissões ==="
ls -ld /www/wwwroot/cf.don.cim.br/dist
```

## 🔧 Correção Rápida

Se a pasta `dist` não estiver sendo servida:

```bash
cd /www/wwwroot/cf.don.cim.br

# Opção 1: Criar symlink (se necessário)
# ln -sfn /www/wwwroot/cf.don.cim.br/dist /www/wwwroot/cf.don.cim.br/public

# Opção 2: Verificar e corrigir configuração do aapanel
# No aapanel: Website → cf.don.cim.br → Settings
# Altere "Website Path" para: /www/wwwroot/cf.don.cim.br/dist
```

## 📋 Checklist

- [ ] Pasta `dist` existe e tem conteúdo
- [ ] Arquivo `dist/index.html` existe
- [ ] Permissões corretas (www:www, 755)
- [ ] Nginx configurado para servir `/www/wwwroot/cf.don.cim.br/dist`
- [ ] Nginx está rodando
- [ ] Domínio `cf.don.cim.br` aponta para o servidor correto
- [ ] SSL configurado (se usando HTTPS)

