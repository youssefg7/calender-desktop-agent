from langfuse import Langfuse
from langfuse.callback import CallbackHandler
from langfuse.client import StatefulTraceClient

from helpers import get_settings

app_settings = get_settings()


class LangfuseHandler:
    __instance = None

    def __new__(cls):
        if cls.__instance is None:
            cls.__instance = super(LangfuseHandler, cls).__new__(cls)
            cls.langfuse_client = Langfuse(
                secret_key=app_settings.LANGFUSE_SK,
                public_key=app_settings.LANGFUSE_PK,
                host=app_settings.LANGFUSE_HOST,
            )
        return cls.__instance

    def get_callback_handler(
        self, trace_id: str = None
    ) -> tuple[StatefulTraceClient, CallbackHandler]:
        trace = self.langfuse_client.trace(
            id=trace_id if trace_id is not None else None
        )
        langfuse_handler = trace.get_langchain_handler(update_parent=True)
        return trace, langfuse_handler

    def create_trace(self) -> StatefulTraceClient:
        return self.langfuse_client.trace()

    def flush(self):
        self.langfuse_client.flush()
