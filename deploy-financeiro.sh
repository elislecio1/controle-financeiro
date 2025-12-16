#!/bin/bash

# Script de Deploy para financeiro.donsantosba.com.br
# Execute este script no servidor via SSH

echo "🚀 Iniciando deploy do Sistema de Controle Financeiro..."
echo "📁 Domínio: financeiro.donsantosba.com.br"
echo "📂 Diretório: /www/wwwroot/financeiro.donsantosba.com.br"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Diretório do projeto
PROJECT_DIR="/www/wwwroot/financeiro.donsantosba.com.br"

# Navegar para o diretório do projeto
cd $PROJECT_DIR

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro: Não foi possível acessar o diretório $PROJECT_DIR${NC}"
    echo "Certifique-se de que o diretório existe e você tem permissões."
    exit 1
fi

echo -e "${GREEN}✓ Diretório acessado: $(pwd)${NC}"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Erro: Node.js não está instalado.${NC}"
    echo "Instale o Node.js pelo aapanel: App Store → Node.js Version Manager"
    exit 1
fi

echo -e "${GREEN}✓ Node.js encontrado: $(node -v)${NC}"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Erro: npm não está instalado.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm encontrado: $(npm -v)${NC}"

# Verificar se o repositório está clonado
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}⚠ package.json não encontrado. Clonando repositório...${NC}"
    git clone https://github.com/elislecio1/controle-financeiro.git .
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erro ao clonar repositório.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Repositório clonado com sucesso.${NC}"
fi

# Verificar/criar arquivo .env
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ Arquivo .env não encontrado. Criando...${NC}"
    cat > .env << EOF
VITE_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
NEXT_PUBLIC_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
EOF
    echo -e "${GREEN}✓ Arquivo .env criado.${NC}"
    echo -e "${YELLOW}⚠ Verifique se as credenciais do Supabase estão corretas.${NC}"
else
    echo -e "${GREEN}✓ Arquivo .env encontrado.${NC}"
fi

# Instalar dependências
echo ""
echo "📦 Instalando dependências..."
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao instalar dependências.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Dependências instaladas com sucesso.${NC}"

# Fazer build
echo ""
echo "🔨 Fazendo build do projeto..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao fazer build.${NC}"
    exit 1
fi

# Verificar se a pasta dist foi criada
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Erro: Pasta dist não foi criada.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build concluído com sucesso.${NC}"

# Ajustar permissões
echo ""
echo "🔐 Ajustando permissões..."
chown -R www:www $PROJECT_DIR
chmod -R 755 $PROJECT_DIR
chmod -R 755 dist/

echo -e "${GREEN}✓ Permissões ajustadas.${NC}"

# Verificar tamanho do build
BUILD_SIZE=$(du -sh dist | cut -f1)
echo ""
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "📊 Tamanho do build: ${BUILD_SIZE}"
echo ""
echo "📝 Próximos passos no aapanel:"
echo "1. Configure o Nginx: Website → financeiro.donsantosba.com.br → Settings → Config File"
echo "2. Use o arquivo nginx-financeiro.conf como referência"
echo "3. Configure o SSL: Website → Settings → SSL → Let's Encrypt"
echo "4. Acesse: https://financeiro.donsantosba.com.br"
echo ""
echo -e "${GREEN}🎉 Pronto para produção!${NC}"

