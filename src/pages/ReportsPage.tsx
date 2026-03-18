import { useState, useMemo } from "react";
import { usePharmacy } from "@/context/PharmacyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileText, TrendingUp, DollarSign } from "lucide-react";
import { toast } from "sonner";

type ReportTab = "sales" | "profit" | "supplier";

export default function ReportsPage() {
  const { sales, medicines } = usePharmacy();
  const [tab, setTab] = useState<ReportTab>("sales");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const d = s.date.split("T")[0];
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    });
  }, [sales, dateFrom, dateTo]);

  const totalSales = filteredSales.reduce((s, sale) => s + sale.total, 0);
  const totalVat = filteredSales.reduce((s, sale) => s + sale.vat, 0);
  const totalDiscount = filteredSales.reduce((s, sale) => s + sale.discount, 0);

  // Profit calculation using TP vs MRP
  const profitData = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        totalRevenue += item.total;
        const med = medicines.find((m) => m.id === item.medicineId);
        totalCost += (med?.tp || 0) * item.qty;
      });
    });
    return { totalRevenue, totalCost, grossProfit: totalRevenue - totalCost, margin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100) : 0 };
  }, [filteredSales, medicines]);

  const paymentBreakdown = useMemo(() => {
    const breakdown: Record<string, { count: number; total: number }> = {};
    filteredSales.forEach((s) => {
      if (!breakdown[s.paymentMethod]) breakdown[s.paymentMethod] = { count: 0, total: 0 };
      breakdown[s.paymentMethod].count++;
      breakdown[s.paymentMethod].total += s.total;
    });
    return breakdown;
  }, [filteredSales]);

  const exportSalesCSV = () => {
    const headers = "Invoice,Customer,Date,Items,Subtotal,VAT,Discount,Total,Payment Method";
    const rows = filteredSales.map((s) =>
      `"${s.invoiceNo}","${s.customerName}","${s.date}",${s.items.length},${s.subtotal.toFixed(2)},${s.vat.toFixed(2)},${s.discount.toFixed(2)},${s.total.toFixed(2)},"${s.paymentMethod}"`
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `sales_report_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Sales report exported");
  };

  const tabs: { key: ReportTab; label: string; icon: typeof FileText }[] = [
    { key: "sales", label: "Sales Report", icon: FileText },
    { key: "profit", label: "Profit & Loss", icon: TrendingUp },
    { key: "supplier", label: "Payment Summary", icon: DollarSign },
  ];

  return (
    <div className="p-6 space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground">Business intelligence overview</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportSalesCSV}>
          <Download className="w-4 h-4 mr-1.5" /> Export CSV
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-outer p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-inner text-sm font-medium transition-all ${
              tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">From</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">To</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
        </div>
        <div className="pt-5">
          <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>Clear</Button>
        </div>
      </div>

      {tab === "sales" && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="Total Sales" value={`৳${totalSales.toFixed(2)}`} />
            <MetricCard label="Invoices" value={filteredSales.length.toString()} />
            <MetricCard label="VAT Collected" value={`৳${totalVat.toFixed(2)}`} />
            <MetricCard label="Discounts Given" value={`৳${totalDiscount.toFixed(2)}`} />
          </div>

          {/* Sales Table */}
          <div className="bg-card border border-border rounded-outer overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Items</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSales.map((s) => (
                    <tr key={s.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3 font-mono-data text-xs">{s.invoiceNo}</td>
                      <td className="px-4 py-3">{s.customerName}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(s.date).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono-data">{s.items.length}</td>
                      <td className="px-4 py-3 text-right font-mono-data font-semibold">৳{s.total.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${s.paymentMethod === "Due" ? "text-accent-due" : "text-muted-foreground"}`}>
                          {s.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "profit" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="Total Revenue" value={`৳${profitData.totalRevenue.toFixed(2)}`} />
            <MetricCard label="Cost of Goods" value={`৳${profitData.totalCost.toFixed(2)}`} />
            <MetricCard label="Gross Profit" value={`৳${profitData.grossProfit.toFixed(2)}`} highlight />
            <MetricCard label="Profit Margin" value={`${profitData.margin.toFixed(1)}%`} />
          </div>

          <div className="bg-card border border-border rounded-outer p-5">
            <h3 className="font-semibold text-foreground mb-4">Item-wise Profit Breakdown</h3>
            <div className="space-y-2">
              {filteredSales.flatMap((s) => s.items).reduce((acc, item) => {
                const existing = acc.find((a) => a.medicineId === item.medicineId);
                if (existing) { existing.qty += item.qty; existing.total += item.total; }
                else acc.push({ ...item });
                return acc;
              }, [] as typeof filteredSales[0]["items"]).map((item) => {
                const med = medicines.find((m) => m.id === item.medicineId);
                const cost = (med?.tp || 0) * item.qty;
                const profit = item.total - cost;
                return (
                  <div key={item.medicineId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.medicineName}</p>
                      <p className="text-xs text-muted-foreground">{item.qty} units sold</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono-data text-sm font-semibold text-accent-success">৳{profit.toFixed(2)}</p>
                      <p className="font-mono-data text-[10px] text-muted-foreground">Revenue: ৳{item.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "supplier" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-outer overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-sm text-foreground">Payment Method Breakdown</h3>
            </div>
            <div className="divide-y divide-border">
              {Object.entries(paymentBreakdown).map(([method, data]) => (
                <div key={method} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-inner bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{method[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{method}</p>
                      <p className="text-xs text-muted-foreground">{data.count} transactions</p>
                    </div>
                  </div>
                  <span className="font-mono-data font-semibold">৳{data.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-outer p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-bold font-mono-data tracking-tight ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
