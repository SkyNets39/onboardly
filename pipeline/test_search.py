import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

from embedder import embed_chunks

load_dotenv(Path(__file__).parent.parent / ".env.local")

supabase = create_client(
    os.getenv("VITE_SUPABASE_URL"),
    os.getenv("VITE_SUPABASE_SECRET_KEY"),
)


def search(query: str, company_id: str) -> None:
    print(f"🔍 Searching: '{query}'")

    embedding = embed_chunks([query])[0]

    result = supabase.rpc(
        "match_chunks",
        {
            "query_embedding": embedding,
            "match_company_id": company_id,
            "match_count": 5,
            "match_threshold": 0.5,
        },
    ).execute()

    rows = result.data or []
    print(f"Found {len(rows)} results:\n")

    for i, row in enumerate(rows, start=1):
        similarity = float(row.get("similarity", 0))
        content = row.get("content", "")
        print(f"[{i}] Similarity: {similarity:.3f}")
        print(f"     {content[:150]}...")
        print()


if __name__ == "__main__":
    search(
        query="berapa hari cuti tahunan?",
        company_id="060d9407-1746-4f6c-aafe-02d5f3e88891",
    )
