import { Clock, MoreVertical, Smartphone, Monitor, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  deviceName: string;
  deviceType: "mobile" | "desktop" | "laptop";
  macAddress: string;
  ipAddress: string;
  package: string;
  timeRemaining: string;
  dataUsed: string;
  status: "active" | "expiring" | "expired";
}

const mockSessions: Session[] = [
  {
    id: "1",
    deviceName: "iPhone 14 Pro",
    deviceType: "mobile",
    macAddress: "AA:BB:CC:DD:EE:01",
    ipAddress: "192.168.1.101",
    package: "24 Hours",
    timeRemaining: "18h 32m",
    dataUsed: "2.4 GB",
    status: "active",
  },
  {
    id: "2",
    deviceName: "MacBook Pro",
    deviceType: "laptop",
    macAddress: "AA:BB:CC:DD:EE:02",
    ipAddress: "192.168.1.102",
    package: "7 Days",
    timeRemaining: "5d 12h",
    dataUsed: "15.8 GB",
    status: "active",
  },
  {
    id: "3",
    deviceName: "Samsung Galaxy",
    deviceType: "mobile",
    macAddress: "AA:BB:CC:DD:EE:03",
    ipAddress: "192.168.1.103",
    package: "24 Hours",
    timeRemaining: "45m",
    dataUsed: "890 MB",
    status: "expiring",
  },
  {
    id: "4",
    deviceName: "Windows PC",
    deviceType: "desktop",
    macAddress: "AA:BB:CC:DD:EE:04",
    ipAddress: "192.168.1.104",
    package: "30 Days",
    timeRemaining: "22d 8h",
    dataUsed: "45.2 GB",
    status: "active",
  },
];

const deviceIcons = {
  mobile: Smartphone,
  desktop: Monitor,
  laptop: Laptop,
};

const statusStyles = {
  active: "bg-success/10 text-success",
  expiring: "bg-warning/10 text-warning",
  expired: "bg-destructive/10 text-destructive",
};

export function ActiveSessionsTable() {
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
            {mockSessions.map((session) => {
              const DeviceIcon = deviceIcons[session.deviceType];
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
                      <span className="font-medium">{session.deviceName}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <code className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-1 rounded">
                      {session.macAddress}
                    </code>
                  </td>
                  <td className="p-4">
                    <code className="text-xs font-mono text-muted-foreground">
                      {session.ipAddress}
                    </code>
                  </td>
                  <td className="p-4 font-medium">{session.package}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span
                        className={cn(
                          session.status === "expiring" && "text-warning"
                        )}
                      >
                        {session.timeRemaining}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {session.dataUsed}
                  </td>
                  <td className="p-4">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                        statusStyles[session.status]
                      )}
                    >
                      {session.status}
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
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Extend Time</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Disconnect
                        </DropdownMenuItem>
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
