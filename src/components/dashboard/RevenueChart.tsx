import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Mon", revenue: 45000 },
  { name: "Tue", revenue: 52000 },
  { name: "Wed", revenue: 48000 },
  { name: "Thu", revenue: 61000 },
  { name: "Fri", revenue: 55000 },
  { name: "Sat", revenue: 72000 },
  { name: "Sun", revenue: 68000 },
];

export function RevenueChart() {
  return (
    <div className="glass-card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Revenue Overview</h2>
        <p className="text-sm text-muted-foreground">Weekly earnings in TZS</p>
      </div>
      <div className="h-[300px]">
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
      </div>
    </div>
  );
}
