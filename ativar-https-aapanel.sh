#!/bin/bash
# ============================================
# Script para Ativar HTTPS no Aapanel
# Usa apenas o Nginx do Aapanel
# ============================================

DOMAIN="cf.don.cim.br"
NGINX_CONFIG="/www/server/panel/vhost/nginx/${DOMAIN}.conf"
AAPANEL_CERT_DIR="/www/server/panel/vhost/cert/${DOMAIN}"

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
echo "🔧 ATIVAR HTTPS NO AAPANEL"
echo "=========================================="
echo ""

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
    log_error "Este script precisa ser executado como root"
    exit 1
fi

# 1. Parar Nginx do sistema (não o do Aapanel)
log_info "1️⃣ Parando Nginx do sistema..."
systemctl stop nginx 2>/dev/null || true
killall -9 nginx 2>/dev/null || true
# Não matar o webserver do Aapanel
pkill -f "/usr/sbin/nginx" 2>/dev/null || true
sleep 2

log_success "Nginx do sistema parado"

echo ""

# 2. Verificar se configuração está correta
log_info "2️⃣ Verificando configuração..."
if [ ! -f "$NGINX_CONFIG" ]; then
    log_error "Arquivo de configuração não encontrado: $NGINX_CONFIG"
    exit 1
fi

# Verificar se tem listen 443
if ! grep -q "listen 443" "$NGINX_CONFIG"; then
    log_error "listen 443 não encontrado na configuração"
    exit 1
fi

# Verificar certificados
if ! grep -q "ssl_certificate.*fullchain.pem" "$NGINX_CONFIG" || \
   ! grep -q "ssl_certificate_key.*privkey.pem" "$NGINX_CONFIG"; then
    log_error "Certificados SSL não configurados"
    exit 1
fi

log_success "Configuração OK"

echo ""

# 3. Recarregar Nginx do Aapanel
log_info "3️⃣ Recarregando Nginx do Aapanel..."
if systemctl restart webserver 2>/dev/null; then
    log_success "Nginx do Aapanel reiniciado"
elif /www/server/panel/webserver/sbin/webserver -s reload 2>/dev/null; then
    log_success "Nginx do Aapanel recarregado"
else
    log_warning "Não foi possível recarregar via systemctl, tentando reiniciar..."
    systemctl start webserver 2>/dev/null || true
fi

sleep 3

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
    log_warning "Porta 80 não está aberta"
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
    log_info "Verificando se há erros..."
    tail -10 /www/wwwlogs/cf.don.cim.br.error.log 2>/dev/null || echo "Log não encontrado"
    
    log_info "Tentando reiniciar novamente..."
    systemctl restart webserver 2>/dev/null || true
    sleep 5
    
    if netstat -tuln | grep -q ":443 "; then
        log_success "✅ Porta 443 agora está aberta"
    else
        log_error "Porta 443 ainda não está aberta"
        log_info "Verificando configuração do Aapanel..."
        log_info "Execute no painel do Aapanel:"
        log_info "  1. Vá em 'Website' > 'cf.don.cim.br'"
        log_info "  2. Verifique se SSL está ativado"
        log_info "  3. Clique em 'Salvar' e 'Reiniciar'"
    fi
fi

echo ""

# 5. Testar conectividade
log_info "5️⃣ Testando conectividade..."

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
    log_warning "HTTPS retornou código 000"
    log_info "Verificando se porta 443 está realmente aberta:"
    netstat -tuln | grep ":443" || echo "Porta 443 não encontrada"
else
    log_warning "HTTPS retornou código: $HTTPS_RESPONSE"
fi

echo ""

# 6. Resumo
echo "=========================================="
if [ "$HTTPS_RESPONSE" = "200" ]; then
    log_success "✅ HTTPS ESTÁ FUNCIONANDO!"
else
    log_warning "⚠️ HTTPS ainda não está funcionando"
    echo ""
    log_info "📋 PRÓXIMOS PASSOS:"
    echo ""
    log_info "1. Acesse o painel do Aapanel:"
    log_info "   https://seu-ip:7800 (ou porta do Aapanel)"
    echo ""
    log_info "2. Vá em 'Website' > 'cf.don.cim.br'"
    echo ""
    log_info "3. Na aba 'SSL', verifique:"
    log_info "   - Se o certificado está selecionado"
    log_info "   - Se 'Force HTTPS' está ativado"
    echo ""
    log_info "4. Clique em 'Salvar'"
    echo ""
    log_info "5. Clique em 'Reiniciar' no Nginx"
    echo ""
    log_info "OU execute manualmente:"
    log_info "  systemctl restart webserver"
fi
echo "=========================================="
log_info "Teste no navegador: https://${DOMAIN}"
echo ""

