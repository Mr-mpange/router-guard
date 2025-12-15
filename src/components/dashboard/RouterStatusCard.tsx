import { Router, Signal, Users, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

interface RouterStatusProps {
  name: string;
  ip: string;
  status: "online" | "offline";
  activeUsers: number;
  signalStrength: number;
  location: string;
}

export function RouterStatusCard({
  name,
  ip,
  status,
  activeUsers,
  signalStrength,
  location,
}: RouterStatusProps) {
  return (
    <div className="glass-card p-5 hover:border-primary/30 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2.5 rounded-xl",
              status === "online" ? "bg-success/10" : "bg-destructive/10"
            )}
          >
            <Router
              className={cn(
                "w-5 h-5",
                status === "online" ? "text-success" : "text-destructive"
              )}
            />
          </div>
          <div>
            <h3 className="font-semibold">{name}</h3>
            <p className="text-xs font-mono text-muted-foreground">{ip}</p>
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
            status === "online"
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive"
          )}
        >
          <span
            className={cn(
              "status-dot",
              status === "online" ? "bg-success" : "bg-destructive"
            )}
          />
          {status === "online" ? "Online" : "Offline"}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold">{activeUsers}</p>
            <p className="text-xs text-muted-foreground">Users</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Signal className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold">{signalStrength}%</p>
            <p className="text-xs text-muted-foreground">Signal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold truncate">{location}</p>
            <p className="text-xs text-muted-foreground">Location</p>
          </div>
        </div>
      </div>
    </div>
  );
}
