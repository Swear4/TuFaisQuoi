@echo off
echo.
echo ========================================
echo   TEST LOCAL
echo ========================================
echo.
echo Lancement de l'app web en local...
echo.
echo L'app s'ouvrira dans votre navigateur
echo URL: http://localhost:8081
echo.
echo Appuyez sur Ctrl+C pour arrêter le serveur
echo.

cd /d "%~dp0"
call npm run web
