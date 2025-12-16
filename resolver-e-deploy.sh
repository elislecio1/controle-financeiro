#!/bin/bash
# ============================================
# Script para Resolver Conflitos Git e Fazer Deploy
# ============================================

PROJECT_DIR="/www/wwwroot/cf.don.cim.br"
GIT_BRANCH="main"

echo "=========================================="
echo "🔧 RESOLVENDO CONFLITOS E FAZENDO DEPLOY"
echo "=========================================="

cd "$PROJECT_DIR" || exit 1

# 1. Salvar mudanças locais
echo "📦 Salvando mudanças locais..."
git stash save "Mudanças locais antes do pull - $(date +%Y%m%d-%H%M%S)" || true

# 2. Fazer pull
echo "⬇️ Fazendo pull do repositório..."
if git pull origin "$GIT_BRANCH" --no-edit; then
    echo "✅ Repositório atualizado"
else
    echo "⚠️ Erro no pull. Tentando reset hard..."
    git fetch origin "$GIT_BRANCH"
    git reset --hard "origin/$GIT_BRANCH"
    echo "✅ Repositório atualizado (reset hard)"
fi

# 3. Dar permissão ao script de deploy
echo "🔐 Dando permissão ao script de deploy..."
chmod +x deploy-completo-aapanel.sh 2>/dev/null || echo "⚠️ Script não encontrado ainda"

# 4. Executar deploy
if [ -f "deploy-completo-aapanel.sh" ]; then
    echo "🚀 Executando deploy completo..."
    bash deploy-completo-aapanel.sh
else
    echo "❌ Script de deploy não encontrado"
    echo "📋 Arquivos disponíveis:"
    ls -la *.sh 2>/dev/null || echo "Nenhum script .sh encontrado"
fi

