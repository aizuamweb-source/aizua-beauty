@echo off
cd /d "%~dp0"
echo Eliminando lock files si existen...
if exist .git\index.lock del /f .git\index.lock
if exist .git\HEAD.lock del /f .git\HEAD.lock
if exist .git\COMMIT_EDITMSG.lock del /f .git\COMMIT_EDITMSG.lock
echo.
echo Commiteando filtro brand=beauty en blog...
git add "app/[locale]/blog/page.tsx" "app/[locale]/blog/[slug]/page.tsx"
git commit -m "fix(blog): filtrar por brand=beauty en listing y detalle (antes mostraba posts mezclados de store)"
git push origin main
echo.
echo PUSH BEAUTY BLOG FIX COMPLETADO
pause
