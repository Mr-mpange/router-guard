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
  Users,
  AlertCircle,
  Loader2,
  Play,
  Pause,
  Square,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSessions, 30000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const loadSessions = async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/sessions?${params.toString()}`);
  