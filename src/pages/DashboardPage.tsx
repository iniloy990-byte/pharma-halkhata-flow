import {
  TrendingUp,
  AlertTriangle,
  Package,
  DollarSign,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const metrics = [
  { label: "Today's Sales", value: "৳24,580", change: "+12.3%", up: true, icon: DollarSign },
  { label: "Net Profit", value: "৳6,240", change: "+8.1%", up: true, icon: TrendingUp },
  { label: "Customer Dues", value: "৳18,450", change: "-3.2%", up: false, icon: Users },
  { label: "Supplier Dues", value: "৳1,24,000", change: "+2.5%", up: true, icon: Clock },
];

const alerts = [
  { type: "expiry", label: "Expired Medicines", count: 8, color: "status-expired" },
  { type: "low", label: "Low Stock Items", count: 14, color: "status-low-stock" },
  { type: "due", label: "Overdue Payments", count: 23, color: "status-low-stock" },
];

const recentSales = [
  { id: "INV-1024", customer: "Walk-in", items: 3, total: "৳285.00", time: "2 min ago", method: "Cash" },
  { id: "INV-1023", customer: "Rahim Uddin", items: 5, total: "৳1,450.00", time: "15 min ago", method: "bKash" },
  { id: "INV-1022", customer: "Walk-in", items: 1, total: "৳440.00", time: "28 min ago", method: "Cash" },
  { id: "INV-1021", customer: "Fatema Begum", items: 2, total: "৳680.00", time: "45 min ago", method: "Due" },
  { id: "INV-1020", customer: "Walk-in", items: 4, total: "৳320.00", time: "1 hr ago", method: "Nagad" },
];

const topSelling = [
  { name: "Napa Extra", generic: "Paracetamol", sold: 142, revenue: "৳355" },
  { name: "Seclo 20", generic: "Omeprazole", sold: 89, revenue: "৳534" },
  { name: "Monas 10", generic: "Montelukast", sold: 67, revenue: "৳938" },
  { name: "Zimax 500", generic: "Azithromycin", sold: 45, revenue: "৳1,350" },
  { name: "Amoxil 500", generic: "Amoxicillin", sold: 38, revenue: "৳456" },
];

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Real-time pharmacy overview</p>
        </div>
        <p className="text-xs text-muted-foreground font-mono-data">
          {new Date().toLocaleDateString("en-BD", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-card border border-border rounded-outer p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">{m.label}</span>
              <m.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-foreground font-mono-data tracking-tight">{m.value}</p>
              <span className={`flex items-center gap-0.5 text-xs font-medium ${m.up ? "text-accent-success" : "text-accent-expiry"}`}>
                {m.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {m.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {alerts.map((a) => (
          <div key={a.type} className="bg-card border border-border rounded-outer p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-inner flex items-center justify-center bg-background">
                {a.type === "expiry" ? (
                  <AlertTriangle className="w-5 h-5 text-accent-expiry" />
                ) : a.type === "low" ? (
                  <Package className="w-5 h-5 text-accent-due" />
                ) : (
                  <Users className="w-5 h-5 text-accent-due" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{a.label}</p>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </div>
            </div>
            <span className={`status-badge ${a.color}`}>{a.count}</span>
          </div>
        ))}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent Sales */}
        <div className="lg:col-span-3 bg-card border border-border rounded-outer">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm text-foreground">Recent Sales</h3>
            <span className="text-xs text-muted-foreground">Today</span>
          </div>
          <div className="divide-y divide-border">
            {recentSales.map((s) => (
              <div key={s.id} className="px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-mono-data text-xs text-muted-foreground w-20">{s.id}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.customer}</p>
                    <p className="text-xs text-muted-foreground">{s.items} items &middot; {s.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono-data font-semibold text-sm text-foreground">{s.total}</p>
                  <p className={`text-[10px] font-medium ${s.method === "Due" ? "text-accent-due" : "text-muted-foreground"}`}>
                    {s.method}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling */}
        <div className="lg:col-span-2 bg-card border border-border rounded-outer">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm text-foreground">Top Selling Today</h3>
          </div>
          <div className="divide-y divide-border">
            {topSelling.map((item, i) => (
              <div key={item.name} className="px-4 py-3 flex items-center gap-3">
                <span className="w-6 h-6 rounded-inner bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.generic}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono-data text-xs font-semibold text-foreground">{item.sold} units</p>
                  <p className="font-mono-data text-[10px] text-muted-foreground">{item.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
