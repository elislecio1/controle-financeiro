#!/bin/bash

echo "=========================================="
echo "🔍 DIAGNÓSTICO NGINX - cf.don.cim.br"
echo "=========================================="
echo ""

# 1. Verificar sintaxe da configuração
echo "1️⃣ Testando sintaxe da configuração do nginx..."
nginx -t
echo ""

# 2. Verificar logs detalhados
echo "2️⃣ Últimas linhas do log de erro do nginx:"
journalctl -xeu nginx.service --no-pager -n 30
echo ""

# 3. Verificar se os certificados SSL existem
echo "3️⃣ Verificando certificados SSL..."
if [ -f "/www/server/panel/vhost/cert/cf.don.cim.br/fullchain.pem" ]; then
    echo "✅ fullchain.pem encontrado"
    ls -lh /www/server/panel/vhost/cert/cf.don.cim.br/fullchain.pem
else
    echo "❌ fullchain.pem NÃO encontrado em /www/server/panel/vhost/cert/cf.don.cim.br/"
    echo "   Tentando caminho alternativo..."
    if [ -f "/www/server/panel/vhost/ssl/cf.don.cim.br/fullchain.pem" ]; then
        echo "✅ fullchain.pem encontrado em caminho alternativo"
        ls -lh /www/server/panel/vhost/ssl/cf.don.cim.br/fullchain.pem
    else
        echo "❌ fullchain.pem NÃO encontrado em caminho alternativo também"
    fi
fi

if [ -f "/www/server/panel/vhost/cert/cf.don.cim.br/privkey.pem" ]; then
    echo "✅ privkey.pem encontrado"
    ls -lh /www/server/panel/vhost/cert/cf.don.cim.br/privkey.pem
else
    echo "❌ privkey.pem NÃO encontrado em /www/server/panel/vhost/cert/cf.don.cim.br/"
    echo "   Tentando caminho alternativo..."
    if [ -f "/www/server/panel/vhost/ssl/cf.don.cim.br/privkey.pem" ]; then
        echo "✅ privkey.pem encontrado em caminho alternativo"
        ls -lh /www/server/panel/vhost/ssl/cf.don.cim.br/privkey.pem
    else
        echo "❌ privkey.pem NÃO encontrado em caminho alternativo também"
    fi
fi
echo ""

# 4. Verificar se o diretório root existe
echo "4️⃣ Verificando diretório root..."
if [ -d "/www/wwwroot/cf.don.cim.br/dist" ]; then
    echo "✅ Diretório /www/wwwroot/cf.don.cim.br/dist existe"
    ls -lh /www/wwwroot/cf.don.cim.br/dist/ | head -10
else
    echo "❌ Diretório /www/wwwroot/cf.don.cim.br/dist NÃO existe"
    if [ -d "/www/wwwroot/cf.don.cim.br" ]; then
        echo "   Mas /www/wwwroot/cf.don.cim.br existe. Conteúdo:"
        ls -lh /www/wwwroot/cf.don.cim.br/ | head -10
    fi
fi
echo ""

# 5. Verificar arquivo de extensão incluído
echo "5️⃣ Verificando arquivo de extensão incluído..."
if [ -d "/www/server/panel/vhost/nginx/extension/cf.don.cim.br" ]; then
    echo "✅ Diretório de extensão existe"
    ls -lh /www/server/panel/vhost/nginx/extension/cf.don.cim.br/
else
    echo "⚠️  Diretório de extensão não existe (pode ser normal se não houver extensões)"
fi
echo ""

# 6. Verificar se a porta está em uso
echo "6️⃣ Verificando portas 80 e 443..."
netstat -tuln | grep -E ':(80|443)' || ss -tuln | grep -E ':(80|443)'
echo ""

# 7. Verificar permissões dos certificados
echo "7️⃣ Verificando permissões dos certificados..."
if [ -f "/www/server/panel/vhost/cert/cf.don.cim.br/fullchain.pem" ]; then
    ls -l /www/server/panel/vhost/cert/cf.don.cim.br/*.pem
fi
echo ""

# 8. Verificar configuração do site no aapanel
echo "8️⃣ Localizando arquivo de configuração do site..."
CONFIG_FILE="/www/server/panel/vhost/nginx/cf.don.cim.br.conf"
if [ -f "$CONFIG_FILE" ]; then
    echo "✅ Arquivo de configuração encontrado: $CONFIG_FILE"
    echo "   Primeiras 20 linhas:"
    head -20 "$CONFIG_FILE"
else
    echo "❌ Arquivo de configuração NÃO encontrado em $CONFIG_FILE"
    echo "   Procurando em outros locais..."
    find /www/server/panel/vhost/nginx/ -name "*cf.don.cim.br*" 2>/dev/null
fi
echo ""

echo "=========================================="
echo "✅ Diagnóstico concluído!"
echo "=========================================="
echo ""
echo "💡 PRÓXIMOS PASSOS:"
echo "   1. Se houver erro de sintaxe, corrija o arquivo de configuração"
echo "   2. Se os certificados não existirem, configure o SSL no aapanel"
echo "   3. Se o diretório dist não existir, faça o build da aplicação"
echo "   4. Se houver problema com arquivo de extensão, comente a linha 'include'"
echo ""

