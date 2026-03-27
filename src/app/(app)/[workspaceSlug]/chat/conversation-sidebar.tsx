"use client";

import { useState } from "react";
import Link from "next/link";

import { usePathname } from "next/navigation";
import { MoreHorizontal, Plus, Trash2, MessageSquare } from "lucide-react";
import { deleteConversation } from "@/actions/conversation";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: Date;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  workspaceSlug: string;
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ConversationSidebar({
  conversations,
  workspaceSlug,
}: ConversationSidebarProps) {
  const pathname = usePathname();
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <div className="w-64 border-r flex flex-col h-full shrink-0">
      {/* New Conversation button */}
      <div className="p-3 border-b">
        <Link
          href={`/${workspaceSlug}/chat`}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-2 px-4 py-8">
            <MessageSquare className="h-8 w-8 opacity-30" />
            <p className="text-xs">Start your first conversation</p>
          </div>
        ) : (
          conversations.map((convo) => {
            const isActive = pathname.includes(convo.id);
            const isMenuOpen = menuOpenId === convo.id;
            const isConfirming = confirmDeleteId === convo.id;

            return (
              <div
                key={convo.id}
                className={cn(
                  "group relative flex items-center gap-1 mx-2 rounded-lg px-3 py-2 text-sm",
                  isActive ? "bg-accent" : "hover:bg-accent/50",
                )}
              >
                <Link
                  href={`/${workspaceSlug}/chat/${convo.id}`}
                  className="flex-1 min-w-0"
                  onClick={() => setMenuOpenId(null)}
                >
                  <p className="truncate font-medium text-foreground text-xs">
                    {convo.title ?? "Untitled"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {relativeTime(new Date(convo.updatedAt))}
                  </p>
                </Link>

                {/* Three-dot button — hidden until hover */}
                {!isConfirming && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setMenuOpenId(isMenuOpen ? null : convo.id);
                    }}
                    className={cn(
                      "shrink-0 p-1 rounded hover:bg-background transition-colors",
                      isMenuOpen
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100",
                    )}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}

                {/* Dropdown */}
                {isMenuOpen && !isConfirming && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpenId(null)}
                    />
                    <div className="absolute right-2 top-9 z-10 bg-popover border rounded-lg shadow-md py-1 w-32">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setMenuOpenId(null);
                          setConfirmDeleteId(convo.id);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-destructive hover:bg-accent"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </>
                )}

                {/* Inline confirmation */}
                {isConfirming && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        await deleteConversation(convo.id, workspaceSlug);
                      }}
                      className="text-xs px-2 py-0.5 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setConfirmDeleteId(null);
                      }}
                      className="text-xs px-2 py-0.5 rounded hover:bg-accent"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
