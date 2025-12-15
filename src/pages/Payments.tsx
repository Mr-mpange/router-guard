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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  transactionId: string;
  amount: number;
  package: string;
  method: "mpesa" | "tigopesa" | "airtelmoney" | "voucher";
  phone?: string;
  voucherCode?: string;
  status: "completed" | "pending" | "failed";
  timestamp: string;
  router: string;
}

const mockPayments: Payment[] = [
  {
    id: "1",
    transactionId: "TXN-001-2024",
    amount: 500,
    package: "24 Hours",
    method: "mpesa",
    phone: "+255712345678",
    status: "completed",
    timestamp: "2024-01-15 14:32:18",
    router: "Main Lobby",
  },
  {
    id: "2",
    transactionId: "TXN-002-2024",
    amount: 1000,
    package: "7 Days",
    method: "tigopesa",
    phone: "+255754321098",
    status: "completed",
    timestamp: "2024-01-15 13:45:02",
    router: "Cafe WiFi",
  },
  {
    id: "3",
    transactionId: "TXN-003-2024",
    amount: 500,
    package: "24 Hours",
    method: "voucher",
    voucherCode: "WIFI-A7X9K2",
    status: "completed",
    timestamp: "2024-01-15 12:18:44",
    router: "Main Lobby",
  },
  {
    id: "4",
    transactionId: "TXN-004-2024",
    amount: 5000,
    package: "30 Days",
    method: "mpesa",
    phone: "+255789012345",
    status: "pending",
    timestamp: "2024-01-15 11:55:31",
    router: "Conference Room",
  },
  {
    id: "5",
    transactionId: "TXN-005-2024",
    amount: 500,
    package: "24 Hours",
    method: "airtelmoney",
    phone: "+255678901234",
    status: "failed",
    timestamp: "2024-01-15 10:22:15",
    router: "Cafe WiFi",
  },
];

const methodConfig = {
  mpesa: { label: "M-Pesa", color: "bg-green-500/10 text-green-500" },
  tigopesa: { label: "Tigo Pesa", color: "bg-blue-500/10 text-blue-500" },
  airtelmoney: { label: "Airtel Money", color: "bg-red-500/10 text-red-500" },
  voucher: { label: "Voucher", color: "bg-purple-500/10 text-purple-500" },
};

const statusConfig = {
  completed: {
    label: "Completed",
    icon: CheckCircle,
    color: "text-success bg-success/10",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-warning bg-warning/10",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    color: "text-destructive bg-destructive/10",
  },
};

export default function Payments() {
  const totalRevenue = mockPayments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

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
                {mockPayments.filter((p) => p.status === "completed").length}
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
                {mockPayments.filter((p) => p.status === "pending").length}
              </p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-accent/10">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">+18%</p>
              <p className="text-sm text-muted-foreground">vs Last Week</p>
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
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <Smartphone className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="mpesa">M-Pesa</SelectItem>
              <SelectItem value="tigopesa">Tigo Pesa</SelectItem>
              <SelectItem value="airtelmoney">Airtel Money</SelectItem>
              <SelectItem value="voucher">Voucher</SelectItem>
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
                {mockPayments.map((payment) => {
                  const method = methodConfig[payment.method];
                  const status = statusConfig[payment.status];
                  const StatusIcon = status.icon;
                  return (
                    <tr
                      key={payment.id}
                      className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                    >
                      <td className="p-4">
                        <code className="text-sm font-mono text-primary">
                          {payment.transactionId}
                        </code>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold">
                          {payment.amount.toLocaleString()} TZS
                        </span>
                      </td>
                      <td className="p-4">
                        <span>{payment.package}</span>
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
                        {payment.phone ? (
                          <span className="text-sm text-muted-foreground">
                            {payment.phone}
                          </span>
                        ) : (
                          <code className="text-xs font-mono bg-secondary px-2 py-0.5 rounded">
                            {payment.voucherCode}
                          </code>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{payment.router}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground font-mono">
                          {payment.timestamp}
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
