#!/bin/bash
# ============================================
# Script Simples para Corrigir Configuração SSL do Nginx
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
echo "🔧 CORRIGIR CONFIGURAÇÃO SSL DO NGINX"
echo "=========================================="
echo ""

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

# Verificar se certificados existem
if [ ! -f "${AAPANEL_CERT_DIR}/fullchain.pem" ] || [ ! -f "${AAPANEL_CERT_DIR}/privkey.pem" ]; then
    log_error "Certificados não encontrados em: ${AAPANEL_CERT_DIR}"
    exit 1
fi

log_success "Certificados encontrados"

# Fazer backup
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d-%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
log_info "Backup criado: $BACKUP_FILE"

echo ""

# Verificar se já tem ssl_certificate_key
log_info "Verificando configuração atual..."
if grep -q "ssl_certificate_key.*privkey.pem" "$NGINX_CONFIG"; then
    log_info "ssl_certificate_key já existe. Atualizando caminhos..."
    
    # Atualizar caminhos dos certificados
    sed -i "s|ssl_certificate.*fullchain.pem.*|ssl_certificate ${AAPANEL_CERT_DIR}/fullchain.pem;|g" "$NGINX_CONFIG"
    sed -i "s|ssl_certificate_key.*privkey.pem.*|ssl_certificate_key ${AAPANEL_CERT_DIR}/privkey.pem;|g" "$NGINX_CONFIG"
    
    log_success "Caminhos atualizados"
else
    log_warning "ssl_certificate_key não encontrado. Adicionando..."
    
    # Verificar se tem ssl_certificate
    if grep -q "ssl_certificate.*fullchain.pem" "$NGINX_CONFIG"; then
        # Adicionar ssl_certificate_key logo após ssl_certificate
        sed -i "/ssl_certificate.*fullchain.pem/a\    ssl_certificate_key ${AAPANEL_CERT_DIR}/privkey.pem;" "$NGINX_CONFIG"
        log_success "ssl_certificate_key adicionado"
    else
        # Não tem nenhum, adicionar ambos
        log_info "Adicionando configuração SSL completa..."
        
        # Encontrar linha com server_name no bloco HTTPS e adicionar depois
        TEMP_FILE=$(mktemp)
        IN_HTTPS=0
        SSL_ADDED=0
        
        while IFS= read -r line || [ -n "$line" ]; do
            # Detectar bloco HTTPS
            if echo "$line" | grep -q "listen 443"; then
                IN_HTTPS=1
                echo "$line" >> "$TEMP_FILE"
                continue
            fi
            
            # Se estiver no bloco HTTPS e encontrar server_name, adicionar SSL
            if [ "$IN_HTTPS" -eq 1 ] && [ "$SSL_ADDED" -eq 0 ] && echo "$line" | grep -q "server_name"; then
                echo "$line" >> "$TEMP_FILE"
                echo "" >> "$TEMP_FILE"
                echo "    # Certificados SSL" >> "$TEMP_FILE"
                echo "    ssl_certificate ${AAPANEL_CERT_DIR}/fullchain.pem;" >> "$TEMP_FILE"
                echo "    ssl_certificate_key ${AAPANEL_CERT_DIR}/privkey.pem;" >> "$TEMP_FILE"
                echo "" >> "$TEMP_FILE"
                echo "    # Configurações SSL" >> "$TEMP_FILE"
                echo "    ssl_protocols TLSv1.2 TLSv1.3;" >> "$TEMP_FILE"
                echo "    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;" >> "$TEMP_FILE"
                echo "    ssl_prefer_server_ciphers on;" >> "$TEMP_FILE"
                echo "    ssl_session_cache shared:SSL:10m;" >> "$TEMP_FILE"
                echo "    ssl_session_timeout 10m;" >> "$TEMP_FILE"
                SSL_ADDED=1
                continue
            fi
            
            # Fim do bloco server
            if [ "$IN_HTTPS" -eq 1 ] && echo "$line" | grep -q "^}"; then
                IN_HTTPS=0
            fi
            
            echo "$line" >> "$TEMP_FILE"
        done < "$NGINX_CONFIG"
        
        mv "$TEMP_FILE" "$NGINX_CONFIG"
        log_success "Configuração SSL adicionada"
    fi
fi

echo ""

# Verificar se ambos estão presentes
log_info "Verificando configuração final..."
if grep -q "ssl_certificate.*fullchain.pem" "$NGINX_CONFIG" && \
   grep -q "ssl_certificate_key.*privkey.pem" "$NGINX_CONFIG"; then
    log_success "✅ Configuração SSL completa encontrada"
    log_info "Linhas SSL encontradas:"
    grep "ssl_certificate" "$NGINX_CONFIG" | head -2
else
    log_error "❌ Configuração SSL incompleta!"
    log_info "Linhas encontradas:"
    grep "ssl_certificate" "$NGINX_CONFIG" || echo "Nenhuma linha encontrada"
    exit 1
fi

echo ""

# Testar configuração
log_info "Testando configuração do Nginx..."
NGINX_TEST_OUTPUT=$(nginx -t 2>&1)
NGINX_EXIT=$?

if [ $NGINX_EXIT -eq 0 ]; then
    log_success "✅ Configuração válida!"
    
    # Recarregar Nginx
    log_info "Recarregando Nginx..."
    if systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null; then
        log_success "Nginx recarregado"
    else
        log_warning "Não foi possível recarregar, tentando reiniciar..."
        if systemctl restart nginx 2>/dev/null || service nginx restart 2>/dev/null; then
            log_success "Nginx reiniciado"
        else
            log_error "Não foi possível reiniciar Nginx"
            exit 1
        fi
    fi
    
    sleep 2
    
    # Verificar porta 443
    if netstat -tuln | grep -q ":443 "; then
        log_success "✅ Porta 443 está aberta"
    else
        log_warning "Porta 443 não está aberta (pode levar alguns segundos)"
    fi
    
    # Testar HTTPS
    log_info "Testando HTTPS..."
    HTTPS_RESPONSE=$(curl -I -s -o /dev/null -w "%{http_code}" --max-time 10 "https://${DOMAIN}" 2>&1)
    if [ "$HTTPS_RESPONSE" = "200" ]; then
        log_success "✅ HTTPS está funcionando (código: $HTTPS_RESPONSE)"
    else
        log_warning "HTTPS retornou código: $HTTPS_RESPONSE"
    fi
else
    log_error "❌ Configuração inválida!"
    log_info "Erros encontrados:"
    echo "$NGINX_TEST_OUTPUT" | grep -i error || echo "$NGINX_TEST_OUTPUT"
    echo ""
    log_info "Mostrando configuração SSL:"
    grep -A 2 -B 2 "ssl_certificate" "$NGINX_CONFIG" || echo "Nenhuma configuração SSL encontrada"
    echo ""
    log_warning "Backup disponível em: $BACKUP_FILE"
    log_info "Para restaurar: cp $BACKUP_FILE $NGINX_CONFIG"
    exit 1
fi

echo ""
echo "=========================================="
log_success "✅ CONFIGURAÇÃO CORRIGIDA COM SUCESSO!"
echo "=========================================="
log_info "Teste o site: https://${DOMAIN}"
echo ""

