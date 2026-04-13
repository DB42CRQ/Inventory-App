@echo off
cd /d "%~dp0"
echo Inventory App wird gestartet...
start http://localhost:5173
npm run dev
pause
