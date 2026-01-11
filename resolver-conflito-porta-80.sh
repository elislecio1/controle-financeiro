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
else
    netstat -tulpn | grep :80
fi
echo ""

# 2. Ver detalhes do processo
echo "2️⃣ Detalhes do processo:"
echo "-----------------------------------"
PID=$(ss -tulpn | grep :80 | awk '{print $6}' | cut -d',' -f2 | cut -d'=' -f2 | head -1)
if [ ! -z "$PID" ]; then
    echo "PID: $PID"
    ps aux | grep "^$PID " | grep -v grep
    echo ""
    echo "Comando completo:"
    cat /proc/$PID/cmdline 2>/dev/null | tr '\0' ' ' || echo "Não foi possível ler"
fi
echo ""

# 3. Verificar processos do nginx
echo "3️⃣ Todos os processos do nginx:"
echo "-----------------------------------"
ps aux | grep nginx | grep -v grep
echo ""

# 4. Verificar se é o nginx do aapanel
echo "4️⃣ Verificando nginx do aapanel:"
echo "-----------------------------------"
if [ -f "/www/server/nginx/sbin/nginx" ]; then
    echo "✅ Nginx do aapanel encontrado"
    /www/server/nginx/sbin/nginx -v 2>&1
    echo ""
    echo "Processos do nginx do aapanel:"
    ps aux | grep "/www/server/nginx" | grep -v grep
fi
echo ""

# 5. Verificar status do nginx do aapanel
echo "5️⃣ Status do nginx do aapanel:"
echo "-----------------------------------"
/etc/init.d/nginx status 2>/dev/null || echo "Script não encontrado"
echo ""

# 6. Verificar se há Apache rodando
echo "6️⃣ Verificando Apache:"
echo "-----------------------------------"
if pgrep -x apache2 >/dev/null || pgrep -x httpd >/dev/null; then
    echo "⚠️  Apache está rodando!"
    ps aux | grep -E "(apache2|httpd)" | grep -v grep | head -5
else
    echo "✅ Apache não está rodando"
fi
echo ""

echo "=========================================="
echo "💡 SOLUÇÃO:"
echo "=========================================="
echo ""
echo "O nginx do aapanel provavelmente já está rodando."
echo "Use o nginx do aapanel em vez de tentar iniciar outro."
echo ""
echo "Comandos:"
echo "  /etc/init.d/nginx reload  # Recarregar configuração"
echo "  /etc/init.d/nginx restart # Reiniciar"
echo "  /etc/init.d/nginx status  # Ver status"
echo ""

