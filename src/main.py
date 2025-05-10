import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from database import LangfuseHandler, get_redis_saver
from core.main_graph import compile_graph
from langgraph.checkpoint.memory import InMemorySaver
from routes.v1 import base, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        langfuse = LangfuseHandler()
        # don't use redis for now
        while True:
            compile_graph(checkpointer=InMemorySaver())
            yield
        # async for checkpoiner in get_redis_saver():
        # compile_graph(checkpointer=InMemorySaver())
            # yield
    finally:
        langfuse.flush()


app = FastAPI(lifespan=lifespan, default_response_class=ORJSONResponse)
# app.get_db = get_db_async_session


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(base.base_router)
app.include_router(chat.chat_router)


# Suppress logging warnings from gRPC underlying gemini api library
os.environ["GRPC_VERBOSITY"] = "ERROR"
os.environ["GLOG_minloglevel"] = "2"
