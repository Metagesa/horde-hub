import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GameSidebar } from "@/components/GameSidebar";
import { SiteLoading } from "@/components/SiteLoading";

const Index = lazy(() => import("./pages/Index.tsx"));
const GamePage = lazy(() => import("./pages/GamePage.tsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 30_000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <div className="flex min-h-screen w-full">
          <GameSidebar />
          <main className="relative min-w-0 flex-1 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,162,67,0.08),transparent_18%),radial-gradient(circle_at_bottom_left,rgba(173,30,43,0.14),transparent_24%)]" />
            <Suspense fallback={<SiteLoading />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/game/:gameId" element={<GamePage />} />
                <Route path="/gestion" element={<AdminPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
