#!/bin/bash
# ============================================
# Script para Corrigir Erro 404 em Assets
# Refaz o build e corrige referências
# ============================================

DOMAIN="cf.don.cim.br"
PROJECT_DIR="/www/wwwroot/${DOMAIN}"
DIST_DIR="${PROJECT_DIR}/dist"

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
echo "🔧 CORRIGIR ERRO 404 EM ASSETS"
echo "=========================================="
echo ""

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
    log_error "Este script precisa ser executado como root"
    exit 1
fi

cd "$PROJECT_DIR" || exit 1

# 1. Limpar build anterior
log_info "1️⃣ Limpando build anterior..."
if [ -d "$DIST_DIR" ]; then
    log_info "Removendo conteúdo antigo de dist..."
    rm -rf "${DIST_DIR}"/*
    log_success "Build anterior removido"
else
    log_info "Criando diretório dist..."
    mkdir -p "$DIST_DIR"
fi

echo ""

# 2. Verificar dependências
log_info "2️⃣ Verificando dependências..."
if [ ! -d "node_modules" ]; then
    log_warning "node_modules não encontrado"
    log_info "Instalando dependências..."
    npm install
    if [ $? -ne 0 ]; then
        log_error "Erro ao instalar dependências"
        exit 1
    fi
    log_success "Dependências instaladas"
else
    log_success "Dependências encontradas"
fi

echo ""

# 3. Fazer build novo
log_info "3️⃣ Fazendo build novo..."
log_info "Isso pode levar alguns minutos..."

npm run build

if [ $? -ne 0 ]; then
    log_error "Erro ao fazer build"
    exit 1
fi

# Verificar se build foi criado
if [ ! -d "$DIST_DIR" ] || [ -z "$(ls -A $DIST_DIR 2>/dev/null)" ]; then
    log_error "Build não foi criado ou está vazio"
    exit 1
fi

log_success "Build concluído"

echo ""

# 4. Verificar arquivos gerados
log_info "4️⃣ Verificando arquivos gerados..."

# Verificar index.html
if [ -f "${DIST_DIR}/index.html" ]; then
    log_success "index.html encontrado"
    FILE_SIZE=$(stat -f%z "${DIST_DIR}/index.html" 2>/dev/null || stat -c%s "${DIST_DIR}/index.html" 2>/dev/null)
    log_info "Tamanho: $FILE_SIZE bytes"
else
    log_error "index.html não encontrado"
    exit 1
fi

# Verificar assets
if [ -d "${DIST_DIR}/assets" ]; then
    ASSET_COUNT=$(ls -1 "${DIST_DIR}/assets" 2>/dev/null | wc -l)
    log_success "Diretório assets encontrado com $ASSET_COUNT arquivo(s)"
    
    # Listar alguns arquivos
    log_info "Arquivos em assets:"
    ls -lh "${DIST_DIR}/assets" | head -5 | tail -4
    
    # Verificar se há arquivos JS
    JS_FILES=$(find "${DIST_DIR}/assets" -name "*.js" 2>/dev/null | wc -l)
    if [ "$JS_FILES" -gt 0 ]; then
        log_success "Arquivos JavaScript encontrados: $JS_FILES"
    else
        log_warning "Nenhum arquivo JavaScript encontrado em assets"
    fi
    
    # Verificar se há arquivos CSS
    CSS_FILES=$(find "${DIST_DIR}/assets" -name "*.css" 2>/dev/null | wc -l)
    if [ "$CSS_FILES" -gt 0 ]; then
        log_success "Arquivos CSS encontrados: $CSS_FILES"
    fi
else
    log_warning "Diretório assets não encontrado"
fi

echo ""

# 5. Verificar referências no index.html
log_info "5️⃣ Verificando referências no index.html..."
if [ -f "${DIST_DIR}/index.html" ]; then
    # Extrair referências a arquivos JS
    JS_REFS=$(grep -oE 'src="[^"]*\.js[^"]*"' "${DIST_DIR}/index.html" | head -3)
    if [ -n "$JS_REFS" ]; then
        log_info "Referências JavaScript encontradas no index.html:"
        echo "$JS_REFS" | head -3
        
        # Verificar se os arquivos referenciados existem
        MISSING_FILES=0
        while IFS= read -r ref; do
            # Extrair caminho do arquivo
            FILE_PATH=$(echo "$ref" | sed 's/src="//;s/"//' | sed 's|^/||')
            if [ -n "$FILE_PATH" ]; then
                FULL_PATH="${DIST_DIR}/${FILE_PATH}"
                if [ ! -f "$FULL_PATH" ]; then
                    log_warning "Arquivo referenciado não encontrado: $FILE_PATH"
                    MISSING_FILES=$((MISSING_FILES + 1))
                fi
            fi
        done <<< "$JS_REFS"
        
        if [ "$MISSING_FILES" -eq 0 ]; then
            log_success "Todos os arquivos referenciados existem"
        else
            log_warning "$MISSING_FILES arquivo(s) referenciado(s) não encontrado(s)"
        fi
    else
        log_warning "Nenhuma referência JavaScript encontrada no index.html"
    fi
fi

echo ""

# 6. Ajustar permissões
log_info "6️⃣ Ajustando permissões..."
chown -R www:www "$DIST_DIR" 2>/dev/null || chown -R www-data:www-data "$DIST_DIR" 2>/dev/null
chmod -R 755 "$DIST_DIR"
chmod 644 "${DIST_DIR}/index.html" 2>/dev/null || true
log_success "Permissões ajustadas"

# Verificar permissões
if [ -r "${DIST_DIR}/index.html" ]; then
    log_success "index.html é legível"
else
    log_error "index.html não é legível"
fi

echo ""

# 7. Recarregar Nginx
log_info "7️⃣ Recarregando Nginx..."
if systemctl reload webserver 2>/dev/null || systemctl reload nginx 2>/dev/null; then
    log_success "Nginx recarregado"
else
    log_warning "Não foi possível recarregar, tentando reiniciar..."
    systemctl restart webserver 2>/dev/null || systemctl restart nginx 2>/dev/null
    sleep 3
fi

echo ""

# 8. Testar acesso
log_info "8️⃣ Testando acesso..."
sleep 2

# Testar localmente
log_info "Testando localmente..."
LOCAL_TEST=$(curl -s -H "Host: ${DOMAIN}" "http://localhost/" 2>&1 | head -20)
if echo "$LOCAL_TEST" | grep -q "<!DOCTYPE html>\|<html"; then
    log_success "Site responde localmente com HTML"
else
    log_warning "Site não responde localmente ou retorna conteúdo inválido"
fi

# Testar HTTPS
log_info "Testando HTTPS..."
HTTPS_RESPONSE=$(curl -I -s -o /dev/null -w "%{http_code}" --max-time 10 "https://${DOMAIN}" 2>&1)
if [ "$HTTPS_RESPONSE" = "200" ]; then
    log_success "HTTPS retorna código 200"
    
    # Verificar conteúdo
    HTTPS_CONTENT=$(curl -s --max-time 10 "https://${DOMAIN}" 2>&1)
    if echo "$HTTPS_CONTENT" | grep -q "<!DOCTYPE html>\|<html"; then
        log_success "✅ Site está retornando conteúdo HTML"
        
        # Verificar se há referências a assets
        if echo "$HTTPS_CONTENT" | grep -q "\.js\|\.css"; then
            log_success "Referências a assets encontradas no HTML"
        fi
    else
        log_warning "Site retorna código 200 mas sem conteúdo HTML visível"
    fi
else
    log_warning "HTTPS retornou código: $HTTPS_RESPONSE"
fi

echo ""

# 9. Resumo
echo "=========================================="
echo "📋 RESUMO"
echo "=========================================="

if [ -f "${DIST_DIR}/index.html" ] && [ -d "${DIST_DIR}/assets" ] && [ "$HTTPS_RESPONSE" = "200" ]; then
    log_success "✅ Build concluído e site está respondendo"
    echo ""
    log_info "Próximos passos:"
    log_info "  1. Limpe o cache do navegador (Ctrl+Shift+Delete)"
    log_info "  2. Recarregue a página com Ctrl+F5 (hard refresh)"
    log_info "  3. Verifique o Console do navegador (F12) para novos erros"
    echo ""
    log_info "Se ainda houver erro 404:"
    log_info "  - Verifique se o arquivo existe: ls -la ${DIST_DIR}/assets/"
    log_info "  - Verifique as referências no index.html"
    log_info "  - Pode ser necessário limpar cache do navegador"
else
    log_warning "⚠️ Há problemas que precisam ser verificados"
fi

echo ""
log_info "Teste no navegador: https://${DOMAIN}"
log_info "Pressione Ctrl+F5 para fazer hard refresh"
echo ""

