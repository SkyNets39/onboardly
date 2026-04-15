import os
import uuid
from dotenv import load_dotenv
from supabase import create_client
from pathlib import Path
from parse import parse_document
from chunker import chunk_text
from embedder import embed_chunks

load_dotenv(Path(__file__).parent.parent / ".env.local")

supabase = create_client(
    os.getenv("VITE_SUPABASE_URL"),
    os.getenv("VITE_SUPABASE_SECRET_KEY")
)

def ingest_document(
    file_path: str,
    document_name: str,
    company_id: str,
    uploaded_by: str
):
    project_root = Path(__file__).resolve().parent.parent
    source_path = Path(file_path)
    if not source_path.is_absolute():
        source_path = (project_root / source_path).resolve()

    print(f"📄 Parsing {source_path}...")
    text = parse_document(str(source_path))

    print(f"✂️  Chunking...")
    chunks = chunk_text(text)
    print(f"   → {len(chunks)} chunks")

    print(f"🔢 Embedding...")
    embeddings = embed_chunks(chunks)

    # Insert document record
    print(f"💾 Saving document record...")
    doc_result = supabase.table("documents").insert({
        "id": str(uuid.uuid4()),
        "company_id": company_id,
        "uploaded_by": uploaded_by,
        "name": document_name,
        "file_path": str(source_path),
        "file_type": source_path.suffix.lstrip("."),
        "status": "processing"
    }).execute()

    document_id = doc_result.data[0]["id"]

    # Insert chunks + embeddings
    print(f"💾 Saving {len(chunks)} chunks...")
    rows = [
        {
            "document_id": document_id,
            "company_id": company_id,
            "content": chunk,
            "embedding": embedding,
            "chunk_index": i,
            "metadata": {"chunk_index": i, "total_chunks": len(chunks)}
        }
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
    ]

    # Batch insert per 50 (hindari payload terlalu besar)
    batch_size = 50
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        supabase.table("document_chunks").insert(batch).execute()
        print(f"   → Saved batch {i // batch_size + 1}")

    # Update status dokumen jadi ready
    supabase.table("documents").update(
        {"status": "ready"}
    ).eq("id", document_id).execute()

    print(f"✅ Done! Document ID: {document_id}")
    return document_id


if __name__ == "__main__":
    # Ganti nilai ini sesuai data kamu
    ingest_document(
        file_path="pipeline/test/test.pdf",
        document_name="Employee Handbook",
        company_id="060d9407-1746-4f6c-aafe-02d5f3e88891",
        uploaded_by="878ec2ff-9fd1-4b4f-ac76-608269ec6f9c"
    )