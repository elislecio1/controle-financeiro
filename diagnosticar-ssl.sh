#!/bin/bash
# ============================================
# Script para Diagnosticar Problemas SSL
# Domínio: cf.don.cim.br
# ============================================

DOMAIN="cf.don.cim.br"
AAPANEL_CERT_DIR="/www/server/panel/vhost/cert/${DOMAIN}"
LETSENCRYPT_LIVE_DIR="/etc/letsencrypt/live"
NGINX_CONFIG="/www/server/panel/vhost/nginx/${DOMAIN}.conf"
NGINX_ERROR_LOG="/www/wwwlogs/cf.don.cim.br.error.log"

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
echo "🔍 DIAGNÓSTICO SSL - ${DOMAIN}"
echo "=========================================="
echo ""

# 1. Verificar certificados no Aapanel
echo "1️⃣ Verificando certificados no Aapanel..."
if [ -f "${AAPANEL_CERT_DIR}/fullchain.pem" ] && [ -f "${AAPANEL_CERT_DIR}/privkey.pem" ]; then
    log_success "Certificados encontrados em: ${AAPANEL_CERT_DIR}"
    
    # Verificar validade do certificado
    CERT_EXPIRY=$(openssl x509 -enddate -noout -in "${AAPANEL_CERT_DIR}/fullchain.pem" 2>/dev/null | cut -d= -f2)
    if [ -n "$CERT_EXPIRY" ]; then
        log_info "Certificado expira em: $CERT_EXPIRY"
        
        # Verificar se está expirado
        EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s 2>/dev/null || echo "0")
        NOW_EPOCH=$(date +%s)
        if [ "$EXPIRY_EPOCH" -lt "$NOW_EPOCH" ]; then
            log_error "Certificado EXPIRADO!"
        else
            DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))
            if [ "$DAYS_LEFT" -lt 30 ]; then
                log_warning "Certificado expira em $DAYS_LEFT dias"
            else
                log_success "Certificado válido por mais $DAYS_LEFT dias"
            fi
        fi
    fi
    
    # Verificar permissões
    if [ -r "${AAPANEL_CERT_DIR}/fullchain.pem" ] && [ -r "${AAPANEL_CERT_DIR}/privkey.pem" ]; then
        log_success "Permissões de leitura OK"
    else
        log_error "Problema com permissões dos certificados"
        ls -la "${AAPANEL_CERT_DIR}/"
    fi
else
    log_error "Certificados NÃO encontrados em: ${AAPANEL_CERT_DIR}"
fi

echo ""

# 2. Verificar certificados Let's Encrypt
echo "2️⃣ Verificando certificados Let's Encrypt..."
CERT_DIR=$(find "${LETSENCRYPT_LIVE_DIR}" -maxdepth 1 -type d -name "${DOMAIN}*" | head -1)
if [ -n "$CERT_DIR" ] && [ -f "${CERT_DIR}/fullchain.pem" ]; then
    log_success "Certificado Let's Encrypt encontrado em: $CERT_DIR"
    
    # Verificar validade
    CERT_EXPIRY=$(openssl x509 -enddate -noout -in "${CERT_DIR}/fullchain.pem" 2>/dev/null | cut -d= -f2)
    if [ -n "$CERT_EXPIRY" ]; then
        log_info "Certificado Let's Encrypt expira em: $CERT_EXPIRY"
    fi
else
    log_warning "Certificado Let's Encrypt não encontrado"
fi

echo ""

# 3. Verificar configuração do Nginx
echo "3️⃣ Verificando configuração do Nginx..."
if [ -f "$NGINX_CONFIG" ]; then
    log_success "Arquivo de configuração encontrado"
    
    # Verificar listen 443
    if grep -q "listen 443" "$NGINX_CONFIG"; then
        log_success "Porta 443 configurada"
    else
        log_error "Porta 443 NÃO configurada"
    fi
    
    # Verificar certificados na configuração
    if grep -q "ssl_certificate.*${DOMAIN}" "$NGINX_CONFIG"; then
        log_success "Certificados SSL configurados"
        grep "ssl_certificate" "$NGINX_CONFIG" | head -2
    else
        log_error "Certificados SSL NÃO configurados no Nginx"
    fi
    
    # Verificar se há erros de sintaxe
    if nginx -t 2>&1 | grep -q "successful"; then
        log_success "Configuração do Nginx válida"
    else
        log_error "Configuração do Nginx tem erros:"
        nginx -t 2>&1 | grep -i error
    fi
else
    log_error "Arquivo de configuração não encontrado: $NGINX_CONFIG"
fi

echo ""

# 4. Verificar status do Nginx
echo "4️⃣ Verificando status do Nginx..."
if systemctl is-active --quiet nginx; then
    log_success "Nginx está rodando"
else
    log_error "Nginx NÃO está rodando"
    log_info "Status: $(systemctl status nginx --no-pager -l | head -3)"
fi

# Verificar portas
if netstat -tuln | grep -q ":80 "; then
    log_success "Porta 80 está aberta"
else
    log_warning "Porta 80 não está aberta"
fi

if netstat -tuln | grep -q ":443 "; then
    log_success "Porta 443 está aberta"
else
    log_error "Porta 443 NÃO está aberta"
fi

echo ""

# 5. Verificar logs do Nginx
echo "5️⃣ Verificando logs do Nginx..."
if [ -f "$NGINX_ERROR_LOG" ]; then
    log_info "Últimos erros do Nginx:"
    tail -20 "$NGINX_ERROR_LOG" | grep -i "ssl\|certificate\|error" | tail -10
    if [ $? -ne 0 ]; then
        log_info "Nenhum erro SSL encontrado nos logs recentes"
    fi
else
    log_warning "Arquivo de log não encontrado: $NGINX_ERROR_LOG"
fi

echo ""

# 6. Testar conectividade
echo "6️⃣ Testando conectividade..."
log_info "Testando HTTP..."
HTTP_RESPONSE=$(curl -I -s -o /dev/null -w "%{http_code}" "http://${DOMAIN}" 2>&1)
if [ "$HTTP_RESPONSE" = "301" ] || [ "$HTTP_RESPONSE" = "302" ]; then
    log_success "HTTP redireciona corretamente (código: $HTTP_RESPONSE)"
elif [ "$HTTP_RESPONSE" = "200" ]; then
    log_warning "HTTP retorna 200 (deveria redirecionar para HTTPS)"
else
    log_error "HTTP retorna código: $HTTP_RESPONSE"
fi

log_info "Testando HTTPS..."
HTTPS_RESPONSE=$(curl -I -s -o /dev/null -w "%{http_code}" --max-time 10 "https://${DOMAIN}" 2>&1)
if [ "$HTTPS_RESPONSE" = "200" ]; then
    log_success "HTTPS está funcionando (código: $HTTPS_RESPONSE)"
elif [ "$HTTPS_RESPONSE" = "000" ]; then
    log_error "HTTPS não está respondendo (timeout ou conexão recusada)"
else
    log_warning "HTTPS retorna código: $HTTPS_RESPONSE"
fi

# Testar certificado SSL diretamente
log_info "Testando certificado SSL..."
SSL_TEST=$(echo | timeout 5 openssl s_client -connect "${DOMAIN}:443" -servername "${DOMAIN}" 2>&1)
if echo "$SSL_TEST" | grep -q "Verify return code: 0"; then
    log_success "Certificado SSL válido"
elif echo "$SSL_TEST" | grep -q "Connection refused"; then
    log_error "Conexão recusada na porta 443"
elif echo "$SSL_TEST" | grep -q "certificate has expired"; then
    log_error "Certificado EXPIRADO"
elif echo "$SSL_TEST" | grep -q "self signed certificate"; then
    log_error "Certificado auto-assinado (não é do Let's Encrypt)"
else
    log_warning "Problema com certificado SSL:"
    echo "$SSL_TEST" | grep -i "verify\|error" | head -3
fi

echo ""

# 7. Resumo e recomendações
echo "=========================================="
echo "📋 RESUMO E RECOMENDAÇÕES"
echo "=========================================="

# Verificar se precisa gerar novo certificado
NEEDS_NEW_CERT=false

if [ ! -f "${AAPANEL_CERT_DIR}/fullchain.pem" ]; then
    log_error "❌ Certificado não encontrado no Aapanel"
    NEEDS_NEW_CERT=true
elif [ -z "$CERT_DIR" ] || [ ! -f "${CERT_DIR}/fullchain.pem" ]; then
    log_warning "⚠️ Certificado Let's Encrypt não encontrado"
    NEEDS_NEW_CERT=true
fi

if [ "$NEEDS_NEW_CERT" = true ]; then
    echo ""
    log_info "🔧 AÇÃO NECESSÁRIA:"
    log_info "Execute: bash gerar-novo-certificado-ssl.sh"
else
    echo ""
    log_info "✅ Certificados encontrados. Se ainda há problemas, verifique:"
    log_info "  1. Logs do Nginx: tail -50 ${NGINX_ERROR_LOG}"
    log_info "  2. Status do Nginx: systemctl status nginx"
    log_info "  3. Configuração: cat ${NGINX_CONFIG}"
fi

echo ""

