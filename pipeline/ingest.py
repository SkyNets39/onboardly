import os
import uuid
import tempfile
from pathlib import Path
from typing import TypedDict

from dotenv import load_dotenv
from supabase import Client, create_client

from chunker import chunk_text
from embedder import embed_chunks
from parse import parse_document

load_dotenv(Path(__file__).parent.parent / ".env.local")

supabase: Client = create_client(
    os.getenv("VITE_SUPABASE_URL"),
    os.getenv("VITE_SUPABASE_SECRET_KEY")
)


class PendingDocument(TypedDict):
    id: str
    company_id: str
    file_path: str
    name: str


class DownloadedDocument(TypedDict):
    temp_dir: str
    local_file_path: str


def process_document_file(file_path: str, document_id: str, company_id: str) -> None:
    source_path = Path(file_path).resolve()

    print(f"📄 Parsing {source_path}...")
    text = parse_document(str(source_path))

    print("✂️  Chunking...")
    chunks = chunk_text(text)
    print(f"   → {len(chunks)} chunks")

    print("🔢 Embedding...")
    embeddings = embed_chunks(chunks)

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

    # Batch insert per 50 to avoid oversized payloads.
    batch_size = 50
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        supabase.table("document_chunks").insert(batch).execute()
        print(f"   → Saved batch {i // batch_size + 1}")


def poll_processing_documents(limit: int = 20) -> list[PendingDocument]:
    result = (
        supabase
        .table("documents")
        .select("id, company_id, file_path, name")
        .eq("status", "processing")
        .limit(limit)
        .execute()
    )

    rows = result.data or []
    return [
        {
            "id": str(row["id"]),
            "company_id": str(row["company_id"]),
            "file_path": str(row["file_path"]),
            "name": str(row.get("name", "")),
        }
        for row in rows
    ]


def update_document_status_ready(document_id: str) -> None:
    (
        supabase
        .table("documents")
        .update({"status": "ready", "error_message": None})
        .eq("id", document_id)
        .execute()
    )


def update_document_status_failed(document_id: str, error_message: str) -> None:
    safe_error = error_message.strip()[:1000]
    (
        supabase
        .table("documents")
        .update({"status": "failed", "error_message": safe_error})
        .eq("id", document_id)
        .execute()
    )


def download_document_to_temp(file_path: str) -> DownloadedDocument:
    temp_dir = tempfile.mkdtemp(prefix="rag-doc-")

    source_name = Path(file_path).name
    local_file_path = str(Path(temp_dir) / source_name)

    response = supabase.storage.from_("documents").download(file_path)
    if not response:
        raise ValueError(f"Empty download for storage path: {file_path}")

    with open(local_file_path, "wb") as local_file:
        local_file.write(response)

    if Path(local_file_path).stat().st_size == 0:
        raise ValueError(f"Downloaded file is empty: {file_path}")

    return {"temp_dir": temp_dir, "local_file_path": local_file_path}

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

    process_document_file(
        file_path=str(source_path),
        document_id=document_id,
        company_id=company_id,
    )

    # Update status dokumen jadi ready
    update_document_status_ready(document_id)

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