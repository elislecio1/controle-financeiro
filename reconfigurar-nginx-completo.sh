#!/bin/bash

echo "=========================================="
echo "🔧 RECONFIGURAÇÃO COMPLETA DO NGINX"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir com cor
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# 1. Identificar processo na porta 80
echo "1️⃣ IDENTIFICANDO PROCESSO NA PORTA 80"
echo "-----------------------------------"
PID_80=""
if command -v ss >/dev/null 2>&1; then
    PORT_80_INFO=$(ss -tulpn | grep :80 | head -1)
    if [ ! -z "$PORT_80_INFO" ]; then
        echo "Processo encontrado na porta 80:"
        echo "$PORT_80_INFO"
        PID_80=$(echo "$PORT_80_INFO" | awk '{print $6}' | cut -d',' -f2 | cut -d'=' -f2 | head -1)
        if [ ! -z "$PID_80" ] && [ "$PID_80" != "-" ]; then
            echo ""
            echo "Detalhes do processo (PID: $PID_80):"
            ps aux | grep "^$PID_80 " | grep -v grep || echo "Processo não encontrado"
            echo ""
            echo "Comando completo:"
            cat /proc/$PID_80/cmdline 2>/dev/null | tr '\0' ' ' || echo "Não foi possível ler"
        fi
    else
        print_success "Porta 80 está livre"
    fi
else
    PORT_80_INFO=$(netstat -tulpn | grep :80 | head -1)
    if [ ! -z "$PORT_80_INFO" ]; then
        echo "$PORT_80_INFO"
        PID_80=$(echo "$PORT_80_INFO" | awk '{print $7}' | cut -d'/' -f1 | head -1)
    else
        print_success "Porta 80 está livre"
    fi
fi
echo ""

# 2. Parar todos os processos do nginx
echo "2️⃣ PARANDO TODOS OS PROCESSOS DO NGINX"
echo "-----------------------------------"
print_info "Parando processos do nginx..."

# Parar nginx do aapanel
/etc/init.d/nginx stop 2>/dev/null
print_info "Tentativa de parar via /etc/init.d/nginx"

# Parar nginx direto
/www/server/nginx/sbin/nginx -s stop 2>/dev/null
print_info "Tentativa de parar via /www/server/nginx/sbin/nginx"

# Matar todos os processos do nginx
killall nginx 2>/dev/null
pkill nginx 2>/dev/null
print_info "Tentativa de parar via killall/pkill"

sleep 2

# Verificar se ainda há processos
REMAINING=$(ps aux | grep nginx | grep -v grep | wc -l)
if [ "$REMAINING" -gt 0 ]; then
    print_warning "Ainda há $REMAINING processo(s) do nginx rodando"
    echo "Processos restantes:"
    ps aux | grep nginx | grep -v grep
    echo ""
    print_info "Tentando forçar parada..."
    pkill -9 nginx 2>/dev/null
    sleep 1
else
    print_success "Todos os processos do nginx foram parados"
fi
echo ""

# 3. Verificar e parar processo na porta 80 (se ainda existir)
echo "3️⃣ VERIFICANDO PORTA 80"
echo "-----------------------------------"
if ss -tulpn | grep :80 >/dev/null 2>&1; then
    print_warning "Ainda há processo na porta 80"
    NEW_PID=$(ss -tulpn | grep :80 | awk '{print $6}' | cut -d',' -f2 | cut -d'=' -f2 | head -1)
    if [ ! -z "$NEW_PID" ] && [ "$NEW_PID" != "-" ]; then
        print_info "Parando processo $NEW_PID na porta 80..."
        kill -9 $NEW_PID 2>/dev/null
        sleep 1
        if ss -tulpn | grep :80 >/dev/null 2>&1; then
            print_error "Não foi possível liberar a porta 80"
            echo "Execute manualmente: ss -tulpn | grep :80"
            exit 1
        else
            print_success "Porta 80 liberada"
        fi
    fi
else
    print_success "Porta 80 está livre"
fi
echo ""

# 4. Verificar configuração do nginx
echo "4️⃣ VERIFICANDO CONFIGURAÇÃO DO NGINX"
echo "-----------------------------------"
NGINX_BIN="/www/server/nginx/sbin/nginx"
if [ -f "$NGINX_BIN" ]; then
    print_success "Nginx do aapanel encontrado: $NGINX_BIN"
    echo "Versão:"
    $NGINX_BIN -v 2>&1
    echo ""
    echo "Testando sintaxe da configuração:"
    if $NGINX_BIN -t 2>&1; then
        print_success "Sintaxe da configuração está OK"
    else
        print_error "Erro na sintaxe da configuração!"
        echo "Corrija os erros antes de continuar"
        exit 1
    fi
else
    print_error "Nginx do aapanel não encontrado em $NGINX_BIN"
    exit 1
fi
echo ""

# 5. Listar sites configurados
echo "5️⃣ SITES CONFIGURADOS"
echo "-----------------------------------"
SITES_DIR="/www/server/panel/vhost/nginx"
if [ -d "$SITES_DIR" ]; then
    SITE_COUNT=$(ls -1 "$SITES_DIR"/*.conf 2>/dev/null | wc -l)
    print_info "Encontrados $SITE_COUNT site(s) configurado(s):"
    ls -1 "$SITES_DIR"/*.conf 2>/dev/null | while read config; do
        SITE=$(basename "$config" .conf)
        echo "  - $SITE"
        
        # Verificar se tem SSL
        if grep -q "listen.*443" "$config"; then
            echo "    ✅ HTTPS configurado"
        else
            echo "    ⚠️  HTTPS não configurado"
        fi
    done
else
    print_error "Diretório de sites não encontrado: $SITES_DIR"
fi
echo ""

# 6. Iniciar nginx do aapanel
echo "6️⃣ INICIANDO NGINX DO AAPANEL"
echo "-----------------------------------"
print_info "Iniciando nginx..."
$NGINX_BIN

sleep 2

# Verificar se iniciou
if ps aux | grep "$NGINX_BIN" | grep -v grep >/dev/null; then
    print_success "Nginx iniciado com sucesso!"
else
    print_error "Falha ao iniciar nginx"
    echo ""
    echo "Verificando erros..."
    $NGINX_BIN -t 2>&1
    echo ""
    echo "Últimas linhas do log de erro:"
    tail -20 /www/server/nginx/logs/error.log 2>/dev/null || echo "Log não encontrado"
    exit 1
fi
echo ""

# 7. Verificar portas
echo "7️⃣ VERIFICANDO PORTAS"
echo "-----------------------------------"
echo "Porta 80:"
if ss -tulpn | grep :80 >/dev/null; then
    ss -tulpn | grep :80
    print_success "Porta 80 está sendo escutada"
else
    print_error "Porta 80 NÃO está sendo escutada"
fi
echo ""

echo "Porta 443:"
if ss -tulpn | grep :443 >/dev/null; then
    ss -tulpn | grep :443
    print_success "Porta 443 está sendo escutada"
else
    print_warning "Porta 443 NÃO está sendo escutada (pode ser normal se não houver SSL configurado)"
fi
echo ""

# 8. Verificar status
echo "8️⃣ STATUS DO NGINX"
echo "-----------------------------------"
if /etc/init.d/nginx status 2>/dev/null; then
    print_success "Nginx está rodando"
else
    # Verificar manualmente
    if ps aux | grep "$NGINX_BIN" | grep -v grep >/dev/null; then
        print_success "Nginx está rodando (verificado via ps)"
    else
        print_error "Nginx não está rodando"
    fi
fi
echo ""

# 9. Testar sites principais
echo "9️⃣ TESTANDO SITES"
echo "-----------------------------------"
TEST_SITES=("cf.don.cim.br" "nucleo.don.cim.br" "ceramica.don.cim.br" "don.cim.br")

for site in "${TEST_SITES[@]}"; do
    if [ -f "$SITES_DIR/$site.conf" ]; then
        echo "Testando $site..."
        
        # Testar HTTP
        HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://$site 2>/dev/null)
        if [ "$HTTP_RESPONSE" = "200" ] || [ "$HTTP_RESPONSE" = "301" ] || [ "$HTTP_RESPONSE" = "302" ]; then
            print_success "HTTP: $site está respondendo (código: $HTTP_RESPONSE)"
        else
            print_warning "HTTP: $site retornou código $HTTP_RESPONSE"
        fi
        
        # Testar HTTPS (se configurado)
        if grep -q "listen.*443" "$SITES_DIR/$site.conf" 2>/dev/null; then
            HTTPS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 -k https://$site 2>/dev/null)
            if [ "$HTTPS_RESPONSE" = "200" ] || [ "$HTTPS_RESPONSE" = "301" ] || [ "$HTTPS_RESPONSE" = "302" ]; then
                print_success "HTTPS: $site está respondendo (código: $HTTPS_RESPONSE)"
            else
                print_warning "HTTPS: $site retornou código $HTTPS_RESPONSE ou não está acessível"
            fi
        fi
        echo ""
    fi
done

# 10. Resumo final
echo "=========================================="
echo "✅ RECONFIGURAÇÃO CONCLUÍDA!"
echo "=========================================="
echo ""
echo "📊 RESUMO:"
echo "  - Nginx: $(ps aux | grep "$NGINX_BIN" | grep -v grep | wc -l) processo(s) rodando"
echo "  - Porta 80: $(ss -tulpn | grep :80 | wc -l) processo(s)"
echo "  - Porta 443: $(ss -tulpn | grep :443 | wc -l) processo(s)"
echo ""
echo "💡 PRÓXIMOS PASSOS:"
echo "  1. Verifique os sites no navegador"
echo "  2. Se algum site não tiver HTTPS, configure SSL no aapanel:"
echo "     Website → [site] → Settings → SSL → Let's Encrypt → Apply"
echo "  3. Após configurar SSL, recarregue: /etc/init.d/nginx reload"
echo ""
echo "📝 COMANDOS ÚTEIS:"
echo "  - Status: /etc/init.d/nginx status"
echo "  - Recarregar: /etc/init.d/nginx reload"
echo "  - Reiniciar: /etc/init.d/nginx restart"
echo "  - Logs: tail -f /www/server/nginx/logs/error.log"
echo ""

