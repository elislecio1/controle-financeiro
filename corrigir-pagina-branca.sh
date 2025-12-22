#!/bin/bash
# ============================================
# Script para Corrigir Página em Branco
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
echo "🔧 CORRIGIR PÁGINA EM BRANCO"
echo "=========================================="
echo ""

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
    log_error "Este script precisa ser executado como root"
    exit 1
fi

cd "$PROJECT_DIR" || exit 1

# 1. Verificar se diretório dist existe e tem conteúdo
log_info "1️⃣ Verificando diretório dist..."
if [ ! -d "$DIST_DIR" ]; then
    log_error "Diretório dist não existe"
    log_info "Criando diretório..."
    mkdir -p "$DIST_DIR"
fi

if [ -z "$(ls -A $DIST_DIR 2>/dev/null)" ]; then
    log_warning "Diretório dist está vazio"
    NEED_BUILD=1
else
    log_success "Diretório dist tem conteúdo"
    DIST_FILES=$(ls -1 "$DIST_DIR" | wc -l)
    log_info "Arquivos encontrados: $DIST_FILES"
    
    # Verificar se tem index.html
    if [ ! -f "${DIST_DIR}/index.html" ]; then
        log_error "index.html não encontrado em dist"
        NEED_BUILD=1
    else
        log_success "index.html encontrado"
    fi
fi

echo ""

# 2. Fazer build se necessário
if [ "$NEED_BUILD" = "1" ]; then
    log_info "2️⃣ Fazendo build do projeto..."
    
    # Verificar se node_modules existe
    if [ ! -d "node_modules" ]; then
        log_info "Instalando dependências..."
        npm install
        if [ $? -ne 0 ]; then
            log_error "Erro ao instalar dependências"
            exit 1
        fi
    fi
    
    # Limpar build anterior
    if [ -d "$DIST_DIR" ]; then
        log_info "Limpando build anterior..."
        rm -rf "${DIST_DIR}"/*
    fi
    
    # Fazer build
    log_info "Executando build..."
    npm run build
    
    if [ $? -eq 0 ] && [ -f "${DIST_DIR}/index.html" ]; then
        log_success "Build concluído com sucesso"
    else
        log_error "Erro ao fazer build"
        exit 1
    fi
else
    log_info "2️⃣ Build já existe, pulando..."
fi

echo ""

# 3. Verificar permissões
log_info "3️⃣ Verificando permissões..."
chown -R www:www "$DIST_DIR" 2>/dev/null || chown -R www-data:www-data "$DIST_DIR" 2>/dev/null
chmod -R 755 "$DIST_DIR"
log_success "Permissões ajustadas"

# Verificar permissões do index.html especificamente
if [ -f "${DIST_DIR}/index.html" ]; then
    chmod 644 "${DIST_DIR}/index.html"
    log_success "Permissões do index.html ajustadas"
fi

echo ""

# 4. Verificar configuração do Nginx
log_info "4️⃣ Verificando configuração do Nginx..."
if [ ! -f "$NGINX_CONFIG" ]; then
    log_error "Arquivo de configuração não encontrado: $NGINX_CONFIG"
    exit 1
fi

# Verificar root
NGINX_ROOT=$(grep -E "^\s*root\s+" "$NGINX_CONFIG" | head -1 | awk '{print $2}' | tr -d ';')
if [ -n "$NGINX_ROOT" ]; then
    log_info "Root configurado no Nginx: $NGINX_ROOT"
    if [ "$NGINX_ROOT" != "$DIST_DIR" ]; then
        log_warning "Root do Nginx não corresponde ao diretório dist"
        log_info "Root atual: $NGINX_ROOT"
        log_info "Deveria ser: $DIST_DIR"
    else
        log_success "Root do Nginx está correto"
    fi
else
    log_error "Root não encontrado na configuração do Nginx"
fi

# Verificar try_files (importante para SPA React)
if grep -q "try_files.*index.html" "$NGINX_CONFIG"; then
    log_success "try_files configurado (importante para React Router)"
else
    log_warning "try_files pode não estar configurado corretamente"
fi

echo ""

# 5. Verificar se arquivos estão acessíveis
log_info "5️⃣ Verificando se arquivos estão acessíveis..."
if [ -f "${DIST_DIR}/index.html" ]; then
    log_success "index.html existe"
    
    # Verificar tamanho do arquivo
    FILE_SIZE=$(stat -f%z "${DIST_DIR}/index.html" 2>/dev/null || stat -c%s "${DIST_DIR}/index.html" 2>/dev/null)
    if [ "$FILE_SIZE" -lt 100 ]; then
        log_warning "index.html parece muito pequeno ($FILE_SIZE bytes)"
    else
        log_success "index.html tem tamanho adequado ($FILE_SIZE bytes)"
    fi
    
    # Verificar conteúdo básico
    if grep -q "<!DOCTYPE html>" "${DIST_DIR}/index.html" || grep -q "<html" "${DIST_DIR}/index.html"; then
        log_success "index.html parece ter conteúdo HTML válido"
    else
        log_warning "index.html pode não ter conteúdo HTML válido"
    fi
else
    log_error "index.html não encontrado"
    exit 1
fi

# Verificar assets
if [ -d "${DIST_DIR}/assets" ]; then
    ASSET_COUNT=$(ls -1 "${DIST_DIR}/assets" 2>/dev/null | wc -l)
    log_info "Arquivos em assets: $ASSET_COUNT"
    if [ "$ASSET_COUNT" -eq 0 ]; then
        log_warning "Diretório assets está vazio"
    else
        log_success "Assets encontrados"
    fi
else
    log_warning "Diretório assets não encontrado"
fi

echo ""

# 6. Testar acesso local
log_info "6️⃣ Testando acesso local..."
if curl -s "http://localhost" -H "Host: ${DOMAIN}" | grep -q "<!DOCTYPE html>\|<html"; then
    log_success "Site responde localmente"
else
    log_warning "Site não responde localmente ou retorna página vazia"
    log_info "Testando diretamente o arquivo..."
    if [ -f "${DIST_DIR}/index.html" ]; then
        FIRST_LINES=$(head -5 "${DIST_DIR}/index.html")
        log_info "Primeiras linhas do index.html:"
        echo "$FIRST_LINES" | head -3
    fi
fi

echo ""

# 7. Verificar logs do Nginx
log_info "7️⃣ Verificando logs do Nginx..."
ERROR_LOG="/www/wwwlogs/cf.don.cim.br.error.log"
if [ -f "$ERROR_LOG" ]; then
    RECENT_ERRORS=$(tail -20 "$ERROR_LOG" | grep -i "error\|fail\|404" | tail -5)
    if [ -n "$RECENT_ERRORS" ]; then
        log_warning "Erros recentes encontrados:"
        echo "$RECENT_ERRORS"
    else
        log_success "Nenhum erro recente nos logs"
    fi
fi

echo ""

# 8. Recarregar Nginx
log_info "8️⃣ Recarregando Nginx..."
if systemctl reload webserver 2>/dev/null || systemctl reload nginx 2>/dev/null; then
    log_success "Nginx recarregado"
else
    log_warning "Não foi possível recarregar, tentando reiniciar..."
    systemctl restart webserver 2>/dev/null || systemctl restart nginx 2>/dev/null
    sleep 2
fi

echo ""

# 9. Testar acesso externo
log_info "9️⃣ Testando acesso externo..."
sleep 2

HTTPS_RESPONSE=$(curl -I -s -o /dev/null -w "%{http_code}" --max-time 10 "https://${DOMAIN}" 2>&1)
if [ "$HTTPS_RESPONSE" = "200" ]; then
    log_success "HTTPS retorna código 200"
    
    # Verificar se tem conteúdo
    HTTPS_CONTENT=$(curl -s --max-time 10 "https://${DOMAIN}" 2>&1)
    if [ -n "$HTTPS_CONTENT" ] && echo "$HTTPS_CONTENT" | grep -q "<!DOCTYPE html>\|<html"; then
        log_success "✅ Site está retornando conteúdo HTML"
    else
        log_warning "Site retorna código 200 mas sem conteúdo HTML visível"
        log_info "Tamanho da resposta: $(echo "$HTTPS_CONTENT" | wc -c) bytes"
    fi
else
    log_warning "HTTPS retornou código: $HTTPS_RESPONSE"
fi

echo ""

# 10. Resumo e recomendações
echo "=========================================="
echo "📋 RESUMO"
echo "=========================================="

if [ -f "${DIST_DIR}/index.html" ] && [ "$HTTPS_RESPONSE" = "200" ]; then
    log_success "✅ Configuração básica está OK"
    echo ""
    log_info "Se ainda vê página em branco, verifique:"
    log_info "  1. Console do navegador (F12) para erros JavaScript"
    log_info "  2. Network tab para ver se assets estão carregando"
    log_info "  3. Verifique se o build está completo: ls -la ${DIST_DIR}"
    log_info "  4. Verifique permissões: ls -la ${DIST_DIR}/index.html"
else
    log_warning "⚠️ Há problemas que precisam ser corrigidos"
    echo ""
    log_info "Verifique:"
    log_info "  - Build: npm run build"
    log_info "  - Permissões: chown -R www:www ${DIST_DIR}"
    log_info "  - Configuração: cat ${NGINX_CONFIG} | grep root"
fi

echo ""
log_info "Teste no navegador: https://${DOMAIN}"
log_info "Pressione F12 e verifique o Console para erros"
echo ""

