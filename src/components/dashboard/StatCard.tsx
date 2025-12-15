import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "primary";
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: StatCardProps) {
  const iconColors = {
    default: "text-muted-foreground bg-secondary",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    primary: "text-primary bg-primary/10",
  };

  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                "text-xs font-medium flex items-center gap-1",
                trend.isPositive ? "text-success" : "text-destructive"
              )}
            >
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              {Math.abs(trend.value)}% from last week
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", iconColors[variant])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
