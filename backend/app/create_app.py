from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import register_routers, register_error_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


def create_fastapi_app():
    app = FastAPI(lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",  # dev
            "http://localhost",  # prod
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_routers(app)
    register_error_handlers(app)

    return app