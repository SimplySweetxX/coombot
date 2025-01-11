@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

REM Define the full path to the marker file
SET markerFile=%~dp0dependencies_installed.txt

REM Check if the marker file exists
IF NOT EXIST "%markerFile%" (
    echo First run detected. Installing dependencies...
    npm install
    IF ERRORLEVEL 1 (
        echo Failed to install dependencies. Please check your setup.
        pause
        exit /b
    )
    echo Dependencies installed successfully.
    echo Creating marker file...
    echo Dependencies installed on %date% at %time% > "%markerFile%"
    echo Now, run this file again to start the bot.
    pause
    exit /b
)

REM Subsequent runs: Deploy commands and start the bot
echo Dependencies already installed. Starting the bot...
npm run deploy

REM Keep the terminal open after the bot stops
pause