import { useState, useEffect } from "react";
import { Clock, MoreVertical, Smartphone, Monitor, Laptop, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";

interface Session {
  id: string;
  deviceMac: string;
  deviceName?: string;
  ipAddress?: string;
  status: string;
  timeRemaining: number;
  timeRemainingFormatted: string;
  bytesUpFormatted: string;
  bytesDownFormatted: string;
  router: {
    name: string;
    location?: string;
  };
  package: {
    name: string;
    duration: number;
  };
}

const deviceIcons = {
  mobile: Smartphone,
  desktop: Monitor,
  laptop: Laptop,
};

const statusStyles = {
  ACTIVE: "bg-success/10 text-success",
  EXPIRED: "bg-destructive/10 text-destructive",
  TERMINATED: "bg-gray-500/10 text-gray-500",
  SUSPENDED: "bg-warning/10 text-warning",
};

export function ActiveSessionsTable() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveSessions();
  }, []);

  const loadActiveSessions = async () => {
    try {
      const data = await adminApi.getActiveSessions();
      setSessions(data.sessions.slice(0, 5)); // Show only first 5 sessions
    } catch (error) {
      console.error('Failed to load active sessions:', error);
      toast.error('Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await adminApi.terminateSession(sessionId);
      toast.success('Session terminated successfully');
      loadActiveSessions(); // Reload data
    } catch (error) {
      console.error('Failed to terminate session:', error);
      toast.error('Failed to terminate session');
    }
  };

  const handleExtendSession = async (sessionId: string, minutes: number = 60) => {
    try {
      await adminApi.extendSession(sessionId, minutes);
      toast.success(`Session extended by ${minutes} minutes`);
      loadActiveSessions(); // Reload data
    } catch (error) {
      console.error('Failed to extend session:', error);
      toast.error('Failed to extend session');
    }
  };

  const handleViewDetails = (session: any) => {
    const deviceInfo = session.deviceName || 'Unknown Device';
    const packageInfo = session.package?.name || 'Unknown Package';
    const timeInfo = session.timeRemainingFormatted || 'N/A';
    const routerInfo = session.router?.name || 'Unknown Router';
    const dataInfo = `↓${session.bytesDownFormatted || '0 B'} ↑${session.bytesUpFormatted || '0 B'}`;
    
    toast.info(
      `📱 ${deviceInfo}\n` +
      `📦 ${packageInfo}\n` +
      `⏰ ${timeInfo} remaining\n` +
      `📡 ${routerInfo}\n` +
      `📊 ${dataInfo}`,
      { duration: 5000 }
    );
  };
  return (
    <div className="glass-card overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Active Sessions</h2>
            <p className="text-sm text-muted-foreground">
              Currently connected devices
            </p>
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="table-header text-left p-4">Device</th>
              <th className="table-header text-left p-4">MAC Address</th>
              <th className="table-header text-left p-4">IP Address</th>
              <th className="table-header text-left p-4">Package</th>
              <th className="table-header text-left p-4">Time Left</th>
              <th className="table-header text-left p-4">Data Used</th>
              <th className="table-header text-left p-4">Status</th>
              <th className="table-header text-left p-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading sessions...</span>
                  </div>
                </td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  No active sessions
                </td>
              </tr>
            ) : sessions.map((session) => {
              const DeviceIcon = Smartphone; // Default icon for now
              const isExpiring = session.status === 'ACTIVE' && session.timeRemaining < 3600000; // Less than 1 hour
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
                      <span className="font-medium">{session.deviceName || 'Unknown Device'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <code className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-1 rounded">
                      {session.deviceMac}
                    </code>
                  </td>
                  <td className="p-4">
                    <code className="text-xs font-mono text-muted-foreground">
                      {session.ipAddress || 'N/A'}
                    </code>
                  </td>
                  <td className="p-4 font-medium">{session.package.name}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className={cn("w-4 h-4", isExpiring ? "text-warning" : "text-muted-foreground")} />
                      <span className={cn(isExpiring && "text-warning")}>
                        {session.timeRemainingFormatted}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    <div className="text-sm">
                      <div>↓ {session.bytesDownFormatted}</div>
                      <div className="text-xs">↑ {session.bytesUpFormatted}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium",
                        statusStyles[session.status as keyof typeof statusStyles] || statusStyles.ACTIVE
                      )}
                    >
                      {session.status.toLowerCase()}
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
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleTerminateSession(session.id)}
                            >
                              Disconnect
                            </DropdownMenuItem>
                          </>
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
  );
}
