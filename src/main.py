import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from core.main_graph import compile_graph

from routes import admin, base, chat, documents, templates, user, validate


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        langfuse = LangfuseHandler()
        await init_db()
        async for checkpoiner in get_redis_saver():
            compile_graph(checkpointer=checkpoiner)
            compile_feedback_graph(checkpointer=checkpoiner)
            yield
    finally:
        langfuse.flush()
        await finalize_db()


app = FastAPI(lifespan=lifespan, default_response_class=ORJSONResponse)
app.get_db = get_db_async_session


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(base.base_router)
app.include_router(chat.chat_router)
app.include_router(templates.templates_router)
app.include_router(user.user_router)
app.include_router(admin.admin_router)
app.include_router(validate.validate_router)
app.include_router(documents.documents_router)


# Suppress logging warnings from gRPC underlying gemini api library
os.environ["GRPC_VERBOSITY"] = "ERROR"
os.environ["GLOG_minloglevel"] = "2"
