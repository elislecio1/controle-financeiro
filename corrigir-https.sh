#!/bin/bash

echo "=========================================="
echo "🔧 CORREÇÃO HTTPS - cf.don.cim.br"
echo "=========================================="
echo ""

# 1. Verificar status do nginx
echo "1️⃣ Status do nginx:"
echo "-----------------------------------"
/etc/init.d/nginx status
echo ""

# 2. Verificar se a porta 443 está sendo escutada
echo "2️⃣ Verificando porta 443:"
echo "-----------------------------------"
ss -tulpn | grep :443
netstat -tulpn | grep :443 2>/dev/null
echo ""

# 3. Verificar configuração SSL do site
echo "3️⃣ Verificando configuração do site:"
echo "-----------------------------------"
CONFIG_FILE="/www/server/panel/vhost/nginx/cf.don.cim.br.conf"
if [ -f "$CONFIG_FILE" ]; then
    echo "✅ Arquivo de configuração encontrado"
    echo ""
    echo "Verificando se há configuração SSL (porta 443):"
    grep -A 5 "listen.*443" "$CONFIG_FILE" || echo "❌ Nenhuma configuração SSL encontrada na porta 443"
    echo ""
    echo "Verificando certificados SSL:"
    grep "ssl_certificate" "$CONFIG_FILE" || echo "❌ Nenhum certificado SSL configurado"
else
    echo "❌ Arquivo de configuração não encontrado: $CONFIG_FILE"
fi
echo ""

# 4. Verificar se os certificados existem
echo "4️⃣ Verificando certificados SSL:"
echo "-----------------------------------"
if [ -f "/www/server/panel/vhost/cert/cf.don.cim.br/fullchain.pem" ]; then
    echo "✅ fullchain.pem encontrado"
    ls -lh /www/server/panel/vhost/cert/cf.don.cim.br/fullchain.pem
else
    echo "❌ fullchain.pem NÃO encontrado"
fi

if [ -f "/www/server/panel/vhost/cert/cf.don.cim.br/privkey.pem" ]; then
    echo "✅ privkey.pem encontrado"
    ls -lh /www/server/panel/vhost/cert/cf.don.cim.br/privkey.pem
else
    echo "❌ privkey.pem NÃO encontrado"
fi
echo ""

# 5. Testar configuração do nginx
echo "5️⃣ Testando configuração do nginx:"
echo "-----------------------------------"
nginx -t
echo ""

# 6. Verificar firewall
echo "6️⃣ Verificando firewall (iptables):"
echo "-----------------------------------"
iptables -L -n | grep 443 || echo "Nenhuma regra específica para porta 443 encontrada"
echo ""

# 7. Verificar se há outro processo na porta 443
echo "7️⃣ Verificando processos na porta 443:"
echo "-----------------------------------"
lsof -i :443 2>/dev/null || echo "Nenhum processo encontrado na porta 443"
echo ""

echo "=========================================="
echo "💡 PRÓXIMOS PASSOS:"
echo "=========================================="
echo ""
echo "1. Se o nginx estiver parado, inicie:"
echo "   /etc/init.d/nginx start"
echo ""
echo "2. Se não houver configuração SSL, adicione no aapanel:"
echo "   Website → cf.don.cim.br → Settings → SSL → Let's Encrypt → Apply"
echo ""
echo "3. Se os certificados não existirem, configure SSL no aapanel"
echo ""
echo "4. Após configurar, recarregue o nginx:"
echo "   /etc/init.d/nginx reload"
echo ""

