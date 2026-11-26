@echo off
title SIH26032 Online Procurement Assistance Center Portal
echo ======================================================================
echo   SIH26032: Online Procurement Assistance Center Portal
echo   Starting Vite Development Server...
echo ======================================================================
set PATH=C:\Users\boddu\AppData\Local\OpenAI\Codex\runtimes\cua_node\dd584937042db7da\bin;%PATH%
call npm.cmd run dev -- --port 5173 --host
pause

