"use client";

import { useRouter, usePathname } from "next/navigation";

const RANGES = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
];

interface Props {
  current: string;
}

export function DateRangeFilter({ current }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function handleSelect(value: string) {
    router.push(`${pathname}?range=${value}`);
  }

  return (
    <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1">
      {RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => handleSelect(r.value)}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            current === r.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
