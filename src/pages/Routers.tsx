import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Router,
  Plus,
  Settings,
  Trash2,
  RefreshCw,
  Signal,
  Users,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RouterDevice {
  id: string;
  name: string;
  ip: string;
  location: string;
  status: "online" | "offline" | "warning";
  activeUsers: number;
  totalConnections: number;
  uptime: string;
  model: string;
}

const mockRouters: RouterDevice[] = [
  {
    id: "1",
    name: "Main Lobby Router",
    ip: "192.168.1.1",
    location: "Main Building - Lobby",
    status: "online",
    activeUsers: 24,
    totalConnections: 156,
    uptime: "15d 8h 32m",
    model: "MikroTik hAP ac³",
  },
  {
    id: "2",
    name: "Cafe WiFi",
    ip: "192.168.1.2",
    location: "Ground Floor - Cafe",
    status: "online",
    activeUsers: 18,
    totalConnections: 89,
    uptime: "7d 14h 22m",
    model: "MikroTik RB4011",
  },
  {
    id: "3",
    name: "Conference Room",
    ip: "192.168.1.3",
    location: "Floor 2 - Meeting Area",
    status: "offline",
    activeUsers: 0,
    totalConnections: 45,
    uptime: "-",
    model: "MikroTik hAP ac²",
  },
  {
    id: "4",
    name: "Outdoor Access Point",
    ip: "192.168.1.4",
    location: "Garden Area",
    status: "warning",
    activeUsers: 8,
    totalConnections: 34,
    uptime: "2d 5h 18m",
    model: "MikroTik wAP ac",
  },
];

const statusConfig = {
  online: {
    label: "Online",
    dotColor: "bg-success",
    textColor: "text-success",
    bgColor: "bg-success/10",
  },
  offline: {
    label: "Offline",
    dotColor: "bg-destructive",
    textColor: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  warning: {
    label: "Warning",
    dotColor: "bg-warning",
    textColor: "text-warning",
    bgColor: "bg-warning/10",
  },
};

export default function Routers() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Router Management</h1>
            <p className="text-muted-foreground mt-1">
              Configure and monitor your MikroTik routers
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="glow" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Router
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Router</DialogTitle>
                <DialogDescription>
                  Connect a MikroTik router to the management system
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Router Name</Label>
                  <Input id="name" placeholder="e.g., Main Lobby Router" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ip">IP Address</Label>
                  <Input id="ip" placeholder="192.168.1.1" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="Building/Floor/Area" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="username">API Username</Label>
                    <Input id="username" placeholder="admin" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">API Password</Label>
                    <Input id="password" type="password" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddDialogOpen(false)}>
                  Connect Router
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10">
              <Router className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-sm text-muted-foreground">Online Routers</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-destructive/10">
              <Router className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">1</p>
              <p className="text-sm text-muted-foreground">Offline Routers</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">50</p>
              <p className="text-sm text-muted-foreground">Total Active Users</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning/10">
              <Activity className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">324</p>
              <p className="text-sm text-muted-foreground">Total Connections</p>
            </div>
          </div>
        </div>

        {/* Router Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mockRouters.map((router) => {
            const status = statusConfig[router.status];
            return (
              <div
                key={router.id}
                className={cn(
                  "glass-card p-6 transition-all duration-300 hover:border-primary/30",
                  router.status === "offline" && "opacity-75"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "p-3 rounded-xl",
                        router.status === "online"
                          ? "bg-success/10"
                          : router.status === "warning"
                          ? "bg-warning/10"
                          : "bg-destructive/10"
                      )}
                    >
                      <Router
                        className={cn(
                          "w-6 h-6",
                          router.status === "online"
                            ? "text-success"
                            : router.status === "warning"
                            ? "text-warning"
                            : "text-destructive"
                        )}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{router.name}</h3>
                      <p className="text-sm text-muted-foreground">{router.model}</p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                      status.bgColor,
                      status.textColor
                    )}
                  >
                    <span className={cn("status-dot", status.dotColor)} />
                    {status.label}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">IP Address</span>
                    <code className="font-mono bg-secondary px-2 py-0.5 rounded">
                      {router.ip}
                    </code>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Location</span>
                    <span>{router.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Uptime</span>
                    <span className="font-mono">{router.uptime}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-lg font-semibold">{router.activeUsers}</p>
                      <p className="text-xs text-muted-foreground">Active Users</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Signal className="w-4 h-4 text-success" />
                    <div>
                      <p className="text-lg font-semibold">{router.totalConnections}</p>
                      <p className="text-xs text-muted-foreground">Total Sessions</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Settings className="w-4 h-4" />
                    Configure
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
