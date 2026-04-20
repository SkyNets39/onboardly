import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useTopQuestionsQuery } from "@/hooks/queries/useChatMessages";
import { useDocumentsCountQuery } from "@/hooks/queries/useDocuments";
import {
  MAX_SUGGESTED_QUESTIONS,
  useAddSuggestedQuestionMutation,
  useDeleteSuggestedQuestionMutation,
  useSuggestedQuestionsQuery,
} from "@/hooks/queries/useSuggestedQuestions";
import { useUsersCountQuery } from "@/hooks/queries/useUsers";

const TOP_QUESTIONS_LIMIT = 5;

export function useAdminDashboard() {
  const { profile } = useAuth();
  const documentsCountQuery = useDocumentsCountQuery();
  const usersCountQuery = useUsersCountQuery();
  const topQuestionsQuery = useTopQuestionsQuery(TOP_QUESTIONS_LIMIT);
  const suggestedQuestionsQuery = useSuggestedQuestionsQuery(
    profile?.company_id,
  );
  const addSuggestedQuestionMutation = useAddSuggestedQuestionMutation();
  const deleteSuggestedQuestionMutation = useDeleteSuggestedQuestionMutation();
  const [newQuestion, setNewQuestion] = useState("");
  const [questionErrorMessage, setQuestionErrorMessage] = useState<
    string | null
  >(null);

  const statsLoading =
    documentsCountQuery.isLoading ||
    usersCountQuery.isLoading ||
    topQuestionsQuery.isLoading;

  const statsError =
    documentsCountQuery.isError ||
    usersCountQuery.isError ||
    topQuestionsQuery.isError;

  const suggestedQuestions = suggestedQuestionsQuery.data ?? [];
  const canAddMoreQuestions =
    suggestedQuestions.length < MAX_SUGGESTED_QUESTIONS;
  const isQuestionActionPending =
    addSuggestedQuestionMutation.isPending ||
    deleteSuggestedQuestionMutation.isPending;
  const addQuestionDisabled =
    !newQuestion.trim() ||
    !profile?.company_id ||
    !canAddMoreQuestions ||
    isQuestionActionPending;

  async function handleAddQuestion() {
    if (!profile?.company_id || !newQuestion.trim() || !canAddMoreQuestions)
      return;

    setQuestionErrorMessage(null);

    try {
      await addSuggestedQuestionMutation.mutateAsync({
        companyId: profile.company_id,
        content: newQuestion,
      });
      setNewQuestion("");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to add suggested question.";
      setQuestionErrorMessage(message);
    }
  }

  async function handleDeleteQuestion(id: string) {
    if (!profile?.company_id) return;

    setQuestionErrorMessage(null);

    try {
      await deleteSuggestedQuestionMutation.mutateAsync({
        id,
        companyId: profile.company_id,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to delete suggested question.";
      setQuestionErrorMessage(message);
    }
  }

  return {
    documentsCount: documentsCountQuery.data ?? 0,
    usersCount: usersCountQuery.data ?? 0,
    statsLoading,
    statsError,
    suggestedQuestions,
    suggestedQuestionsQuery,
    canAddMoreQuestions,
    isQuestionActionPending,
    addQuestionDisabled,
    addSuggestedQuestionMutation,
    newQuestion,
    setNewQuestion,
    questionErrorMessage,
    handleAddQuestion,
    handleDeleteQuestion,
    maxSuggestedQuestions: MAX_SUGGESTED_QUESTIONS,
  };
}
