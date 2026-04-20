import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import {
  type DocumentRow,
  type DocumentStatus,
  useDeleteDocumentMutation,
  useDocumentsQuery,
  useUploadDocumentMutation,
} from "@/hooks/queries/useDocuments";

function getStatusVariant(
  status: DocumentStatus,
): "secondary" | "default" | "destructive" {
  if (status === "ready") return "default";
  if (status === "failed") return "destructive";
  return "secondary";
}

export default function AdminDocuments() {
  const { profile } = useAuth();
  const documentsQuery = useDocumentsQuery();
  const uploadDocumentMutation = useUploadDocumentMutation();
  const deleteDocumentMutation = useDeleteDocumentMutation();
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

  return (
    <section className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Document Manager</h2>
          <p className="text-sm text-muted-foreground">
            Upload and maintain the knowledge documents used by the chat
            assistant.
          </p>
        </div>

        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              Upload document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload document</DialogTitle>
              <DialogDescription>
                Upload to storage first, then create a processing record in the
                documents table.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="document-name">
                  Document name
                </label>
                <Input
                  id="document-name"
                  placeholder="Employee Handbook"
                  value={documentName}
                  onChange={(event) => setDocumentName(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="document-file">
                  File
                </label>
                <Input
                  id="document-file"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(event) =>
                    setSelectedFile(event.target.files?.[0] ?? null)
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUploadOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleUpload()}
                disabled={submitDisabled}
              >
                {uploadDocumentMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    Submit
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="rounded-xl border bg-(--card)">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documentsQuery.isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  Loading documents...
                </TableCell>
              </TableRow>
            ) : documentsQuery.isError ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-destructive">
                  Unable to load documents.
                </TableCell>
              </TableRow>
            ) : !(documentsQuery.data?.length ?? 0) ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No documents found.
                </TableCell>
              </TableRow>
            ) : (
              (documentsQuery.data ?? []).map((document) => (
                <TableRow key={document.id}>
                  <TableCell className="font-medium">{document.name}</TableCell>
                  <TableCell className="uppercase">
                    {document.file_type}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(document.status)}>
                      {document.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(document.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-destructive hover:text-destructive"
                      disabled={deleteDocumentMutation.isPending}
                      onClick={() => void handleDelete(document)}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
