import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePharmacy } from "@/context/PharmacyContext";
import { useCompanies } from "@/context/CompanyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, ScanLine, Trash2, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ExtractedItem {
  name: string;
  generic?: string;
  qty: number;
  batch?: string;
  expiry?: string;
  unitPrice?: number;
  total?: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function ScanInvoiceDialog({ open, onOpenChange }: Props) {
  const { medicines, addMedicine, updateMedicine } = usePharmacy();
  const { companies, addPurchase } = useCompanies();
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [scanning, setScanning] = useState(false);
  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [companyId, setCompanyId] = useState<string>("");
  const [paidAmount, setPaidAmount] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("upload"); setItems([]); setInvoiceNo(""); setCompanyId("");
    setPaidAmount(""); setImagePreview(null); setScanning(false); setSaving(false);
  };

  const close = () => { reset(); onOpenChange(false); };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error("Image too large (max 8 MB)"); return; }

    setScanning(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setImagePreview(URL.createObjectURL(file));

      const { data, error } = await supabase.functions.invoke("scan-invoice", {
        body: { imageBase64: base64, mimeType: file.type },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const extracted: ExtractedItem[] = (data?.items || []).map((i: any) => ({
        name: String(i.name || "").trim(),
        generic: i.generic || "",
        qty: Number(i.qty) || 0,
        batch: i.batch || "",
        expiry: i.expiry || "",
        unitPrice: Number(i.unitPrice) || 0,
        total: Number(i.total) || 0,
      })).filter((i: ExtractedItem) => i.name);

      if (extracted.length === 0) { toast.error("No medicines detected. Try a clearer photo."); setScanning(false); return; }

      setItems(extracted);
      if (data?.invoiceNo) setInvoiceNo(String(data.invoiceNo));
      setStep("review");
      toast.success(`Found ${extracted.length} item(s)`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to scan invoice");
    } finally {
      setScanning(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const updateItem = (idx: number, key: keyof ExtractedItem, val: string | number) => {
    setItems((p) => p.map((it, i) => i === idx ? { ...it, [key]: val } : it));
  };
  const removeItem = (idx: number) => setItems((p) => p.filter((_, i) => i !== idx));

  const total = items.reduce((sum, i) => sum + (i.total || (i.unitPrice || 0) * i.qty), 0);

  const handleConfirm = async () => {
    if (items.length === 0) { toast.error("No items to save"); return; }
    setSaving(true);
    try {
      let added = 0, updated = 0;
      for (const item of items) {
        const match = medicines.find(
          (m) => m.name.toLowerCase().trim() === item.name.toLowerCase().trim()
        );
        if (match) {
          await updateMedicine({
            ...match,
            stock: match.stock + item.qty,
            ...(item.batch ? { batch: item.batch } : {}),
            ...(item.expiry ? { expiry: item.expiry } : {}),
            ...(item.unitPrice && item.unitPrice > 0 ? { tp: item.unitPrice } : {}),
          });
          updated++;
        } else {
          await addMedicine({
            name: item.name,
            generic: item.generic || "",
            form: "",
            manufacturer: companies.find(c => c.id === companyId)?.name || "",
            mrp: 0,
            tp: item.unitPrice || 0,
            stock: item.qty,
            batch: item.batch || "",
            expiry: item.expiry || "",
            minStock: 10,
          });
          added++;
        }
      }

      if (companyId) {
        const paid = parseFloat(paidAmount) || 0;
        await addPurchase({
          companyId,
          invoiceNo: invoiceNo || `SCAN-${Date.now()}`,
          date: new Date().toISOString(),
          totalAmount: total,
          paidAmount: paid,
          dueAmount: Math.max(0, total - paid),
          note: "Created from scanned invoice",
        });
      }

      toast.success(`Inventory updated: ${added} added, ${updated} restocked`);
      close();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5" /> Scan Supplier Invoice
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Upload or capture a photo of the supplier invoice. AI will extract medicine names, quantities, batch and expiry.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFile}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={scanning}
              className="w-full border-2 border-dashed border-border rounded-outer p-10 flex flex-col items-center justify-center gap-3 hover:bg-accent/30 transition disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm font-medium">Reading invoice...</p>
                  <p className="text-xs text-muted-foreground">This may take 10–30 seconds</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload or take a photo</p>
                  <p className="text-xs text-muted-foreground">JPG / PNG, up to 8 MB</p>
                </>
              )}
            </button>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Supplier Company</label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger><SelectValue placeholder="Select company (optional)" /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Invoice No.</label>
                <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="Auto-generated if empty" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Paid Amount (৳)</label>
                <Input type="number" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="0" disabled={!companyId} />
              </div>
            </div>

            {imagePreview && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">View original photo</summary>
                <img src={imagePreview} alt="Invoice" className="mt-2 max-h-64 rounded-outer border border-border" />
              </details>
            )}

            <div className="border border-border rounded-outer overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Medicine</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Generic</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Qty</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Unit ৳</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Batch</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Expiry</th>
                      <th className="text-center px-3 py-2 font-medium text-muted-foreground">Match</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((it, idx) => {
                      const matched = medicines.some(m => m.name.toLowerCase().trim() === it.name.toLowerCase().trim());
                      return (
                        <tr key={idx}>
                          <td className="px-2 py-1"><Input className="h-8" value={it.name} onChange={(e) => updateItem(idx, "name", e.target.value)} /></td>
                          <td className="px-2 py-1"><Input className="h-8" value={it.generic || ""} onChange={(e) => updateItem(idx, "generic", e.target.value)} /></td>
                          <td className="px-2 py-1"><Input className="h-8 w-20 text-right" type="number" value={it.qty} onChange={(e) => updateItem(idx, "qty", parseInt(e.target.value) || 0)} /></td>
                          <td className="px-2 py-1"><Input className="h-8 w-24 text-right" type="number" step="0.01" value={it.unitPrice || ""} onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)} /></td>
                          <td className="px-2 py-1"><Input className="h-8 w-24" value={it.batch || ""} onChange={(e) => updateItem(idx, "batch", e.target.value)} /></td>
                          <td className="px-2 py-1"><Input className="h-8 w-28" type="month" value={it.expiry || ""} onChange={(e) => updateItem(idx, "expiry", e.target.value)} /></td>
                          <td className="px-2 py-1 text-center">
                            {matched
                              ? <span className="inline-flex items-center gap-1 text-xs text-success"><CheckCircle2 className="w-3 h-3" />Restock</span>
                              : <span className="text-xs text-muted-foreground">New</span>}
                          </td>
                          <td className="px-2 py-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(idx)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-right text-sm text-muted-foreground">
              Total: <span className="font-mono-data text-foreground font-semibold">৳{total.toFixed(2)}</span>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "review" && (
            <>
              <Button variant="outline" onClick={() => { setStep("upload"); setItems([]); }}>Back</Button>
              <Button onClick={handleConfirm} disabled={saving || items.length === 0}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm & Add to Inventory
              </Button>
            </>
          )}
          {step === "upload" && <Button variant="outline" onClick={close}>Cancel</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
