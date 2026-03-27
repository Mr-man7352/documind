import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Question = {
  query: string;
  count: number;
};

export function UnansweredQuestions({ questions }: { questions: Question[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Unanswered Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No unanswered questions yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {questions.map(({ query, count }) => (
              <li
                key={query}
                className="flex items-start justify-between gap-3"
              >
                <p className="text-sm leading-snug">{query}</p>
                <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  {count}×
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
