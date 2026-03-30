import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug);
}

export const ACCEPTED_MIME: readonly string[] = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
];
