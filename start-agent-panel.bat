@echo off
echo Starting Agent Panel...
echo.
echo Panel: http://localhost:5050
echo Stop: Ctrl+C
echo.
cd /d "%~dp0.claude\panel"
python app.py
pause
