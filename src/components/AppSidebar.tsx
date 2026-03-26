import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, Package, AlertTriangle, Users, FileText, Settings, Pill, X,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/pos", icon: ShoppingCart, label: "POS Sales" },
  { to: "/inventory", icon: Package, label: "Inventory" },
  { to: "/expiry", icon: AlertTriangle, label: "Expiry Monitor" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/reports", icon: FileText, label: "Reports" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

interface AppSidebarProps {
  onClose?: () => void;
}

export default function AppSidebar({ onClose }: AppSidebarProps) {
  const location = useLocation();

  const renderLink = (item: typeof navItems[0], isActive: boolean) => (
    <NavLink
      key={item.to}
      to={item.to}
      onClick={onClose}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-outer text-sm font-medium transition-all ${
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      }`}
    >
      <item.icon className="w-4 h-4 shrink-0" />
      {item.label}
    </NavLink>
  );

  return (
    <aside className="flex flex-col h-screen bg-sidebar text-sidebar-foreground w-[240px] border-r border-sidebar-border">
      <div className="flex items-center justify-between px-5 h-16 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-outer bg-sidebar-primary flex items-center justify-center">
            <Pill className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          <h1 className="text-sm font-bold text-sidebar-accent-foreground tracking-tight">PharmaStream</h1>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 rounded-inner hover:bg-sidebar-accent">
            <X className="w-4 h-4 text-sidebar-foreground" />
          </button>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-auto">
        {navItems.map((item) => renderLink(item, location.pathname === item.to))}
      </nav>
    </aside>
  );
}
