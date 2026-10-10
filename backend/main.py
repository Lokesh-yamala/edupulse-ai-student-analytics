
from io import StringIO

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.ensemble import RandomForestClassifier

app = FastAPI(title="EduPulse AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FEATURES = [
    "attendance",
    "cgpa",
    "assignment_completion",
    "lms_activity",
    "backlogs",
]

students = [
    {
        "id": 1, "name": "Aarav Kumar", "department": "CSE",
        "attendance": 92, "marks": 86, "cgpa": 8.6,
        "assignment_completion": 95, "lms_activity": 80,
        "backlogs": 0,
    },
    {
        "id": 2, "name": "Priya Sharma", "department": "CSE",
        "attendance": 68, "marks": 58, "cgpa": 6.1,
        "assignment_completion": 65, "lms_activity": 48,
        "backlogs": 1,
    },
    {
        "id": 3, "name": "Rahul Reddy", "department": "AIML",
        "attendance": 45, "marks": 39, "cgpa": 4.8,
        "assignment_completion": 40, "lms_activity": 25,
        "backlogs": 3,
    },
    {
        "id": 4, "name": "Sneha Rao", "department": "Data Science",
        "attendance": 88, "marks": 79, "cgpa": 8.0,
        "assignment_completion": 90, "lms_activity": 75,
        "backlogs": 0,
    },
    {
        "id": 5, "name": "Kiran Kumar", "department": "ECE",
        "attendance": 61, "marks": 52, "cgpa": 5.8,
        "assignment_completion": 55, "lms_activity": 42,
        "backlogs": 2,
    },
]


def calculate_risk(attendance, marks):
    if attendance < 50 or marks < 40:
        return "High"
    if attendance < 75 or marks < 60:
        return "Medium"
    return "Low"


def refresh_student_risks():
    for student in students:
        student["risk"] = calculate_risk(
            student["attendance"],
            student["marks"],
        )


refresh_student_risks()

# Synthetic training examples for demonstration purposes.
training_data = pd.DataFrame(
    [
        [95, 9.0, 95, 90, 0],
        [88, 8.0, 85, 75, 0],
        [80, 7.5, 80, 70, 0],
        [70, 6.5, 65, 50, 1],
        [62, 5.8, 55, 40, 2],
        [45, 4.5, 35, 25, 4],
        [35, 3.8, 20, 15, 5],
        [90, 8.5, 92, 88, 0],
        [72, 6.8, 68, 55, 1],
        [50, 5.0, 45, 30, 3],
    ],
    columns=FEATURES,
)

training_labels = [
    "Low", "Low", "Low", "Medium", "Medium",
    "High", "High", "Low", "Medium", "High",
]

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
)
model.fit(training_data, training_labels)


class PredictionInput(BaseModel):
    attendance: float = Field(ge=0, le=100)
    cgpa: float = Field(ge=0, le=10)
    assignment_completion: float = Field(ge=0, le=100)
    lms_activity: float = Field(ge=0, le=100)
    backlogs: int = Field(ge=0)


@app.get("/")
def root():
    return {"message": "EduPulse AI API is running"}


@app.get("/api/summary")
def summary():
    total = len(students)
    high = sum(s["risk"] == "High" for s in students)
    medium = sum(s["risk"] == "Medium" for s in students)
    low = sum(s["risk"] == "Low" for s in students)

    average_attendance = (
        round(sum(s["attendance"] for s in students) / total, 2)
        if total else 0
    )

    return {
        "total_students": total,
        "high_risk": high,
        "medium_risk": medium,
        "low_risk": low,
        "average_attendance": average_attendance,
    }


@app.get("/api/students")
def get_students():
    return {"students": students}


@app.post("/api/predict")
def predict_risk(data: PredictionInput):
    values = pd.DataFrame(
        [[
            data.attendance,
            data.cgpa,
            data.assignment_completion,
            data.lms_activity,
            data.backlogs,
        ]],
        columns=FEATURES,
    )

    prediction = model.predict(values)[0]
    probabilities = model.predict_proba(values)[0]

    return {
        "risk": str(prediction),
        "probabilities": {
            str(label): round(float(probability), 4)
            for label, probability in zip(model.classes_, probabilities)
        },
        "message": (
            "This is a demonstration prediction, not a definitive assessment "
            "of a student's academic future."
        ),
    }


@app.post("/api/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a CSV file.",
        )

    try:
        contents = await file.read()
        data = pd.read_csv(StringIO(contents.decode("utf-8-sig")))
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="Could not read the CSV file. Check its format and encoding.",
        ) from exc

    required = {
        "attendance",
        "marks",
        "department",
    }

    missing = required - set(data.columns)

    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required CSV columns: {', '.join(sorted(missing))}",
        )

    if data.empty:
        raise HTTPException(
            status_code=400,
            detail="The CSV file contains no student records.",
        )

    try:
        data["attendance"] = pd.to_numeric(data["attendance"], errors="raise")
        data["marks"] = pd.to_numeric(data["marks"], errors="raise")

        if not data["attendance"].between(0, 100).all():
            raise ValueError("Attendance must be between 0 and 100.")

        if not data["marks"].between(0, 100).all():
            raise ValueError("Marks must be between 0 and 100.")

        if data["department"].isna().any():
            raise ValueError("Department cannot be empty.")

        uploaded_students = []

        for index, row in data.iterrows():
            attendance = float(row["attendance"])
            marks = float(row["marks"])

            student = {
                "id": index + 1,
                "name": str(row.get("name", f"Student {index + 1}")),
                "department": str(row["department"]),
                "attendance": attendance,
                "marks": marks,
                "risk": calculate_risk(attendance, marks),
            }

            uploaded_students.append(student)

    except (ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid student data: {exc}",
        ) from exc

    students.clear()
    students.extend(uploaded_students)

    return {
        "message": f"Successfully uploaded {len(students)} student records.",
        "count": len(students),
    }
