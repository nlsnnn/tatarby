from fastapi import FastAPI, APIRouter

from app.api.speech.router import router as speech_router
from app.api.error_handlers import register_error_handlers


def register_routers(app: FastAPI):
    root_router = APIRouter(tags=["Root"])

    @root_router.get("/ping")
    async def ping():
        return {"message": "PONG"}

    register_error_handlers(app)

    app.include_router(root_router)
    app.include_router(speech_router)

