# Script de Deploy Simples - Controle Financeiro
# Atualiza repositório e executa as alterações

# Diretório do projeto
# Para servidor Linux:
# $PROJECT_DIR = "/www/wwwroot/sites/elislecio/cf.don.cim.br"
# Para desenvolvimento local Windows:
$PROJECT_DIR = "D:\Projetos_aplicacoes\Controle_financeiro"

Write-Host "🚀 Iniciando deploy..." -ForegroundColor Green

# Navegar para o diretório do projeto
Write-Host "📂 Navegando para o diretório do projeto..." -ForegroundColor Yellow
Set-Location $PROJECT_DIR

if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: package.json não encontrado em $PROJECT_DIR" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Diretório: $(Get-Location)" -ForegroundColor Green

# Atualizar repositório
Write-Host "📥 Atualizando repositório..." -ForegroundColor Yellow
git pull origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao atualizar repositório" -ForegroundColor Red
    exit 1
}

# Instalar dependências
Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
    exit 1
}

# Build do projeto
Write-Host "🔨 Fazendo build do projeto..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host "📁 Arquivos prontos em ./dist" -ForegroundColor Cyan
