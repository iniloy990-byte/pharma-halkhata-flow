import { ReactNode, useState } from "react";
import { Menu, X } from "lucide-react";
import AppSidebar from "./AppSidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile, shown on lg+ */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-auto transition-transform duration-200 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        <AppSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile header */}
        <div className="flex items-center gap-3 h-14 px-4 border-b border-border bg-card lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-inner hover:bg-accent">
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <span className="text-sm font-bold text-foreground">PharmaStream</span>
        </div>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
