import { useEffect } from "react";
import { Loader2, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";

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

import {
  getDocumentStatusLabel,
  getDocumentStatusVariant,
} from "./documentStatusVariant";
import { useAdminDocuments } from "./useAdminDocuments";
import { formatMonthDateYear } from "@/utils/formatDate";

export default function AdminDocuments() {
  const {
    documentsQuery,
    isUploading,
    isDeleting,
    isSyncing,
    isUploadOpen,
    setIsUploadOpen,
    setSelectedFile,
    documentName,
    setDocumentName,
    errorMessage,
    successMessage,
    submitDisabled,
    handleUpload,
    handleDelete,
    handleSync,
  } = useAdminDocuments();

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
    }
  }, [successMessage]);

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
            <Button className="gap-2 cursor-pointer border-rounded">
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
                {isUploading ? (
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

      <div className="rounded-xl border border-neutral-border bg-(--card)">
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
                    <Badge variant={getDocumentStatusVariant(document.status)}>
                      {getDocumentStatusLabel(document.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatMonthDateYear(document.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 cursor-pointer"
                        disabled={isSyncing || document.status === "ready"}
                        onClick={() => void handleSync(document)}
                        aria-label="Sync document"
                      >
                        {isSyncing ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <RefreshCw className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2 hover:text-error-foreground cursor-pointer"
                        disabled={isDeleting}
                        onClick={() => void handleDelete(document)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
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
