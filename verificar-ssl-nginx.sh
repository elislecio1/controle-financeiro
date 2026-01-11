#!/bin/bash

echo "=========================================="
echo "🔍 VERIFICANDO CONFIGURAÇÃO SSL NO NGINX"
echo "=========================================="
echo ""

# 1. Verificar configuração carregada do nginx
echo "1️⃣ Configuração SSL carregada no nginx:"
echo "-----------------------------------"
nginx -T 2>/dev/null | grep -A 10 "server_name cf.don.cim.br" | grep -A 10 "listen.*443" || echo "❌ Configuração SSL não encontrada na configuração carregada"
echo ""

# 2. Verificar arquivo de configuração do site
echo "2️⃣ Arquivo de configuração do site:"
echo "-----------------------------------"
CONFIG_FILE="/www/server/panel/vhost/nginx/cf.don.cim.br.conf"
if [ -f "$CONFIG_FILE" ]; then
    echo "✅ Arquivo encontrado: $CONFIG_FILE"
    echo ""
    echo "Configuração SSL:"
    grep -A 15 "listen.*443" "$CONFIG_FILE" | head -20
else
    echo "❌ Arquivo não encontrado"
fi
echo ""

# 3. Verificar se os certificados existem
echo "3️⃣ Certificados SSL:"
echo "-----------------------------------"
if [ -f "/www/server/panel/vhost/cert/cf.don.cim.br/fullchain.pem" ]; then
    echo "✅ fullchain.pem existe"
    ls -lh /www/server/panel/vhost/cert/cf.don.cim.br/fullchain.pem
else
    echo "❌ fullchain.pem NÃO existe"
fi

if [ -f "/www/server/panel/vhost/cert/cf.don.cim.br/privkey.pem" ]; then
    echo "✅ privkey.pem existe"
    ls -lh /www/server/panel/vhost/cert/cf.don.cim.br/privkey.pem
else
    echo "❌ privkey.pem NÃO existe"
fi
echo ""

# 4. Verificar se a porta 443 está sendo escutada
echo "4️⃣ Porta 443:"
echo "-----------------------------------"
ss -tulpn | grep :443
if [ $? -eq 0 ]; then
    echo "✅ Porta 443 está sendo escutada"
else
    echo "❌ Porta 443 NÃO está sendo escutada"
    echo ""
    echo "💡 O nginx precisa ser recarregado para aplicar a configuração SSL"
fi
echo ""

# 5. Testar sintaxe da configuração
echo "5️⃣ Testando sintaxe:"
echo "-----------------------------------"
nginx -t
echo ""

echo "=========================================="
echo "💡 PRÓXIMOS PASSOS:"
echo "=========================================="
echo ""
echo "Se a configuração SSL existe mas a porta 443 não está escutando:"
echo "  1. Recarregue o nginx: /etc/init.d/nginx reload"
echo "  2. Verifique novamente: ss -tulpn | grep :443"
echo "  3. Se ainda não funcionar, reinicie: /etc/init.d/nginx restart"
echo ""

