#!/bin/bash

echo "=========================================="
echo "🔧 RECONFIGURAR NGINX - TODOS OS SITES"
echo "=========================================="
echo ""

# 1. Parar todos os processos do nginx
echo "1️⃣ Parando todos os processos do nginx..."
echo "-----------------------------------"
killall nginx 2>/dev/null
pkill nginx 2>/dev/null
/etc/init.d/nginx stop 2>/dev/null
/www/server/nginx/sbin/nginx -s stop 2>/dev/null
sleep 2
echo "✅ Processos do nginx parados"
echo ""

# 2. Verificar se a porta 80 está livre
echo "2️⃣ Verificando se a porta 80 está livre..."
echo "-----------------------------------"
if ss -tulpn | grep :80 >/dev/null; then
    echo "⚠️  Ainda há processo na porta 80:"
    ss -tulpn | grep :80
    echo ""
    echo "Tentando identificar e parar..."
    PID=$(ss -tulpn | grep :80 | awk '{print $6}' | cut -d',' -f2 | cut -d'=' -f2 | head -1)
    if [ ! -z "$PID" ] && [ "$PID" != "-" ]; then
        echo "Parando processo $PID..."
        kill -9 $PID 2>/dev/null
        sleep 1
    fi
else
    echo "✅ Porta 80 está livre"
fi
echo ""

# 3. Listar todos os sites do aapanel
echo "3️⃣ Sites configurados no aapanel:"
echo "-----------------------------------"
SITES_DIR="/www/server/panel/vhost/nginx"
if [ -d "$SITES_DIR" ]; then
    echo "Arquivos de configuração encontrados:"
    ls -1 "$SITES_DIR"/*.conf 2>/dev/null | while read config; do
        SITE=$(basename "$config" .conf)
        echo "  - $SITE"
    done
else
    echo "❌ Diretório de configurações não encontrado"
fi
echo ""

# 4. Verificar configuração principal do nginx
echo "4️⃣ Verificando configuração principal do nginx:"
echo "-----------------------------------"
NGINX_CONF="/www/server/nginx/conf/nginx.conf"
if [ -f "$NGINX_CONF" ]; then
    echo "✅ Arquivo de configuração principal encontrado"
    echo "Testando sintaxe..."
    /www/server/nginx/sbin/nginx -t 2>&1
else
    echo "❌ Arquivo de configuração principal não encontrado"
fi
echo ""

# 5. Iniciar nginx do aapanel
echo "5️⃣ Iniciando nginx do aapanel..."
echo "-----------------------------------"
if [ -f "/www/server/nginx/sbin/nginx" ]; then
    /www/server/nginx/sbin/nginx
    sleep 2
    
    # Verificar se iniciou
    if ps aux | grep "/www/server/nginx" | grep -v grep >/dev/null; then
        echo "✅ Nginx do aapanel iniciado com sucesso"
    else
        echo "❌ Falha ao iniciar nginx do aapanel"
        echo "Verificando erros..."
        /www/server/nginx/sbin/nginx -t 2>&1
    fi
else
    echo "❌ Nginx do aapanel não encontrado"
fi
echo ""

# 6. Verificar portas
echo "6️⃣ Verificando portas 80 e 443:"
echo "-----------------------------------"
echo "Porta 80:"
ss -tulpn | grep :80 || echo "Nenhum processo na porta 80"
echo ""
echo "Porta 443:"
ss -tulpn | grep :443 || echo "Nenhum processo na porta 443"
echo ""

# 7. Verificar status
echo "7️⃣ Status do nginx:"
echo "-----------------------------------"
/etc/init.d/nginx status 2>/dev/null || echo "Script de status não disponível"
echo ""

echo "=========================================="
echo "✅ Processo concluído!"
echo "=========================================="
echo ""
echo "💡 PRÓXIMOS PASSOS:"
echo "   1. Verifique se o nginx está rodando: /etc/init.d/nginx status"
echo "   2. Teste HTTP: curl -I http://cf.don.cim.br"
echo "   3. Teste HTTPS: curl -I https://cf.don.cim.br"
echo "   4. Se HTTPS não funcionar, verifique a configuração SSL de cada site"
echo ""

