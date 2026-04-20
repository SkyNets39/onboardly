import type { Dispatch, SetStateAction } from "react";

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

type SuggestedQuestion = {
  id: string;
  content: string;
};

type SuggestedQuestionsCardProps = {
  suggestedQuestions: SuggestedQuestion[];
  maxSuggestedQuestions: number;
  questionErrorMessage: string | null;
  isLoading: boolean;
  isError: boolean;
  canAddMoreQuestions: boolean;
  isQuestionActionPending: boolean;
  addQuestionDisabled: boolean;
  isAddPending: boolean;
  newQuestion: string;
  setNewQuestion: Dispatch<SetStateAction<string>>;
  handleAddQuestion: () => Promise<void>;
  handleDeleteQuestion: (id: string) => Promise<void>;
};

export function SuggestedQuestionsCard({
  suggestedQuestions,
  maxSuggestedQuestions,
  questionErrorMessage,
  isLoading,
  isError,
  canAddMoreQuestions,
  isQuestionActionPending,
  addQuestionDisabled,
  isAddPending,
  newQuestion,
  setNewQuestion,
  handleAddQuestion,
  handleDeleteQuestion,
}: SuggestedQuestionsCardProps) {
  return (
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
            {suggestedQuestions.length}/{maxSuggestedQuestions}
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
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading suggested questions...
            </p>
          ) : isError ? (
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
                  className="flex items-center justify-between gap-3 rounded-lg border border-(--border) p-3"
                >
                  <p className="text-sm">
                    {index + 1}. {question.content}
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="shrink-0 gap-2 cursor-pointer"
                    disabled={isQuestionActionPending}
                    onClick={() => void handleDeleteQuestion(question.id)}
                    aria-label="Delete question"
                  >
                    <Trash2 className="size-4" />
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
              {isAddPending ? (
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
            Maximum {maxSuggestedQuestions} suggested questions reached.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
