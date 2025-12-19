#!/bin/bash
# ============================================
# Script para Aplicar Configuração Nginx Corrigida
# Domínio: cf.don.cim.br
# ============================================

DOMAIN="cf.don.cim.br"
NGINX_CONFIG="/www/server/panel/vhost/nginx/${DOMAIN}.conf"
CONFIG_SOURCE="nginx-cf.don.cim.br.conf"
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
echo "🔧 APLICANDO CONFIGURAÇÃO NGINX CORRIGIDA"
echo "=========================================="
echo ""

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
    log_error "Este script precisa ser executado como root"
    exit 1
fi

# Verificar se está no diretório correto
if [ ! -f "$CONFIG_SOURCE" ]; then
    log_error "Arquivo de configuração não encontrado: $CONFIG_SOURCE"
    log_info "Certifique-se de estar no diretório do projeto"
    exit 1
fi

# Verificar se certificado existe
if [ ! -f "${AAPANEL_CERT_DIR}/fullchain.pem" ] || [ ! -f "${AAPANEL_CERT_DIR}/privkey.pem" ]; then
    log_warning "Certificados SSL não encontrados em: ${AAPANEL_CERT_DIR}"
    log_info "Tentando encontrar certificado Let's Encrypt..."
    
    CERT_DIR=$(find /etc/letsencrypt/live -maxdepth 1 -type d -name "${DOMAIN}*" | head -1)
    if [ -n "$CERT_DIR" ] && [ -f "${CERT_DIR}/fullchain.pem" ] && [ -f "${CERT_DIR}/privkey.pem" ]; then
        log_info "Certificado encontrado em: $CERT_DIR"
        log_info "Copiando certificado para aapanel..."
        
        mkdir -p "${AAPANEL_CERT_DIR}"
        cp "${CERT_DIR}/fullchain.pem" "${AAPANEL_CERT_DIR}/"
        cp "${CERT_DIR}/privkey.pem" "${AAPANEL_CERT_DIR}/"
        chown -R www:www "${AAPANEL_CERT_DIR}" 2>/dev/null || chown -R www-data:www-data "${AAPANEL_CERT_DIR}" 2>/dev/null
        chmod 644 "${AAPANEL_CERT_DIR}/fullchain.pem"
        chmod 600 "${AAPANEL_CERT_DIR}/privkey.pem"
        
        log_success "Certificado copiado"
    else
        log_error "Certificado SSL não encontrado!"
        log_info "Execute primeiro: bash corrigir-certificado-ssl.sh"
        exit 1
    fi
else
    log_success "Certificados SSL encontrados"
fi

# Fazer backup da configuração atual
if [ -f "$NGINX_CONFIG" ]; then
    BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d-%H%M%S)"
    cp "$NGINX_CONFIG" "$BACKUP_FILE"
    log_success "Backup criado: $BACKUP_FILE"
else
    log_warning "Arquivo de configuração não existe, será criado"
fi

# Copiar nova configuração
log_info "Aplicando nova configuração..."
cp "$CONFIG_SOURCE" "$NGINX_CONFIG"
log_success "Configuração aplicada"

# Verificar se certificado está no lugar correto e ajustar se necessário
if ! grep -q "${AAPANEL_CERT_DIR}" "$NGINX_CONFIG"; then
    log_info "Ajustando caminhos dos certificados..."
    sed -i "s|ssl_certificate.*|ssl_certificate ${AAPANEL_CERT_DIR}/fullchain.pem;|g" "$NGINX_CONFIG"
    sed -i "s|ssl_certificate_key.*|ssl_certificate_key ${AAPANEL_CERT_DIR}/privkey.pem;|g" "$NGINX_CONFIG"
    log_success "Caminhos dos certificados ajustados"
fi

# Testar configuração
log_info "Testando configuração do Nginx..."
if nginx -t 2>&1 | grep -q "successful"; then
    log_success "Configuração válida!"
    
    # Mostrar resumo da configuração
    echo ""
    log_info "Resumo da configuração:"
    echo "  - Porta 80: Redireciona para HTTPS"
    echo "  - Porta 443: SSL habilitado"
    echo "  - Root: /www/wwwroot/cf.don.cim.br/dist"
    echo "  - SPA React: Configurado (try_files)"
    echo "  - SSL: TLSv1.2 e TLSv1.3"
    echo "  - Gzip: Habilitado"
    echo ""
    
    # Recarregar Nginx
    log_info "Recarregando Nginx..."
    if systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null; then
        log_success "Nginx recarregado"
        sleep 2
    else
        log_warning "Não foi possível recarregar, tentando reiniciar..."
        if systemctl restart nginx 2>/dev/null || service nginx restart 2>/dev/null; then
            log_success "Nginx reiniciado"
            sleep 3
        else
            log_error "Não foi possível reiniciar Nginx"
            exit 1
        fi
    fi
    
    # Verificar se está escutando nas portas
    echo ""
    log_info "Verificando portas..."
    if netstat -tuln | grep -q ":80 "; then
        log_success "Porta 80 está aberta"
    else
        log_warning "Porta 80 não está aberta"
    fi
    
    if netstat -tuln | grep -q ":443 "; then
        log_success "Porta 443 está aberta"
    else
        log_error "Porta 443 não está aberta"
    fi
    
    # Testar conectividade
    echo ""
    log_info "Testando conectividade..."
    if curl -I http://${DOMAIN} 2>&1 | grep -q "301\|302"; then
        log_success "HTTP redireciona para HTTPS"
    else
        log_warning "HTTP não está redirecionando corretamente"
    fi
    
    if curl -I https://${DOMAIN} 2>&1 | grep -q "HTTP"; then
        log_success "HTTPS está funcionando"
    else
        log_error "HTTPS não está funcionando"
    fi
    
else
    log_error "Configuração inválida!"
    echo ""
    log_info "Erros encontrados:"
    nginx -t 2>&1 | grep -i error
    echo ""
    log_info "Restaurando backup..."
    if [ -f "$BACKUP_FILE" ]; then
        cp "$BACKUP_FILE" "$NGINX_CONFIG"
        log_success "Backup restaurado"
    fi
    exit 1
fi

echo ""
echo "=========================================="
log_success "✅ CONFIGURAÇÃO APLICADA COM SUCESSO!"
echo "=========================================="
log_info "Teste o site:"
log_info "  HTTP:  curl -I http://${DOMAIN}"
log_info "  HTTPS: curl -I https://${DOMAIN}"
echo ""

