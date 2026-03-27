"use client";

interface Props {
  totalQueries: number;
  successRate: number;
  avgResponseTime: number | null;
}

export function AnalyticsClient({
  totalQueries,
  successRate,
  avgResponseTime,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard label="Total Queries" value={totalQueries.toString()} />
      <StatCard label="Success Rate" value={`${successRate}%`} />
      <StatCard
        label="Avg Response Time"
        value={avgResponseTime ? `${avgResponseTime}ms` : "—"}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-4xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
