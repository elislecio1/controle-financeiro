@echo off
REM Script para executar o projeto localmente no Windows
REM Uso: executar-local.bat

echo ========================================
echo  Executando Projeto Localmente
echo ========================================
echo.

REM Verificar se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Node.js nao encontrado!
    echo Por favor, instale Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js encontrado
node --version

REM Verificar se npm está instalado
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] npm nao encontrado!
    pause
    exit /b 1
)

echo [OK] npm encontrado
npm --version
echo.

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERRO] Falha ao instalar dependencias!
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas
    echo.
)

REM Verificar se .env existe
if not exist ".env" (
    echo [AVISO] Arquivo .env nao encontrado!
    echo [INFO] Criando .env a partir do exemplo...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [OK] Arquivo .env criado
        echo [AVISO] Por favor, edite o arquivo .env com suas credenciais do Supabase!
        echo.
    ) else (
        echo [ERRO] Arquivo .env.example nao encontrado!
        echo [INFO] Criando .env basico...
        (
            echo VITE_SUPABASE_URL=https://seu-projeto.supabase.co
            echo VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
        ) > .env
        echo [OK] Arquivo .env criado
        echo [AVISO] Por favor, edite o arquivo .env com suas credenciais do Supabase!
        echo.
    )
)

echo ========================================
echo  Iniciando servidor de desenvolvimento
echo ========================================
echo.
echo O navegador abrira automaticamente em http://localhost:3000
echo.
echo Para parar o servidor, pressione Ctrl+C
echo.

REM Executar o projeto
call npm run dev

pause

