@echo off
setlocal

set ver=3.1.2
set title=ModernActiveDesktop System Plugin %ver% Installer
title %title%
echo %title%
echo.
echo Copyright (c) 2024 Ingan121
echo Licensed under the MIT License
echo.
cd /d "%~dp0"

for /f "tokens=4-5 delims=. " %%i in ('ver') do set winver=%%i.%%j
if not "%winver%" == "10.0" (
    echo ModernActiveDesktop System Plugin requires Windows 10 or higher.
    echo Press any key to close this window.
    timeout 20 >nul
    exit /b
)

echo ----------------------------------------------------------
echo.
echo Please select an action:
echo.
echo 1. Install / Update ModernActiveDesktop System Plugin
echo 2. Run ModernActiveDesktop System Plugin without instlling
echo 3. Extract ModernActiveDesktop System Plugin without installing
echo 4. Uninstall ModernActiveDesktop System Plugin
echo 5. View license
echo 6. Exit
echo.

:choice
set /p choice=Choice: 
echo.

if %choice% == 1 (
    if exist systemplugin (
        call :kill
        echo Deleting the previous installation...
        rmdir /s /q systemplugin
    )
    call :unzip
    call :autostart
    call :start
    
    echo.
    echo Done!
    echo To uninstall, run this program again and enter 4.
    echo Press any key to close this window.
    timeout 20 >nul
) else if %choice% == 2 (
    call :ensureinst
    call :start
    
    echo.
    echo Done!
    echo Press any key to close this window.
    timeout 20 >nul
) else if %choice% == 3 (
    call :unzip
    
    echo.
    echo Done!
    echo Press any key to close this window.
    timeout 20 >nul
) else if %choice% == 4 (
    if not exist systemplugin (
        echo ModernActiveDesktop System Plugin %ver% is not installed!
        echo.
        goto choice
    )

    call :kill

    echo.
    <nul set /p =Removing autostart... 
    reg delete HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run /v MADSysPlug /f >nul 2>nul
    if not errorlevel 1 (echo Success) else echo Not installed

    echo.
    echo Deleting ModernActiveDesktop System Plugin files...
    rmdir /s /q systemplugin
    
    echo.
    echo Done!
    echo Press any key to close this window.
    timeout 20 >nul
) else if %choice% == 5 (
    start notepad license.txt
    goto choice
) else if %choice% == 6 (
    exit /b
) else (
    echo Wrong selection!
    echo.
    goto choice
)
goto :eof

:unzip
<nul set /p =Extracting ModernActiveDesktop System Plugin %ver%... 
powershell -command "Expand-Archive -Path systemplugin.zip -DestinationPath systemplugin -Force"
if not errorlevel 1 (echo Success) else echo Fail
goto :eof

:autostart
<nul set /p =Registering autostart... 
reg add HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run /v MADSysPlug /t REG_SZ /d "%cd%\systemplugin\MADSysPlug.exe" /f >nul
if not errorlevel 1 (echo Success) else echo Fail
goto :eof

:start
echo Starting ModernActiveDesktop System Plugin %ver%...
start cmd /c start systemplugin\MADSysPlug.exe
goto :eof

:kill
<nul set /p =Killing ModernActiveDesktop System Plugin process... 
taskkill -im MADSysPlug.exe -f >nul 2>nul
if not errorlevel 1 (echo Success) else echo Not running
timeout 1 >nul
goto :eof

:ensureinst
if not exist systemplugin\MADSysPlug.exe (
    call :unzip
)