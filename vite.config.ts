import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: [
      // SPA shims for TanStack Start server-side APIs and Supabase admin client
      { find: /^@tanstack\/react-start$/, replacement: path.resolve(__dirname, "src/lib/spa-shim/react-start.ts") },
      { find: /^@tanstack\/react-start\/server$/, replacement: path.resolve(__dirname, "src/lib/spa-shim/react-start-server.ts") },
      { find: /^@\/integrations\/supabase\/client\.server$/, replacement: path.resolve(__dirname, "src/lib/spa-shim/supabase-admin.ts") },
      { find: /^@\/integrations\/supabase\/auth-middleware$/, replacement: path.resolve(__dirname, "src/lib/spa-shim/auth-middleware.ts") },
      { find: /^@\/integrations\/supabase\/auth-attacher$/, replacement: path.resolve(__dirname, "src/lib/spa-shim/auth-attacher.ts") },
      { find: "@", replacement: path.resolve(__dirname, "src") },
    ],
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
  },
  server: { host: "::", port: 8080, strictPort: true },
  preview: { host: "::", port: 8080, strictPort: true },
  build: { outDir: "dist", sourcemap: true },
});
