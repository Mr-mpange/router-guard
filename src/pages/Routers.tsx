import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Router,
  Plus,
  Settings,
  Trash2,
  RefreshCw,
  Signal,
  Users,
  Activity,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";

interface RouterDevice {
  id: string;
  name: string;
  ipAddress: string;
  location?: string;
  status: string;
  activeUsers: number;
  activeSessions: number;
  statusColor: string;
  lastSeenFormatted: string;
  signalStrength?: number;
  macAddress?: string;
  createdAt: string;
  updatedAt: string;
}

interface NewRouter {
  name: string;
  ipAddress: string;
  location: string;
  username: string;
  password: string;
}
const statusConfig = {
  ONLINE: {
    label: "Online",
    dotColor: "bg-success",
    textColor: "text-success",
    bgColor: "bg-success/10",
  },
  OFFLINE: {
    label: "Offline",
    dotColor: "bg-destructive",
    textColor: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  MAINTENANCE: {
    label: "Maintenance",
    dotColor: "bg-warning",
    textColor: "text-warning",
    bgColor: "bg-warning/10",
  },
};

export default function Routers() {
  const [routers, setRouters] = useState<RouterDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRouter, setNewRouter] = useState<NewRouter>({
    name: '',
    ipAddress: '',
    location: '',
    username: 'admin',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadRouters();
  }, []);

  const loadRouters = async () => {
    try {
      setError(null);
      const data = await adminApi.getRouters();
      setRouters(data.routers);
    } catch (error) {
      console.error('Failed to load routers:', error);
      setError(error instanceof Error ? error.message : 'Failed to load routers');
      toast.error('Failed to load routers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRouter = async () => {
    if (!newRouter.name || !newRouter.ipAddress || !newRouter.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await adminApi.createRouter(newRouter);
      toast.success(data.message || 'Router added successfully');
      setIsAddDialogOpen(false);
      setNewRouter({
        name: '',
        ipAddress: '',
        location: '',
        username: 'admin',
        password: ''
      });
      loadRouters(); // Reload the list
    } catch (error) {
      console.error('Failed to add router:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add router');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestConnection = async (routerId: string) => {
    try {
      const data = await adminApi.testRouter(routerId);
      toast.success(data.message);
      loadRouters(); // Reload to get updated status
    } catch (error) {
      console.error('Failed to test connection:', error);
      toast.error('Failed to test router connection');
    }
  };

  const handleDeleteRouter = async (routerId: string, routerName: string) => {
    if (!confirm(`Are you sure you want to delete "${routerName}"?`)) {
      return;
    }

    try {
      const data = await adminApi.deleteRouter(routerId);
      toast.success(data.message);
      loadRouters(); // Reload the list
    } catch (error) {
      console.error('Failed to delete router:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete router');
    }
  };

  const onlineRouters = routers.filter(r => r.status === 'ONLINE').length;
  const offlineRouters = routers.filter(r => r.status === 'OFFLINE').length;
  const totalActiveUsers = routers.reduce((sum, r) => sum + r.activeSessions, 0);

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
                  <Label htmlFor="name">Router Name *</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g., Main Lobby Router"
                    value={newRouter.name}
                    onChange={(e) => setNewRouter({...newRouter, name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ip">IP Address *</Label>
                  <Input 
                    id="ip" 
                    placeholder="192.168.1.1"
                    value={newRouter.ipAddress}
                    onChange={(e) => setNewRouter({...newRouter, ipAddress: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    placeholder="Building/Floor/Area"
                    value={newRouter.location}
                    onChange={(e) => setNewRouter({...newRouter, location: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="username">API Username</Label>
                    <Input 
                      id="username" 
                      placeholder="admin"
                      value={newRouter.username}
                      onChange={(e) => setNewRouter({...newRouter, username: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">API Password *</Label>
                    <Input 
                      id="password" 
                      type="password"
                      value={newRouter.password}
                      onChange={(e) => setNewRouter({...newRouter, password: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddRouter} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect Router'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mr-2" />
            <span>Loading routers...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
            <Button variant="outline" size="sm" onClick={loadRouters} className="ml-auto">
              Retry
            </Button>
          </div>
        )}

        {/* Stats Overview */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/10">
                <Router className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{onlineRouters}</p>
                <p className="text-sm text-muted-foreground">Online Routers</p>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-destructive/10">
                <Router className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{offlineRouters}</p>
                <p className="text-sm text-muted-foreground">Offline Routers</p>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalActiveUsers}</p>
                <p className="text-sm text-muted-foreground">Active Sessions</p>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-warning/10">
                <Activity className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{routers.length}</p>
                <p className="text-sm text-muted-foreground">Total Routers</p>
              </div>
            </div>
          </div>
        )}

        {/* Router Grid */}
        {!loading && !error && (
          <div>
            {routers.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {routers.map((router) => {
                  const status = statusConfig[router.status as keyof typeof statusConfig] || statusConfig.OFFLINE;
                  return (
                    <div
                      key={router.id}
                      className={cn(
                        "glass-card p-6 transition-all duration-300 hover:border-primary/30",
                        router.status === "OFFLINE" && "opacity-75"
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "p-3 rounded-xl",
                              router.status === "ONLINE"
                                ? "bg-success/10"
                                : router.status === "MAINTENANCE"
                                ? "bg-warning/10"
                                : "bg-destructive/10"
                            )}
                          >
                            <Router
                              className={cn(
                                "w-6 h-6",
                                router.status === "ONLINE"
                                  ? "text-success"
                                  : router.status === "MAINTENANCE"
                                  ? "text-warning"
                                  : "text-destructive"
                              )}
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{router.name}</h3>
                            <p className="text-sm text-muted-foreground">MikroTik Router</p>
                          </div>
                        </div>
                        <Badge
                          variant={router.status === 'ONLINE' ? 'default' : 'destructive'}
                          className={cn(
                            "flex items-center gap-1.5",
                            status.bgColor,
                            status.textColor
                          )}
                        >
                          <span className={cn("w-2 h-2 rounded-full", status.dotColor)} />
                          {status.label}
                        </Badge>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">IP Address</span>
                          <code className="font-mono bg-secondary px-2 py-0.5 rounded">
                            {router.ipAddress}
                          </code>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Location</span>
                          <span>{router.location || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Last Seen</span>
                          <span className="font-mono">{router.lastSeenFormatted}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg mb-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-lg font-semibold">{router.activeSessions}</p>
                            <p className="text-xs text-muted-foreground">Active Sessions</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Signal className="w-4 h-4 text-success" />
                          <div>
                            <p className="text-lg font-semibold">{router.signalStrength || 0}%</p>
                            <p className="text-xs text-muted-foreground">Signal Strength</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 gap-2"
                          onClick={() => handleTestConnection(router.id)}
                        >
                          <RefreshCw className="w-4 h-4" />
                          Test Connection
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteRouter(router.id, router.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Router className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Routers Configured</h3>
                <p className="text-gray-500 mb-4">Add your first MikroTik router to start managing WiFi access</p>
                <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Router
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
