from docling.document_converter import DocumentConverter

def parse_document(file_path: str) -> str:
    converter = DocumentConverter()
    result = converter.convert(file_path)
    return result.document.export_to_markdown()

if __name__ == "__main__":
    text = parse_document("test/test.pdf")
    print(text[:500])  # preview 500 karakter pertama