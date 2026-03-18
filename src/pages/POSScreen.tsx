import { useState, useMemo } from "react";
import { usePharmacy } from "@/context/PharmacyContext";
import { Medicine, Sale } from "@/types/pharmacy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Minus, X, Banknote, Smartphone, CreditCard, ShoppingCart } from "lucide-react";
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
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [printInvoice, setPrintInvoice] = useState<Sale | null>(null);
  const [showCart, setShowCart] = useState(false);

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

  const paid = paidAmount === "" ? total : parseFloat(paidAmount) || 0;
  const dueAmount = Math.max(0, total - paid);
  const isPartialPayment = dueAmount > 0;
  const isWalkIn = !selectedCustomer;

  const selectedCust = customers.find((c) => c.id === selectedCustomer);
  const existingDue = selectedCust?.dueBalance || 0;

  const completeSale = () => {
    if (cart.length === 0) return;
    if (isPartialPayment && isWalkIn) {
      toast.error("Due payment is not available for Walk-in customers. Please select a customer.");
      return;
    }
    if (paid <= 0) { toast.error("Paid amount must be greater than 0"); return; }
    if (paid > total) { toast.error("Paid amount cannot exceed total"); return; }

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
      subtotal, vat, discount, total,
      paidAmount: paid, dueAmount,
      paymentMethod: isPartialPayment
        ? `Partial (${selectedPayment === "cash" ? "Cash" : selectedPayment === "bkash" ? "bKash" : selectedPayment === "card" ? "Card" : "Cash"})`
        : selectedPayment === "cash" ? "Cash" : selectedPayment === "bkash" ? "bKash" : selectedPayment === "card" ? "Card" : "Due",
      date: new Date().toISOString(),
      salesperson: "Admin",
    };
    addSale(saleData);

    const invoiceSale: Sale = { ...saleData, id: "temp", invoiceNo: `INV-${(sales?.length || 0) + 1002}` };
    setPrintInvoice(invoiceSale);
    toast.success(`Sale completed — ৳${total.toFixed(2)}${isPartialPayment ? ` (Due: ৳${dueAmount.toFixed(2)})` : ""}`);
    setCart([]); setDiscount(0); setPaidAmount(""); setSelectedCustomer(""); setSearch(""); setShowCart(false);
  };

  const cartSidebar = (
    <div className={`${showCart ? "fixed inset-0 z-50 lg:static lg:z-auto" : "hidden lg:flex"} lg:w-[360px] lg:border-l lg:border-border lg:bg-card flex flex-col`}>
      {/* Mobile overlay */}
      {showCart && <div className="fixed inset-0 bg-black/50 lg:hidden" onClick={() => setShowCart(false)} />}
      <div className={`${showCart ? "fixed right-0 top-0 bottom-0 w-[320px] sm:w-[360px] z-50" : ""} bg-card flex flex-col h-full`}>
        <div className="px-4 h-14 lg:h-16 flex items-center justify-between border-b border-border">
          <h3 className="font-bold text-foreground">Current Sale</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono-data">{cart.length} item{cart.length !== 1 ? "s" : ""}</span>
            <button onClick={() => setShowCart(false)} className="lg:hidden p-1"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-6">
              <ShoppingCart className="w-10 h-10 opacity-30" />
              <p className="text-sm mt-3">No items in cart</p>
              <p className="text-xs mt-1">Click a medicine to add it</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {cart.map((item) => (
                <div key={item.medicine.id} className="px-4 py-3">
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
        <div className="border-t border-border p-3 lg:p-4 space-y-3 bg-background/50">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Customer Account</label>
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

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "cash", label: "Cash", icon: Banknote },
              { id: "bkash", label: "bKash", icon: Smartphone },
              { id: "card", label: "Card", icon: CreditCard },
            ].map((method) => (
              <Button key={method.id} variant={selectedPayment === method.id ? "default" : "pos-method"} size="sm"
                onClick={() => setSelectedPayment(method.id)} className="flex flex-col items-center gap-1 h-auto py-2">
                <method.icon className="w-4 h-4" /><span className="text-[10px]">{method.label}</span>
              </Button>
            ))}
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Paid Amount</label>
            <Input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)}
              placeholder={`Full: ৳${total.toFixed(2)}`} className="h-9 font-mono-data text-sm" />
          </div>

          {isPartialPayment && cart.length > 0 && (
            <div className={`rounded-inner p-3 space-y-1 ${isWalkIn ? "bg-destructive/10 border border-destructive/30" : "bg-accent-due/10 border border-accent-due/30"}`}>
              {isWalkIn ? (
                <p className="text-xs text-destructive font-medium">⚠ Due not available for Walk-in. Select a customer account.</p>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Due</span>
                    <span className="font-mono-data font-bold text-accent-due">৳{dueAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Previous Due</span>
                    <span className="font-mono-data">৳{existingDue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-accent-due/20 pt-1">
                    <span className="text-muted-foreground">Total Due</span>
                    <span className="font-mono-data text-accent-due">৳{(existingDue + dueAmount).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          )}

          <Button variant="pos" size="xl" className="w-full" disabled={cart.length === 0 || (isPartialPayment && isWalkIn)} onClick={completeSale}>
            {isPartialPayment && !isWalkIn
              ? `Pay ৳${paid.toFixed(2)} + Due ৳${dueAmount.toFixed(2)}`
              : `Complete Sale — ৳${total.toFixed(2)}`}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-56px)] lg:h-screen overflow-hidden">
      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="flex items-center gap-2 md:gap-4 px-3 md:px-6 h-14 lg:h-16 border-b border-border bg-card">
          <h2 className="text-base lg:text-lg font-bold text-foreground tracking-tight shrink-0 hidden sm:block">POS</h2>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search medicine..." className="pl-10 h-9 lg:h-10" autoFocus />
          </div>
          {/* Mobile cart button */}
          <Button variant="outline" size="sm" className="lg:hidden relative" onClick={() => setShowCart(true)}>
            <ShoppingCart className="w-4 h-4" />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                {cart.length}
              </span>
            )}
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-3 md:p-4">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3">
            {filtered.map((med) => {
              const stockStatus = getStockStatus(med.stock);
              const expSoon = isExpiringSoon(med.expiry);
              return (
                <button key={med.id} onClick={() => addToCart(med)} disabled={stockStatus === "out"}
                  className={`medicine-card text-left cursor-pointer ${stockStatus === "out" ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p className="font-semibold text-xs md:text-sm text-foreground truncate">{med.name}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground truncate">{med.generic}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {stockStatus === "low" && <span className="status-badge status-low-stock">Low</span>}
                      {stockStatus === "out" && <span className="status-badge status-expired">Out</span>}
                      {expSoon && <span className="status-badge status-expired">Exp</span>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                    <div className="hidden sm:flex items-center gap-2 text-[10px] md:text-xs text-muted-foreground">
                      <span>{med.form}</span>
                    </div>
                    <div className="text-right ml-auto">
                      <p className="font-mono-data font-semibold text-foreground text-xs md:text-sm">৳{med.mrp.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground font-mono-data">Stock: {med.stock}</p>
                    </div>
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

      {cartSidebar}

      {printInvoice && (
        <InvoicePrint sale={printInvoice} settings={settings} onClose={() => setPrintInvoice(null)} />
      )}
    </div>
  );
}
