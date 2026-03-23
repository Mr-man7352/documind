"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  BarChart2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, segment: "dashboard" },
  { label: "Documents", icon: FileText, segment: "documents" },
  { label: "Chat", icon: MessageSquare, segment: "chat" },
  { label: "Analytics", icon: BarChart2, segment: "analytics" },
  { label: "Settings", icon: Settings, segment: "settings" },
];

interface SidebarNavProps {
  workspaceSlug: string;
}

export function SidebarNav({ workspaceSlug }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map(({ label, icon: Icon, segment }) => {
        const href = `/${workspaceSlug}/${segment}`;
        const isActive = pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
