
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import reports

app = FastAPI(
    title="EMS Reports Service",
    description="Employee Management System - Reports Microservice API for generating and exporting employee reports",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Include router
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost"         # Docker frontend (Nginx on port 80)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get(
    "/health",
    tags=["Health"],
    summary="Service Health Check",
    description="Check if the EMS Reports Service is running and healthy",
    responses={
        200: {
            "description": "Service is healthy",
            "content": {
                "application/json": {
                    "example": {"status": "healthy", "service": "EMS Reports Service"}
                }
            }
        }
    }
)
def health_check():
    return {"status": "healthy", "service": "EMS Reports Service"}