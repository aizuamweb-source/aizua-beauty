@echo off
cd /d "%~dp0"
echo Eliminando lock files si existen...
if exist .git\index.lock del /f .git\index.lock
if exist .git\HEAD.lock del /f .git\HEAD.lock
if exist .git\COMMIT_EDITMSG.lock del /f .git\COMMIT_EDITMSG.lock
echo.
echo Commiteando fix Brevo newsletter...
git add app/api/newsletter/route.ts
git commit -m "fix: Brevo listId fallbacks #5/#6 cuando env vars no configuradas"
git push origin main
echo.
echo PUSH BEAUTY BREVO FIX COMPLETADO
pause
