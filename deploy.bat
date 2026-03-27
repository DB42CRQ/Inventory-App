@echo off
cd /d "%~dp0"
echo Deploying...
git add .
set /p msg="Commit-Nachricht: "
git commit -m "%msg%"
git push
echo.
echo Fertig! Vercel deployed automatisch.
pause
