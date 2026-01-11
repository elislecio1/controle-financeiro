#!/bin/bash

echo "=========================================="
echo "🔍 IDENTIFICANDO PROCESSO NA PORTA 80"
echo "=========================================="
echo ""

# 1. Ver qual processo está usando a porta 80
echo "1️⃣ Processo usando a porta 80:"
echo "-----------------------------------"
if command -v ss >/dev/null 2>&1; then
    ss -tulpn | grep :80
    PID=$(ss -tulpn | grep :80 | awk '{print $6}' | cut -d',' -f2 | cut -d'=' -f2 | head -1)
else
    netstat -tulpn | grep :80
    PID=$(netstat -tulpn | grep :80 | awk '{print $7}' | cut -d'/' -f1 | head -1)
fi
echo ""

# 2. Ver detalhes do processo
if [ ! -z "$PID" ] && [ "$PID" != "-" ]; then
    echo "2️⃣ Detalhes do processo (PID: $PID):"
    echo "-----------------------------------"
    ps aux | grep "^$PID " | grep -v grep
    echo ""
    echo "Comando completo:"
    cat /proc/$PID/cmdline 2>/dev/null | tr '\0' ' ' || echo "Não foi possível ler"
    echo ""
    echo "Caminho do executável:"
    ls -l /proc/$PID/exe 2>/dev/null || echo "Não foi possível ler"
    echo ""
fi

# 3. Verificar todos os processos do nginx
echo "3️⃣ Todos os processos do nginx:"
echo "-----------------------------------"
ps aux | grep nginx | grep -v grep
echo ""

# 4. Verificar nginx do aapanel
echo "4️⃣ Verificando nginx do aapanel:"
echo "-----------------------------------"
if [ -f "/www/server/nginx/sbin/nginx" ]; then
    echo "✅ Nginx do aapanel encontrado: /www/server/nginx/sbin/nginx"
    /www/server/nginx/sbin/nginx -v 2>&1
    echo ""
    echo "Processos do nginx do aapanel:"
    ps aux | grep "/www/server/nginx" | grep -v grep
    echo ""
    echo "Verificando se está rodando:"
    /www/server/nginx/sbin/nginx -t 2>&1
else
    echo "❌ Nginx do aapanel não encontrado em /www/server/nginx/sbin/nginx"
fi
echo ""

# 5. Verificar nginx do sistema
echo "5️⃣ Verificando nginx do sistema:"
echo "-----------------------------------"
if command -v nginx >/dev/null 2>&1; then
    echo "✅ Nginx do sistema encontrado: $(which nginx)"
    nginx -v 2>&1
    echo ""
    echo "Processos do nginx do sistema:"
    ps aux | grep "nginx:" | grep -v grep
else
    echo "❌ Nginx do sistema não encontrado"
fi
echo ""

# 6. Verificar qual nginx o script /etc/init.d/nginx usa
echo "6️⃣ Verificando script /etc/init.d/nginx:"
echo "-----------------------------------"
if [ -f "/etc/init.d/nginx" ]; then
    echo "Primeiras 20 linhas do script:"
    head -20 /etc/init.d/nginx
else
    echo "❌ Script não encontrado"
fi
echo ""

# 7. Verificar portas em uso
echo "7️⃣ Portas 80 e 443 em uso:"
echo "-----------------------------------"
echo "Porta 80:"
ss -tulpn | grep :80 || echo "Nenhum processo na porta 80"
echo ""
echo "Porta 443:"
ss -tulpn | grep :443 || echo "Nenhum processo na porta 443"
echo ""

echo "=========================================="
echo "💡 DIAGNÓSTICO:"
echo "=========================================="
echo ""
if [ ! -z "$PID" ] && [ "$PID" != "-" ]; then
    echo "Processo $PID está usando a porta 80"
    echo "Este processo precisa ser parado antes de iniciar o nginx do aapanel"
fi
echo ""

