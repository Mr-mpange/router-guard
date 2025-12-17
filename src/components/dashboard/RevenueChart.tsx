import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { adminApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface RevenueData {
  name: string;
  revenue: number;
}

export function RevenueChart() {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    try {
      // For now, we'll generate some sample data based on current date
      // In a real implementation, this would come from the API
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const sampleData = days.map(day => ({
        name: day,
        revenue: Math.floor(Math.random() * 50000) + 30000
      }));
      setData(sampleData);
    } catch (error) {
      console.error('Failed to load revenue data:', error);
      // Fallback to empty data
      setData([]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="glass-card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Revenue Overview</h2>
        <p className="text-sm text-muted-foreground">Weekly earnings in TZS</p>
      </div>
      <div className="h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading chart data...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No revenue data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(186, 100%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(186, 100%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
              <XAxis
                dataKey="name"
                stroke="hsl(215, 20%, 55%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(215, 20%, 55%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222, 47%, 10%)",
                  border: "1px solid hsl(222, 30%, 18%)",
                  borderRadius: "8px",
                  color: "hsl(210, 40%, 98%)",
                }}
                formatter={(value: number) => [`${value.toLocaleString()} TZS`, "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(186, 100%, 50%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
