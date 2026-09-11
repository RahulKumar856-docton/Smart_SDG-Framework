@echo off
echo Installing backend requirements...
python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt

echo Starting backend server...
start cmd /k "venv\Scripts\activate.bat && python app.py"

echo Starting frontend server...
cd client
start cmd /k "npm install && npm run dev"

echo Both servers started!
