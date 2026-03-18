import { useMemo } from "react";
import { usePharmacy } from "@/context/PharmacyContext";
import {
  TrendingUp, AlertTriangle, Package, DollarSign, Users, Clock,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";

export default function DashboardPage() {
  const { medicines, customers, sales } = usePharmacy();

  const today = new Date().toISOString().split("T")[0];
  const todaySales = sales.filter((s) => s.date.startsWith(today));
  const totalToday = todaySales.reduce((s, sale) => s + sale.total, 0);
  const totalDues = customers.reduce((s, c) => s + c.dueBalance, 0);

  const profitToday = useMemo(() => {
    let revenue = 0, cost = 0;
    todaySales.forEach((sale) => {
      sale.items.forEach((item) => {
        revenue += item.total;
        const med = medicines.find((m) => m.id === item.medicineId);
        cost += (med?.tp || 0) * item.qty;
      });
    });
    return revenue - cost;
  }, [todaySales, medicines]);

  const expiredCount = medicines.filter((m) => new Date(m.expiry + "-01") < new Date()).length;
  const lowStockCount = medicines.filter((m) => m.stock > 0 && m.stock < m.minStock).length;
  const dueCustomers = customers.filter((c) => c.dueBalance > 0).length;

  const metrics = [
    { label: "Today's Sales", value: `৳${totalToday.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, change: `${todaySales.length} invoices`, up: true, icon: DollarSign },
    { label: "Net Profit", value: `৳${profitToday.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, change: "Today", up: profitToday > 0, icon: TrendingUp },
    { label: "Customer Dues", value: `৳${totalDues.toLocaleString()}`, change: `${dueCustomers} customers`, up: false, icon: Users },
    { label: "Total SKUs", value: medicines.length.toString(), change: `${medicines.filter(m => m.stock > 0).length} in stock`, up: true, icon: Package },
  ];

  const alerts = [
    { type: "expiry", label: "Expired Medicines", count: expiredCount },
    { type: "low", label: "Low Stock Items", count: lowStockCount },
    { type: "due", label: "Customers with Due", count: dueCustomers },
  ];

  const recentSales = sales.slice(0, 8);

  const topSelling = useMemo(() => {
    const counts: Record<string, { name: string; generic: string; sold: number; revenue: number }> = {};
    sales.forEach((s) => s.items.forEach((item) => {
      if (!counts[item.medicineId]) counts[item.medicineId] = { name: item.medicineName, generic: item.generic, sold: 0, revenue: 0 };
      counts[item.medicineId].sold += item.qty;
      counts[item.medicineId].revenue += item.total;
    }));
    return Object.values(counts).sort((a, b) => b.sold - a.sold).slice(0, 5);
  }, [sales]);

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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {alerts.map((a) => (
          <div key={a.type} className="bg-card border border-border rounded-outer p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-inner flex items-center justify-center bg-background">
                {a.type === "expiry" ? <AlertTriangle className="w-5 h-5 text-accent-expiry" /> :
                 a.type === "low" ? <Package className="w-5 h-5 text-accent-due" /> :
                 <Users className="w-5 h-5 text-accent-due" />}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{a.label}</p>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </div>
            </div>
            <span className={`status-badge ${a.type === "expiry" ? "status-expired" : "status-low-stock"}`}>{a.count}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-card border border-border rounded-outer">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm text-foreground">Recent Sales</h3>
            <span className="text-xs text-muted-foreground">{recentSales.length} shown</span>
          </div>
          <div className="divide-y divide-border">
            {recentSales.map((s) => (
              <div key={s.id} className="px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-mono-data text-xs text-muted-foreground w-20">{s.invoiceNo}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.customerName}</p>
                    <p className="text-xs text-muted-foreground">{s.items.length} items &middot; {new Date(s.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono-data font-semibold text-sm text-foreground">৳{s.total.toFixed(2)}</p>
                  <p className={`text-[10px] font-medium ${s.paymentMethod === "Due" ? "text-accent-due" : "text-muted-foreground"}`}>{s.paymentMethod}</p>
                </div>
              </div>
            ))}
            {recentSales.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">No sales yet</div>}
          </div>
        </div>

        <div className="lg:col-span-2 bg-card border border-border rounded-outer">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm text-foreground">Top Selling</h3>
          </div>
          <div className="divide-y divide-border">
            {topSelling.map((item, i) => (
              <div key={item.name} className="px-4 py-3 flex items-center gap-3">
                <span className="w-6 h-6 rounded-inner bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.generic}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono-data text-xs font-semibold text-foreground">{item.sold} units</p>
                  <p className="font-mono-data text-[10px] text-muted-foreground">৳{item.revenue.toFixed(2)}</p>
                </div>
              </div>
            ))}
            {topSelling.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">No sales data</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
