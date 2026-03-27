"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DayData {
  date: string; // "2025-01-15"
  success: number;
  failure: number;
}

interface Props {
  data: DayData[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00"); // force local time
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function QueryChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm text-gray-400">
        No query data for this period.
      </div>
    );
  }

  const formatted = data.map((d) => ({ ...d, date: formatDate(d.date) }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="mb-4 text-sm font-medium text-gray-500">
        Queries over time
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={formatted} barSize={16}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="success"
            name="Answered"
            stackId="a"
            fill="#22c55e"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="failure"
            name="Unanswered"
            stackId="a"
            fill="#f87171"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
