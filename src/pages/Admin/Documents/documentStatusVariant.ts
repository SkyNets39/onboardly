import type { DocumentStatus } from "@/hooks/queries/useDocuments";

export function getDocumentStatusLabel(status: DocumentStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getDocumentStatusVariant(
  status: DocumentStatus,
): "success" | "destructive" | "warning" {
  if (status === "ready") return "success";
  if (status === "failed") return "destructive";
  return "warning";
}
