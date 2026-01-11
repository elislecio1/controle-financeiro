#!/bin/bash

echo "=========================================="
echo "✅ VERIFICAÇÃO DO NGINX"
echo "=========================================="
echo ""

# 1. Verificar status do nginx
echo "1️⃣ Status do nginx:"
echo "-----------------------------------"
/etc/init.d/nginx status
echo ""

# 2. Verificar processos
echo "2️⃣ Processos do nginx:"
echo "-----------------------------------"
ps aux | grep nginx | grep -v grep
echo ""

# 3. Verificar portas
echo "3️⃣ Portas em uso pelo nginx:"
echo "-----------------------------------"
ss -tulpn | grep nginx
echo ""

# 4. Testar configuração
echo "4️⃣ Testando configuração:"
echo "-----------------------------------"
nginx -t
echo ""

# 5. Testar acesso HTTP
echo "5️⃣ Testando acesso HTTP:"
echo "-----------------------------------"
curl -I http://cf.don.cim.br 2>&1 | head -10
echo ""

# 6. Verificar logs de erro recentes
echo "6️⃣ Últimas linhas do log de erro:"
echo "-----------------------------------"
tail -20 /www/wwwlogs/cf.don.cim.br.error.log 2>/dev/null || echo "Log não encontrado"
echo ""

# 7. Verificar avisos de server_name conflitantes
echo "7️⃣ Verificando configurações com server_name conflitantes:"
echo "-----------------------------------"
grep -r "server_name.*wshub.com.br" /www/server/panel/vhost/nginx/ 2>/dev/null | head -10
echo ""

echo "=========================================="
echo "✅ Verificação concluída!"
echo "=========================================="

