@echo off
echo.
echo ========================================
echo   BUILD POUR VERCEL
echo ========================================
echo.
echo Ce script va construire l'app pour Vercel
echo.

cd /d "%~dp0"

echo [1/3] Nettoyage...
if exist web-build rmdir /s /q web-build

echo [2/3] Construction de l'app web...
call npx expo export:web

echo.
echo [3/3] Terminé !
echo.
echo Le dossier 'web-build' est prêt à être déployé sur Vercel
echo.
echo Prochaine étape :
echo   1. Aller sur vercel.com
echo   2. Créer un nouveau projet
echo   3. Upload le dossier 'web-build' OU connecter GitHub
echo.
pause
