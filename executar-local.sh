#!/bin/bash

###############################################################################
# Script para executar o projeto localmente (Linux/Mac)
# Uso: bash executar-local.sh
###############################################################################

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  🚀 Executando Projeto Localmente"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado!${NC}"
    echo "Por favor, instale Node.js: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓ Node.js encontrado: $(node -v)${NC}"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm não encontrado!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm encontrado: $(npm -v)${NC}"
echo ""

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠ Dependências não instaladas. Instalando...${NC}"
    npm install
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erro ao instalar dependências!${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Dependências instaladas${NC}"
    echo ""
fi

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ Arquivo .env não encontrado!${NC}"
    
    if [ -f ".env.example" ]; then
        echo -e "${BLUE}ℹ Criando .env a partir do exemplo...${NC}"
        cp .env.example .env
        echo -e "${GREEN}✓ Arquivo .env criado${NC}"
    else
        echo -e "${BLUE}ℹ Criando .env básico...${NC}"
        cat > .env << 'EOF'
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sua-chave-anon-aqui
EOF
        echo -e "${GREEN}✓ Arquivo .env criado${NC}"
    fi
    
    echo -e "${YELLOW}⚠ IMPORTANTE: Edite o arquivo .env com suas credenciais do Supabase!${NC}"
    echo ""
    read -p "Pressione Enter para continuar ou Ctrl+C para editar o .env primeiro..."
    echo ""
fi

echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}  ✅ Iniciando servidor de desenvolvimento${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}ℹ O navegador abrirá automaticamente em: http://localhost:3000${NC}"
echo -e "${BLUE}ℹ Para parar o servidor, pressione Ctrl+C${NC}"
echo ""

# Executar o projeto
npm run dev

