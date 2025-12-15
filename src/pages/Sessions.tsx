import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  deviceName: string;
  deviceType: "mobile" | "desktop" | "laptop";
  macAddress: string;
  ipAddress: string;
  router: string;
  package: string;
  startTime: string;
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
    router: "Main Lobby",
    package: "24 Hours",
    startTime: "2024-01-15 08:30",
    timeRemaining: "18h 32m",
    dataUsed: "2.4 GB",
    status: "active",
  },
  {
    id: "2",
    deviceName: "MacBook Pro M3",
    deviceType: "laptop",
    macAddress: "AA:BB:CC:DD:EE:02",
    ipAddress: "192.168.1.102",
    router: "Cafe WiFi",
    package: "7 Days",
    startTime: "2024-01-10 14:15",
    timeRemaining: "5d 12h",
    dataUsed: "15.8 GB",
    status: "active",
  },
  {
    id: "3",
    deviceName: "Samsung Galaxy S23",
    deviceType: "mobile",
    macAddress: "AA:BB:CC:DD:EE:03",
    ipAddress: "192.168.1.103",
    router: "Main Lobby",
    package: "24 Hours",
    startTime: "2024-01-15 22:45",
    timeRemaining: "45m",
    dataUsed: "890 MB",
    status: "expiring",
  },
  {
    id: "4",
    deviceName: "Windows Desktop",
    deviceType: "desktop",
    macAddress: "AA:BB:CC:DD:EE:04",
    ipAddress: "192.168.1.104",
    router: "Conference Room",
    package: "30 Days",
    startTime: "2023-12-20 10:00",
    timeRemaining: "22d 8h",
    dataUsed: "45.2 GB",
    status: "active",
  },
  {
    id: "5",
    deviceName: "iPad Pro",
    deviceType: "laptop",
    macAddress: "AA:BB:CC:DD:EE:05",
    ipAddress: "192.168.1.105",
    router: "Cafe WiFi",
    package: "24 Hours",
    startTime: "2024-01-14 12:00",
    timeRemaining: "0m",
    dataUsed: "1.2 GB",
    status: "expired",
  },
];

const deviceIcons = {
  mobile: Smartphone,
  desktop: Monitor,
  laptop: Laptop,
};

const statusConfig = {
  active: {
    label: "Active",
    dotColor: "bg-success",
    textColor: "text-success",
    bgColor: "bg-success/10",
  },
  expiring: {
    label: "Expiring",
    dotColor: "bg-warning",
    textColor: "text-warning",
    bgColor: "bg-warning/10",
  },
  expired: {
    label: "Expired",
    dotColor: "bg-destructive",
    textColor: "text-destructive",
    bgColor: "bg-destructive/10",
  },
};

export default function Sessions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredSessions = mockSessions.filter((session) => {
    const matchesSearch =
      session.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.macAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.ipAddress.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || session.status === statusFilter;
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
            <Button variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
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
                {mockSessions.filter((s) => s.status === "active").length}
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
                {mockSessions.filter((s) => s.status === "expiring").length}
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
                {mockSessions.filter((s) => s.status === "expired").length}
              </p>
              <p className="text-sm text-muted-foreground">Expired</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockSessions.length}</p>
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
              <SelectItem value="expiring">Expiring</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
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
                {filteredSessions.map((session) => {
                  const DeviceIcon = deviceIcons[session.deviceType];
                  const status = statusConfig[session.status];
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
                            <span className="font-medium block">{session.deviceName}</span>
                            <span className="text-xs text-muted-foreground">
                              Started: {session.startTime}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <code className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded block w-fit">
                            {session.macAddress}
                          </code>
                          <code className="text-xs font-mono text-muted-foreground block">
                            {session.ipAddress}
                          </code>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{session.router}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{session.package}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <Clock
                            className={cn(
                              "w-4 h-4",
                              session.status === "expiring"
                                ? "text-warning"
                                : session.status === "expired"
                                ? "text-destructive"
                                : "text-muted-foreground"
                            )}
                          />
                          <span
                            className={cn(
                              "font-mono",
                              session.status === "expiring" && "text-warning",
                              session.status === "expired" && "text-destructive"
                            )}
                          >
                            {session.timeRemaining}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-muted-foreground">{session.dataUsed}</span>
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
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Extend Time</DropdownMenuItem>
                            <DropdownMenuItem>Change Package</DropdownMenuItem>
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
      </div>
    </DashboardLayout>
  );
}
