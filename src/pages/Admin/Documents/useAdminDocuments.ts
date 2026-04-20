import { useMemo, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import {
  type DocumentRow,
  useDeleteDocumentMutation,
  useDocumentsQuery,
  useSyncDocumentMutation,
  useUploadDocumentMutation,
} from "@/hooks/queries/useDocuments";

export function useAdminDocuments() {
  const { profile } = useAuth();
  const documentsQuery = useDocumentsQuery();
  const uploadDocumentMutation = useUploadDocumentMutation();
  const deleteDocumentMutation = useDeleteDocumentMutation();
  const syncDocumentMutation = useSyncDocumentMutation();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const submitDisabled = useMemo(
    () =>
      uploadDocumentMutation.isPending ||
      !selectedFile ||
      !documentName.trim() ||
      !profile?.company_id,
    [
      documentName,
      profile?.company_id,
      selectedFile,
      uploadDocumentMutation.isPending,
    ],
  );

  async function handleUpload() {
    if (!selectedFile || !profile?.company_id || !profile.id) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await uploadDocumentMutation.mutateAsync({
        companyId: profile.company_id,
        uploadedBy: profile.id,
        file: selectedFile,
        documentName,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Upload failed.",
      );
      return;
    }

    setDocumentName("");
    setSelectedFile(null);
    setIsUploadOpen(false);
    setSuccessMessage("Document uploaded and marked as processing.");
  }

  async function handleDelete(document: DocumentRow) {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await deleteDocumentMutation.mutateAsync({
        id: document.id,
        filePath: document.file_path,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Delete failed.",
      );
      return;
    }

    setSuccessMessage("Document deleted successfully.");
  }

  async function handleSync(document: DocumentRow) {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await syncDocumentMutation.mutateAsync({
        documentId: document.id,
      });

      if (result.mode === "queued") {
        setSuccessMessage(
          "Document queued for processing. Run your worker to complete syncing.",
        );
        return;
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Sync failed.",
      );
      return;
    }

    setSuccessMessage("Document sync started. Status will update shortly.");
  }

  return {
    documentsQuery,
    isUploading: uploadDocumentMutation.isPending,
    isDeleting: deleteDocumentMutation.isPending,
    isSyncing: syncDocumentMutation.isPending,
    isUploadOpen,
    setIsUploadOpen,
    selectedFile,
    setSelectedFile,
    documentName,
    setDocumentName,
    errorMessage,
    successMessage,
    submitDisabled,
    handleUpload,
    handleDelete,
    handleSync,
  };
}
