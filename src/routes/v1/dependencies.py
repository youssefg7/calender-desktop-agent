from fastapi import Depends
from stores import ChromaDBManager
from controllers import DocumentController, ChatController
from core import get_compiled_graph
from langgraph.graph.state import CompiledStateGraph


def get_document_controller(
    vectordb_manager: ChromaDBManager = Depends(ChromaDBManager),
) -> DocumentController:
    return DocumentController(vectordb_manager=vectordb_manager)


def get_chat_controller(
    vectordb_manager: ChromaDBManager = Depends(ChromaDBManager),
    compiled_graph: CompiledStateGraph = Depends(get_compiled_graph),
) -> ChatController:
    return ChatController(vectordb_manager=vectordb_manager, graph=compiled_graph)
