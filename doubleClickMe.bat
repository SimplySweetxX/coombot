@echo off

REM Check if node_modules directory exists
IF NOT EXIST "node_modules" (
    echo Installing dependencies...
    npm install
) ELSE (
    echo Dependencies are already installed.
)

REM Deploy commands
echo Deploying commands...
npm run deploy

REM Start the bot
echo Starting the bot...
npm run deploy