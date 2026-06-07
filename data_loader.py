import os

import httpx
from dotenv import load_dotenv
from llama_index.readers.file import PDFReader
from llama_index.core.node_parser import SentenceSplitter

load_dotenv()

EMBED_MODEL = "openai/text-embedding-3-small"
EMBED_DIM = 1536

splitter = SentenceSplitter(chunk_size=1000, chunk_overlap=200)


def load_and_chunk_pdf(path: str) -> list[str]:
    docs = PDFReader().load_data(file=path)
    texts = [d.text for d in docs if getattr(d, "text", None)]
    chunks = []
    for t in texts:
        chunks.extend(splitter.split_text(t))
    return chunks


def _embed(texts: list[str]) -> list[list[float]]:
    resp = httpx.post(
        "https://openrouter.ai/api/v1/embeddings",
        headers={"Authorization": f"Bearer {os.getenv('OPEN_ROUTER_API_KEY')}"},
        json={"model": EMBED_MODEL, "input": texts},
        timeout=30,
    )
    resp.raise_for_status()
    return [d["embedding"] for d in resp.json()["data"]]


def embed_texts(texts: list[str]) -> list[list[float]]:
    return _embed(texts)


def embed_query(text: str) -> list[float]:
    return _embed([text])[0]
