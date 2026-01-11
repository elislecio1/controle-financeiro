# Script para monitorar o servidor em tempo real
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📊 Monitoramento do Servidor de Desenvolvimento" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verificar se o servidor está rodando
$port = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($port) {
    Write-Host "✅ Servidor está RODANDO na porta 3000" -ForegroundColor Green
    Write-Host "📍 URL: http://localhost:3000" -ForegroundColor Yellow
    Write-Host ""
    
    # Abrir navegador
    Write-Host "🌐 Abrindo navegador..." -ForegroundColor Cyan
    Start-Process "http://localhost:3000"
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  📈 Status do Servidor" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    # Mostrar informações da conexão
    Write-Host "Conexões ativas:" -ForegroundColor Yellow
    Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Format-Table -AutoSize
    
    Write-Host ""
    Write-Host "Processo Node.js:" -ForegroundColor Yellow
    Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Select-Object Id, ProcessName, @{Name="CPU(s)";Expression={$_.CPU}}, @{Name="Memória(MB)";Expression={[math]::Round($_.WorkingSet64/1MB,2)}} | Format-Table -AutoSize
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  💡 Dicas" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "• O servidor está rodando em background" -ForegroundColor White
    Write-Host "• Mudanças no código são refletidas automaticamente (Hot Reload)" -ForegroundColor White
    Write-Host "• Para ver os logs completos, execute: npm run dev" -ForegroundColor White
    Write-Host "• Para parar o servidor, encontre o processo e finalize-o" -ForegroundColor White
    Write-Host ""
    Write-Host "Pressione qualquer tecla para atualizar o status..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
} else {
    Write-Host "❌ Servidor NÃO está rodando na porta 3000" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para iniciar o servidor, execute:" -ForegroundColor Yellow
    Write-Host "  npm run dev" -ForegroundColor Cyan
    Write-Host ""
}

