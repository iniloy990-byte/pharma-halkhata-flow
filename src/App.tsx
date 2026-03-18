import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import POSScreen from "@/pages/POSScreen";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout><DashboardPage /></AppLayout>} />
          <Route path="/pos" element={<AppLayout><POSScreen /></AppLayout>} />
          <Route path="/inventory" element={<AppLayout><PlaceholderPage title="Inventory" /></AppLayout>} />
          <Route path="/expiry" element={<AppLayout><PlaceholderPage title="Expiry Monitor" /></AppLayout>} />
          <Route path="/customers" element={<AppLayout><PlaceholderPage title="Customers" /></AppLayout>} />
          <Route path="/reports" element={<AppLayout><PlaceholderPage title="Reports" /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><PlaceholderPage title="Settings" /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-foreground tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">This module is coming soon.</p>
    </div>
  );
}

export default App;
