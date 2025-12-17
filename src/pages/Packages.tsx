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
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";

interface PackageItem {
  id: string;
  name: string;
  price: number;
  duration: number; // Duration in minutes
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Packages() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPackage, setNewPackage] = useState({
    name: '',
    price: '',
    duration: '',
    description: ''
  });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getPackages();
      setPackages(data.packages || []);
    } catch (error) {
      console.error('Failed to load packages:', error);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const togglePackage = async (id: string) => {
    try {
      const pkg = packages.find(p => p.id === id);
      if (!pkg) return;

      await adminApi.updatePackage(id, { isActive: !pkg.isActive });
      setPackages((prev) =>
        prev.map((pkg) =>
          pkg.id === id ? { ...pkg, isActive: !pkg.isActive } : pkg
        )
      );
      toast.success(`Package ${pkg.isActive ? 'disabled' : 'enabled'} successfully`);
    } catch (error) {
      console.error('Failed to toggle package:', error);
      toast.error('Failed to update package');
    }
  };

  const handleCreatePackage = async () => {
    try {
      if (!newPackage.name || !newPackage.price || !newPackage.duration) {
        toast.error('Please fill in all required fields');
        return;
      }

      await adminApi.createPackage({
        name: newPackage.name,
        price: parseInt(newPackage.price) * 100, // Convert to cents
        duration: parseInt(newPackage.duration) * 60, // Convert to minutes
        description: newPackage.description || undefined
      });

      toast.success('Package created successfully');
      setIsAddDialogOpen(false);
      setNewPackage({ name: '', price: '', duration: '', description: '' });
      loadPackages();
    } catch (error) {
      console.error('Failed to create package:', error);
      toast.error('Failed to create package');
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
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
                  <Input 
                    id="pkg-name" 
                    placeholder="e.g., Daily Pass" 
                    value={newPackage.name}
                    onChange={(e) => setNewPackage(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price (TZS)</Label>
                    <Input 
                      id="price" 
                      type="number" 
                      placeholder="500" 
                      value={newPackage.price}
                      onChange={(e) => setNewPackage(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="duration">Duration (Hours)</Label>
                    <Input 
                      id="duration" 
                      type="number" 
                      placeholder="24" 
                      value={newPackage.duration}
                      onChange={(e) => setNewPackage(prev => ({ ...prev, duration: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input 
                    id="description" 
                    placeholder="Package description" 
                    value={newPackage.description}
                    onChange={(e) => setNewPackage(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePackage}>
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
                {packages.length}
              </p>
              <p className="text-sm text-muted-foreground">Total Packages</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning/10">
              <TrendingUp className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {packages.reduce((sum, p) => sum + (p.price / 100), 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Value (TZS)</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-accent/10">
              <DollarSign className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {packages.length > 0 ? Math.round(packages.reduce((sum, p) => sum + (p.price / 100), 0) / packages.length) : 0}
              </p>
              <p className="text-sm text-muted-foreground">Avg Price (TZS)</p>
            </div>
          </div>
        </div>

        {/* Packages Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading packages...</span>
            </div>
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No packages found</h3>
            <p className="text-muted-foreground mb-4">Create your first WiFi package to get started</p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Package
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={cn(
                  "glass-card p-6 relative transition-all duration-300",
                  pkg.isActive
                    ? "hover:border-primary/30"
                    : "opacity-60 hover:opacity-80"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{pkg.name}</h3>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-sm">{formatDuration(pkg.duration)}</span>
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
                      {(pkg.price / 100).toLocaleString()}
                    </span>
                    <span className="text-muted-foreground text-sm">TZS</span>
                  </div>
                </div>

                {pkg.description && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">{pkg.description}</p>
                  </div>
                )}

                <div className="space-y-3 mb-6 py-4 border-y border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{formatDuration(pkg.duration)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className={cn("font-medium", pkg.isActive ? "text-success" : "text-muted-foreground")}>
                      {pkg.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">{new Date(pkg.createdAt).toLocaleDateString()}</span>
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
        )}
      </div>
    </DashboardLayout>
  );
}
