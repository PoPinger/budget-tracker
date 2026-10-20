from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.v1.router import api_router
from backend.app.core.config import settings

app = FastAPI(
    title="Budget Tracker API",
    version="1.0.0"
)

# ✅ CORS: tylko frontend z FRONTEND_URL (+ localhost poza produkcją).
# Token JWT idzie w nagłówku Authorization, a nie w cookies, więc credentials są wyłączone.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# ✅ Router API
app.include_router(api_router, prefix="/api/v1")


# ✅ Health check
@app.get("/")
def root():
    return {"message": "Budget Tracker API działa 🚀"}


@app.get("/api/v1/health")
def health():
    return {"status": "ok"}