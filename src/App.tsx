import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PharmacyProvider } from "@/context/PharmacyContext";
import AppLayout from "@/components/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import POSScreen from "@/pages/POSScreen";
import InventoryPage from "@/pages/InventoryPage";
import ExpiryPage from "@/pages/ExpiryPage";
import CustomersPage from "@/pages/CustomersPage";
import ReportsPage from "@/pages/ReportsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PharmacyProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<AppLayout><DashboardPage /></AppLayout>} />
            <Route path="/pos" element={<AppLayout><POSScreen /></AppLayout>} />
            <Route path="/inventory" element={<AppLayout><InventoryPage /></AppLayout>} />
            <Route path="/expiry" element={<AppLayout><ExpiryPage /></AppLayout>} />
            <Route path="/customers" element={<AppLayout><CustomersPage /></AppLayout>} />
            <Route path="/reports" element={<AppLayout><ReportsPage /></AppLayout>} />
            <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </PharmacyProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
