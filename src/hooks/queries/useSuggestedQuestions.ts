import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export interface SuggestedQuestionRow {
  id: string;
  company_id: string;
  content: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

interface AddSuggestedQuestionArgs {
  companyId: string;
  content: string;
}

interface DeleteSuggestedQuestionArgs {
  id: string;
  companyId: string;
}

export const MAX_SUGGESTED_QUESTIONS = 5;

export const suggestedQuestionsQueryKey = (companyId: string) =>
  ["suggested-questions", companyId] as const;

export function useSuggestedQuestionsQuery(companyId?: string) {
  return useQuery({
    queryKey: companyId
      ? suggestedQuestionsQueryKey(companyId)
      : (["suggested-questions", "missing-company"] as const),
    enabled: Boolean(companyId),
    queryFn: async (): Promise<SuggestedQuestionRow[]> => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("suggested_questions")
        .select("id, company_id, content, sort_order, is_active, created_at")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw new Error("Unable to load suggested questions.");
      return (data ?? []) as SuggestedQuestionRow[];
    },
  });
}

export function useAddSuggestedQuestionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      companyId,
      content,
    }: AddSuggestedQuestionArgs): Promise<void> => {
      const trimmedContent = content.trim();
      if (!trimmedContent) throw new Error("Question cannot be empty.");

      const { data: currentRows, error: listError } = await supabase
        .from("suggested_questions")
        .select("id, sort_order")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("sort_order", { ascending: false });

      if (listError) throw new Error("Unable to validate suggested questions.");

      const rows = currentRows ?? [];
      if (rows.length >= MAX_SUGGESTED_QUESTIONS) {
        throw new Error("Maximum 5 suggested questions allowed.");
      }

      const nextSortOrder = rows.length === 0 ? 0 : (rows[0].sort_order ?? 0) + 1;

      const { error: insertError } = await supabase.from("suggested_questions").insert({
        company_id: companyId,
        content: trimmedContent,
        sort_order: nextSortOrder,
        is_active: true,
      });

      if (insertError) throw new Error("Unable to add suggested question.");
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: suggestedQuestionsQueryKey(variables.companyId),
      });
    },
  });
}

export function useDeleteSuggestedQuestionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      companyId: _companyId,
    }: DeleteSuggestedQuestionArgs): Promise<void> => {
      const { error } = await supabase.from("suggested_questions").delete().eq("id", id);
      if (error) throw new Error("Unable to delete suggested question.");
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: suggestedQuestionsQueryKey(variables.companyId),
      });
    },
  });
}
