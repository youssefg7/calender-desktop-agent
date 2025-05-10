from langchain_core.embeddings import Embeddings
from langchain_openai.embeddings import OpenAIEmbeddings
from langchain_core.language_models import BaseChatModel
from langchain_openai.chat_models import ChatOpenAI
from helpers import get_settings

app_settings = get_settings()


def get_embedder(
    embedding_model_name: str = app_settings.EMBEDDING_MODEL,
) -> Embeddings:
    if embedding_model_name.startswith("openai__"):
        return OpenAIEmbeddings(
            api_key=app_settings.OPENAI_API_KEY,
            model=embedding_model_name[len("openai__") :],
        )

    raise ValueError(f"Unsupported Embedding model: {embedding_model_name}")


def get_llm_model(llm_model_name: str = app_settings.LLM_MODEL) -> BaseChatModel:
    if llm_model_name.startswith("openai__"):
        return ChatOpenAI(
            api_key=app_settings.OPENAI_API_KEY,
            model=llm_model_name[len("openai__") :],
            temperature=0,
            verbose=True
        )

    raise ValueError(f"Unsupported LLM model: {llm_model_name}")
