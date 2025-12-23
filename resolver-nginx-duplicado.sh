#!/bin/bash
# ============================================
# Script para Resolver Nginx Duplicado e Configurar Porta 443
# ============================================

DOMAIN="cf.don.cim.br"
NGINX_CONFIG="/www/server/panel/vhost/nginx/${DOMAIN}.conf"
AAPANEL_NGINX="/www/server/panel/webserver/sbin/webserver"
SYSTEM_NGINX="/usr/sbin/nginx"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

echo "=========================================="
echo "🔧 RESOLVER NGINX DUPLICADO E PORTA 443"
echo "=========================================="
echo ""

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
    log_error "Este script precisa ser executado como root"
    exit 1
fi

# 1. Identificar processos Nginx
log_info "1️⃣ Identificando processos Nginx..."
NGINX_PROCESSES=$(ps aux | grep -E "nginx|webserver" | grep -v grep)

log_info "Processos encontrados:"
echo "$NGINX_PROCESSES"

# Verificar qual está usando porta 80
log_info "Verificando qual processo está usando porta 80..."
PROCESS_80=$(lsof -ti :80 2>/dev/null | head -1)
if [ -n "$PROCESS_80" ]; then
    PROCESS_INFO=$(ps -p "$PROCESS_80" -o comm=,args= 2>/dev/null)
    log_info "Processo usando porta 80 (PID $PROCESS_80): $PROCESS_INFO"
    
    if echo "$PROCESS_INFO" | grep -q "webserver"; then
        log_warning "É o Nginx do Aapanel usando porta 80"
        AAPANEL_USING_80=1
    else
        log_info "É o Nginx do sistema usando porta 80"
        AAPANEL_USING_80=0
    fi
else
    log_warning "Nenhum processo encontrado usando porta 80"
    AAPANEL_USING_80=0
fi

echo ""

# 2. Verificar qual Nginx deve ser usado
log_info "2️⃣ Verificando qual Nginx deve ser usado..."
if [ -f "$AAPANEL_NGINX" ]; then
    log_info "Nginx do Aapanel encontrado: $AAPANEL_NGINX"
    USE_AAPANEL_NGINX=1
else
    log_info "Nginx do Aapanel não encontrado, usando Nginx do sistema"
    USE_AAPANEL_NGINX=0
fi

echo ""

# 3. Parar todos os processos Nginx
log_info "3️⃣ Parando todos os processos Nginx..."
systemctl stop nginx 2>/dev/null || true
killall -9 nginx 2>/dev/null || true
killall -9 webserver 2>/dev/null || true
sleep 3

# Verificar se parou
if lsof -ti :80 > /dev/null 2>&1 || lsof -ti :443 > /dev/null 2>&1; then
    log_warning "Ainda há processos usando portas 80/443"
    log_info "Matando processos restantes..."
    fuser -k 80/tcp 2>/dev/null || true
    fuser -k 443/tcp 2>/dev/null || true
    sleep 2
fi

log_success "Todos os processos Nginx parados"

echo ""

# 4. Verificar configuração do Nginx
log_info "4️⃣ Verificando configuração do Nginx..."
if [ ! -f "$NGINX_CONFIG" ]; then
    log_error "Arquivo de configuração não encontrado: $NGINX_CONFIG"
    exit 1
fi

# Verificar se listen 443 está configurado
if grep -q "listen 443" "$NGINX_CONFIG"; then
    log_success "listen 443 configurado"
else
    log_error "listen 443 não encontrado na configuração"
    exit 1
fi

# Verificar certificados SSL
if grep -q "ssl_certificate.*fullchain.pem" "$NGINX_CONFIG" && \
   grep -q "ssl_certificate_key.*privkey.pem" "$NGINX_CONFIG"; then
    log_success "Certificados SSL configurados"
else
    log_error "Certificados SSL não configurados corretamente"
    exit 1
fi

# Testar configuração
if [ "$USE_AAPANEL_NGINX" -eq 1 ]; then
    log_info "Testando configuração do Nginx do Aapanel..."
    if "$AAPANEL_NGINX" -t -c /www/server/panel/webserver/conf/webserver.conf 2>&1 | grep -q "successful"; then
        log_success "Configuração válida"
    else
        log_warning "Configuração do Aapanel tem problemas, testando Nginx do sistema..."
        if nginx -t 2>&1 | grep -q "successful"; then
            log_success "Configuração do Nginx do sistema válida"
            USE_AAPANEL_NGINX=0
        else
            log_error "Ambas as configurações têm problemas"
            nginx -t
            exit 1
        fi
    fi
else
    log_info "Testando configuração do Nginx do sistema..."
    if nginx -t 2>&1 | grep -q "successful"; then
        log_success "Configuração válida"
    else
        log_error "Configuração inválida:"
        nginx -t
        exit 1
    fi
fi

echo ""

# 5. Iniciar Nginx correto
log_info "5️⃣ Iniciando Nginx..."
if [ "$USE_AAPANEL_NGINX" -eq 1 ]; then
    log_info "Iniciando Nginx do Aapanel..."
    systemctl start webserver 2>/dev/null || \
    /www/server/panel/webserver/sbin/webserver -c /www/server/panel/webserver/conf/webserver.conf
    sleep 3
else
    log_info "Iniciando Nginx do sistema..."
    systemctl start nginx
    sleep 3
fi

# Verificar se iniciou
if systemctl is-active --quiet nginx || systemctl is-active --quiet webserver; then
    log_success "Nginx iniciado"
else
    log_warning "Nginx pode não ter iniciado completamente"
    log_info "Verificando processos..."
    ps aux | grep -E "nginx|webserver" | grep -v grep
fi

echo ""

# 6. Verificar portas
log_info "6️⃣ Verificando portas..."
sleep 3

if netstat -tuln | grep -q ":80 "; then
    log_success "Porta 80 está aberta"
    PROCESS_80=$(lsof -ti :80 2>/dev/null | head -1)
    if [ -n "$PROCESS_80" ]; then
        PROCESS_INFO=$(ps -p "$PROCESS_80" -o comm=,args= 2>/dev/null)
        log_info "Processo usando porta 80: $PROCESS_INFO"
    fi
else
    log_warning "Porta 80 não está aberta"
fi

if netstat -tuln | grep -q ":443 "; then
    log_success "✅ Porta 443 está aberta"
    PROCESS_443=$(lsof -ti :443 2>/dev/null | head -1)
    if [ -n "$PROCESS_443" ]; then
        PROCESS_INFO=$(ps -p "$PROCESS_443" -o comm=,args= 2>/dev/null)
        log_info "Processo usando porta 443: $PROCESS_INFO"
    fi
else
    log_error "Porta 443 não está aberta"
    log_info "Verificando configuração novamente..."
    grep "listen 443" "$NGINX_CONFIG" || log_error "listen 443 não encontrado"
    
    log_info "Tentando reiniciar Nginx..."
    if [ "$USE_AAPANEL_NGINX" -eq 1 ]; then
        systemctl restart webserver 2>/dev/null || true
    else
        systemctl restart nginx
    fi
    sleep 5
    
    if netstat -tuln | grep -q ":443 "; then
        log_success "✅ Porta 443 agora está aberta"
    else
        log_error "Porta 443 ainda não está aberta"
        log_info "Verificando logs de erro:"
        tail -20 /var/log/nginx/error.log 2>/dev/null || tail -20 /www/wwwlogs/cf.don.cim.br.error.log
    fi
fi

echo ""

# 7. Testar conectividade
log_info "7️⃣ Testando conectividade..."

# Testar HTTP
log_info "Testando HTTP..."
HTTP_RESPONSE=$(curl -I -s -o /dev/null -w "%{http_code}" --max-time 5 "http://${DOMAIN}" 2>&1)
if [ "$HTTP_RESPONSE" = "301" ] || [ "$HTTP_RESPONSE" = "302" ]; then
    log_success "✅ HTTP redireciona para HTTPS (código: $HTTP_RESPONSE)"
elif [ "$HTTP_RESPONSE" = "200" ]; then
    log_warning "HTTP retorna 200 (deveria redirecionar para HTTPS)"
else
    log_warning "HTTP retornou código: $HTTP_RESPONSE"
fi

# Testar HTTPS
log_info "Testando HTTPS..."
HTTPS_RESPONSE=$(curl -I -s -o /dev/null -w "%{http_code}" --max-time 10 "https://${DOMAIN}" 2>&1)
if [ "$HTTPS_RESPONSE" = "200" ]; then
    log_success "✅ HTTPS está funcionando (código: $HTTPS_RESPONSE)"
elif [ "$HTTPS_RESPONSE" = "000" ]; then
    log_warning "HTTPS retornou código 000 (timeout/conexão recusada)"
    log_info "Verificando se há firewall bloqueando:"
    iptables -L -n | grep -E "443|ACCEPT|REJECT" | head -5
else
    log_warning "HTTPS retornou código: $HTTPS_RESPONSE"
fi

echo ""

# 8. Resumo
echo "=========================================="
if [ "$HTTPS_RESPONSE" = "200" ]; then
    log_success "✅ HTTPS ESTÁ FUNCIONANDO!"
else
    log_warning "⚠️ HTTPS ainda precisa de atenção"
    log_info "Comandos úteis:"
    log_info "  - Ver portas: netstat -tuln | grep -E ':80|:443'"
    log_info "  - Ver processos: ps aux | grep -E 'nginx|webserver' | grep -v grep"
    log_info "  - Ver logs: tail -50 /www/wwwlogs/cf.don.cim.br.error.log"
    log_info "  - Reiniciar: systemctl restart nginx (ou webserver)"
fi
echo "=========================================="
log_info "Teste no navegador: https://${DOMAIN}"
echo ""

