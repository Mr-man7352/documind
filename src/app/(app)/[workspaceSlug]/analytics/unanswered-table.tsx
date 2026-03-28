"use client";

interface Question {
  query: string;
  count: number;
  first: Date;
  last: Date;
}

interface Props {
  questions: Question[];
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function UnansweredTable({ questions }: Props) {
  if (questions.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm text-gray-400">
        No unanswered questions for this period.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <p className="text-sm font-medium text-gray-500">
          Top unanswered questions
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
            <th className="px-3 py-3 hidden sm:table-cell">#</th>
            <th className="px-3 py-3">Question</th>
            <th className="px-3 py-3 text-center">Times asked</th>
            <th className="px-3 py-3 hidden md:table-cell">First asked</th>
            <th className="px-3 py-3 hidden md:table-cell">Last asked</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {questions.map((q, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-3 py-4 text-gray-400 hidden sm:table-cell">
                {i + 1}
              </td>
              <td className="px-3 py-4 font-medium text-gray-800">{q.query}</td>
              <td className="px-3 py-4 text-center font-semibold text-red-500">
                {q.count}
              </td>
              <td className="px-3 py-4 text-gray-500 hidden md:table-cell">
                {formatDate(q.first)}
              </td>
              <td className="px-3 py-4 text-gray-500 hidden md:table-cell">
                {formatDate(q.last)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
