#!/bin/bash

# 🚀 Script de Deploy Automatizado
# Controle Financeiro - Deploy Script

echo "🚀 Iniciando deploy do Controle Financeiro..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para exibir mensagens coloridas
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Verificar se Node.js está instalado
check_node() {
    print_step "Verificando Node.js..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js não está instalado. Instale o Node.js primeiro."
        exit 1
    fi
    
    NODE_VERSION=$(node -v)
    print_message "Node.js encontrado: $NODE_VERSION"
}

# Verificar se npm está instalado
check_npm() {
    print_step "Verificando npm..."
    if ! command -v npm &> /dev/null; then
        print_error "npm não está instalado."
        exit 1
    fi
    
    NPM_VERSION=$(npm -v)
    print_message "npm encontrado: $NPM_VERSION"
}

# Verificar arquivo .env
check_env() {
    print_step "Verificando arquivo .env..."
    if [ ! -f ".env" ]; then
        print_warning "Arquivo .env não encontrado. Criando a partir do env.example..."
        if [ -f "env.example" ]; then
            cp env.example .env
            print_message "Arquivo .env criado. Configure suas variáveis de ambiente."
        else
            print_error "Arquivo env.example não encontrado."
            exit 1
        fi
    else
        print_message "Arquivo .env encontrado."
    fi
}

# Instalar dependências
install_dependencies() {
    print_step "Instalando dependências..."
    npm install
    if [ $? -eq 0 ]; then
        print_message "Dependências instaladas com sucesso."
    else
        print_error "Erro ao instalar dependências."
        exit 1
    fi
}

# Build do projeto
build_project() {
    print_step "Fazendo build do projeto..."
    npm run build
    if [ $? -eq 0 ]; then
        print_message "Build concluído com sucesso."
    else
        print_error "Erro no build do projeto."
        exit 1
    fi
}

# Testar build localmente
test_build() {
    print_step "Testando build localmente..."
    npm run preview &
    PREVIEW_PID=$!
    
    # Aguardar um pouco para o servidor iniciar
    sleep 3
    
    # Verificar se o servidor está rodando
    if curl -s http://localhost:4173 > /dev/null; then
        print_message "Build testado com sucesso em http://localhost:4173"
        kill $PREVIEW_PID 2>/dev/null
    else
        print_warning "Não foi possível testar o build automaticamente."
        print_message "Você pode testar manualmente com: npm run preview"
    fi
}

# Deploy no Vercel
deploy_vercel() {
    print_step "Deploy no Vercel..."
    
    # Verificar se Vercel CLI está instalado
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI não encontrado. Instalando..."
        npm install -g vercel
    fi
    
    # Verificar se está logado no Vercel
    if ! vercel whoami &> /dev/null; then
        print_warning "Você precisa fazer login no Vercel primeiro."
        print_message "Execute: vercel login"
        return 1
    fi
    
    # Deploy
    vercel --prod
    if [ $? -eq 0 ]; then
        print_message "Deploy no Vercel concluído com sucesso!"
    else
        print_error "Erro no deploy do Vercel."
        return 1
    fi
}

# Deploy no Netlify
deploy_netlify() {
    print_step "Deploy no Netlify..."
    
    # Verificar se Netlify CLI está instalado
    if ! command -v netlify &> /dev/null; then
        print_warning "Netlify CLI não encontrado. Instalando..."
        npm install -g netlify-cli
    fi
    
    # Deploy
    netlify deploy --prod --dir=dist
    if [ $? -eq 0 ]; then
        print_message "Deploy no Netlify concluído com sucesso!"
    else
        print_error "Erro no deploy do Netlify."
        return 1
    fi
}

# Deploy no GitHub Pages
deploy_github_pages() {
    print_step "Deploy no GitHub Pages..."
    
    # Verificar se gh-pages está instalado
    if ! npm list gh-pages &> /dev/null; then
        print_warning "gh-pages não encontrado. Instalando..."
        npm install --save-dev gh-pages
    fi
    
    # Deploy
    npm run deploy
    if [ $? -eq 0 ]; then
        print_message "Deploy no GitHub Pages concluído com sucesso!"
    else
        print_error "Erro no deploy do GitHub Pages."
        return 1
    fi
}

# Menu principal
show_menu() {
    echo ""
    echo "🎯 Escolha uma opção de deploy:"
    echo "1) Vercel (Recomendado)"
    echo "2) Netlify"
    echo "3) GitHub Pages"
    echo "4) Apenas build (sem deploy)"
    echo "5) Sair"
    echo ""
    read -p "Digite sua escolha (1-5): " choice
}

# Função principal
main() {
    echo "🎉 Bem-vindo ao script de deploy do Controle Financeiro!"
    echo ""
    
    # Verificações iniciais
    check_node
    check_npm
    check_env
    
    # Instalar dependências
    install_dependencies
    
    # Build do projeto
    build_project
    
    # Testar build
    test_build
    
    # Menu de deploy
    while true; do
        show_menu
        
        case $choice in
            1)
                deploy_vercel
                break
                ;;
            2)
                deploy_netlify
                break
                ;;
            3)
                deploy_github_pages
                break
                ;;
            4)
                print_message "Build concluído. Arquivos prontos em ./dist"
                break
                ;;
            5)
                print_message "Saindo..."
                exit 0
                ;;
            *)
                print_error "Opção inválida. Tente novamente."
                ;;
        esac
    done
    
    echo ""
    print_message "🎉 Processo concluído!"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Configure seu domínio no provedor escolhido"
    echo "2. Configure as variáveis de ambiente"
    echo "3. Configure SSL se necessário"
    echo "4. Teste todas as funcionalidades"
    echo ""
}

# Executar script
main "$@" 