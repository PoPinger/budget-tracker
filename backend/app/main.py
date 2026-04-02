from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.v1.router import api_router

app = FastAPI(
    title="Budget Tracker API",
    version="1.0.0"
)

# ✅ CORS (BARDZO WAŻNE dla frontendu)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # na start OK (potem można zawęzić)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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