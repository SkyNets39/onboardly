import tiktoken

def chunk_text(text: str, max_tokens: int = 500, overlap: int = 50) -> list[str]:
    enc = tiktoken.get_encoding("cl100k_base")
    tokens = enc.encode(text)

    chunks = []
    start = 0

    while start < len(tokens):
        end = start + max_tokens
        chunk_tokens = tokens[start:end]
        chunk_text = enc.decode(chunk_tokens)
        chunks.append(chunk_text)

        # Geser dengan overlap
        start += max_tokens - overlap

    return chunks

if __name__ == "__main__":
    sample = "Lorem ipsum " * 500  # simulasi teks panjang
    chunks = chunk_text(sample)
    print(f"Total chunks: {len(chunks)}")
    print(f"Chunk 1 preview: {chunks[0][:100]}")