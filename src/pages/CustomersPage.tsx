import { useState } from "react";
import { usePharmacy } from "@/context/PharmacyContext";
import { Customer, Payment, DueEntry } from "@/types/pharmacy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Plus, Users, ChevronRight, X, Banknote, ArrowLeft, PlusCircle, Edit,
} from "lucide-react";
import { toast } from "sonner";

export default function CustomersPage() {
  const { customers, sales, payments, dueEntries, addCustomer, updateCustomer, deleteCustomer, addPayment, addDueEntry } = usePharmacy();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCust, setEditingCust] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const totalDues = customers.reduce((s, c) => s + c.dueBalance, 0);

  if (selectedCustomer) {
    const cust = customers.find((c) => c.id === selectedCustomer.id) || selectedCustomer;
    const custSales = sales.filter((s) => s.customerId === cust.id);
    const custPayments = payments.filter((p) => p.customerId === cust.id);
    const custDueEntries = dueEntries.filter((d) => d.customerId === cust.id);
    return (
      <CustomerDetail
        customer={cust} sales={custSales} payments={custPayments} dueEntries={custDueEntries}
        onBack={() => setSelectedCustomer(null)}
        onPayment={() => setShowPaymentForm(true)}
        onEdit={() => { setEditingCust(cust); setSelectedCustomer(null); setShowForm(true); }}
        onAddDue={(amount, note) => {
          addDueEntry({ customerId: cust.id, amount, note, date: new Date().toISOString() });
          toast.success(`৳${amount} due added to ${cust.name}`);
        }}
        onDelete={() => {
          if (window.confirm(`Are you sure you want to delete "${cust.name}"?`)) {
            deleteCustomer(cust.id); setSelectedCustomer(null); toast.success("Customer deleted");
          }
        }}
        showPaymentForm={showPaymentForm}
        onSubmitPayment={(amount, method, note) => {
          addPayment({ customerId: cust.id, amount, method, note, date: new Date().toISOString() });
          setShowPaymentForm(false); toast.success(`Payment of ৳${amount} recorded`);
        }}
        onCancelPayment={() => setShowPaymentForm(false)}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">Customer Management</h2>
          <p className="text-xs md:text-sm text-muted-foreground">{customers.length} customers &middot; Total Due: <span className="font-mono-data text-accent-due font-semibold">৳{totalDues.toLocaleString()}</span></p>
        </div>
        <Button size="sm" onClick={() => { setEditingCust(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Customer
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone..." className="pl-10" />
      </div>

      {showForm && (
        <CustomerForm
          customer={editingCust}
          onSave={(cust) => {
            if (editingCust) {
              const updated = { ...cust, id: editingCust.id };
              updateCustomer(updated);
              setSelectedCustomer(updated as Customer);
              toast.success("Customer updated");
            }
            else { addCustomer(cust); toast.success("Customer added"); }
            setShowForm(false); setEditingCust(null);
          }}
          onCancel={() => { setShowForm(false); setEditingCust(null); }}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((c) => (
          <button key={c.id} onClick={() => setSelectedCustomer(c)}
            className="bg-card border border-border rounded-outer p-4 text-left hover:border-primary/30 transition-all group">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.phone}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.address}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Outstanding Due</span>
              <span className={`font-mono-data font-bold ${c.dueBalance > 0 ? "text-accent-due" : "text-accent-success"}`}>
                ৳{c.dueBalance.toLocaleString()}
              </span>
            </div>
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-16 text-muted-foreground">
          <Users className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm">No customers found</p>
        </div>
      )}
    </div>
  );
}

function CustomerDetail({ customer, sales, payments, dueEntries, onBack, onPayment, onDelete, onAddDue, onEdit, showPaymentForm, onSubmitPayment, onCancelPayment }: {
  customer: Customer; sales: any[]; payments: Payment[]; dueEntries: DueEntry[]; onBack: () => void; onPayment: () => void; onDelete: () => void;
  onAddDue: (amount: number, note: string) => void; onEdit: () => void;
  showPaymentForm: boolean; onSubmitPayment: (amount: number, method: string, note: string) => void; onCancelPayment: () => void;
}) {
  const [payAmt, setPayAmt] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [payNote, setPayNote] = useState("");
  const [showAddDue, setShowAddDue] = useState(false);
  const [dueAmt, setDueAmt] = useState("");
  const [dueNote, setDueNote] = useState("");

  const allTransactions = [
    ...sales.map((s) => ({ type: "sale" as const, date: s.date, amount: s.total, label: s.invoiceNo, method: s.paymentMethod })),
    ...payments.map((p) => ({ type: "payment" as const, date: p.date, amount: p.amount, label: "Payment", method: p.method })),
    ...dueEntries.map((d) => ({ type: "due" as const, date: d.date, amount: d.amount, label: d.note || "Old Due Added", method: "" })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1000px]">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
      </Button>

      <div className="bg-card border border-border rounded-outer p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-foreground">{customer.name}</h2>
            <p className="text-xs md:text-sm text-muted-foreground">{customer.phone} &middot; {customer.address}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-muted-foreground">Outstanding Balance</p>
            <p className={`text-xl md:text-2xl font-bold font-mono-data ${customer.dueBalance > 0 ? "text-accent-due" : "text-accent-success"}`}>
              ৳{customer.dueBalance.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant={customer.dueBalance > 0 ? "due" : "outline"} onClick={onPayment} disabled={customer.dueBalance <= 0}>
          <Banknote className="w-4 h-4 mr-1.5" /> Receive Payment
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowAddDue(true)}>
          <PlusCircle className="w-4 h-4 mr-1.5" /> Add Old Due
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Edit className="w-4 h-4 mr-1.5" /> Edit
        </Button>
        <Button size="sm" variant="destructive" onClick={onDelete}>
          <X className="w-4 h-4 mr-1.5" /> Delete
        </Button>
      </div>

      {showAddDue && (
        <div className="bg-card border border-primary/30 rounded-outer p-4 space-y-3">
          <h3 className="font-semibold text-foreground">Add Old Due Amount</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Amount (৳)</label>
              <Input type="number" value={dueAmt} onChange={(e) => setDueAmt(e.target.value)} placeholder="Enter due amount" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Note</label>
              <Input value={dueNote} onChange={(e) => setDueNote(e.target.value)} placeholder="e.g. Old balance from March" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowAddDue(false); setDueAmt(""); setDueNote(""); }}>Cancel</Button>
            <Button size="sm" onClick={() => {
              const amt = parseFloat(dueAmt);
              if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
              onAddDue(amt, dueNote);
              setShowAddDue(false); setDueAmt(""); setDueNote("");
            }}>Add Due</Button>
          </div>
        </div>
      )}

      {showPaymentForm && (
        <div className="bg-card border border-primary/30 rounded-outer p-4 space-y-3">
          <h3 className="font-semibold text-foreground">Receive Payment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Amount (৳)</label>
              <Input type="number" value={payAmt} onChange={(e) => setPayAmt(e.target.value)} placeholder={`Max: ${customer.dueBalance}`} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Method</label>
              <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="w-full h-10 rounded-outer border border-input bg-background px-3 text-sm">
                <option>Cash</option><option>bKash</option><option>Nagad</option><option>Card</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Note</label>
              <Input value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onCancelPayment}>Cancel</Button>
            <Button size="sm" onClick={() => {
              const amt = parseFloat(payAmt);
              if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
              if (amt > customer.dueBalance) { toast.error("Amount exceeds due balance"); return; }
              onSubmitPayment(amt, payMethod, payNote); setPayAmt(""); setPayNote("");
            }}>Confirm Payment</Button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-outer overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">Transaction History</h3>
        </div>
        <div className="divide-y divide-border">
          {allTransactions.map((t, i) => (
            <div key={i} className="px-3 md:px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                {t.type === "sale" ? (
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-inner bg-accent-expiry/10 flex items-center justify-center">
                    <span className="text-[10px] md:text-xs font-bold text-accent-expiry">S</span>
                  </div>
                ) : t.type === "payment" ? (
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-inner bg-accent-success/10 flex items-center justify-center">
                    <span className="text-[10px] md:text-xs font-bold text-accent-success">P</span>
                  </div>
                ) : (
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-inner bg-amber-500/10 flex items-center justify-center">
                    <span className="text-[10px] md:text-xs font-bold text-amber-600">D</span>
                  </div>
                )}
                <div>
                  <p className="text-xs md:text-sm font-medium text-foreground">{t.label}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()} {t.method ? `· ${t.method}` : ""}</p>
                </div>
              </div>
              <span className={`font-mono-data font-semibold text-xs md:text-sm ${t.type === "sale" ? "text-accent-expiry" : t.type === "payment" ? "text-accent-success" : "text-amber-600"}`}>
                {t.type === "sale" ? "-" : t.type === "payment" ? "+" : "+"}৳{t.amount.toFixed(2)}
              </span>
            </div>
          ))}
          {allTransactions.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">No transactions yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomerForm({ customer, onSave, onCancel }: {
  customer: Customer | null;
  onSave: (cust: Omit<Customer, "id">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(customer?.name || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [address, setAddress] = useState(customer?.address || "");

  const [dueBalance, setDueBalance] = useState(String(customer?.dueBalance || 0));

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!name.trim()) { toast.error("Name is required"); return; } onSave({ name, phone, address, dueBalance: parseFloat(dueBalance) || 0 }); }} className="bg-card border border-border rounded-outer p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{customer ? "Edit Customer" : "Add Customer"}</h3>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}><X className="w-4 h-4" /></Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div><label className="text-xs text-muted-foreground mb-1 block">Name *</label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">Phone</label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">Address</label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">Old Due Balance (৳)</label><Input type="number" value={dueBalance} onChange={(e) => setDueBalance(e.target.value)} placeholder="0" min="0" /></div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{customer ? "Update" : "Add"}</Button>
      </div>
    </form>
  );
}
