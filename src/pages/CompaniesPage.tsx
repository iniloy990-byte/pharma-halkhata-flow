import { useState } from "react";
import { useCompany } from "@/context/CompanyContext";
import { Company, CompanyPurchase, CompanyPayment } from "@/types/pharmacy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Plus, Building2, ChevronRight, X, ArrowLeft, Banknote, ShoppingCart, Edit, Trash2,
} from "lucide-react";
import { toast } from "sonner";

export default function CompaniesPage() {
  const { companies, companyPurchases, companyPayments, addCompany, updateCompany, deleteCompany, addPurchase, addCompanyPayment } = useCompany();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingComp, setEditingComp] = useState<Company | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const filtered = companies.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const totalDues = companies.reduce((s, c) => s + c.dueBalance, 0);

  if (selectedCompany) {
    const comp = companies.find(c => c.id === selectedCompany.id) || selectedCompany;
    const purchases = companyPurchases.filter(p => p.companyId === comp.id);
    const payments = companyPayments.filter(p => p.companyId === comp.id);
    return (
      <CompanyDetail
        company={comp} purchases={purchases} payments={payments}
        onBack={() => setSelectedCompany(null)}
        onEdit={() => { setEditingComp(comp); setSelectedCompany(null); setShowForm(true); }}
        onDelete={() => {
          if (window.confirm(`Delete "${comp.name}"?`)) {
            deleteCompany(comp.id); setSelectedCompany(null); toast.success("Company deleted");
          }
        }}
        onAddPurchase={(p) => {
          addPurchase({ ...p, companyId: comp.id, date: new Date().toISOString() });
          toast.success("Purchase recorded");
        }}
        onAddPayment={(amount, method, note) => {
          addCompanyPayment({ companyId: comp.id, amount, method, note, date: new Date().toISOString() });
          toast.success(`Payment of ৳${amount} recorded`);
        }}
      />
    );
  }

  if (showForm) {
    return (
      <CompanyForm
        company={editingComp}
        onSave={async (c) => {
          if (editingComp) {
            await updateCompany({ ...editingComp, ...c });
            toast.success("Company updated");
          } else {
            await addCompany({ ...c, dueBalance: 0 });
            toast.success("Company added");
          }
          setShowForm(false); setEditingComp(null);
        }}
        onCancel={() => { setShowForm(false); setEditingComp(null); }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Medicine Companies</h2>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Company
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-outer p-3">
          <p className="text-xs text-muted-foreground">Total Companies</p>
          <p className="text-xl font-bold text-foreground">{companies.length}</p>
        </div>
        <div className="bg-card border border-border rounded-outer p-3">
          <p className="text-xs text-muted-foreground">Total Dues</p>
          <p className="text-xl font-bold text-destructive">৳{totalDues.toFixed(2)}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search companies..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="space-y-2">
        {filtered.map(c => (
          <div key={c.id} onClick={() => setSelectedCompany(c)}
            className="flex items-center justify-between p-3 bg-card border border-border rounded-outer cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.contactPerson || c.phone || "No contact"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {c.dueBalance > 0 && (
                <span className="text-xs font-medium text-destructive">৳{c.dueBalance.toFixed(2)}</span>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No companies found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Company Form
function CompanyForm({ company, onSave, onCancel }: {
  company: Company | null;
  onSave: (c: Omit<Company, "id" | "dueBalance">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(company?.name || "");
  const [address, setAddress] = useState(company?.address || "");
  const [phone, setPhone] = useState(company?.phone || "");
  const [contactPerson, setContactPerson] = useState(company?.contactPerson || "");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="w-4 h-4" /></Button>
        <h2 className="text-lg font-bold text-foreground">{company ? "Edit" : "Add"} Company</h2>
      </div>
      <div className="space-y-3 bg-card border border-border rounded-outer p-4">
        <div>
          <label className="text-xs font-medium text-foreground">Company Name *</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Company name" />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Contact Person</label>
          <Input value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="Contact person" />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Phone</label>
          <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Address</label>
          <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { if (!name.trim()) { toast.error("Name required"); return; } onSave({ name, address, phone, contactPerson }); }} className="flex-1">
            {company ? "Update" : "Add"} Company
          </Button>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// Company Detail
function CompanyDetail({ company, purchases, payments, onBack, onEdit, onDelete, onAddPurchase, onAddPayment }: {
  company: Company;
  purchases: CompanyPurchase[];
  payments: CompanyPayment[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddPurchase: (p: { invoiceNo: string; totalAmount: number; paidAmount: number; dueAmount: number; note: string }) => void;
  onAddPayment: (amount: number, method: string, note: string) => void;
}) {
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [payNote, setPayNote] = useState("");
  const [purchInvoice, setPurchInvoice] = useState("");
  const [purchTotal, setPurchTotal] = useState("");
  const [purchPaid, setPurchPaid] = useState("");
  const [purchNote, setPurchNote] = useState("");

  // Merge transactions
  const allTransactions = [
    ...purchases.map(p => ({ type: "purchase" as const, date: p.date, data: p })),
    ...payments.map(p => ({ type: "payment" as const, date: p.date, data: p })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        <h2 className="text-lg font-bold text-foreground flex-1">{company.name}</h2>
        <Button variant="ghost" size="icon" onClick={onEdit}><Edit className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="w-4 h-4 text-destructive" /></Button>
      </div>

      <div className="bg-card border border-border rounded-outer p-4 space-y-2">
        {company.contactPerson && <p className="text-sm text-muted-foreground">Contact: {company.contactPerson}</p>}
        {company.phone && <p className="text-sm text-muted-foreground">Phone: {company.phone}</p>}
        {company.address && <p className="text-sm text-muted-foreground">Address: {company.address}</p>}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm font-medium text-foreground">Due Balance</span>
          <span className={`text-lg font-bold ${company.dueBalance > 0 ? "text-destructive" : "text-green-600"}`}>
            ৳{company.dueBalance.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setShowPurchaseForm(!showPurchaseForm)} className="flex-1">
          <ShoppingCart className="w-4 h-4 mr-1" /> Add Purchase
        </Button>
        <Button size="sm" onClick={() => setShowPaymentForm(!showPaymentForm)} className="flex-1">
          <Banknote className="w-4 h-4 mr-1" /> Pay
        </Button>
      </div>

      {showPurchaseForm && (
        <div className="bg-card border border-border rounded-outer p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground">Record Purchase</h3>
          <Input placeholder="Invoice No." value={purchInvoice} onChange={e => setPurchInvoice(e.target.value)} />
          <Input type="number" placeholder="Total Amount" value={purchTotal} onChange={e => setPurchTotal(e.target.value)} />
          <Input type="number" placeholder="Paid Amount" value={purchPaid} onChange={e => setPurchPaid(e.target.value)} />
          <Input placeholder="Note (optional)" value={purchNote} onChange={e => setPurchNote(e.target.value)} />
          <Button onClick={() => {
            const total = Number(purchTotal);
            const paid = Number(purchPaid);
            if (total <= 0) { toast.error("Enter total amount"); return; }
            onAddPurchase({ invoiceNo: purchInvoice, totalAmount: total, paidAmount: paid, dueAmount: Math.max(0, total - paid), note: purchNote });
            setPurchInvoice(""); setPurchTotal(""); setPurchPaid(""); setPurchNote(""); setShowPurchaseForm(false);
          }} className="w-full">Save Purchase</Button>
        </div>
      )}

      {showPaymentForm && (
        <div className="bg-card border border-border rounded-outer p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground">Record Payment to Company</h3>
          <Input type="number" placeholder="Amount" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
          <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="w-full h-9 rounded-inner border border-input bg-background px-3 text-sm">
            <option>Cash</option><option>Bank Transfer</option><option>bKash</option><option>Cheque</option>
          </select>
          <Input placeholder="Note (optional)" value={payNote} onChange={e => setPayNote(e.target.value)} />
          <Button onClick={() => {
            const amt = Number(payAmount);
            if (amt <= 0) { toast.error("Enter amount"); return; }
            onAddPayment(amt, payMethod, payNote);
            setPayAmount(""); setPayNote(""); setShowPaymentForm(false);
          }} className="w-full">Submit Payment</Button>
        </div>
      )}

      <div>
        <h3 className="text-sm font-bold text-foreground mb-2">Transaction History</h3>
        {allTransactions.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>}
        <div className="space-y-2">
          {allTransactions.map((t, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-card border border-border rounded-inner">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  t.type === "purchase" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                }`}>
                  {t.type === "purchase" ? "P" : "$"}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t.type === "purchase"
                      ? `Purchase${(t.data as CompanyPurchase).invoiceNo ? ` #${(t.data as CompanyPurchase).invoiceNo}` : ""}`
                      : `Payment (${(t.data as CompanyPayment).method})`}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                  {t.type === "purchase" && (t.data as CompanyPurchase).note && (
                    <p className="text-xs text-muted-foreground">{(t.data as CompanyPurchase).note}</p>
                  )}
                  {t.type === "payment" && (t.data as CompanyPayment).note && (
                    <p className="text-xs text-muted-foreground">{(t.data as CompanyPayment).note}</p>
                  )}
                </div>
              </div>
              <span className={`text-sm font-bold ${t.type === "purchase" ? "text-destructive" : "text-green-600"}`}>
                {t.type === "purchase" ? `-৳${(t.data as CompanyPurchase).totalAmount.toFixed(2)}` : `+৳${(t.data as CompanyPayment).amount.toFixed(2)}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
