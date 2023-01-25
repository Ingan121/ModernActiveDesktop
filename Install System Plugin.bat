@echo off
setlocal

set title=ModernActiveDesktop System Plugin 2.1.0 Installer
title %title%
echo %title%
echo.
echo Copyright (c) 2023 Ingan121/RomanHue
echo Licensed under the MIT License
echo.
cd /d "%~dp0"

echo ----------------------------------------------------------
echo.
echo Please select a action:
echo.
echo 1. Install ModernActiveDesktop System Plugin 2.1.0
echo 2. Run ModernActiveDesktop System Plugin 2.1.0 without instlling
echo 3. Uninstall ModernActiveDesktop System Plugin 2.1.0
echo 4. View license
echo 5. Exit
echo.

:choice
set /p choice=Choice: 
echo.

if %choice% == 1 (
    <nul set /p =Registering autostart... 
    reg add HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run /v MADSysPlug /t REG_SZ /d "%cd%\systemplugin\MADSysPlug.exe" /f >nul
    if not errorlevel 1 (echo Success) else echo Fail
    
    echo Starting ModernActiveDesktop System Plugin 2.1.0...
    start cmd /c start systemplugin\MADSysPlug.exe
    
    echo.
    echo Done!
    echo To uninstall, run this program again and enter 3.
    echo Press any key to close this window.
    timeout 20 >nul
) else if %choice% == 2 (
    echo Starting ModernActiveDesktop System Plugin 2.1.0...
    start cmd /c start systemplugin\MADSysPlug.exe
    
    echo.
    echo Done!
    echo Press any key to close this window.
    timeout 20 >nul
) else if %choice% == 3 (
    <nul set /p =Killing ModernActiveDesktop System Plugin process... 
    taskkill -im MADSysPlug.exe -f >nul 2>nul
    if not errorlevel 1 (echo Success) else echo Not running

    echo.
    <nul set /p =Removing autostart... 
    reg delete HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run /v MADSysPlug /f >nul 2>nul
    if not errorlevel 1 (echo Success) else echo Not installed
    
    echo.
    echo Done!
    echo Press any key to close this window.
    timeout 20 >nul
) else if %choice% == 4 (
    start notepad license.txt
    goto choice
) else if %choice% == 5 (
    exit /b
) else (
    echo Wrong selection!
    goto choice
)