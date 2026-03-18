import { useState, useMemo } from "react";
import { Search, Plus, Minus, X, Banknote, Smartphone, CreditCard, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Mock medicine data
const medicines = [
  { id: 1, name: "Napa Extra", generic: "Paracetamol 500mg + Caffeine 65mg", form: "Tablet", manufacturer: "Beximco", mrp: 2.5, tp: 1.8, stock: 450, batch: "NE-2024-031", expiry: "2025-08" },
  { id: 2, name: "Seclo 20", generic: "Omeprazole 20mg", form: "Capsule", manufacturer: "Square", mrp: 6, tp: 4.5, stock: 120, batch: "SC-2024-088", expiry: "2025-11" },
  { id: 3, name: "Ace Plus", generic: "Paracetamol 500mg + Caffeine 65mg", form: "Tablet", manufacturer: "Square", mrp: 2.5, tp: 1.8, stock: 0, batch: "AP-2024-012", expiry: "2025-06" },
  { id: 4, name: "Zimax 500", generic: "Azithromycin 500mg", form: "Tablet", manufacturer: "Square", mrp: 30, tp: 22, stock: 85, batch: "ZM-2024-055", expiry: "2026-02" },
  { id: 5, name: "Losectil 20", generic: "Omeprazole 20mg", form: "Capsule", manufacturer: "Incepta", mrp: 5, tp: 3.5, stock: 200, batch: "LS-2024-019", expiry: "2025-09" },
  { id: 6, name: "Sergel 20", generic: "Esomeprazole 20mg", form: "Capsule", manufacturer: "Square", mrp: 8, tp: 6, stock: 15, batch: "SG-2024-043", expiry: "2025-04" },
  { id: 7, name: "Amoxil 500", generic: "Amoxicillin 500mg", form: "Capsule", manufacturer: "Square", mrp: 12, tp: 9, stock: 300, batch: "AX-2024-077", expiry: "2026-06" },
  { id: 8, name: "Ciprocin 500", generic: "Ciprofloxacin 500mg", form: "Tablet", manufacturer: "Square", mrp: 10, tp: 7, stock: 4, batch: "CP-2024-091", expiry: "2025-12" },
  { id: 9, name: "Monas 10", generic: "Montelukast 10mg", form: "Tablet", manufacturer: "Square", mrp: 14, tp: 10, stock: 90, batch: "MN-2024-066", expiry: "2026-01" },
  { id: 10, name: "Insulin Mixtard", generic: "Insulin (Human) 70/30", form: "Injection", manufacturer: "Novo Nordisk", mrp: 440, tp: 385, stock: 25, batch: "IM-2024-008", expiry: "2025-05" },
];

interface CartItem {
  medicine: typeof medicines[0];
  qty: number;
}

function getStockStatus(stock: number) {
  if (stock === 0) return "out";
  if (stock < 10) return "low";
  return "ok";
}

function isExpiringSoon(expiry: string) {
  const exp = new Date(expiry + "-01");
  const now = new Date();
  const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff < 90;
}

export default function POSScreen() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string>("cash");

  const filtered = useMemo(() => {
    if (!search.trim()) return medicines;
    const q = search.toLowerCase();
    return medicines.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.generic.toLowerCase().includes(q) ||
        m.manufacturer.toLowerCase().includes(q)
    );
  }, [search]);

  const addToCart = (med: typeof medicines[0]) => {
    if (med.stock === 0) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.medicine.id === med.id);
      if (existing) {
        return prev.map((c) =>
          c.medicine.id === med.id ? { ...c, qty: Math.min(c.qty + 1, c.medicine.stock) } : c
        );
      }
      return [...prev, { medicine: med, qty: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.medicine.id !== id) return c;
          const newQty = c.qty + delta;
          if (newQty <= 0) return null;
          return { ...c, qty: Math.min(newQty, c.medicine.stock) };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((c) => c.medicine.id !== id));
  };

  const subtotal = cart.reduce((sum, c) => sum + c.medicine.mrp * c.qty, 0);
  const vat = subtotal * 0.05;
  const total = subtotal + vat;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main Area - Medicine Search & Grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center gap-4 px-6 h-16 border-b border-border bg-card">
          <h2 className="text-lg font-bold text-foreground tracking-tight">Point of Sale</h2>
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicine — Brand, Generic, or Barcode..."
              className="pl-10 h-10 bg-background border-border font-body"
              autoFocus
            />
          </div>
          <div className="text-xs text-muted-foreground font-mono-data">
            F2: Search &middot; F8: Checkout
          </div>
        </div>

        {/* Medicine Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {filtered.map((med) => {
              const stockStatus = getStockStatus(med.stock);
              const expSoon = isExpiringSoon(med.expiry);
              return (
                <button
                  key={med.id}
                  onClick={() => addToCart(med)}
                  disabled={stockStatus === "out"}
                  className={`medicine-card text-left cursor-pointer transition-all ${
                    stockStatus === "out" ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
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
                      <span>{med.form}</span>
                      <span>&middot;</span>
                      <span>{med.manufacturer}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-mono-data font-semibold text-foreground">৳{med.mrp.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground font-mono-data">Stock: {med.stock}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground font-mono-data">
                    <span>Batch: {med.batch}</span>
                    <span>Exp: {med.expiry}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Search className="w-8 h-8 mb-3 opacity-40" />
              <p className="text-sm">No medicines found for "{search}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-[360px] border-l border-border bg-card flex flex-col">
        <div className="px-4 h-16 flex items-center justify-between border-b border-border">
          <h3 className="font-bold text-foreground">Current Sale</h3>
          <span className="text-xs text-muted-foreground font-mono-data">
            {cart.length} item{cart.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-6">
              <ShoppingCartEmpty />
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
                      <Button
                        variant="outline"
                        size="pos-qty"
                        onClick={() => updateQty(item.medicine.id, -1)}
                        className="rounded-inner"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-10 text-center font-mono-data font-semibold text-sm">{item.qty}</span>
                      <Button
                        variant="outline"
                        size="pos-qty"
                        onClick={() => updateQty(item.medicine.id, 1)}
                        className="rounded-inner"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="font-mono-data font-semibold text-foreground">
                      ৳{(item.medicine.mrp * item.qty).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout Section */}
        <div className="border-t border-border p-4 space-y-3 bg-background/50">
          {/* Totals */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-mono-data">৳{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>VAT (5%)</span>
              <span className="font-mono-data">৳{vat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-primary pt-1.5 border-t border-border">
              <span>Total</span>
              <span className="font-mono-data">৳{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "cash", label: "Cash", icon: Banknote },
              { id: "bkash", label: "bKash", icon: Smartphone },
              { id: "card", label: "Card", icon: CreditCard },
              { id: "due", label: "Due", icon: Clock },
            ].map((method) => (
              <Button
                key={method.id}
                variant={selectedPayment === method.id ? "default" : "pos-method"}
                size="sm"
                onClick={() => setSelectedPayment(method.id)}
                className="flex flex-col items-center gap-1 h-auto py-2.5"
              >
                <method.icon className="w-4 h-4" />
                <span className="text-[10px]">{method.label}</span>
              </Button>
            ))}
          </div>

          {/* Checkout Button */}
          <Button variant="pos" size="xl" className="w-full" disabled={cart.length === 0}>
            Complete Sale — ৳{total.toFixed(2)}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ShoppingCartEmpty() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
      <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}
