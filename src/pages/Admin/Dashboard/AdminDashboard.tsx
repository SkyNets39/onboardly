import { FileText, Users } from "lucide-react";

import { StatsCard } from "./StatsCard";
import { SuggestedQuestionsCard } from "./SuggestedQuestionsCard";
import { useAdminDashboard } from "./useAdminDashboard";

export default function AdminDashboard() {
  const {
    documentsCount,
    usersCount,
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
    maxSuggestedQuestions,
  } = useAdminDashboard();

  return (
    <section className="space-y-6 p-6">
      <header>
        <h2 className="text-xl font-semibold">Admin Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Monitor adoption and knowledge gaps from employee chat usage.
        </p>
      </header>

      {statsError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Unable to load admin analytics right now.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <StatsCard
          title="Total documents"
          description="Knowledge files available for RAG"
          value={statsLoading ? "..." : documentsCount}
          icon={FileText}
          iconClassName="bg-(--badge-background-accent) text-(--badge-foreground-accent)"
        />
        <StatsCard
          title="Total users"
          description="Employees and admins in this company"
          value={statsLoading ? "..." : usersCount}
          icon={Users}
          iconClassName="bg-(--badge-background-secondary) text-(--badge-foreground-secondary)"
        />
      </div>

      <SuggestedQuestionsCard
        suggestedQuestions={suggestedQuestions}
        maxSuggestedQuestions={maxSuggestedQuestions}
        questionErrorMessage={questionErrorMessage}
        isLoading={suggestedQuestionsQuery.isLoading}
        isError={suggestedQuestionsQuery.isError}
        canAddMoreQuestions={canAddMoreQuestions}
        isQuestionActionPending={isQuestionActionPending}
        addQuestionDisabled={addQuestionDisabled}
        isAddPending={addSuggestedQuestionMutation.isPending}
        newQuestion={newQuestion}
        setNewQuestion={setNewQuestion}
        handleAddQuestion={handleAddQuestion}
        handleDeleteQuestion={handleDeleteQuestion}
      />
    </section>
  );
}
