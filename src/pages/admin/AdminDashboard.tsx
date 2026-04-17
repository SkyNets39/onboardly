import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function AdminDashboard() {
  const { profile } = useAuth();
  const documentsCountQuery = useDocumentsCountQuery();
  const usersCountQuery = useUsersCountQuery();
  const topQuestionsQuery = useTopQuestionsQuery(TOP_QUESTIONS_LIMIT);
  const suggestedQuestionsQuery = useSuggestedQuestionsQuery(profile?.company_id);
  const addSuggestedQuestionMutation = useAddSuggestedQuestionMutation();
  const deleteSuggestedQuestionMutation = useDeleteSuggestedQuestionMutation();
  const [newQuestion, setNewQuestion] = useState("");
  const [questionErrorMessage, setQuestionErrorMessage] = useState<string | null>(
    null,
  );

  const isLoading =
    documentsCountQuery.isLoading ||
    usersCountQuery.isLoading ||
    topQuestionsQuery.isLoading;

  const hasError =
    documentsCountQuery.isError ||
    usersCountQuery.isError ||
    topQuestionsQuery.isError;

  const suggestedQuestions = suggestedQuestionsQuery.data ?? [];
  const canAddMoreQuestions = suggestedQuestions.length < MAX_SUGGESTED_QUESTIONS;
  const isQuestionActionPending =
    addSuggestedQuestionMutation.isPending ||
    deleteSuggestedQuestionMutation.isPending;
  const addQuestionDisabled =
    !newQuestion.trim() ||
    !profile?.company_id ||
    !canAddMoreQuestions ||
    isQuestionActionPending;

  async function handleAddQuestion() {
    if (!profile?.company_id || !newQuestion.trim() || !canAddMoreQuestions) return;

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

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Admin Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Monitor adoption and knowledge gaps from employee chat usage.
        </p>
      </header>

      {hasError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Unable to load admin analytics right now.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total documents</CardTitle>
            <CardDescription>Knowledge files available for RAG</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {isLoading ? "..." : (documentsCountQuery.data ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total users</CardTitle>
            <CardDescription>
              Employees and admins in this company
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {isLoading ? "..." : (usersCountQuery.data ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Suggested questions</CardTitle>
              <CardDescription>
                Frequently asked prompts shown to employees in chat.
              </CardDescription>
            </div>
            <p className="text-sm text-muted-foreground">
              {suggestedQuestions.length}/{MAX_SUGGESTED_QUESTIONS}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {questionErrorMessage ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {questionErrorMessage}
            </div>
          ) : null}

          <div className="space-y-2">
            {suggestedQuestionsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading suggested questions...
              </p>
            ) : suggestedQuestionsQuery.isError ? (
              <p className="text-sm text-destructive">
                Unable to load suggested questions.
              </p>
            ) : suggestedQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No suggested questions yet.
              </p>
            ) : (
              <ol className="space-y-2">
                {suggestedQuestions.map((question, index) => (
                  <li
                    key={question.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <p className="text-sm">
                      {index + 1}. {question.content}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 gap-2 text-destructive hover:text-destructive"
                      disabled={isQuestionActionPending}
                      onClick={() => void handleDeleteQuestion(question.id)}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {canAddMoreQuestions ? (
            <div className="flex flex-col gap-2 md:flex-row">
              <Input
                value={newQuestion}
                onChange={(event) => setNewQuestion(event.target.value)}
                placeholder="Add a suggested question..."
                maxLength={200}
              />
              <Button
                className="gap-2 md:self-start"
                disabled={addQuestionDisabled}
                onClick={() => void handleAddQuestion()}
              >
                {addSuggestedQuestionMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Add question
                  </>
                )}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Maximum 5 suggested questions reached.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top employee questions</CardTitle>
          <CardDescription>
            Most frequently asked prompts from chat history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading top questions...
            </p>
          ) : (topQuestionsQuery.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              No employee questions yet.
            </p>
          ) : (
            <ol className="space-y-2">
              {(topQuestionsQuery.data ?? []).map((question) => (
                <li
                  key={question.content}
                  className="rounded-lg border border-border p-3"
                >
                  <p className="text-sm">{question.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Asked {question.count} times
                  </p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
