#!/bin/bash

# =====================================================
# SCRIPT DE CONFIGURAÇÃO ÚNICA - GIT SAFE.DIRECTORY
# =====================================================
# Execute este script UMA VEZ no servidor como root ou o usuário que executa o Git Manager
# Isso resolve o problema de "dubious ownership" permanentemente

PROJECT_DIR="/www/wwwroot/sites/elislecio/cf.don.cim.br"

echo "🔧 Configurando Git safe.directory para $PROJECT_DIR"

# Configurar para o usuário atual
git config --global --add safe.directory "$PROJECT_DIR"
git config --global --add safe.directory "*"

# Configurar para root (caso o Git Manager execute como root)
if [ "$EUID" -eq 0 ]; then
    echo "✅ Configurado para root"
else
    echo "⚠️  Execute como root para configurar também para root:"
    echo "   sudo git config --global --add safe.directory '$PROJECT_DIR'"
    echo "   sudo git config --global --add safe.directory '*'"
fi

# Configurar localmente no repositório
cd "$PROJECT_DIR" 2>/dev/null && {
    git config --local --add safe.directory "$PROJECT_DIR" 2>/dev/null || true
    echo "✅ Configurado localmente no repositório"
}

echo "✅ Configuração concluída!"
echo ""
echo "Para verificar, execute:"
echo "  git config --global --get-all safe.directory"
