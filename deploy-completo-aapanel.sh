#!/bin/bash

# ============================================
# Script de Deploy Completo para aapanel
# Atualiza repositório, faz build, configura SSL e reinicia serviços
# ============================================

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ==================== CONFIGURAÇÕES ====================
PROJECT_DIR="/www/wwwroot/cf.don.cim.br"
DOMAIN="cf.don.cim.br"
GIT_BRANCH="main"
LOG_FILE="/www/wwwlogs/cf.don.cim.br-deploy-completo.log"
AAPANEL_CERT_DIR="/www/server/panel/vhost/cert/${DOMAIN}"
NGINX_CONFIG="/www/server/panel/vhost/nginx/${DOMAIN}.conf"
LETSENCRYPT_LIVE_DIR="/etc/letsencrypt/live"

# ==================== FUNÇÕES ====================

log_info() {
    echo -e "${BLUE}ℹ️${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌${NC} $1" | tee -a "$LOG_FILE"
}

log_step() {
    echo -e "${CYAN}▶️${NC} $1" | tee -a "$LOG_FILE"
}

# Verificar se é root
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        log_error "Este script precisa ser executado como root"
        exit 1
    fi
}

# Atualizar repositório Git
update_repository() {
    log_step "Atualizando repositório Git..."
    
    cd "$PROJECT_DIR" || {
        log_error "Não foi possível acessar $PROJECT_DIR"
        return 1
    }
    
    # Stash mudanças locais se houver
    if [ -n "$(git status --porcelain)" ]; then
        log_info "Salvando mudanças locais..."
        git stash save "Backup antes do pull - $(date +%Y%m%d-%H%M%S)" || true
    fi
    
    # Fazer pull
    if git pull origin "$GIT_BRANCH" --no-edit; then
        log_success "Repositório atualizado"
        return 0
    else
        log_warning "Erro ao fazer pull. Tentando reset hard..."
        git fetch origin "$GIT_BRANCH"
        git reset --hard "origin/$GIT_BRANCH"
        log_success "Repositório atualizado (reset hard)"
        return 0
    fi
}

# Instalar dependências
install_dependencies() {
    log_step "Instalando dependências..."
    
    cd "$PROJECT_DIR" || return 1
    
    # Ajustar permissões do node_modules
    if [ -d "node_modules" ]; then
        chown -R www:www node_modules 2>/dev/null || true
        chmod -R 755 node_modules 2>/dev/null || true
        find node_modules/.bin -type f -exec chmod +x {} \; 2>/dev/null || true
    fi
    
    # Instalar dependências
    if npm install; then
        log_success "Dependências instaladas"
        
        # Ajustar permissões novamente após instalação
        chown -R www:www node_modules 2>/dev/null || true
        chmod -R 755 node_modules 2>/dev/null || true
        find node_modules/.bin -type f -exec chmod +x {} \; 2>/dev/null || true
        
        return 0
    else
        log_error "Erro ao instalar dependências"
        return 1
    fi
}

# Fazer build
build_project() {
    log_step "Fazendo build do projeto..."
    
    cd "$PROJECT_DIR" || return 1
    
    # Ajustar permissões antes do build
    chown -R www:www . 2>/dev/null || true
    chmod -R 755 . 2>/dev/null || true
    find node_modules/.bin -type f -exec chmod +x {} \; 2>/dev/null || true
    
    if npm run build; then
        log_success "Build concluído"
        
        # Ajustar permissões da pasta dist
        chown -R www:www dist 2>/dev/null || true
        chmod -R 755 dist 2>/dev/null || true
        
        return 0
    else
        log_error "Erro ao fazer build"
        return 1
    fi
}

# Encontrar diretório do certificado
find_cert_dir() {
    CERT_DIR=$(find "${LETSENCRYPT_LIVE_DIR}" -maxdepth 1 -type d -name "${DOMAIN}*" | head -1)
    
    if [ -z "$CERT_DIR" ]; then
        CERT_DIR="${LETSENCRYPT_LIVE_DIR}/${DOMAIN}"
    fi
    
    if [ -d "$CERT_DIR" ] && [ -f "${CERT_DIR}/fullchain.pem" ]; then
        echo "$CERT_DIR"
        return 0
    else
        return 1
    fi
}

# Configurar SSL no Nginx
configure_ssl() {
    log_step "Configurando SSL no Nginx..."
    
    # Verificar se certificado existe
    FOUND_CERT_DIR=$(find_cert_dir)
    if [ -z "$FOUND_CERT_DIR" ]; then
        log_warning "Certificado SSL não encontrado. Pulando configuração SSL."
        return 0
    fi
    
    log_info "Certificado encontrado em: $FOUND_CERT_DIR"
    
    # Criar diretório de certificados do aapanel
    mkdir -p "${AAPANEL_CERT_DIR}"
    
    # Copiar certificados
    if [ -f "${FOUND_CERT_DIR}/fullchain.pem" ] && [ -f "${FOUND_CERT_DIR}/privkey.pem" ]; then
        cp "${FOUND_CERT_DIR}/fullchain.pem" "${AAPANEL_CERT_DIR}/"
        cp "${FOUND_CERT_DIR}/privkey.pem" "${AAPANEL_CERT_DIR}/"
        
        # Ajustar permissões
        chown -R www:www "${AAPANEL_CERT_DIR}"
        chmod 644 "${AAPANEL_CERT_DIR}/fullchain.pem"
        chmod 600 "${AAPANEL_CERT_DIR}/privkey.pem"
        
        log_success "Certificados copiados"
    else
        log_warning "Arquivos de certificado não encontrados"
        return 0
    fi
    
    # Verificar e atualizar configuração do Nginx
    if [ ! -f "$NGINX_CONFIG" ]; then
        log_warning "Arquivo de configuração do Nginx não encontrado"
        return 0
    fi
    
    # Backup da configuração
    if [ ! -f "${NGINX_CONFIG}.backup" ]; then
        cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup"
    fi
    
    # Verificar se já tem listen 443
    if grep -q "listen 443" "$NGINX_CONFIG"; then
        log_info "Configuração SSL já existe. Atualizando caminhos..."
        
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
    log_step "Testando configuração do Nginx..."
    
    if nginx -t > /dev/null 2>&1; then
        log_success "Configuração do Nginx válida"
        return 0
    else
        log_error "Configuração do Nginx tem erros:"
        nginx -t 2>&1 | tee -a "$LOG_FILE"
        return 1
    fi
}

# Reiniciar serviços
restart_services() {
    log_step "Reiniciando serviços..."
    
    # Recarregar Nginx
    log_info "Recarregando Nginx..."
    if systemctl reload nginx 2>/dev/null; then
        log_success "Nginx recarregado"
    elif service nginx reload 2>/dev/null; then
        log_success "Nginx recarregado (via service)"
    else
        log_warning "Não foi possível recarregar Nginx. Tentando reiniciar..."
        if systemctl restart nginx 2>/dev/null; then
            log_success "Nginx reiniciado"
        elif service nginx restart 2>/dev/null; then
            log_success "Nginx reiniciado (via service)"
        else
            log_error "Não foi possível reiniciar Nginx"
            return 1
        fi
    fi
    
    # Verificar status
    sleep 2
    if systemctl is-active --quiet nginx; then
        log_success "Nginx está rodando"
    else
        log_error "Nginx não está rodando"
        return 1
    fi
    
    # Verificar portas
    if netstat -tuln | grep -q ":80 "; then
        log_success "Nginx está escutando na porta 80"
    else
        log_warning "Nginx não está escutando na porta 80"
    fi
    
    if netstat -tuln | grep -q ":443 "; then
        log_success "Nginx está escutando na porta 443"
    else
        log_warning "Nginx não está escutando na porta 443"
    fi
}

# Verificar se site está acessível
verify_site() {
    log_step "Verificando se o site está acessível..."
    
    sleep 2
    
    # Testar HTTP
    if curl -I "http://${DOMAIN}" > /dev/null 2>&1; then
        log_success "Site acessível via HTTP"
    else
        log_warning "Site não está acessível via HTTP"
    fi
    
    # Testar HTTPS
    if curl -I "https://${DOMAIN}" > /dev/null 2>&1; then
        log_success "Site acessível via HTTPS"
    else
        log_warning "Site não está acessível via HTTPS"
    fi
}

# ==================== EXECUÇÃO PRINCIPAL ====================

main() {
    echo "=========================================="
    echo "🚀 DEPLOY COMPLETO - aapanel"
    echo "=========================================="
    log_info "Domínio: ${DOMAIN}"
    log_info "Diretório: ${PROJECT_DIR}"
    log_info "Data: $(date)"
    echo "=========================================="
    
    # Verificar se é root
    check_root
    
    # Criar arquivo de log
    touch "$LOG_FILE"
    log_info "Log: $LOG_FILE"
    
    # Atualizar repositório
    if ! update_repository; then
        log_error "Erro ao atualizar repositório"
        exit 1
    fi
    
    # Instalar dependências
    if ! install_dependencies; then
        log_error "Erro ao instalar dependências"
        exit 1
    fi
    
    # Fazer build
    if ! build_project; then
        log_error "Erro ao fazer build"
        exit 1
    fi
    
    # Configurar SSL
    configure_ssl
    
    # Testar configuração do Nginx
    if ! test_nginx_config; then
        log_error "Configuração do Nginx inválida"
        exit 1
    fi
    
    # Reiniciar serviços
    if ! restart_services; then
        log_error "Erro ao reiniciar serviços"
        exit 1
    fi
    
    # Verificar site
    verify_site
    
    echo "=========================================="
    log_success "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
    echo "=========================================="
    log_info "Commit: $(cd $PROJECT_DIR && git rev-parse --short HEAD 2>/dev/null || echo 'N/A')"
    log_info "Build: $(du -sh $PROJECT_DIR/dist 2>/dev/null | cut -f1 || echo 'N/A')"
    log_info "Log: $LOG_FILE"
    echo "=========================================="
    log_info "Teste o site:"
    log_info "  HTTP:  http://${DOMAIN}"
    log_info "  HTTPS: https://${DOMAIN}"
    echo "=========================================="
}

# Executar
main "$@"

