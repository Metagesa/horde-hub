import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

function manualChunks(id: string) {
  if (id.includes("node_modules")) {
    if (id.includes("react-day-picker") || id.includes("date-fns")) {
      return "calendar";
    }

    if (id.includes("html-to-image")) {
      return "export";
    }

    if (id.includes("react-router") || id.includes("@tanstack")) {
      return "route-shell";
    }

    if (id.includes("@radix-ui") || id.includes("lucide-react")) {
      return "ui-core";
    }

    if (id.includes("react") || id.includes("scheduler")) {
      return "react-core";
    }
  }

  if (id.includes("/src/components/FridayDatePickerCalendar.tsx")) {
    return "calendar";
  }

  if (
    id.includes("/src/components/RegistrationForm.tsx") ||
    id.includes("/src/components/BoardReservationPanel.tsx")
  ) {
    return "game-registration";
  }

  if (
    id.includes("/src/components/BoardsHeatmap.tsx") ||
    id.includes("/src/lib/tableAvailability.ts")
  ) {
    return "game-boards";
  }

  if (
    id.includes("/src/components/MatchEditorModal.tsx") ||
    id.includes("/src/components/ResultModal.tsx")
  ) {
    return "game-modals";
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
}));
