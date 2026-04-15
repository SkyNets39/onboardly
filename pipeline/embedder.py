from google import genai
from google.genai import types
from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv(Path(__file__).parent.parent / ".env.local")

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def embed_chunks(chunks: list[str]) -> list[list[float]]:
    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=chunks,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_DOCUMENT",
            output_dimensionality=768 
        )
    )
    return [e.values for e in result.embeddings]

if __name__ == "__main__":
    test_chunks = ["Karyawan baru mendapat 12 hari cuti tahunan."]
    embeddings = embed_chunks(test_chunks)
    print(f"Embedding dimension: {len(embeddings[0])}")  # harusnya 3072