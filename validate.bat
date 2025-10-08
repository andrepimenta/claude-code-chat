@echo off
echo ================================================
echo   VALIDACAO JURISANALYTICA + CLAUDE CODE CHAT
echo ================================================
echo.

echo [1/5] Verificando Node.js...
node --version || (echo ERRO: Node.js nao encontrado! && exit /b 1)
echo OK!
echo.

echo [2/5] Verificando npm...
npm --version || (echo ERRO: npm nao encontrado! && exit /b 1)
echo OK!
echo.

echo [3/5] Verificando Claude CLI...
claude --version || (echo AVISO: Claude CLI nao encontrado! Instale com: npm install -g @anthropic-ai/claude-code)
echo.

echo [4/5] Compilando projeto...
call npm run compile || (echo ERRO: Falha na compilacao! && exit /b 1)
echo OK!
echo.

echo [5/5] Verificando arquivos compilados...
if exist "out\extension.js" (
    echo ✓ extension.js
) else (
    echo ✗ extension.js NAO ENCONTRADO
    exit /b 1
)

if exist "out\framework\FrameworkManager.js" (
    echo ✓ framework\FrameworkManager.js
) else (
    echo ✗ framework\FrameworkManager.js NAO ENCONTRADO
    exit /b 1
)

echo.
echo ================================================
echo   ✓ VALIDACAO COMPLETA - TUDO OK!
echo ================================================
echo.
echo Proximos passos:
echo   1. Configurar: .vscode/settings.json
echo   2. Ajustar: jurisanalytica.frameworkPath
echo   3. Pressionar F5 no VS Code para testar
echo.
echo Documentacao:
echo   - SETUP_GUIDE.md
echo   - JURISANALYTICA_INTEGRATION.md
echo   - RESUMO_FINAL.md
echo.

pause
