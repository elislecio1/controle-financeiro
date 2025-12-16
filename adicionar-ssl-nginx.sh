#!/bin/bash
# ============================================
# Script para Adicionar Configuração SSL ao Nginx
# Domínio: cf.don.cim.br
# ============================================

DOMAIN="cf.don.cim.br"
NGINX_CONFIG="/www/server/panel/vhost/nginx/${DOMAIN}.conf"
AAPANEL_CERT_DIR="/www/server/panel/vhost/cert/${DOMAIN}"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
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

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
    log_error "Este script precisa ser executado como root"
    exit 1
fi

# Verificar se arquivo existe
if [ ! -f "$NGINX_CONFIG" ]; then
    log_error "Arquivo de configuração não encontrado: $NGINX_CONFIG"
    exit 1
fi

# Backup
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d-%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
log_info "Backup criado: $BACKUP_FILE"

# Verificar se já tem listen 443
if grep -q "listen 443" "$NGINX_CONFIG"; then
    log_info "Configuração SSL já existe. Atualizando caminhos dos certificados..."
    
    # Atualizar caminhos dos certificados
    sed -i "s|ssl_certificate.*|ssl_certificate ${AAPANEL_CERT_DIR}/fullchain.pem;|g" "$NGINX_CONFIG"
    sed -i "s|ssl_certificate_key.*|ssl_certificate_key ${AAPANEL_CERT_DIR}/privkey.pem;|g" "$NGINX_CONFIG"
    
    log_success "Caminhos dos certificados atualizados"
else
    log_info "Adicionando configuração SSL ao bloco HTTPS..."
    
    # Criar arquivo temporário com a configuração SSL completa
    TEMP_FILE=$(mktemp)
    
    # Ler o arquivo e adicionar SSL ao bloco HTTPS
    awk -v cert_dir="$AAPANEL_CERT_DIR" '
    /^server \{/ {
        in_server = 1
        server_count++
        print
        next
    }
    in_server && /server_name.*cf\.don\.cim\.br/ {
        # Este é o bloco HTTPS (não o de redirecionamento)
        if (server_count == 2) {
            print "    listen 443 ssl http2;"
            print "    listen [::]:443 ssl http2;"
            print ""
            print "    # Certificados SSL"
            print "    ssl_certificate " cert_dir "/fullchain.pem;"
            print "    ssl_certificate_key " cert_dir "/privkey.pem;"
            print ""
            print "    # Configurações SSL"
            print "    ssl_protocols TLSv1.2 TLSv1.3;"
            print "    ssl_ciphers HIGH:!aNULL:!MD5;"
            print "    ssl_prefer_server_ciphers on;"
            print "    ssl_session_cache shared:SSL:10m;"
            print "    ssl_session_timeout 10m;"
            print ""
        }
        print
        next
    }
    {
        print
    }
    ' "$NGINX_CONFIG" > "$TEMP_FILE"
    
    # Substituir arquivo original
    mv "$TEMP_FILE" "$NGINX_CONFIG"
    
    log_success "Configuração SSL adicionada"
fi

# Testar configuração
log_info "Testando configuração do Nginx..."
if nginx -t; then
    log_success "Configuração válida!"
    
    # Recarregar Nginx
    log_info "Recarregando Nginx..."
    if systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null; then
        log_success "Nginx recarregado"
    else
        log_error "Não foi possível recarregar Nginx. Tente manualmente: systemctl reload nginx"
    fi
else
    log_error "Configuração inválida! Restaurando backup..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    exit 1
fi

# Verificar se está escutando na porta 443
sleep 2
if netstat -tuln | grep -q ":443 "; then
    log_success "Nginx está escutando na porta 443!"
else
    log_error "Nginx não está escutando na porta 443"
    log_info "Verifique os logs: tail -50 /var/log/nginx/error.log"
fi

echo ""
log_success "✅ Configuração SSL concluída!"
log_info "Teste: curl -I https://${DOMAIN}"

