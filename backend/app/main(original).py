import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import items, patients

app = FastAPI(title="Simple Items API")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(items.router)
app.include_router(patients.router)


@app.get("/health")
def health():
    return {"status": "ok"}
