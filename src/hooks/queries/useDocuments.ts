import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"

export type DocumentStatus = "processing" | "ready" | "failed"

export interface DocumentRow {
  id: string
  name: string
  file_path: string
  file_type: string
  status: DocumentStatus
  created_at: string
}

interface UploadDocumentArgs {
  companyId: string
  uploadedBy: string
  file: File
  documentName: string
}

interface DeleteDocumentArgs {
  id: string
  filePath: string
}

export const documentsQueryKey = ["documents"] as const

function normalizeFilename(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase()
}

export function useDocumentsQuery() {
  return useQuery({
    queryKey: documentsQueryKey,
    queryFn: async (): Promise<DocumentRow[]> => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, name, file_path, file_type, status, created_at")
        .order("created_at", { ascending: false })

      if (error) throw new Error("Unable to load documents.")
      return (data ?? []) as DocumentRow[]
    },
  })
}

export function useDocumentsCountQuery() {
  return useQuery({
    queryKey: ["documents-count"] as const,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("documents")
        .select("id", { count: "exact", head: true })

      if (error) throw new Error("Unable to load documents count.")
      return count ?? 0
    },
  })
}

export function useUploadDocumentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      companyId,
      uploadedBy,
      file,
      documentName,
    }: UploadDocumentArgs): Promise<void> => {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? ""
      const fileType = extension === "pdf" ? "pdf" : extension === "docx" ? "docx" : ""

      if (!fileType) throw new Error("Only .pdf and .docx files are supported.")

      const timestamp = Date.now()
      const filePath = `${companyId}/${timestamp}-${normalizeFilename(file.name)}`

      const { error: storageError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { upsert: false })

      if (storageError) {
        console.error("Supabase storage upload error", {
          message: storageError.message,
          details: storageError,
          filePath,
          companyId,
        })
        throw new Error(
          `Upload failed before database insert: ${storageError.message ?? "Unknown storage error."}`
        )
      }

      const { error: insertError } = await supabase.from("documents").insert({
        company_id: companyId,
        uploaded_by: uploadedBy,
        name: documentName.trim(),
        file_path: filePath,
        file_type: fileType,
        file_size: file.size,
        status: "processing",
      })

      if (insertError) {
        console.error("Supabase documents insert error", {
          message: insertError.message,
          details: insertError,
          filePath,
          companyId,
          uploadedBy,
        })
        await supabase.storage.from("documents").remove([filePath])
        throw new Error(
          `Document metadata insert failed after upload: ${insertError.message ?? "Unknown insert error."}`
        )
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: documentsQueryKey })
      await queryClient.invalidateQueries({ queryKey: ["documents-count"] })
    },
  })
}

export function useDeleteDocumentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, filePath }: DeleteDocumentArgs): Promise<void> => {
      const { error: storageError } = await supabase.storage.from("documents").remove([filePath])
      if (storageError) throw new Error("Unable to delete file from storage.")

      const { error: deleteError } = await supabase.from("documents").delete().eq("id", id)
      if (deleteError) throw new Error("Unable to delete document row.")
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: documentsQueryKey })
      await queryClient.invalidateQueries({ queryKey: ["documents-count"] })
    },
  })
}
