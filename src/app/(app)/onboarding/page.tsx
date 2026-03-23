"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export default function OnboardingPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [slugEdited, setSlugEdited] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // When name changes and user hasn't manually edited slug, auto-generate it
  useEffect(() => {
    if (!slugEdited) {
      setSlug(slugify(name));
    }
  }, [name, slugEdited]);

  // When slug changes, validate it with the server
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!slug) {
      setSlugStatus("idle");
      return;
    }

    setSlugStatus("checking");

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/workspaces/check-slug?slug=${encodeURIComponent(slug)}`,
        );
        const data = await res.json();

        if (!data.available && data.reason === "invalid_format") {
          setSlugStatus("invalid");
        } else if (data.available) {
          setSlugStatus("available");
        } else {
          setSlugStatus("taken");
        }
      } catch (err) {
        setSlugStatus("idle");
      }
    }, 500);
  }, [slug]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setSlugEdited(false); // reset manual edit flag when name changes
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setSlugEdited(true); // user has manually edited slug
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim() || slugStatus !== "available") return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create workspace");
        setLoading(false);
      } else {
        router.push(`/${data.slug}/dashboard`);
      }
    } catch {
      setError("Failed to create workspace. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = name.trim() && slugStatus === "available" && !loading;

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Create your workspace
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              A workspace is where your team&apos;s documents and knowledge
              live.
            </p>
          </div>

          <div className="flex justify-end">
            <LogoutButton />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Workspace Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Workspace name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Acme Corp, My Team"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                required
                autoFocus
              />
            </div>

            {/* Slug Field */}
            <div>
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Workspace URL
              </label>
              <div className="relative">
                <div className="flex items-center rounded-lg border border-gray-300 focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900 overflow-hidden">
                  <span className="pl-4 pr-1 text-sm text-gray-400 whitespace-nowrap select-none">
                    documind.app/
                  </span>
                  <input
                    id="slug"
                    type="text"
                    value={slug}
                    onChange={handleSlugChange}
                    placeholder="acme-corp"
                    className="flex-1 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
                  />
                  {/* Status indicator */}
                  <span className="absolute right-3 text-lg">
                    {slugStatus === "checking" && (
                      <span className="text-gray-400 text-sm">...</span>
                    )}
                    {slugStatus === "available" && (
                      <span className="text-green-500">✓</span>
                    )}
                    {(slugStatus === "taken" || slugStatus === "invalid") && (
                      <span className="text-red-500">✗</span>
                    )}
                  </span>
                </div>
              </div>
              {/* Status messages */}
              <p className="mt-1 text-xs h-4">
                {slugStatus === "available" && (
                  <span className="text-green-600">This URL is available</span>
                )}
                {slugStatus === "taken" && (
                  <span className="text-red-600">
                    This URL is already taken
                  </span>
                )}
                {slugStatus === "invalid" && (
                  <span className="text-red-600">
                    3–40 characters, lowercase letters, numbers, hyphens only
                  </span>
                )}
              </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating..." : "Create workspace"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
