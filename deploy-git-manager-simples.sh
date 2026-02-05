#!/bin/bash

# =====================================================
# SCRIPT DE DEPLOY SIMPLES PARA GIT MANAGER
# =====================================================
# Versão simplificada - apenas atualiza e faz build
# Use este se o script completo der problemas

PROJECT_DIR="/www/wwwroot/sites/elislecio/cf.don.cim.br"

echo "🚀 Iniciando deploy..."

cd "$PROJECT_DIR" || exit 1

# Função git_safe para resolver "dubious ownership"
git_safe() {
    git -c safe.directory="$PROJECT_DIR" "$@"
}

# Atualizar repositório (forçar reset)
git_safe fetch origin main
git_safe reset --hard origin/main
git_safe clean -df

# Instalar e build
npm install && npm run build

echo "✅ Deploy concluído!"
