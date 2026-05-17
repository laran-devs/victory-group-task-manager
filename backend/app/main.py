from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine
from app.models.base import Base

import asyncio
from app.api.routers import tasks, auth, projects, team
from app.api import websockets
from app.services.rabbitmq import consume_events

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        # Create all tables (safe for early dev, replaces Alembic for now)
        await conn.run_sync(Base.metadata.create_all)
    
    # Start RabbitMQ Background Consumer
    app.state.rabbitmq_task = asyncio.create_task(consume_events())
    
    yield
    # Shutdown
    # Cancel RabbitMQ Background Consumer
    if hasattr(app.state, "rabbitmq_task"):
        app.state.rabbitmq_task.cancel()
        try:
            await app.state.rabbitmq_task
        except asyncio.CancelledError:
            pass
            
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(projects.router, prefix="/projects", tags=["Projects"])
app.include_router(team.router, prefix="/team", tags=["Team"])
app.include_router(websockets.router, tags=["WebSockets"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}
