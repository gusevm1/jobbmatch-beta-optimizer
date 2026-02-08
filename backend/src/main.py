from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes.cv import router as cv_router
from src.api.routes.health import router as health_router
from src.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create data directories on startup
    uploads_dir = settings.DATA_DIR / "uploads"
    generated_dir = settings.DATA_DIR / "generated"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    generated_dir.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(title="JobbMatch Beta Optimizer API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(cv_router)
