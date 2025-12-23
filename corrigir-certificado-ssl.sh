#!/bin/bash
# ============================================
# Script para Corrigir Certificado SSL
# Domínio: cf.don.cim.br
# ============================================

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==================== CONFIGURAÇÕES ====================
DOMAIN="cf.don.cim.br"
LETSENCRYPT_LIVE_DIR="/etc/letsencrypt/live"
AAPANEL_CERT_DIR="/www/server/panel/vhost/cert/${DOMAIN}"
NGINX_CONFIG="/www/server/panel/vhost/nginx/${DOMAIN}.conf"

# ==================== FUNÇÕES ====================

log_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
}

# Verificar se é root
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        log_error "Este script precisa ser executado como root"
        log_info "Execute: sudo bash corrigir-certificado-ssl.sh"
        exit 1
    fi
}

# Verificar se o domínio está acessível
check_domain() {
    log_info "Verificando se o domínio está acessível..."
    if curl -I "http://${DOMAIN}" > /dev/null 2>&1; then
        log_success "Domínio acessível via HTTP"
        return 0
    else
        log_warning "Domínio não está acessível via HTTP"
        return 1
    fi
}

# Parar Nginx temporariamente
stop_nginx() {
    log_info "Parando Nginx para liberar porta 80..."
    if systemctl stop nginx 2>/dev/null; then
        log_success "Nginx parado"
    elif service nginx stop 2>/dev/null; then
        log_success "Nginx parado (via service)"
    else
        log_warning "Não foi possível parar Nginx automaticamente"
        log_info "Tente manualmente: systemctl stop nginx"
        return 1
    fi
}

# Verificar se porta 80 está livre
check_port_80() {
    log_info "Verificando se porta 80 está livre..."
    if lsof -i :80 > /dev/null 2>&1; then
        log_warning "Porta 80 ainda está em uso"
        log_info "Processos usando porta 80:"
        lsof -i :80
        return 1
    else
        log_success "Porta 80 está livre"
        return 0
    fi
}

# Encontrar diretório do certificado (pode ter sufixo -0001, -0002, etc)
find_cert_dir() {
    # Procurar diretório que começa com o domínio
    CERT_DIR=$(find "${LETSENCRYPT_LIVE_DIR}" -maxdepth 1 -type d -name "${DOMAIN}*" | head -1)
    
    if [ -z "$CERT_DIR" ]; then
        # Tentar sem sufixo
        CERT_DIR="${LETSENCRYPT_LIVE_DIR}/${DOMAIN}"
    fi
    
    if [ -d "$CERT_DIR" ] && [ -f "${CERT_DIR}/fullchain.pem" ]; then
        log_info "Certificado encontrado em: $CERT_DIR"
        echo "$CERT_DIR"
        return 0
    else
        log_warning "Certificado não encontrado em: $CERT_DIR"
        return 1
    fi
}

# Instalar certificado Let's Encrypt
install_certificate() {
    log_info "Instalando/renovando certificado Let's Encrypt..."
    
    # Verificar se certbot está instalado
    if ! command -v certbot &> /dev/null; then
        log_warning "Certbot não encontrado. Instalando..."
        if command -v apt-get &> /dev/null; then
            apt-get update && apt-get install -y certbot
        elif command -v yum &> /dev/null; then
            yum install -y certbot
        else
            log_error "Não foi possível instalar certbot automaticamente"
            return 1
        fi
    fi
    
    # Tentar renovar primeiro (se já existe)
    FOUND_CERT_DIR=$(find_cert_dir)
    if [ -n "$FOUND_CERT_DIR" ]; then
        log_info "Certificado existente encontrado. Tentando renovar..."
        certbot renew --cert-name "${DOMAIN}" --quiet 2>/dev/null || true
    fi
    
    # Verificar se precisa criar novo
    FOUND_CERT_DIR=$(find_cert_dir)
    if [ -z "$FOUND_CERT_DIR" ]; then
        # Se não existe, criar novo
        log_info "Criando novo certificado..."
        certbot certonly --standalone -d "${DOMAIN}" --non-interactive --agree-tos --email elislecio@gmail.com
        
        if [ $? -eq 0 ]; then
            log_success "Certificado criado com sucesso"
            # Encontrar o diretório criado
            FOUND_CERT_DIR=$(find_cert_dir)
        else
            log_error "Erro ao criar certificado"
            return 1
        fi
    fi
    
    if [ -n "$FOUND_CERT_DIR" ]; then
        CERT_DIR="$FOUND_CERT_DIR"
        return 0
    else
        log_error "Não foi possível localizar o certificado"
        return 1
    fi
}

# Copiar certificado para aapanel
copy_certificate_to_aapanel() {
    log_info "Copiando certificado para diretório do aapanel..."
    
    # Encontrar diretório do certificado
    FOUND_CERT_DIR=$(find_cert_dir)
    if [ -z "$FOUND_CERT_DIR" ]; then
        log_error "Não foi possível encontrar o diretório do certificado"
        return 1
    fi
    
    CERT_DIR="$FOUND_CERT_DIR"
    log_info "Usando certificado de: $CERT_DIR"
    
    # Criar diretório se não existir
    mkdir -p "${AAPANEL_CERT_DIR}"
    
    # Copiar certificados
    if [ -f "${CERT_DIR}/fullchain.pem" ]; then
        cp "${CERT_DIR}/fullchain.pem" "${AAPANEL_CERT_DIR}/"
        log_success "fullchain.pem copiado"
    else
        log_error "Arquivo fullchain.pem não encontrado em: ${CERT_DIR}"
        return 1
    fi
    
    if [ -f "${CERT_DIR}/privkey.pem" ]; then
        cp "${CERT_DIR}/privkey.pem" "${AAPANEL_CERT_DIR}/"
        log_success "privkey.pem copiado"
    else
        log_error "Arquivo privkey.pem não encontrado em: ${CERT_DIR}"
        return 1
    fi
    
    # Ajustar permissões
    chown -R www:www "${AAPANEL_CERT_DIR}"
    chmod 644 "${AAPANEL_CERT_DIR}/fullchain.pem"
    chmod 600 "${AAPANEL_CERT_DIR}/privkey.pem"
    
    log_success "Certificados copiados e permissões ajustadas"
}

# Verificar configuração do Nginx
check_nginx_config() {
    log_info "Verificando configuração do Nginx..."
    
    if [ ! -f "$NGINX_CONFIG" ]; then
        log_warning "Arquivo de configuração do Nginx não encontrado: $NGINX_CONFIG"
        return 1
    fi
    
    # Verificar se certificados estão configurados
    if grep -q "ssl_certificate.*${DOMAIN}" "$NGINX_CONFIG"; then
        log_success "Certificados SSL configurados no Nginx"
        return 0
    else
        log_warning "Certificados SSL não encontrados na configuração do Nginx"
        return 1
    fi
}

# Atualizar configuração do Nginx
update_nginx_config() {
    log_info "Atualizando configuração do Nginx..."
    
    if [ ! -f "$NGINX_CONFIG" ]; then
        log_error "Arquivo de configuração não encontrado: $NGINX_CONFIG"
        return 1
    fi
    
    # Backup da configuração
    cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup.$(date +%Y%m%d-%H%M%S)"
    log_info "Backup criado: ${NGINX_CONFIG}.backup.$(date +%Y%m%d-%H%M%S)"
    
    # Verificar se já tem listen 443
    if grep -q "listen 443" "$NGINX_CONFIG"; then
        log_info "Configuração SSL já existe. Atualizando caminhos dos certificados..."
        
        # Atualizar caminhos dos certificados
        sed -i "s|ssl_certificate.*|ssl_certificate ${AAPANEL_CERT_DIR}/fullchain.pem;|g" "$NGINX_CONFIG"
        sed -i "s|ssl_certificate_key.*|ssl_certificate_key ${AAPANEL_CERT_DIR}/privkey.pem;|g" "$NGINX_CONFIG"
        
        log_success "Caminhos dos certificados atualizados"
    else
        log_info "Adicionando configuração SSL ao bloco HTTPS..."
        
        # Criar arquivo temporário
        TEMP_FILE=$(mktemp)
        SERVER_COUNT=0
        IN_HTTPS_SERVER=0
        
        while IFS= read -r line; do
            # Detectar início de bloco server
            if echo "$line" | grep -q "^server {"; then
                SERVER_COUNT=$((SERVER_COUNT + 1))
                echo "$line" >> "$TEMP_FILE"
                
                # Se for o segundo bloco server (HTTPS), adicionar SSL
                if [ "$SERVER_COUNT" -eq 2 ]; then
                    IN_HTTPS_SERVER=1
                else
                    IN_HTTPS_SERVER=0
                fi
                continue
            fi
            
            # Se estiver no bloco HTTPS e encontrar server_name, adicionar SSL antes
            if [ "$IN_HTTPS_SERVER" -eq 1 ] && echo "$line" | grep -q "server_name.*${DOMAIN}"; then
                echo "    listen 443 ssl http2;" >> "$TEMP_FILE"
                echo "    listen [::]:443 ssl http2;" >> "$TEMP_FILE"
                echo "" >> "$TEMP_FILE"
                echo "    # Certificados SSL" >> "$TEMP_FILE"
                echo "    ssl_certificate ${AAPANEL_CERT_DIR}/fullchain.pem;" >> "$TEMP_FILE"
                echo "    ssl_certificate_key ${AAPANEL_CERT_DIR}/privkey.pem;" >> "$TEMP_FILE"
                echo "" >> "$TEMP_FILE"
                echo "    # Configurações SSL" >> "$TEMP_FILE"
                echo "    ssl_protocols TLSv1.2 TLSv1.3;" >> "$TEMP_FILE"
                echo "    ssl_ciphers HIGH:!aNULL:!MD5;" >> "$TEMP_FILE"
                echo "    ssl_prefer_server_ciphers on;" >> "$TEMP_FILE"
                echo "    ssl_session_cache shared:SSL:10m;" >> "$TEMP_FILE"
                echo "    ssl_session_timeout 10m;" >> "$TEMP_FILE"
                echo "" >> "$TEMP_FILE"
                IN_HTTPS_SERVER=0
            fi
            
            echo "$line" >> "$TEMP_FILE"
        done < "$NGINX_CONFIG"
        
        # Substituir arquivo original
        mv "$TEMP_FILE" "$NGINX_CONFIG"
        
        log_success "Configuração SSL adicionada"
    fi
}

# Testar configuração do Nginx
test_nginx_config() {
    log_info "Testando configuração do Nginx..."
    if nginx -t > /dev/null 2>&1; then
        log_success "Configuração do Nginx está válida"
        return 0
    else
        log_error "Configuração do Nginx tem erros:"
        nginx -t
        return 1
    fi
}

# Iniciar Nginx
start_nginx() {
    log_info "Iniciando Nginx..."
    if systemctl start nginx 2>/dev/null; then
        log_success "Nginx iniciado"
    elif service nginx start 2>/dev/null; then
        log_success "Nginx iniciado (via service)"
    else
        log_error "Não foi possível iniciar Nginx"
        return 1
    fi
}

# Verificar certificado SSL
verify_certificate() {
    log_info "Verificando certificado SSL..."
    
    sleep 2  # Aguardar Nginx iniciar
    
    if echo | openssl s_client -connect "${DOMAIN}:443" -servername "${DOMAIN}" 2>/dev/null | grep -q "Verify return code: 0"; then
        log_success "Certificado SSL válido!"
        return 0
    else
        log_warning "Certificado SSL pode ter problemas"
        log_info "Verificando manualmente..."
        echo | openssl s_client -connect "${DOMAIN}:443" -servername "${DOMAIN}" 2>&1 | grep -A 5 "Verify return code"
        return 1
    fi
}

# ==================== EXECUÇÃO PRINCIPAL ====================

main() {
    echo "=========================================="
    echo "🔒 CORRIGIR CERTIFICADO SSL"
    echo "=========================================="
    log_info "Domínio: ${DOMAIN}"
    log_info "Data: $(date)"
    echo "=========================================="
    
    # Verificar se é root
    check_root
    
    # Verificar domínio
    if ! check_domain; then
        log_warning "Continuando mesmo assim..."
    fi
    
    # Parar Nginx
    if ! stop_nginx; then
        log_error "Não foi possível parar Nginx. Abortando."
        exit 1
    fi
    
    # Aguardar Nginx parar completamente
    sleep 2
    
    # Verificar porta 80
    if ! check_port_80; then
        log_warning "Porta 80 ainda está em uso. Matando processos..."
        # Matar processos do Nginx que ainda estão usando a porta
        killall -9 nginx 2>/dev/null || true
        sleep 2
    fi
    
    # Instalar certificado
    if ! install_certificate; then
        log_error "Erro ao instalar certificado"
        start_nginx
        exit 1
    fi
    
    # Copiar para aapanel
    if ! copy_certificate_to_aapanel; then
        log_error "Erro ao copiar certificado"
        start_nginx
        exit 1
    fi
    
    # Atualizar configuração do Nginx
    update_nginx_config
    
    # Testar configuração
    if ! test_nginx_config; then
        log_error "Configuração do Nginx inválida. Restaurando backup..."
        # Restaurar backup se houver
        LATEST_BACKUP=$(ls -t ${NGINX_CONFIG}.backup.* 2>/dev/null | head -1)
        if [ -n "$LATEST_BACKUP" ]; then
            cp "$LATEST_BACKUP" "$NGINX_CONFIG"
            log_info "Backup restaurado"
        fi
        start_nginx
        exit 1
    fi
    
    # Iniciar Nginx
    if ! start_nginx; then
        log_error "Erro ao iniciar Nginx"
        exit 1
    fi
    
    # Verificar certificado
    verify_certificate
    
    echo "=========================================="
    log_success "✅ PROCESSO CONCLUÍDO!"
    echo "=========================================="
    log_info "Certificado instalado em: ${AAPANEL_CERT_DIR}"
    log_info "Teste o site: https://${DOMAIN}"
    echo "=========================================="
}

# Executar
main "$@"

