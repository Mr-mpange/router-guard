import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Smartphone, 
  Package, 
  Clock, 
  Wifi, 
  MapPin, 
  Activity,
  Download,
  Upload,
  Calendar,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionDetailsModalProps {
  session: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExtend?: (sessionId: string, minutes: number) => void;
  onSuspend?: (sessionId: string) => void;
  onResume?: (sessionId: string) => void;
  onTerminate?: (sessionId: string) => void;
}

const statusConfig = {
  ACTIVE: {
    label: "Active",
    color: "bg-green-100 text-green-800",
    icon: Activity
  },
  SUSPENDED: {
    label: "Suspended",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock
  },
  EXPIRED: {
    label: "Expired",
    color: "bg-red-100 text-red-800",
    icon: Clock
  },
  TERMINATED: {
    label: "Terminated",
    color: "bg-gray-100 text-gray-800",
    icon: Activity
  }
};

export function SessionDetailsModal({
  session,
  open,
  onOpenChange,
  onExtend,
  onSuspend,
  onResume,
  onTerminate
}: SessionDetailsModalProps) {
  if (!session) return null;

  const status = statusConfig[session.status as keyof typeof statusConfig] || statusConfig.ACTIVE;
  const StatusIcon = status.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Session Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about this WiFi session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Device Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Device</span>
              </div>
              <span className="text-sm">{session.deviceName || 'Unknown Device'}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">MAC Address</span>
              </div>
              <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                {session.deviceMac}
              </code>
            </div>

            {session.ipAddress && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">IP Address</span>
                </div>
                <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                  {session.ipAddress}
                </code>
              </div>
            )}
          </div>

          <Separator />

          {/* Package & Status Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Package</span>
              </div>
              <span className="text-sm font-semibold">{session.package?.name || 'Unknown'}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <Badge className={cn("text-xs", status.color)}>
                {status.label}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Time Remaining</span>
              </div>
              <span className={cn(
                "text-sm font-mono",
                session.timeRemaining < 3600000 ? "text-orange-600" : "text-green-600"
              )}>
                {session.timeRemainingFormatted || 'N/A'}
              </span>
            </div>
          </div>

          <Separator />

          {/* Network Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Router</span>
              </div>
              <span className="text-sm">{session.router?.name || 'Unknown'}</span>
            </div>

            {session.router?.location && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Location</span>
                </div>
                <span className="text-sm">{session.router.location}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Data Usage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Downloaded</span>
              </div>
              <span className="text-sm font-mono">{session.bytesDownFormatted || '0 B'}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Uploaded</span>
              </div>
              <span className="text-sm font-mono">{session.bytesUpFormatted || '0 B'}</span>
            </div>
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Started</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(session.startTime)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Expires</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(session.expiresAt)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          {(onExtend || onSuspend || onResume || onTerminate) && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-2">
                {session.status === 'ACTIVE' && onExtend && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onExtend(session.id, 60)}
                      className="flex-1"
                    >
                      +1 Hour
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onExtend(session.id, 1440)}
                      className="flex-1"
                    >
                      +1 Day
                    </Button>
                  </>
                )}
                
                {session.status === 'ACTIVE' && onSuspend && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onSuspend(session.id);
                      onOpenChange(false);
                    }}
                    className="flex-1"
                  >
                    Suspend
                  </Button>
                )}
                
                {session.status === 'SUSPENDED' && onResume && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onResume(session.id);
                      onOpenChange(false);
                    }}
                    className="flex-1"
                  >
                    Resume
                  </Button>
                )}
                
                {(session.status === 'ACTIVE' || session.status === 'SUSPENDED') && onTerminate && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      onTerminate(session.id);
                      onOpenChange(false);
                    }}
                    className="flex-1"
                  >
                    Terminate
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}