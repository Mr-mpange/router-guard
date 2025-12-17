import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  MoreVertical,
  Clock,
  Smartphone,
  Monitor,
  Laptop,
  Wifi,
  XCircle,
  RefreshCw,
  Users,
  AlertCircle,
  Loader2,
  Play,
  Pause,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { SessionDetailsModal } from "@/components/SessionDetailsModal";

interface Session {
  id: string;
  deviceMac: string;
  deviceName?: string;
  ipAddress?: string;
  status: string;
  startTime: string;
  endTime?: string;
  expiresAt: string;
  timeRemaining: number;
  timeRemainingFormatted: string;
  durationFormatted: string;
  bytesUpFormatted: string;
  bytesDownFormatted: string;
  statusColor: string;
  isExpired: boolean;
  router: {
    id: string;
    name: string;
    location?: string;
    ipAddress: string;
  };
  package: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
  payment?: {
    id: string;
    status: string;
    paymentMethod: string;
    amount: number;
    paidAt?: string;
  };
}

const deviceIcons = {
  mobile: Smartphone,
  desktop: Monitor,
  laptop: Laptop,
};

const statusConfig = {
  ACTIVE: {
    label: "Active",
    dotColor: "bg-success",
    textColor: "text-success",
    bgColor: "bg-success/10",
  },
  EXPIRED: {
    label: "Expired",
    dotColor: "bg-destructive",
    textColor: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  TERMINATED: {
    label: "Terminated",
    dotColor: "bg-gray-500",
    textColor: "text-gray-500",
    bgColor: "bg-gray-500/10",
  },
  SUSPENDED: {
    label: "Suspended",
    dotColor: "bg-warning",
    textColor: "text-warning",
    bgColor: "bg-warning/10",
  },
};

export default function Sessions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getSessions();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await adminApi.terminateSession(sessionId);
      toast.success('Session terminated successfully');
      loadSessions(); // Reload data
    } catch (error) {
      console.error('Failed to terminate session:', error);
      toast.error('Failed to terminate session');
    }
  };

  const handleSuspendSession = async (sessionId: string) => {
    try {
      await adminApi.suspendSession(sessionId);
      toast.success('Session suspended successfully');
      loadSessions(); // Reload data
    } catch (error) {
      console.error('Failed to suspend session:', error);
      toast.error('Failed to suspend session');
    }
  };

  const handleResumeSession = async (sessionId: string) => {
    try {
      await adminApi.resumeSession(sessionId);
      toast.success('Session resumed successfully');
      loadSessions(); // Reload data
    } catch (error) {
      console.error('Failed to resume session:', error);
      toast.error('Failed to resume session');
    }
  };

  const handleExtendSession = async (sessionId: string, minutes: number = 60) => {
    try {
      await adminApi.extendSession(sessionId, minutes);
      toast.success(`Session extended by ${minutes} minutes`);
      loadSessions(); // Reload data
    } catch (error) {
      console.error('Failed to extend session:', error);
      toast.error('Failed to extend session');
    }
  };

  const handleViewDetails = (session: any) => {
    setSelectedSession(session);
    setIsDetailsModalOpen(true);
  };

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      (session.deviceName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.deviceMac.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (session.ipAddress || '').includes(searchQuery);
    const matchesStatus = statusFilter === "all" || session.status === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Active Sessions</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and manage connected device sessions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={loadSessions} disabled={loading}>
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10">
              <Wifi className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {sessions.filter((s) => s.status === "ACTIVE").length}
              </p>
              <p className="text-sm text-muted-foreground">Active Sessions</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning/10">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {sessions.filter((s) => s.status === "ACTIVE" && s.timeRemaining < 3600000).length}
              </p>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-destructive/10">
              <XCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {sessions.filter((s) => s.status === "EXPIRED").length}
              </p>
              <p className="text-sm text-muted-foreground">Expired</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sessions.length}</p>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by device, MAC, or IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sessions Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="table-header text-left p-4">Device</th>
                  <th className="table-header text-left p-4">MAC / IP</th>
                  <th className="table-header text-left p-4">Router</th>
                  <th className="table-header text-left p-4">Package</th>
                  <th className="table-header text-left p-4">Time Left</th>
                  <th className="table-header text-left p-4">Data</th>
                  <th className="table-header text-left p-4">Status</th>
                  <th className="table-header text-left p-4"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading sessions...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No sessions found
                    </td>
                  </tr>
                ) : filteredSessions.map((session) => {
                  const DeviceIcon = Smartphone; // Default icon for now
                  const status = statusConfig[session.status as keyof typeof statusConfig] || statusConfig.ACTIVE;
                  return (
                    <tr
                      key={session.id}
                      className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-secondary">
                            <DeviceIcon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <span className="font-medium block">{session.deviceName || 'Unknown Device'}</span>
                            <span className="text-xs text-muted-foreground">
                              Started: {new Date(session.startTime).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <code className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded block w-fit">
                            {session.deviceMac}
                          </code>
                          <code className="text-xs font-mono text-muted-foreground block">
                            {session.ipAddress || 'N/A'}
                          </code>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{session.router?.name || 'Unknown'}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{session.package?.name || 'Unknown'}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <Clock
                            className={cn(
                              "w-4 h-4",
                              session.status === "ACTIVE" && session.timeRemaining < 3600000
                                ? "text-warning"
                                : session.status === "EXPIRED"
                                ? "text-destructive"
                                : "text-muted-foreground"
                            )}
                          />
                          <span
                            className={cn(
                              "font-mono",
                              session.status === "ACTIVE" && session.timeRemaining < 3600000 && "text-warning",
                              session.status === "EXPIRED" && "text-destructive"
                            )}
                          >
                            {session.timeRemainingFormatted || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div>↓ {session.bytesDownFormatted || '0 B'}</div>
                          <div className="text-xs text-muted-foreground">↑ {session.bytesUpFormatted || '0 B'}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5",
                            status.bgColor,
                            status.textColor
                          )}
                        >
                          <span className={cn("status-dot", status.dotColor)} />
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(session)}>
                              View Details
                            </DropdownMenuItem>
                            {session.status === 'ACTIVE' && (
                              <>
                                <DropdownMenuItem onClick={() => handleExtendSession(session.id, 60)}>
                                  Extend +1 Hour
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExtendSession(session.id, 1440)}>
                                  Extend +1 Day
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSuspendSession(session.id)}>
                                  Suspend
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleTerminateSession(session.id)}
                                >
                                  Terminate
                                </DropdownMenuItem>
                              </>
                            )}
                            {session.status === 'SUSPENDED' && (
                              <DropdownMenuItem onClick={() => handleResumeSession(session.id)}>
                                Resume
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Session Details Modal */}
        <SessionDetailsModal
          session={selectedSession}
          open={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
          onExtend={handleExtendSession}
          onSuspend={handleSuspendSession}
          onResume={handleResumeSession}
          onTerminate={handleTerminateSession}
        />
      </div>
    </DashboardLayout>
  );
}
