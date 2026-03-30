"use client";

import { createContext, useContext, useState } from "react";

interface ChatSidebarContextValue {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const ChatSidebarContext = createContext<ChatSidebarContextValue>({
  isMobileOpen: false,
  setIsMobileOpen: () => {},
});

export function ChatSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <ChatSidebarContext.Provider value={{ isMobileOpen, setIsMobileOpen }}>
      {children}
    </ChatSidebarContext.Provider>
  );
}

export function useChatSidebar() {
  return useContext(ChatSidebarContext);
}
