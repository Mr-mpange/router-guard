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
  Search,
  Filter,
  Download,
  CreditCard,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Payment {
  id: string;
  sessionId: string;
  packageId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentReference?: string;
  phoneNumber?: string;
  status: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  session: {
    id: string;
    deviceMac: string;
    deviceName?: string;
    router: {
      id: string;
      name: string;
      location?: string;
    };
  };
  package: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
}

const methodConfig: Record<string, { label: string; color: string }> = {
  MPESA: { label: "M-Pesa", color: "bg-green-500/10 text-green-500" },
  TIGO_PESA: { label: "Tigo Pesa", color: "bg-blue-500/10 text-blue-500" },
  AIRTEL_MONEY: { label: "Airtel Money", color: "bg-red-500/10 text-red-500" },
  VOUCHER: { label: "Voucher", color: "bg-purple-500/10 text-purple-500" },
  CASH: { label: "Cash", color: "bg-gray-500/10 text-gray-500" },
};

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle,
    color: "text-success bg-success/10",
  },
  PENDING: {
    label: "Pending",
    icon: Clock,
    color: "text-warning bg-warning/10",
  },
  FAILED: {
    label: "Failed",
    icon: XCircle,
    color: "text-destructive bg-destructive/10",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-muted-foreground bg-muted/10",
  },
  REFUNDED: {
    label: "Refunded",
    icon: XCircle,
    color: "text-warning bg-warning/10",
  },
};

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getPayments();
      setPayments(data.payments || []);
    } catch (error) {
      console.error('Failed to load payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.paymentReference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.phoneNumber || '').includes(searchQuery) ||
      payment.session.deviceMac.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter.toUpperCase();
    const matchesMethod = methodFilter === "all" || payment.paymentMethod === methodFilter.toUpperCase();
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const totalRevenue = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + (p.amount / 100), 0);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payment History</h1>
            <p className="text-muted-foreground mt-1">
              Track transactions and revenue
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Today's Revenue (TZS)</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {payments.filter((p) => p.status === "COMPLETED").length}
              </p>
              <p className="text-sm text-muted-foreground">Successful</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning/10">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {payments.filter((p) => p.status === "PENDING").length}
              </p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-accent/10">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{payments.length}</p>
              <p className="text-sm text-muted-foreground">Total Transactions</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-[180px]">
              <Smartphone className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="mpesa">M-Pesa</SelectItem>
              <SelectItem value="tigo_pesa">Tigo Pesa</SelectItem>
              <SelectItem value="airtel_money">Airtel Money</SelectItem>
              <SelectItem value="voucher">Voucher</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Payments Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="table-header text-left p-4">Transaction ID</th>
                  <th className="table-header text-left p-4">Amount</th>
                  <th className="table-header text-left p-4">Package</th>
                  <th className="table-header text-left p-4">Method</th>
                  <th className="table-header text-left p-4">Details</th>
                  <th className="table-header text-left p-4">Router</th>
                  <th className="table-header text-left p-4">Time</th>
                  <th className="table-header text-left p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading payments...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No payments found
                    </td>
                  </tr>
                ) : filteredPayments.map((payment) => {
                  const method = methodConfig[payment.paymentMethod] || { label: payment.paymentMethod, color: "bg-gray-500/10 text-gray-500" };
                  const status = statusConfig[payment.status] || statusConfig.PENDING;
                  const StatusIcon = status.icon;
                  return (
                    <tr
                      key={payment.id}
                      className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                    >
                      <td className="p-4">
                        <code className="text-sm font-mono text-primary">
                          {payment.paymentReference || payment.id.slice(0, 12)}
                        </code>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold">
                          {(payment.amount / 100).toLocaleString()} {payment.currency}
                        </span>
                      </td>
                      <td className="p-4">
                        <span>{payment.package.name}</span>
                      </td>
                      <td className="p-4">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium",
                            method.color
                          )}
                        >
                          {method.label}
                        </span>
                      </td>
                      <td className="p-4">
                        {payment.phoneNumber ? (
                          <span className="text-sm text-muted-foreground">
                            {payment.phoneNumber}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {payment.session.deviceMac}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{payment.session.router.name}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground font-mono">
                          {new Date(payment.createdAt).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5",
                            status.color
                          )}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
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
