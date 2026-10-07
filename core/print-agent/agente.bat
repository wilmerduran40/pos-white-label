@echo off
cd /d %~dp0
set API_URL=https://kikifastfood-kiki-4dekic-31140e-159-195-16-73.sslip.io
set AGENT_TOKEN=1cf9acf251006946283b4755513a694c8eec405d
set PRINTER_HOST=192.168.0.100
set PRINTER_PORT=9100
set PRINTER_WIDTH=80
set PRINTER_MODE=tcp
node agent.js