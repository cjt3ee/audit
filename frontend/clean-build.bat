@echo off
echo Cleaning Next.js build files...

REM 停止任何运行的Next.js进程
taskkill /f /im node.exe 2>nul

REM 等待一下确保进程完全停止
timeout /t 2 /nobreak >nul

REM 删除.next目录
if exist .next (
    echo Removing .next directory...
    rmdir /s /q .next 2>nul
    if exist .next (
        echo Forcing removal of .next directory...
        rd /s /q .next 2>nul
    )
)

REM 删除node_modules/.cache
if exist node_modules\.cache (
    echo Removing node_modules cache...
    rmdir /s /q node_modules\.cache 2>nul
)

echo Cleaning completed!
echo You can now run: npm run dev
pause