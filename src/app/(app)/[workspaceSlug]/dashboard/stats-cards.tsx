import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Layers, MessageSquare, TrendingUp } from "lucide-react";

type Stats = {
  totalDocuments: number;
  totalChunks: number;
  totalQueries: number;
  queriesToday: number;
};

const statConfig = [
  {
    key: "totalDocuments" as const,
    label: "Total Documents",
    icon: FileText,
    description: "Indexed in this workspace",
  },
  {
    key: "totalChunks" as const,
    label: "Total Chunks",
    icon: Layers,
    description: "Text segments across all docs",
  },
  {
    key: "totalQueries" as const,
    label: "Total Queries",
    icon: MessageSquare,
    description: "All time",
  },
  {
    key: "queriesToday" as const,
    label: "Queries Today",
    icon: TrendingUp,
    description: "Since midnight",
  },
];

export function StatsCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {statConfig.map(({ key, label, icon: Icon, description }) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {label}
            </CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats[key].toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
