import { useState, useRef } from "react";
import { usePharmacy } from "@/context/PharmacyContext";
import { useAuth } from "@/context/AuthContext";
import { Medicine } from "@/types/pharmacy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Plus, Upload, Download, Pencil, Trash2, X, Package,
} from "lucide-react";
import { toast } from "sonner";

export default function InventoryPage() {
  const { medicines, addMedicine, updateMedicine, deleteMedicine, importMedicines } = usePharmacy();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = medicines.filter((m) => {
    const q = search.toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.generic.toLowerCase().includes(q) || m.manufacturer.toLowerCase().includes(q) || m.batch.toLowerCase().includes(q);
  });

  const handleExport = () => {
    const headers = "Name,Generic,Form,Manufacturer,MRP,TP,Stock,Batch,Expiry,MinStock";
    const rows = medicines.map((m) =>
      `"${m.name}","${m.generic}","${m.form}","${m.manufacturer}",${m.mrp},${m.tp},${m.stock},"${m.batch}","${m.expiry}",${m.minStock}`
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medicines_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Medicine list exported successfully");
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.split("\n").filter((l) => l.trim());
        const header = lines[0].toLowerCase();
        if (!header.includes("name") || !header.includes("generic")) {
          toast.error("Invalid CSV format. Required columns: Name, Generic, Form, Manufacturer, MRP, TP, Stock, Batch, Expiry, MinStock");
          return;
        }
        const meds: Omit<Medicine, "id">[] = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = parseCSVLine(lines[i]);
          if (parts.length < 2) continue;
          meds.push({
            name: parts[0]?.trim() || "Unknown",
            generic: parts[1]?.trim() || "Unknown",
            form: parts[2]?.trim() || "Tablet",
            manufacturer: parts[3]?.trim() || "",
            mrp: parseFloat(parts[4]) || 0,
            tp: parseFloat(parts[5]) || 0,
            stock: parseInt(parts[6]) || 0,
            batch: parts[7]?.trim() || "",
            expiry: parts[8]?.trim() || "",
            minStock: parseInt(parts[9]) || 10,
          });
        }
        if (meds.length === 0) {
          toast.error("No valid medicines found in CSV");
          return;
        }
        importMedicines(meds);
        toast.success(`${meds.length} medicines imported successfully`);
      } catch {
        toast.error("Failed to parse CSV file");
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = (id: string) => {
    deleteMedicine(id);
    toast.success("Medicine deleted");
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">Inventory Management</h2>
          <p className="text-xs md:text-sm text-muted-foreground">{medicines.length} SKUs &middot; {medicines.filter(m => m.stock < m.minStock).length} low stock</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4 mr-1.5" /> Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1.5" /> Export
          </Button>
          <Button size="sm" onClick={() => { setEditingMed(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-1.5" /> Add
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search medicines..." className="pl-10" />
      </div>

      {showForm && (
        <MedicineForm
          medicine={editingMed}
          onSave={(med) => {
            if (editingMed) {
              updateMedicine({ ...med, id: editingMed.id });
              toast.success("Medicine updated");
            } else {
              addMedicine(med);
              toast.success("Medicine added");
            }
            setShowForm(false);
            setEditingMed(null);
          }}
          onCancel={() => { setShowForm(false); setEditingMed(null); }}
        />
      )}

      {/* Mobile card view */}
      <div className="block md:hidden space-y-3">
        {filtered.map((m) => {
          const isLow = m.stock > 0 && m.stock < m.minStock;
          const isOut = m.stock === 0;
          const expDate = new Date(m.expiry + "-01");
          const isExpired = expDate < new Date();
          const isExpSoon = !isExpired && (expDate.getTime() - Date.now()) / 86400000 < 90;
          return (
            <div key={m.id} className="bg-card border border-border rounded-outer p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.generic}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {isExpired && <span className="status-badge status-expired">Expired</span>}
                  {isExpSoon && !isExpired && <span className="status-badge status-expired">Exp Soon</span>}
                  {isOut && <span className="status-badge status-expired">Out</span>}
                  {isLow && !isOut && <span className="status-badge status-low-stock">Low</span>}
                  {!isExpired && !isExpSoon && !isOut && !isLow && <span className="status-badge status-in-stock">OK</span>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <span>{m.form}</span>
                <span>{m.manufacturer}</span>
                <span className="text-right font-mono-data">Stock: {m.stock}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex gap-3 text-xs font-mono-data text-muted-foreground">
                  <span>MRP: ৳{m.mrp.toFixed(2)}</span>
                  <span>Batch: {m.batch}</span>
                  <span>Exp: {m.expiry}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingMed(m); setShowForm(true); }}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(m.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block bg-card border border-border rounded-outer overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Medicine</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Form</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Manufacturer</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">MRP</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">TP</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Stock</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Batch</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expiry</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((m) => {
                const isLow = m.stock > 0 && m.stock < m.minStock;
                const isOut = m.stock === 0;
                const expDate = new Date(m.expiry + "-01");
                const isExpired = expDate < new Date();
                const isExpSoon = !isExpired && (expDate.getTime() - Date.now()) / 86400000 < 90;
                return (
                  <tr key={m.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.generic}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{m.form}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.manufacturer}</td>
                    <td className="px-4 py-3 text-right font-mono-data">৳{m.mrp.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono-data text-muted-foreground">৳{m.tp.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono-data">{m.stock}</td>
                    <td className="px-4 py-3 font-mono-data text-xs text-muted-foreground">{m.batch}</td>
                    <td className="px-4 py-3 font-mono-data text-xs text-muted-foreground">{m.expiry}</td>
                    <td className="px-4 py-3 text-center">
                      {isExpired && <span className="status-badge status-expired">Expired</span>}
                      {isExpSoon && !isExpired && <span className="status-badge status-expired">Exp Soon</span>}
                      {isOut && <span className="status-badge status-expired">Out</span>}
                      {isLow && !isOut && <span className="status-badge status-low-stock">Low</span>}
                      {!isExpired && !isExpSoon && !isOut && !isLow && <span className="status-badge status-in-stock">OK</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingMed(m); setShowForm(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(m.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Package className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No medicines found</p>
          </div>
        )}
      </div>

      {/* Mobile empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-16 text-muted-foreground md:hidden">
          <Package className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm">No medicines found</p>
        </div>
      )}
    </div>
  );
}

function MedicineForm({ medicine, onSave, onCancel }: {
  medicine: Medicine | null;
  onSave: (med: Omit<Medicine, "id">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: medicine?.name || "",
    generic: medicine?.generic || "",
    form: medicine?.form || "Tablet",
    manufacturer: medicine?.manufacturer || "",
    mrp: medicine?.mrp?.toString() || "",
    tp: medicine?.tp?.toString() || "",
    stock: medicine?.stock?.toString() || "",
    batch: medicine?.batch || "",
    expiry: medicine?.expiry || "",
    minStock: medicine?.minStock?.toString() || "10",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.generic) { toast.error("Name and Generic are required"); return; }
    onSave({
      name: form.name, generic: form.generic, form: form.form, manufacturer: form.manufacturer,
      mrp: parseFloat(form.mrp) || 0, tp: parseFloat(form.tp) || 0, stock: parseInt(form.stock) || 0,
      batch: form.batch, expiry: form.expiry, minStock: parseInt(form.minStock) || 10,
    });
  };

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-outer p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{medicine ? "Edit Medicine" : "Add New Medicine"}</h3>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}><X className="w-4 h-4" /></Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="sm:col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Brand Name *</label><Input value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
        <div className="sm:col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Generic Name *</label><Input value={form.generic} onChange={(e) => set("generic", e.target.value)} required /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">Form</label>
          <select value={form.form} onChange={(e) => set("form", e.target.value)} className="w-full h-10 rounded-outer border border-input bg-background px-3 text-sm">
            <option>Tablet</option><option>Capsule</option><option>Syrup</option><option>Injection</option><option>Cream</option><option>Drops</option><option>Inhaler</option><option>Suppository</option>
          </select>
        </div>
        <div><label className="text-xs text-muted-foreground mb-1 block">Manufacturer</label><Input value={form.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">MRP (৳)</label><Input type="number" step="0.01" value={form.mrp} onChange={(e) => set("mrp", e.target.value)} /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">TP (৳)</label><Input type="number" step="0.01" value={form.tp} onChange={(e) => set("tp", e.target.value)} /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">Stock</label><Input type="number" value={form.stock} onChange={(e) => set("stock", e.target.value)} /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">Batch No.</label><Input value={form.batch} onChange={(e) => set("batch", e.target.value)} /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">Expiry (YYYY-MM)</label><Input type="month" value={form.expiry} onChange={(e) => set("expiry", e.target.value)} /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">Min Stock Alert</label><Input type="number" value={form.minStock} onChange={(e) => set("minStock", e.target.value)} /></div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{medicine ? "Update" : "Add"} Medicine</Button>
      </div>
    </form>
  );
}
