@echo off
REM ============================================================
REM  Inicia el sitio IES 11 en local (servidor HTTP estatico)
REM  Doble clic para usar. Requiere Python instalado.
REM ============================================================
setlocal
chcp 65001 >nul

REM Ir a la raiz del proyecto (esta carpeta es qa\)
cd /d "%~dp0.."

set PORT=8080

REM Si el puerto esta ocupado, elegir otro automaticamente
for /f %%i in ('powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue) { 'busy' }"') do (
  if "%%i"=="busy" set PORT=8081
)

echo.
echo  Proyecto: %CD%
echo  Iniciando servidor en http://localhost:%PORT%/
echo.
echo  Deja esta ventana abierta mientras probas el sitio.
echo  Para detenerlo: Ctrl + C
echo.

REM Abrir el navegador cuando el servidor ya este escuchando
start "" cmd /c "timeout /t 2 >nul & start http://localhost:%PORT%/"

python -m http.server %PORT%

echo.
echo  Servidor detenido.
pause
