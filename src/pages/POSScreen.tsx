import { useState, useMemo } from "react";
import { usePharmacy } from "@/context/PharmacyContext";
import { Medicine, Sale } from "@/types/pharmacy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Minus, X, Banknote, Smartphone, CreditCard, Clock } from "lucide-react";
import { toast } from "sonner";
import InvoicePrint from "@/components/InvoicePrint";

interface CartItem {
  medicine: Medicine;
  qty: number;
}

function getStockStatus(stock: number) {
  if (stock === 0) return "out";
  if (stock < 10) return "low";
  return "ok";
}

function isExpiringSoon(expiry: string) {
  const exp = new Date(expiry + "-01");
  const diff = (exp.getTime() - Date.now()) / 86400000;
  return diff < 90;
}

function isExpired(expiry: string) {
  return new Date(expiry + "-01") < new Date();
}

export default function POSScreen() {
  const { medicines, settings, customers, sales, addSale } = usePharmacy();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState("cash");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [discount, setDiscount] = useState(0);
  const [printInvoice, setPrintInvoice] = useState<Sale | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return medicines.filter((m) => m.stock > 0 && !isExpired(m.expiry));
    const q = search.toLowerCase();
    return medicines.filter(
      (m) => (m.name.toLowerCase().includes(q) || m.generic.toLowerCase().includes(q) || m.manufacturer.toLowerCase().includes(q)) && !isExpired(m.expiry)
    );
  }, [search, medicines]);

  const addToCart = (med: Medicine) => {
    if (med.stock === 0 || isExpired(med.expiry)) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.medicine.id === med.id);
      if (existing) return prev.map((c) => c.medicine.id === med.id ? { ...c, qty: Math.min(c.qty + 1, c.medicine.stock) } : c);
      return [...prev, { medicine: med, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((c) => {
      if (c.medicine.id !== id) return c;
      const newQty = c.qty + delta;
      if (newQty <= 0) return null as any;
      return { ...c, qty: Math.min(newQty, c.medicine.stock) };
    }).filter(Boolean));
  };

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((c) => c.medicine.id !== id));

  const subtotal = cart.reduce((sum, c) => sum + c.medicine.mrp * c.qty, 0);
  const vat = subtotal * (settings.vatRate / 100);
  const total = subtotal + vat - discount;

  const completeSale = () => {
    if (cart.length === 0) return;
    if (selectedPayment === "due" && !selectedCustomer) {
      toast.error("Select a customer for Due payment");
      return;
    }
    const cust = customers.find((c) => c.id === selectedCustomer);
    const saleData: Omit<Sale, "id" | "invoiceNo"> = {
      customerId: selectedCustomer || null,
      customerName: cust?.name || "Walk-in",
      items: cart.map((c) => ({
        medicineId: c.medicine.id,
        medicineName: c.medicine.name,
        generic: c.medicine.generic,
        qty: c.qty,
        unitPrice: c.medicine.mrp,
        total: c.medicine.mrp * c.qty,
      })),
      subtotal,
      vat,
      discount,
      total,
      paymentMethod: selectedPayment === "cash" ? "Cash" : selectedPayment === "bkash" ? "bKash" : selectedPayment === "card" ? "Card" : "Due",
      date: new Date().toISOString(),
      salesperson: "Admin",
    };
    addSale(saleData);
    // Build a temporary sale object for invoice display
    const invoiceSale: Sale = {
      ...saleData,
      id: "temp",
      invoiceNo: `INV-${(sales?.length || 0) + 1002}`,
    };
    setPrintInvoice(invoiceSale);
    toast.success(`Sale completed — ৳${total.toFixed(2)}`);
    setCart([]);
    setDiscount(0);
    setSelectedCustomer("");
    setSearch("");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-4 px-6 h-16 border-b border-border bg-card">
          <h2 className="text-lg font-bold text-foreground tracking-tight">Point of Sale</h2>
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search medicine — Brand, Generic, or Barcode..." className="pl-10 h-10" autoFocus />
          </div>
          <div className="text-xs text-muted-foreground font-mono-data">F2: Search &middot; F8: Checkout</div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {filtered.map((med) => {
              const stockStatus = getStockStatus(med.stock);
              const expSoon = isExpiringSoon(med.expiry);
              return (
                <button key={med.id} onClick={() => addToCart(med)} disabled={stockStatus === "out"}
                  className={`medicine-card text-left cursor-pointer ${stockStatus === "out" ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate text-balance">{med.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{med.generic}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {stockStatus === "low" && <span className="status-badge status-low-stock">Low</span>}
                      {stockStatus === "out" && <span className="status-badge status-expired">Out</span>}
                      {expSoon && <span className="status-badge status-expired">Exp Soon</span>}
                      {stockStatus === "ok" && !expSoon && <span className="status-badge status-in-stock">In Stock</span>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{med.form}</span><span>&middot;</span><span>{med.manufacturer}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-mono-data font-semibold text-foreground">৳{med.mrp.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground font-mono-data">Stock: {med.stock}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground font-mono-data">
                    <span>Batch: {med.batch}</span><span>Exp: {med.expiry}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Search className="w-8 h-8 mb-3 opacity-40" />
              <p className="text-sm">No medicines found{search ? ` for "${search}"` : ""}</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-[360px] border-l border-border bg-card flex flex-col">
        <div className="px-4 h-16 flex items-center justify-between border-b border-border">
          <h3 className="font-bold text-foreground">Current Sale</h3>
          <span className="text-xs text-muted-foreground font-mono-data">{cart.length} item{cart.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="flex-1 overflow-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-6">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
                <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              <p className="text-sm mt-3">No items in cart</p>
              <p className="text-xs mt-1">Click a medicine to add it</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {cart.map((item) => (
                <div key={item.medicine.id} className="px-4 py-3 animate-fade-in">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.medicine.name}</p>
                      <p className="text-xs text-muted-foreground">{item.medicine.generic}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.medicine.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="pos-qty" onClick={() => updateQty(item.medicine.id, -1)} className="rounded-inner"><Minus className="w-3 h-3" /></Button>
                      <span className="w-10 text-center font-mono-data font-semibold text-sm">{item.qty}</span>
                      <Button variant="outline" size="pos-qty" onClick={() => updateQty(item.medicine.id, 1)} className="rounded-inner"><Plus className="w-3 h-3" /></Button>
                    </div>
                    <p className="font-mono-data font-semibold text-foreground">৳{(item.medicine.mrp * item.qty).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout */}
        <div className="border-t border-border p-4 space-y-3 bg-background/50">
          {/* Customer Select for Due */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Customer</label>
            <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full h-9 rounded-inner border border-input bg-background px-3 text-sm">
              <option value="">Walk-in Customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — Due: ৳{c.dueBalance}</option>)}
            </select>
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="font-mono-data">৳{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>VAT ({settings.vatRate}%)</span><span className="font-mono-data">৳{vat.toFixed(2)}</span></div>
            <div className="flex justify-between text-muted-foreground items-center">
              <span>Discount</span>
              <Input type="number" value={discount || ""} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="w-24 h-7 text-right font-mono-data text-xs" placeholder="0.00" />
            </div>
            <div className="flex justify-between text-lg font-bold text-primary pt-1.5 border-t border-border">
              <span>Total</span><span className="font-mono-data">৳{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "cash", label: "Cash", icon: Banknote },
              { id: "bkash", label: "bKash", icon: Smartphone },
              { id: "card", label: "Card", icon: CreditCard },
              { id: "due", label: "Due", icon: Clock },
            ].map((method) => (
              <Button key={method.id} variant={selectedPayment === method.id ? "default" : "pos-method"} size="sm"
                onClick={() => setSelectedPayment(method.id)} className="flex flex-col items-center gap-1 h-auto py-2.5">
                <method.icon className="w-4 h-4" /><span className="text-[10px]">{method.label}</span>
              </Button>
            ))}
          </div>

          <Button variant="pos" size="xl" className="w-full" disabled={cart.length === 0} onClick={completeSale}>
            Complete Sale — ৳{total.toFixed(2)}
          </Button>
        </div>
      </div>

      {/* Invoice Print Overlay */}
      {printInvoice && (
        <InvoicePrint sale={printInvoice} settings={settings} onClose={() => setPrintInvoice(null)} />
      )}
    </div>
  );
}
