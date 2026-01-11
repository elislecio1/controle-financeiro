#!/bin/bash

echo "=========================================="
echo "🔍 DIAGNÓSTICO: Porta 80 em uso"
echo "=========================================="
echo ""

# 1. Verificar qual processo está usando a porta 80
echo "1️⃣ Processos usando a porta 80:"
echo "-----------------------------------"
if command -v ss >/dev/null 2>&1; then
    ss -tulpn | grep :80
else
    netstat -tulpn | grep :80
fi
echo ""

# 2. Verificar processos do nginx
echo "2️⃣ Processos do nginx em execução:"
echo "-----------------------------------"
ps aux | grep nginx | grep -v grep
echo ""

# 3. Verificar se há outro servidor web rodando
echo "3️⃣ Verificando outros servidores web:"
echo "-----------------------------------"
if pgrep -x apache2 >/dev/null; then
    echo "⚠️  Apache2 está rodando!"
    ps aux | grep apache2 | grep -v grep | head -5
fi

if pgrep -x httpd >/dev/null; then
    echo "⚠️  httpd está rodando!"
    ps aux | grep httpd | grep -v grep | head -5
fi

if systemctl is-active --quiet aapanel; then
    echo "ℹ️  aaPanel está ativo"
fi
echo ""

# 4. Verificar serviços systemd relacionados
echo "4️⃣ Status de serviços web:"
echo "-----------------------------------"
systemctl status nginx --no-pager -l | head -10
echo ""
if systemctl list-units --type=service | grep -E "(apache|httpd)" >/dev/null; then
    echo "Serviços Apache encontrados:"
    systemctl list-units --type=service | grep -E "(apache|httpd)"
fi
echo ""

# 5. Verificar se há múltiplas instâncias do nginx
echo "5️⃣ Verificando instalações do nginx:"
echo "-----------------------------------"
which nginx
nginx -v 2>&1
echo ""

# 6. Verificar se o aapanel tem seu próprio nginx
echo "6️⃣ Verificando nginx do aapanel:"
echo "-----------------------------------"
if [ -f "/www/server/nginx/sbin/nginx" ]; then
    echo "✅ Nginx do aapanel encontrado em /www/server/nginx/sbin/nginx"
    /www/server/nginx/sbin/nginx -v 2>&1
    echo ""
    echo "Processos do nginx do aapanel:"
    ps aux | grep "/www/server/nginx" | grep -v grep
fi
echo ""

echo "=========================================="
echo "💡 SOLUÇÕES POSSÍVEIS:"
echo "=========================================="
echo ""
echo "1. Se houver outro nginx rodando:"
echo "   killall nginx"
echo "   systemctl start nginx"
echo ""
echo "2. Se houver Apache rodando:"
echo "   systemctl stop apache2"
echo "   # ou"
echo "   systemctl stop httpd"
echo ""
echo "3. Se o aapanel tiver seu próprio nginx:"
echo "   /www/server/nginx/sbin/nginx -s stop"
echo "   systemctl start nginx"
echo ""
echo "4. Para ver detalhes do processo na porta 80:"
echo "   lsof -i :80"
echo "   # ou"
echo "   fuser -v 80/tcp"
echo ""

