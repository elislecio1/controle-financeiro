#!/bin/bash
# ============================================
# Script Completo para Diagnosticar e Corrigir Tudo
# ============================================

DOMAIN="cf.don.cim.br"
PROJECT_DIR="/www/wwwroot/${DOMAIN}"
DIST_DIR="${PROJECT_DIR}/dist"
NGINX_CONFIG="/www/server/panel/vhost/nginx/${DOMAIN}.conf"

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
echo "🔍 DIAGNÓSTICO COMPLETO"
echo "=========================================="
echo ""

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
    log_error "Este script precisa ser executado como root"
    exit 1
fi

# 1. Verificar status do Aapanel
log_info "1️⃣ Verificando status do Aapanel..."
if systemctl is-active --quiet bt; then
    log_success "Serviço bt (Aapanel) está rodando"
else
    log_warning "Serviço bt não está rodando"
    log_info "Tentando iniciar..."
    systemctl start bt 2>/dev/null || /etc/init.d/bt start 2>/dev/null || true
    sleep 2
fi

# Verificar porta do Aapanel (geralmente 7800)
AAPANEL_PORT=$(netstat -tuln | grep -E ":7800|:8888" | head -1)
if [ -n "$AAPANEL_PORT" ]; then
    log_success "Aapanel está escutando em uma porta"
    log_info "Porta: $AAPANEL_PORT"
else
    log_warning "Aapanel não está escutando nas portas padrão (7800 ou 8888)"
    log_info "Verificando processo do Aapanel..."
    ps aux | grep -E "panel|aapanel" | grep -v grep | head -3
fi

echo ""

# 2. Verificar e iniciar webserver do Aapanel
log_info "2️⃣ Verificando webserver do Aapanel..."
if systemctl is-active --quiet webserver; then
    log_success "Webserver está rodando"
else
    log_warning "Webserver não está rodando"
    log_info "Tentando iniciar..."
    
    # Tentar iniciar via systemctl
    if systemctl start webserver 2>/dev/null; then
        log_success "Webserver iniciado via systemctl"
    elif /www/server/panel/webserver/sbin/webserver -c /www/server/panel/webserver/conf/webserver.conf 2>/dev/null; then
        log_success "Webserver iniciado diretamente"
    else
        log_error "Não foi possível iniciar webserver"
        log_info "Verificando erros..."
        /www/server/panel/webserver/sbin/webserver -t 2>&1 | head -10
    fi
    sleep 3
fi

# Verificar processos do webserver
WEBSERVER_PROCESSES=$(ps aux | grep webserver | grep -v grep | wc -l)
if [ "$WEBSERVER_PROCESSES" -gt 0 ]; then
    log_success "Processos do webserver encontrados: $WEBSERVER_PROCESSES"
else
    log_error "Nenhum processo do webserver encontrado"
fi

echo ""

# 3. Verificar build do projeto
log_info "3️⃣ Verificando build do projeto..."
if [ ! -d "$DIST_DIR" ] || [ -z "$(ls -A $DIST_DIR 2>/dev/null)" ]; then
    log_warning "Build não encontrado ou vazio"
    log_info "Fazendo build..."
    
    cd "$PROJECT_DIR" || exit 1
    
    if [ ! -d "node_modules" ]; then
        log_info "Instalando dependências..."
        npm install
    fi
    
    log_info "Executando build..."
    npm run build
    
    if [ $? -eq 0 ] && [ -d "$DIST_DIR" ] && [ -n "$(ls -A $DIST_DIR 2>/dev/null)" ]; then
        log_success "Build concluído"
        chown -R www:www "$DIST_DIR" 2>/dev/null || chown -R www-data:www-data "$DIST_DIR" 2>/dev/null
    else
        log_error "Erro ao fazer build"
    fi
else
    log_success "Build encontrado"
fi

echo ""

# 4. Verificar portas
log_info "4️⃣ Verificando portas..."
sleep 2

if netstat -tuln | grep -q ":80 "; then
    log_success "Porta 80 está aberta"
    PROCESS_80=$(lsof -ti :80 2>/dev/null | head -1)
    if [ -n "$PROCESS_80" ]; then
        PROCESS_INFO=$(ps -p "$PROCESS_80" -o comm=,args= 2>/dev/null | head -1)
        log_info "Processo na porta 80: $PROCESS_INFO"
    fi
else
    log_error "Porta 80 não está aberta"
    log_info "Tentando reiniciar webserver..."
    systemctl restart webserver 2>/dev/null || true
    sleep 3
fi

if netstat -tuln | grep -q ":443 "; then
    log_success "✅ Porta 443 está aberta"
    PROCESS_443=$(lsof -ti :443 2>/dev/null | head -1)
    if [ -n "$PROCESS_443" ]; then
        PROCESS_INFO=$(ps -p "$PROCESS_443" -o comm=,args= 2>/dev/null | head -1)
        log_info "Processo na porta 443: $PROCESS_INFO"
    fi
else
    log_error "Porta 443 não está aberta"
    log_info "Verificando configuração SSL..."
    if grep -q "listen 443" "$NGINX_CONFIG"; then
        log_info "listen 443 está configurado"
    else
        log_error "listen 443 não está configurado"
    fi
fi

echo ""

# 5. Verificar configuração do Nginx
log_info "5️⃣ Verificando configuração do Nginx..."
if [ -f "$NGINX_CONFIG" ]; then
    if /www/server/panel/webserver/sbin/webserver -t 2>&1 | grep -q "successful"; then
        log_success "Configuração válida"
    else
        log_error "Configuração inválida:"
        /www/server/panel/webserver/sbin/webserver -t 2>&1 | grep -i error | head -5
    fi
else
    log_error "Arquivo de configuração não encontrado: $NGINX_CONFIG"
fi

echo ""

# 6. Tentar reiniciar webserver completamente
log_info "6️⃣ Reiniciando webserver completamente..."
systemctl stop webserver 2>/dev/null || true
pkill -f webserver 2>/dev/null || true
sleep 2

systemctl start webserver 2>/dev/null || \
/www/server/panel/webserver/sbin/webserver -c /www/server/panel/webserver/conf/webserver.conf

sleep 5

# Verificar novamente
if systemctl is-active --quiet webserver || ps aux | grep -q "[w]ebserver"; then
    log_success "Webserver reiniciado"
else
    log_error "Webserver não iniciou"
fi

echo ""

# 7. Verificar portas novamente
log_info "7️⃣ Verificando portas após reiniciar..."
sleep 3

if netstat -tuln | grep -q ":80 "; then
    log_success "✅ Porta 80 está aberta"
else
    log_error "Porta 80 ainda não está aberta"
fi

if netstat -tuln | grep -q ":443 "; then
    log_success "✅ Porta 443 está aberta"
else
    log_error "Porta 443 ainda não está aberta"
fi

echo ""

# 8. Resumo e recomendações
echo "=========================================="
echo "📋 RESUMO E RECOMENDAÇÕES"
echo "=========================================="
echo ""

# Verificar Aapanel
AAPANEL_ACCESSIBLE=$(curl -I -s -o /dev/null -w "%{http_code}" --max-time 3 "http://localhost:7800" 2>&1)
if [ "$AAPANEL_ACCESSIBLE" = "200" ] || [ "$AAPANEL_ACCESSIBLE" = "301" ] || [ "$AAPANEL_ACCESSIBLE" = "302" ]; then
    log_success "Aapanel está acessível localmente"
    log_info "Acesse: http://$(hostname -I | awk '{print $1}'):7800"
else
    log_warning "Aapanel não está acessível localmente"
    log_info "Verifique:"
    log_info "  - Porta do Aapanel: netstat -tuln | grep -E '7800|8888'"
    log_info "  - Status: systemctl status bt"
    log_info "  - Reiniciar: systemctl restart bt"
fi

echo ""

# Verificar site
if netstat -tuln | grep -q ":443 "; then
    log_info "Testando HTTPS do site..."
    HTTPS_RESPONSE=$(curl -I -s -o /dev/null -w "%{http_code}" --max-time 10 "https://${DOMAIN}" 2>&1)
    if [ "$HTTPS_RESPONSE" = "200" ]; then
        log_success "✅ Site HTTPS está funcionando"
    else
        log_warning "Site HTTPS retornou código: $HTTPS_RESPONSE"
    fi
else
    log_error "Porta 443 não está aberta - site não pode funcionar"
fi

echo ""
log_info "📝 COMANDOS ÚTEIS:"
log_info "  - Status webserver: systemctl status webserver"
log_info "  - Reiniciar webserver: systemctl restart webserver"
log_info "  - Ver portas: netstat -tuln | grep -E ':80|:443'"
log_info "  - Ver logs: tail -50 /www/wwwlogs/cf.don.cim.br.error.log"
log_info "  - Status Aapanel: systemctl status bt"
log_info "  - Reiniciar Aapanel: systemctl restart bt"
echo ""

