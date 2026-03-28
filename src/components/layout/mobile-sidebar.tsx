"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { SidebarNav } from "./sidebar-nav";

interface MobileSidebarProps {
  workspaceSlug: string;
}

export function MobileSidebar({ workspaceSlug }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close whenever the user navigates to a new page
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Dark backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-in panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r bg-sidebar p-4 flex flex-col transform transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-6 px-3">
          <span className="text-lg font-bold">DocuMind</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarNav workspaceSlug={workspaceSlug} />
      </div>
    </>
  );
}
