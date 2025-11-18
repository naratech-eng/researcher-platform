import { useMemo } from "react";
import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

import IndexPage from "@/pages/Index";
import ResearchPage from "@/pages/Research";
import BehaviorPage from "@/pages/Behavior";
import HistoryPage from "@/pages/History";
import AuthPage from "@/pages/Auth";
import NotFoundPage from "@/pages/NotFound";

const AppLayout = () => (
  <ProtectedRoute>
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  </ProtectedRoute>
);

function App() {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route element={<AppLayout />}>
              <Route index element={<IndexPage />} />
              <Route path="research" element={<ResearchPage />} />
              <Route path="behavior" element={<BehaviorPage />} />
              <Route path="history" element={<HistoryPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        <SonnerToaster richColors closeButton />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
