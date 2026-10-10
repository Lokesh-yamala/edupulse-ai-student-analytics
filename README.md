# EduPulse AI — Student Success Intelligence

A hackathon MVP for Challenge #04: AI-Powered Student Analytics & Success Platform.

## Features
- Student overview dashboard and risk distribution
- Student directory with search and risk filters
- Random Forest prototype classifier for `On Track`, `Watchlist`, and `Needs Support`
- Student Success Score and explainable warning indicators
- AI Risk Lab simulator with recommended support actions
- CSV upload endpoint with schema validation
- Synthetic demo records; no real student personal data required

## Requirements
- Python 3.10+ (Python 3.11 recommended)
- Node.js 20+

## Run on Windows PowerShell

### 1. Start backend
```powershell
cd edupulse-ai\backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn main:app --reload
```
API: http://127.0.0.1:8000  
Swagger docs: http://127.0.0.1:8000/docs

### 2. Start frontend in a second PowerShell terminal
```powershell
cd edupulse-ai\frontend
npm install
npm run dev
```
Open the localhost URL shown by Vite, usually http://localhost:5173.

## CSV format
Required column names: `attendance`, `cgpa`, `assignment_completion`, `lms_activity`, `backlogs`.
A sample file is in `backend/sample_students.csv`.

## Important model note
The bundled model is trained on synthetic demonstration records. The reported training score is not a reliable estimate of real-world performance. For an actual deployment or evaluation, train and validate with an appropriate permitted dataset, check class balance and leakage, and report hold-out metrics. Do not use the prototype score as a final judgment about any student. Human review and privacy controls are required.
