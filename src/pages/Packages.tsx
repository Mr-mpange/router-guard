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
import { Switch } from "@/components/ui/switch";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Clock,
  DollarSign,
  Users,
  Zap,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PackageItem {
  id: string;
  name: string;
  price: number;
  duration: string;
  durationHours: number;
  speedLimit?: string;
  dataLimit?: string;
  activeUsers: number;
  totalSold: number;
  isActive: boolean;
  isPopular?: boolean;
}

const mockPackages: PackageItem[] = [
  {
    id: "1",
    name: "Daily Pass",
    price: 500,
    duration: "24 Hours",
    durationHours: 24,
    speedLimit: "10 Mbps",
    activeUsers: 28,
    totalSold: 1250,
    isActive: true,
    isPopular: true,
  },
  {
    id: "2",
    name: "Weekly Bundle",
    price: 1000,
    duration: "7 Days",
    durationHours: 168,
    speedLimit: "15 Mbps",
    activeUsers: 45,
    totalSold: 890,
    isActive: true,
  },
  {
    id: "3",
    name: "Monthly Premium",
    price: 5000,
    duration: "30 Days",
    durationHours: 720,
    speedLimit: "25 Mbps",
    dataLimit: "Unlimited",
    activeUsers: 12,
    totalSold: 156,
    isActive: true,
  },
  {
    id: "4",
    name: "Hourly Access",
    price: 100,
    duration: "1 Hour",
    durationHours: 1,
    speedLimit: "5 Mbps",
    activeUsers: 5,
    totalSold: 2340,
    isActive: true,
  },
  {
    id: "5",
    name: "Student Special",
    price: 3000,
    duration: "30 Days",
    durationHours: 720,
    speedLimit: "10 Mbps",
    dataLimit: "50 GB",
    activeUsers: 0,
    totalSold: 45,
    isActive: false,
  },
];

export default function Packages() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [packages, setPackages] = useState(mockPackages);

  const togglePackage = (id: string) => {
    setPackages((prev) =>
      prev.map((pkg) =>
        pkg.id === id ? { ...pkg, isActive: !pkg.isActive } : pkg
      )
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Package Configuration</h1>
            <p className="text-muted-foreground mt-1">
              Manage WiFi access packages and pricing
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="glow" className="gap-2">
                <Plus className="w-4 h-4" />
                New Package
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Package</DialogTitle>
                <DialogDescription>
                  Configure a new WiFi access package for customers
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="pkg-name">Package Name</Label>
                  <Input id="pkg-name" placeholder="e.g., Daily Pass" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price (TZS)</Label>
                    <Input id="price" type="number" placeholder="500" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="duration">Duration (Hours)</Label>
                    <Input id="duration" type="number" placeholder="24" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="speed">Speed Limit</Label>
                    <Input id="speed" placeholder="10 Mbps" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="data">Data Limit</Label>
                    <Input id="data" placeholder="Unlimited" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddDialogOpen(false)}>
                  Create Package
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {packages.filter((p) => p.isActive).length}
              </p>
              <p className="text-sm text-muted-foreground">Active Packages</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10">
              <Users className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {packages.reduce((sum, p) => sum + p.activeUsers, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Active Subscribers</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning/10">
              <TrendingUp className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {packages.reduce((sum, p) => sum + p.totalSold, 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Sold</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-accent/10">
              <DollarSign className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {(
                  packages.reduce((sum, p) => sum + p.price * p.totalSold, 0) /
                  1000000
                ).toFixed(1)}M
              </p>
              <p className="text-sm text-muted-foreground">Total Revenue (TZS)</p>
            </div>
          </div>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={cn(
                "glass-card p-6 relative transition-all duration-300",
                pkg.isActive
                  ? "hover:border-primary/30"
                  : "opacity-60 hover:opacity-80",
                pkg.isPopular && "border-primary/40"
              )}
            >
              {pkg.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                  Most Popular
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{pkg.name}</h3>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-sm">{pkg.duration}</span>
                    </div>
                  </div>
                </div>
                <Switch
                  checked={pkg.isActive}
                  onCheckedChange={() => togglePackage(pkg.id)}
                />
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    {pkg.price.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground text-sm">TZS</span>
                </div>
              </div>

              <div className="space-y-3 mb-6 py-4 border-y border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Speed
                  </span>
                  <span className="font-medium">{pkg.speedLimit || "Unlimited"}</span>
                </div>
                {pkg.dataLimit && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Data</span>
                    <span className="font-medium">{pkg.dataLimit}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active Users</span>
                  <span className="font-medium text-success">{pkg.activeUsers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Sold</span>
                  <span className="font-medium">{pkg.totalSold.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-2">
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
