import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RouterStatusCard } from "@/components/dashboard/RouterStatusCard";
import { ActiveSessionsTable } from "@/components/dashboard/ActiveSessionsTable";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { Users, Router, DollarSign, Clock, Wifi } from "lucide-react";

const mockRouters = [
  {
    name: "Main Lobby Router",
    ip: "192.168.1.1",
    status: "online" as const,
    activeUsers: 24,
    signalStrength: 95,
    location: "Lobby",
  },
  {
    name: "Cafe Router",
    ip: "192.168.1.2",
    status: "online" as const,
    activeUsers: 18,
    signalStrength: 88,
    location: "Cafe",
  },
  {
    name: "Conference Room",
    ip: "192.168.1.3",
    status: "offline" as const,
    activeUsers: 0,
    signalStrength: 0,
    location: "Floor 2",
  },
];

export default function Dashboard() {
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Active Users"
            value="42"
            subtitle="Currently connected"
            icon={Users}
            variant="primary"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Online Routers"
            value="2/3"
            subtitle="Healthy connections"
            icon={Router}
            variant="success"
          />
          <StatCard
            title="Today's Revenue"
            value="125,000 TZS"
            subtitle="From 28 transactions"
            icon={DollarSign}
            variant="warning"
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Avg. Session"
            value="4.2h"
            subtitle="Per user today"
            icon={Clock}
          />
        </div>

        {/* Router Status */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Router Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockRouters.map((router) => (
              <RouterStatusCard key={router.ip} {...router} />
            ))}
          </div>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart />
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4">Package Distribution</h2>
              <div className="space-y-4">
                {[
                  { name: "24 Hours - 500 TZS", percentage: 45, color: "bg-primary" },
                  { name: "7 Days - 1,000 TZS", percentage: 35, color: "bg-success" },
                  { name: "30 Days - 5,000 TZS", percentage: 20, color: "bg-warning" },
                ].map((pkg) => (
                  <div key={pkg.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{pkg.name}</span>
                      <span className="text-muted-foreground">{pkg.percentage}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${pkg.color} rounded-full transition-all duration-500`}
                        style={{ width: `${pkg.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <ActiveSessionsTable />
      </div>
    </DashboardLayout>
  );
}
