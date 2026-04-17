import argparse
import shutil
import time

from ingest import (
    download_document_to_temp,
    poll_processing_documents,
    process_document_file,
    update_document_status_failed,
    update_document_status_ready,
)


def process_pending_documents() -> int:
    documents = poll_processing_documents()
    print(f"🗂️ Found {len(documents)} document(s) with status=processing")
    processed_count = 0

    for document in documents:
        document_id = document["id"]
        company_id = document["company_id"]
        storage_file_path = document["file_path"]
        document_name = document["name"]

        temp_dir = ""
        try:
            print(f"\n▶️ Processing {document_name} ({document_id})")
            downloaded = download_document_to_temp(storage_file_path)
            temp_dir = downloaded["temp_dir"]

            process_document_file(
                file_path=downloaded["local_file_path"],
                document_id=document_id,
                company_id=company_id,
            )
            update_document_status_ready(document_id)
            processed_count += 1
            print(f"✅ Completed {document_name} ({document_id})")
        except Exception as exc:
            error_message = f"{type(exc).__name__}: {exc}"
            update_document_status_failed(document_id, error_message)
            print(f"❌ Failed {document_name} ({document_id}) -> {error_message}")
        finally:
            if temp_dir:
                shutil.rmtree(temp_dir, ignore_errors=True)

    return processed_count


def run_worker_loop(interval_seconds: int) -> None:
    print(
        f"🚀 Worker started. Polling for processing documents every {interval_seconds}s"
    )
    while True:
        cycle_started_at = time.time()
        processed_count = process_pending_documents()
        elapsed_seconds = time.time() - cycle_started_at
        print(
            f"⏱️ Cycle finished: processed {processed_count} document(s) in {elapsed_seconds:.2f}s"
        )
        sleep_for = max(1, interval_seconds)
        print(f"😴 Sleeping {sleep_for}s before next poll")
        time.sleep(sleep_for)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Process Supabase documents with status=processing."
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Run a single processing cycle and exit.",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=10,
        help="Polling interval in seconds for worker mode (default: 10).",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    try:
        if args.once:
            process_pending_documents()
        else:
            run_worker_loop(interval_seconds=args.interval)
    except KeyboardInterrupt:
        print("\n🛑 Worker stopped by user.")
