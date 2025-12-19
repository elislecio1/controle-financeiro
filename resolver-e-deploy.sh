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

# 1. Salvar mudanças locais e arquivos não rastreados
echo "📦 Salvando mudanças locais..."
git stash save "Mudanças locais antes do pull - $(date +%Y%m%d-%H%M%S)" || true

# 1.1. Mover arquivos não rastreados que podem conflitar
echo "📦 Movendo arquivos não rastreados que podem conflitar..."
UNTRACKED_FILES=$(git ls-files --others --exclude-standard)
if [ -n "$UNTRACKED_FILES" ]; then
    BACKUP_DIR=".backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    echo "$UNTRACKED_FILES" | while read -r file; do
        if [ -f "$file" ]; then
            echo "  Movendo: $file"
            mkdir -p "$BACKUP_DIR/$(dirname "$file")" 2>/dev/null || true
            mv "$file" "$BACKUP_DIR/$file" 2>/dev/null || true
        fi
    done
    if [ -d "$BACKUP_DIR" ] && [ "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        echo "✅ Arquivos não rastreados movidos para: $BACKUP_DIR"
    fi
fi

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

