import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // console.log("Loaded env variables:", env);

  // Use env variable for local dev testing, fallback to production URL
  const apiBase = env.WIDGET_API_BASE_URL || "https://documind-lac.vercel.app";

  return {
    define: {
      // __BASE_URL__ will be replaced with the actual string at build time
      __BASE_URL__: JSON.stringify(apiBase),
    },
    build: {
      lib: {
        entry: "widget/index.js",
        formats: ["iife"], // Self-executing bundle — no import/export, just runs
        name: "DocuMindWidget",
        fileName: () => "widget.js", // outputs widget.js
      },
      outDir: "public", // Next.js serves /public at the root
      emptyOutDir: false, // Don't wipe the whole public folder on each build
    },
  };
});
