import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp, MessageSquare, UserPlus } from "lucide-react";

type ActivityEvent = {
  type: "upload" | "chat" | "join";
  label: string;
  at: Date;
};

const iconMap = {
  upload: FileUp,
  chat: MessageSquare,
  join: UserPlus,
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RecentActivity({ events }: { events: ActivityEvent[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="space-y-3">
            {events.map((event, i) => {
              const Icon = iconMap[event.type];
              return (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-muted p-1.5">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm">{event.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {timeAgo(event.at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
