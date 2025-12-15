import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Router,
  Users,
  Package,
  CreditCard,
  Settings,
  Wifi,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Router, label: "Routers", path: "/routers" },
  { icon: Users, label: "Sessions", path: "/sessions" },
  { icon: Package, label: "Packages", path: "/packages" },
  { icon: CreditCard, label: "Payments", path: "/payments" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <Wifi className="w-6 h-6 text-primary" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold gradient-text">NetFlow</h1>
              <p className="text-xs text-muted-foreground">WiFi Management</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "nav-item",
                  isActive && "nav-item-active",
                  collapsed && "justify-center px-3"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && (
                  <span className="animate-fade-in">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 flex items-center justify-center w-6 h-6 rounded-full bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-sidebar-border">
          <Link
            to="/"
            className={cn(
              "nav-item text-muted-foreground hover:text-destructive",
              collapsed && "justify-center px-3"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </Link>
        </div>
      </div>
    </aside>
  );
}
