from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.api import register_routers, register_error_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


def create_fastapi_app():
    app = FastAPI(lifespan=lifespan)

    register_routers(app)
    register_error_handlers(app)

    return app