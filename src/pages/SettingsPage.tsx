import { useState, useRef } from "react";
import { usePharmacy } from "@/context/PharmacyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Upload, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function SettingsPage() {
  const { settings, updateSettings } = usePharmacy();
  const [form, setForm] = useState(settings);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: string, val: string | number) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = () => { updateSettings(form); toast.success("Settings saved successfully"); };

  const handleReset = () => {
    if (confirm("This will clear ALL data and reset to defaults. Are you sure?")) {
      localStorage.clear(); window.location.reload();
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2MB"); return; }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("pharmacy-logos").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("pharmacy-logos").getPublicUrl(path);
      setForm((p) => ({ ...p, logoUrl: data.publicUrl }));
      toast.success("Logo uploaded — click Save Settings to apply");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeLogo = () => setForm((p) => ({ ...p, logoUrl: "" }));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[800px]">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">Settings</h2>
        <p className="text-xs md:text-sm text-muted-foreground">Configure your pharmacy details</p>
      </div>

      <div className="bg-card border border-border rounded-outer p-4 md:p-5 space-y-4">
        <h3 className="font-semibold text-foreground">Store Logo</h3>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-outer border border-border bg-background flex items-center justify-center overflow-hidden shrink-0">
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="Store logo" className="w-full h-full object-contain" />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <Upload className="w-4 h-4 mr-1.5" /> {uploading ? "Uploading..." : form.logoUrl ? "Change Logo" : "Upload Logo"}
              </Button>
              {form.logoUrl && (
                <Button variant="ghost" size="sm" onClick={removeLogo}>
                  <X className="w-4 h-4 mr-1.5" /> Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">PNG/JPG, max 2MB. Appears at the top of every printed invoice.</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-outer p-4 md:p-5 space-y-4">
        <h3 className="font-semibold text-foreground">Pharmacy Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Pharmacy Name</label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Address</label>
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">VAT Rate (%)</label>
            <Input type="number" step="0.1" value={form.vatRate} onChange={(e) => set("vatRate", parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Currency Symbol</label>
            <Input value={form.currency} onChange={(e) => set("currency", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Receipt Width</label>
            <select value={form.receiptWidth} onChange={(e) => set("receiptWidth", e.target.value)}
              className="w-full h-10 rounded-outer border border-input bg-background px-3 text-sm">
              <option value="80mm">80mm (Standard)</option>
              <option value="58mm">58mm (Compact)</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave}><Save className="w-4 h-4 mr-1.5" /> Save Settings</Button>
        </div>
      </div>

      <div className="bg-card border border-destructive/30 rounded-outer p-4 md:p-5 space-y-3">
        <h3 className="font-semibold text-destructive">Danger Zone</h3>
        <p className="text-xs md:text-sm text-muted-foreground">Reset all data to defaults. This action cannot be undone.</p>
        <Button variant="destructive" size="sm" onClick={handleReset}>Reset All Data</Button>
      </div>
    </div>
  );
}
