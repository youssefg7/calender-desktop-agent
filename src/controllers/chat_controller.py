from .base_controller import BaseController
from langgraph.graph.state import CompiledStateGraph
import uuid


class ChatController(BaseController):
    def __init__(self, graph: CompiledStateGraph):
        self.graph = graph

    async def new_conversation(self) -> str:
        conversation_id = str(uuid.uuid4())
        return conversation_id

    async def chat_message(self, conversation_id: str, message: str) -> str:
        config = {
            "configurable": {"thread_id": conversation_id},
        }
        async for update in self.graph.astream(
            {"user_message": message}, config=config
        ):
            pass

        final_state = await self.graph.aget_state(config=config)
        return final_state.values["response"]
