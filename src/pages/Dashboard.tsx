import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RouterStatusCard } from "@/components/dashboard/RouterStatusCard";
import { ActiveSessionsTable } from "@/components/dashboard/ActiveSessionsTable";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { Users, Router, DollarSign, Clock, Wifi, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";

interface DashboardStats {
  sessions: {
    total: number;
    active: number;
    today: number;
    week: number;
    month: number;
  };
  routers: {
    total: number;
    online: number;
    offline: number;
  };
  packages: {
    total: number;
    active: number;
    inactive: number;
  };
  revenue: {
    total: number;
    today: number;
    week: number;
    month: number;
    totalFormatted: string;
    todayFormatted: string;
    weekFormatted: string;
    monthFormatted: string;
  };
}

interface RouterStatus {
  id: string;
  name: string;
  ipAddress: string;
  location?: string;
  status: string;
  activeUsers: number;
  activeSessions: number;
  statusColor: string;
  lastSeenFormatted: string;
}

interface ActiveSession {
  id: string;
  deviceMac: string;
  deviceName?: string;
  ipAddress?: string;
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

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [routers, setRouters] = useState<RouterStatus[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      
      // Load dashboard stats
      const statsData = await adminApi.getDashboardStats();
      setStats(statsData.stats || statsData);

      // Load routers (for router status)
      const routersData = await adminApi.getRouters();
      const routersWithStatus = routersData.routers.map((router: any) => ({
        ...router,
        statusColor: router.status === 'ONLINE' ? 'green' : 'red',
        lastSeenFormatted: router.lastSeen ? new Date(router.lastSeen).toLocaleString() : 'Never',
        activeSessions: router.activeUsers || 0
      }));
      setRouters(routersWithStatus);

      // Load active sessions
      const sessionsData = await adminApi.getActiveSessions();
      setActiveSessions(sessionsData.sessions);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
      
      // Set default empty stats to prevent crashes
      setStats({
        sessions: { total: 0, active: 0, today: 0, week: 0, month: 0 },
        routers: { total: 0, online: 0, offline: 0 },
        packages: { total: 0, active: 0, inactive: 0 },
        revenue: {
          total: 0, today: 0, week: 0, month: 0,
          totalFormatted: '0 TZS', todayFormatted: '0 TZS',
          weekFormatted: '0 TZS', monthFormatted: '0 TZS'
        }
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitor your network and connected devices
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/10 border border-success/20">
            <Wifi className="w-5 h-5 text-success" />
            <span className="text-success font-medium">System Online</span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading dashboard data...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Active Sessions"
              value={(stats.sessions?.active || 0).toString()}
              subtitle="Currently connected"
              icon={Users}
              variant="primary"
            />
            <StatCard
              title="Online Routers"
              value={`${stats.routers?.online || 0}/${stats.routers?.total || 0}`}
              subtitle={(stats.routers?.total || 0) === 0 ? "No routers configured" : "Router status"}
              icon={Router}
              variant={(stats.routers?.online || 0) > 0 ? "success" : "destructive"}
            />
            <StatCard
              title="Today's Revenue"
              value={stats.revenue?.todayFormatted || '0 TZS'}
              subtitle={`From ${stats.sessions?.today || 0} sessions`}
              icon={DollarSign}
              variant="warning"
            />
            <StatCard
              title="Total Sessions"
              value={(stats.sessions?.total || 0).toString()}
              subtitle="All time"
              icon={Clock}
            />
          </div>
        )}

        {/* Empty State for Stats */}
        {!loading && !error && !stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Active Sessions"
              value="0"
              subtitle="No active sessions"
              icon={Users}
              variant="primary"
            />
            <StatCard
              title="Online Routers"
              value="0/0"
              subtitle="No routers configured"
              icon={Router}
              variant="destructive"
            />
            <StatCard
              title="Today's Revenue"
              value="0 TZS"
              subtitle="No transactions today"
              icon={DollarSign}
              variant="warning"
            />
            <StatCard
              title="Total Sessions"
              value="0"
              subtitle="No sessions yet"
              icon={Clock}
            />
          </div>
        )}

        {/* Router Status */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Router Status</h2>
          {routers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {routers.map((router) => (
                <RouterStatusCard 
                  key={router.id} 
                  name={router.name}
                  ip={router.ipAddress}
                  status={router.status.toLowerCase() as "online" | "offline"}
                  activeUsers={router.activeSessions}
                  signalStrength={router.status === 'ONLINE' ? 85 : 0}
                  location={router.location || 'Unknown'}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Router className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Routers Configured</h3>
              <p className="text-gray-500 mb-4">Add your first router to start managing WiFi access</p>
              <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                Add Router
              </button>
            </div>
          )}
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart />
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4">System Status</h2>
              {stats ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Packages</span>
                    <span className="font-medium">{stats.packages?.total || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Packages</span>
                    <span className="font-medium text-green-600">{stats.packages?.active || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Revenue</span>
                    <span className="font-medium">{stats.revenue?.totalFormatted || '0 TZS'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">This Week</span>
                    <span className="font-medium">{stats.revenue?.weekFormatted || '0 TZS'}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Sessions</h2>
          {activeSessions.length > 0 ? (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Device
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        MAC Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Package
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Time Left
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Data Used
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Router
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {activeSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-secondary/30">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">
                            {session.deviceName || 'Unknown Device'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {session.ipAddress || 'No IP'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                          {session.deviceMac}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {session.package.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {session.timeRemainingFormatted}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div>↑ {session.bytesUpFormatted}</div>
                          <div>↓ {session.bytesDownFormatted}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div>{session.router.name}</div>
                          <div className="text-muted-foreground">{session.router.location}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Sessions</h3>
              <p className="text-gray-500">No users are currently connected to your WiFi network</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
