import logging
import os
import shutil
import tempfile
import uuid

import httpx
import inngest
import inngest.fast_api
from inngest.experimental import ai
import pydantic
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from custom_types import RAGChunkAndSrc, RAGQueryResult, RAGUpsertResult, RAGSearchResults
from data_loader import embed_query, embed_texts, load_and_chunk_pdf
from vector_db import QdrantStorage

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPEN_ROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")


class QueryRequest(pydantic.BaseModel):
    question: str
    top_k: int = 5
    model: str = OPENROUTER_MODEL


inngest_client = inngest.Inngest(
    app_id="rag_app",
    logger=logging.getLogger("uvicorn"),
    is_production=os.getenv("RAILWAY_ENVIRONMENT") is not None,
    serializer=inngest.PydanticSerializer(),
)


@inngest_client.create_function(
    fn_id="RAG: Ingest PDF",
    trigger=inngest.TriggerEvent(event="rag/ingest_pdf"),
)
async def rag_ingest_pdf(ctx: inngest.Context):
    def _load(ctx: inngest.Context) -> RAGChunkAndSrc:
        pdf_path = ctx.event.data["pdf_path"]
        source_id = ctx.event.data.get("source_id", pdf_path)
        chunks = load_and_chunk_pdf(pdf_path)
        return RAGChunkAndSrc(chunks=chunks, source_id=source_id)

    def _upsert(chunks_and_src: RAGChunkAndSrc) -> RAGUpsertResult:
        chunks = chunks_and_src.chunks
        source_id = chunks_and_src.source_id
        vecs = embed_texts(chunks)
        ids = [str(uuid.uuid5(uuid.NAMESPACE_URL, f"{source_id}:{i}")) for i in range(len(chunks))]
        payloads = [{"source": source_id, "text": chunks[i]} for i in range(len(chunks))]
        QdrantStorage().upsert(ids, vecs, payloads)
        return RAGUpsertResult(ingested=len(chunks))

    chunks_and_src = await ctx.step.run("load-and-chunk", lambda: _load(ctx), output_type=RAGChunkAndSrc)
    ingested = await ctx.step.run("embed-and-upsert", lambda: _upsert(chunks_and_src), output_type=RAGUpsertResult)

    return ingested.model_dump()

@inngest_client.create_function(
    fn_id="RAG: Query PDF",
    trigger=inngest.TriggerEvent(event="rag/query_pdf_ai")
)
async def rag_query_pdf_ai(ctx: inngest.Context) -> RAGSearchResults:
    def _search(question: str, top_k: int = 5):
        query_vec = embed_query(question)
        store = QdrantStorage()
        found = store.search(query_vec, top_k)
        return RAGSearchResults(contexts=found["contexts"], sources=found["sources"])
    
    question = ctx.event.data["question"]
    top_k = int(ctx.event.data.get("top_k", 5))
    
    found = await ctx.step.run("embed-and-search", lambda: _search(question, top_k), output_type=RAGSearchResults)
    
    context_block = "\n\n".join(f"- {c}" for c in found.contexts) # Join all the sentences that are found
    user_content = (
        "Use the following context to answer the question. \n\n"
        f"Context: \n{context_block}\n\n"
        f"Question: {question}\n"
        "Answer conscisely using the context above"
    )
    
    adapter = ai.openai.Adapter(
        auth_key=OPENROUTER_API_KEY,
        base_url="https://openrouter.ai/api/v1",
        model=OPENROUTER_MODEL,
    )
    
    res = await ctx.step.ai.infer(
        "llm-answer",
        adapter=adapter,
        body={
            "max_tokens": 1024,
            "temperature": 0.2,
            "messages": [
                {"role": "system", "content": "You answer questions using only the provided context."},
                {"role": "user", "content": user_content},
            ]
        }
    )
    
    answer = res["choices"][0]["message"]["content"].strip()
    return {"answer": answer, "sources": found.sources, "num_contexts": len(found.contexts)}
    


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

inngest.fast_api.serve(app, inngest_client, functions=[rag_ingest_pdf, rag_query_pdf_ai])


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/ingest")
async def ingest_pdf(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        chunks = load_and_chunk_pdf(tmp_path)
        vecs = embed_texts(chunks)
        source_id = file.filename
        ids = [str(uuid.uuid5(uuid.NAMESPACE_URL, f"{source_id}:{i}")) for i in range(len(chunks))]
        payloads = [{"source": source_id, "text": chunks[i]} for i in range(len(chunks))]
        QdrantStorage().upsert(ids, vecs, payloads)
    finally:
        os.unlink(tmp_path)

    return {"status": "ingested", "filename": file.filename, "chunks": len(chunks)}


@app.get("/api/documents")
def list_documents():
    storage = QdrantStorage()
    results, _ = storage.client.scroll(
        collection_name=storage.collection,
        with_payload=True,
        limit=1000,
    )
    sources = list({(r.payload or {}).get("source", "unknown") for r in results})
    return {"documents": sources}


@app.post("/api/query", response_model=RAGQueryResult)
async def query_rag(req: QueryRequest):
    query_vec = embed_query(req.question)
    search_result = QdrantStorage().search(query_vec, top_k=req.top_k)
    contexts = search_result["contexts"]
    sources = search_result["sources"]

    if not contexts:
        raise HTTPException(status_code=404, detail="No relevant documents found.")

    context_block = "\n\n".join(f"[{i + 1}] {ctx}" for i, ctx in enumerate(contexts))
    prompt = (
        "You are a helpful assistant. Answer the question using ONLY the provided context.\n"
        "If the answer is not in the context, say \"I don't have enough information.\"\n\n"
        f"Context:\n{context_block}\n\n"
        f"Question: {req.question}\n\nAnswer:"
    )

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "HTTP-Referer": FRONTEND_ORIGIN,
                "X-Title": "RAG App",
            },
            json={
                "model": req.model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
            },
        )
        resp.raise_for_status()

    answer = resp.json()["choices"][0]["message"]["content"]
    return RAGQueryResult(answer=answer, sources=sources, num_contexts=len(contexts))
