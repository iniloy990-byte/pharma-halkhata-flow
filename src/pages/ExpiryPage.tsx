import { useState, useMemo } from "react";
import { usePharmacy } from "@/context/PharmacyContext";
import { AlertTriangle, Clock, Ban, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExpiryFilter = "expired" | "30" | "60" | "90" | "all";

export default function ExpiryPage() {
  const { medicines } = usePharmacy();
  const [filter, setFilter] = useState<ExpiryFilter>("all");

  const now = new Date();

  const categorized = useMemo(() => {
    return medicines.map((m) => {
      const exp = new Date(m.expiry + "-01");
      exp.setMonth(exp.getMonth() + 1); // end of expiry month
      const daysLeft = Math.floor((exp.getTime() - now.getTime()) / 86400000);
      return { ...m, daysLeft, isExpired: daysLeft <= 0 };
    }).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [medicines]);

  const filtered = categorized.filter((m) => {
    if (filter === "expired") return m.isExpired;
    if (filter === "30") return !m.isExpired && m.daysLeft <= 30;
    if (filter === "60") return !m.isExpired && m.daysLeft <= 60;
    if (filter === "90") return !m.isExpired && m.daysLeft <= 90;
    return true;
  });

  const counts = {
    expired: categorized.filter((m) => m.isExpired).length,
    d30: categorized.filter((m) => !m.isExpired && m.daysLeft <= 30).length,
    d60: categorized.filter((m) => !m.isExpired && m.daysLeft <= 60).length,
    d90: categorized.filter((m) => !m.isExpired && m.daysLeft <= 90).length,
  };

  const filters: { key: ExpiryFilter; label: string; count: number; icon: typeof AlertTriangle }[] = [
    { key: "expired", label: "Expired", count: counts.expired, icon: Ban },
    { key: "30", label: "Within 30 Days", count: counts.d30, icon: AlertTriangle },
    { key: "60", label: "Within 60 Days", count: counts.d60, icon: Clock },
    { key: "90", label: "Within 90 Days", count: counts.d90, icon: Clock },
  ];

  return (
    <div className="p-6 space-y-4 max-w-[1400px]">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Expiry Monitor</h2>
        <p className="text-sm text-muted-foreground">Track and manage medicine expiry dates</p>
      </div>

      {/* Filter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(filter === f.key ? "all" : f.key)}
            className={`bg-card border rounded-outer p-4 text-left transition-all ${
              filter === f.key ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/30"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <f.icon className={`w-5 h-5 ${f.key === "expired" ? "text-accent-expiry" : "text-accent-due"}`} />
              <span className={`text-2xl font-bold font-mono-data ${f.count > 0 ? (f.key === "expired" ? "text-accent-expiry" : "text-accent-due") : "text-muted-foreground"}`}>
                {f.count}
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground">{f.label}</p>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-outer overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground">
            {filter === "all" ? "All Medicines" : filter === "expired" ? "Expired Medicines" : `Expiring Within ${filter} Days`}
          </h3>
          <span className="text-xs text-muted-foreground font-mono-data">{filtered.length} items</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Medicine</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Manufacturer</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Batch</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Stock</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expiry</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Days Left</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((m) => (
                <tr key={m.id} className={`transition-colors ${m.isExpired ? "bg-accent-expiry/5" : "hover:bg-accent/50"}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.generic}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.manufacturer}</td>
                  <td className="px-4 py-3 font-mono-data text-xs text-muted-foreground">{m.batch}</td>
                  <td className="px-4 py-3 text-right font-mono-data">{m.stock}</td>
                  <td className="px-4 py-3 font-mono-data text-xs">{m.expiry}</td>
                  <td className="px-4 py-3 text-right font-mono-data font-semibold">
                    <span className={m.isExpired ? "text-accent-expiry" : m.daysLeft <= 30 ? "text-accent-due" : "text-foreground"}>
                      {m.isExpired ? "Expired" : m.daysLeft}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {m.isExpired ? (
                      <span className="status-badge status-expired">Expired</span>
                    ) : m.daysLeft <= 30 ? (
                      <span className="status-badge status-expired">Critical</span>
                    ) : m.daysLeft <= 60 ? (
                      <span className="status-badge status-low-stock">Warning</span>
                    ) : (
                      <span className="status-badge status-low-stock">Monitor</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button variant="outline" size="sm" className="text-xs">
                      <RotateCcw className="w-3 h-3 mr-1" /> Return
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">No medicines in this category</div>
        )}
      </div>
    </div>
  );
}
