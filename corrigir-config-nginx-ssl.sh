#!/bin/bash
# ============================================
# Script para Corrigir Configuração SSL do Nginx
# Garante que ssl_certificate e ssl_certificate_key estão corretos
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
    log_info "Execute primeiro: bash gerar-novo-certificado-ssl.sh"
    exit 1
fi

log_success "Certificados encontrados"

# Fazer backup
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d-%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
log_info "Backup criado: $BACKUP_FILE"

echo ""

# Verificar configuração atual
log_info "Verificando configuração atual..."
HAS_SSL_CERT=$(grep -c "ssl_certificate" "$NGINX_CONFIG" 2>/dev/null | head -1)
HAS_SSL_KEY=$(grep -c "ssl_certificate_key" "$NGINX_CONFIG" 2>/dev/null | head -1)

# Garantir que são números válidos
HAS_SSL_CERT=${HAS_SSL_CERT:-0}
HAS_SSL_KEY=${HAS_SSL_KEY:-0}

# Converter para inteiro (remover espaços e quebras de linha)
HAS_SSL_CERT=$(echo "$HAS_SSL_CERT" | tr -d '[:space:]')
HAS_SSL_KEY=$(echo "$HAS_SSL_KEY" | tr -d '[:space:]')

# Se ainda não for número, definir como 0
if ! [[ "$HAS_SSL_CERT" =~ ^[0-9]+$ ]]; then
    HAS_SSL_CERT=0
fi
if ! [[ "$HAS_SSL_KEY" =~ ^[0-9]+$ ]]; then
    HAS_SSL_KEY=0
fi

log_info "SSL Cert encontrado: $HAS_SSL_CERT, SSL Key encontrado: $HAS_SSL_KEY"

if [ "$HAS_SSL_CERT" -gt 0 ] && [ "$HAS_SSL_KEY" -gt 0 ]; then
    log_info "Certificados já configurados. Verificando se estão corretos..."
    
    # Verificar se os caminhos estão corretos
    if grep -q "ssl_certificate.*${AAPANEL_CERT_DIR}/fullchain.pem" "$NGINX_CONFIG" && \
       grep -q "ssl_certificate_key.*${AAPANEL_CERT_DIR}/privkey.pem" "$NGINX_CONFIG"; then
        log_success "Caminhos dos certificados estão corretos"
    else
        log_warning "Caminhos dos certificados precisam ser atualizados"
        # Atualizar caminhos
        sed -i "s|ssl_certificate.*|ssl_certificate ${AAPANEL_CERT_DIR}/fullchain.pem;|g" "$NGINX_CONFIG"
        sed -i "s|ssl_certificate_key.*|ssl_certificate_key ${AAPANEL_CERT_DIR}/privkey.pem;|g" "$NGINX_CONFIG"
        log_success "Caminhos atualizados"
    fi
else
    log_warning "Certificados SSL não configurados corretamente"
    
    # Verificar se há bloco HTTPS
    if grep -q "listen 443" "$NGINX_CONFIG"; then
        log_info "Bloco HTTPS encontrado. Adicionando certificados..."
        
        # Encontrar linha com server_name no bloco HTTPS
        # Criar arquivo temporário
        TEMP_FILE=$(mktemp)
        IN_HTTPS_BLOCK=0
        SSL_ADDED=0
        
        while IFS= read -r line || [ -n "$line" ]; do
            # Detectar início de bloco server com HTTPS
            if echo "$line" | grep -q "listen 443"; then
                IN_HTTPS_BLOCK=1
                echo "$line" >> "$TEMP_FILE"
                continue
            fi
            
            # Se estiver no bloco HTTPS e encontrar server_name, adicionar SSL depois
            if [ "$IN_HTTPS_BLOCK" -eq 1 ] && [ "$SSL_ADDED" -eq 0 ] && echo "$line" | grep -q "server_name"; then
                echo "$line" >> "$TEMP_FILE"
                # Adicionar certificados logo após server_name
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
            
            # Detectar fim do bloco server
            if [ "$IN_HTTPS_BLOCK" -eq 1 ] && echo "$line" | grep -q "^}"; then
                IN_HTTPS_BLOCK=0
            fi
            
            echo "$line" >> "$TEMP_FILE"
        done < "$NGINX_CONFIG"
        
        mv "$TEMP_FILE" "$NGINX_CONFIG"
        log_success "Certificados SSL adicionados à configuração"
    else
        log_error "Bloco HTTPS não encontrado na configuração"
        log_info "Aplicando configuração completa..."
        cp "nginx-cf.don.cim.br.conf" "$NGINX_CONFIG" 2>/dev/null || {
            log_error "Arquivo nginx-cf.don.cim.br.conf não encontrado no diretório atual"
            exit 1
        }
        log_success "Configuração completa aplicada"
    fi
fi

echo ""

# Verificar se ambas as linhas estão presentes
log_info "Verificando se configuração está completa..."
if grep -q "ssl_certificate.*fullchain.pem" "$NGINX_CONFIG" && \
   grep -q "ssl_certificate_key.*privkey.pem" "$NGINX_CONFIG"; then
    log_success "Configuração SSL completa encontrada"
else
    log_error "Configuração SSL incompleta!"
    log_info "Linhas encontradas:"
    grep "ssl_certificate" "$NGINX_CONFIG" || echo "Nenhuma linha ssl_certificate encontrada"
    exit 1
fi

echo ""

# Testar configuração
log_info "Testando configuração do Nginx..."
NGINX_TEST=$(nginx -t 2>&1)
if echo "$NGINX_TEST" | grep -q "successful"; then
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
    
    # Verificar se está escutando na porta 443
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
    echo "$NGINX_TEST" | grep -i error || echo "$NGINX_TEST"
    echo ""
    log_info "Mostrando linhas SSL na configuração:"
    grep -n "ssl_certificate" "$NGINX_CONFIG" || echo "Nenhuma linha SSL encontrada"
    echo ""
    log_warning "NÃO restaurando backup. Verifique manualmente a configuração."
    log_info "Arquivo de configuração: $NGINX_CONFIG"
    log_info "Backup disponível em: $BACKUP_FILE"
    exit 1
fi

echo ""
echo "=========================================="
log_success "✅ CONFIGURAÇÃO CORRIGIDA COM SUCESSO!"
echo "=========================================="
log_info "Teste o site: https://${DOMAIN}"
echo ""

