#!/bin/bash

# Script de Deploy Simples - Controle Financeiro
# Atualiza repositório e executa as alterações

# Diretório do projeto
PROJECT_DIR="/www/wwwroot/sites/elislecio/cf.don.cim.br"

echo "🚀 Iniciando deploy..."

# Navegar para o diretório do projeto
echo "📂 Navegando para o diretório do projeto..."
cd "$PROJECT_DIR" || exit 1

if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado em $PROJECT_DIR"
    exit 1
fi

echo "✓ Diretório: $(pwd)"

# Verificar status do git
echo "🔍 Verificando status do repositório..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Mudanças locais detectadas. Fazendo stash..."
    git stash save "Stash antes do deploy - $(date '+%Y-%m-%d %H:%M:%S')" || {
        echo "❌ Erro ao fazer stash. Tentando reset hard..."
        read -p "⚠️  Deseja descartar mudanças locais? (s/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            git reset --hard HEAD || exit 1
            echo "✓ Mudanças locais descartadas"
        else
            echo "❌ Deploy cancelado. Resolva os conflitos manualmente."
            exit 1
        fi
    }
    echo "✓ Mudanças locais salvas em stash"
fi

# Atualizar repositório
echo "📥 Atualizando repositório..."
git fetch origin main || exit 1
git pull origin main || {
    echo "❌ Erro ao fazer pull. Tentando reset e pull novamente..."
    git reset --hard origin/main || exit 1
    echo "✓ Repositório atualizado com reset hard"
}

# Instalar dependências
echo "📦 Instalando dependências..."
npm install || exit 1

# Build do projeto
echo "🔨 Fazendo build do projeto..."
npm run build || exit 1

echo "✅ Deploy concluído com sucesso!"
echo "📁 Arquivos prontos em ./dist"
