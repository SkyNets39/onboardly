import os
import shutil
import sys
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

# Keep compatibility with existing pipeline modules that use local imports
# (e.g. "from chunker import ...") when loaded from a package context.
sys.path.append(str(Path(__file__).resolve().parent))

from pipeline.ingest import (
    download_document_to_temp,
    process_document_file,
    supabase,
    update_document_status_failed,
    update_document_status_ready,
)

app = FastAPI(title="Onboardly Document Sync Webhook")


class SyncRequest(BaseModel):
    document_id: str
    company_id: str
    file_path: str
    file_type: str
    document_name: str


def _require_valid_secret(authorization: Optional[str]) -> None:
    expected = os.getenv("DOCUMENT_SYNC_WEBHOOK_SECRET", "").strip()
    if not expected:
        # Fail closed: do not allow webhook calls without configured secret.
        raise HTTPException(
            status_code=500,
            detail="DOCUMENT_SYNC_WEBHOOK_SECRET is not configured on webhook server.",
        )

    token = (authorization or "").strip()
    if not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token.")

    provided = token[len("Bearer ") :].strip()
    if provided != expected:
        raise HTTPException(status_code=401, detail="Invalid bearer token.")


def _clear_existing_chunks(document_id: str) -> None:
    # Re-sync should replace old chunks, not duplicate them.
    supabase.table("document_chunks").delete().eq("document_id", document_id).execute()


@app.get("/health")
def health() -> dict[str, str]:
    return {"ok": "true"}


@app.post("/sync")
def sync_document(
    payload: SyncRequest,
    authorization: Optional[str] = Header(default=None),
) -> dict[str, str]:
    _require_valid_secret(authorization)

    temp_dir = ""
    try:
        downloaded = download_document_to_temp(payload.file_path)
        temp_dir = downloaded["temp_dir"]

        _clear_existing_chunks(payload.document_id)

        process_document_file(
            file_path=downloaded["local_file_path"],
            document_id=payload.document_id,
            company_id=payload.company_id,
        )
        update_document_status_ready(payload.document_id)
    except Exception as exc:
        error_message = f"{type(exc).__name__}: {exc}"
        update_document_status_failed(payload.document_id, error_message)
        raise HTTPException(status_code=500, detail=error_message) from exc
    finally:
        if temp_dir:
            shutil.rmtree(temp_dir, ignore_errors=True)

    return {"ok": "true", "status": "ready"}
