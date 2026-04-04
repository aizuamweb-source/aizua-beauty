@echo off
REM AizuaBeauty — Initial push to GitHub
REM Run this from: C:\Users\aizua\AizuaLabs\aizua-beauty\

cd /d C:\Users\aizua\AizuaLabs\aizua-beauty

git init
git checkout -b main
git add -A
git commit -m "feat: initial AizuaBeauty store — natural beauty & fashion"
git remote add origin https://github.com/aizuamweb-source/aizua-beauty.git
git push -u origin main

echo.
echo Done! Now go to https://vercel.com/new and import aizua-beauty
echo Then add env vars from .env.example
pause
