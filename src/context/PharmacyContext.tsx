import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Medicine, Customer, Sale, Payment, DueEntry, PharmacySettings } from "@/types/pharmacy";

interface PharmacyContextType {
  medicines: Medicine[];
  customers: Customer[];
  sales: Sale[];
  payments: Payment[];
  settings: PharmacySettings;
  loading: boolean;
  addMedicine: (med: Omit<Medicine, "id">) => Promise<void>;
  updateMedicine: (med: Medicine) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
  importMedicines: (meds: Omit<Medicine, "id">[]) => Promise<void>;
  addCustomer: (cust: Omit<Customer, "id">) => Promise<void>;
  updateCustomer: (cust: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addSale: (sale: Omit<Sale, "id" | "invoiceNo">) => Promise<void>;
  addPayment: (payment: Omit<Payment, "id">) => Promise<void>;
  updateSettings: (s: PharmacySettings) => Promise<void>;
}

const PharmacyContext = createContext<PharmacyContextType | null>(null);

const defaultSettings: PharmacySettings = {
  name: "PharmaStream Pharmacy",
  address: "123 Mirpur Road, Dhaka-1205",
  phone: "01712345678",
  vatRate: 5,
  currency: "৳",
  receiptWidth: "80mm",
};

export function PharmacyProvider({ children }: { children: ReactNode }) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<PharmacySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Fetch all data on mount
  useEffect(() => {
    async function fetchAll() {
      try {
        const [medsRes, custRes, salesRes, paymentsRes, settingsRes] = await Promise.all([
          supabase.from("medicines").select("*").order("name"),
          supabase.from("customers").select("*").order("name"),
          supabase.from("sales").select("*").order("date", { ascending: false }),
          supabase.from("payments").select("*").order("date", { ascending: false }),
          supabase.from("pharmacy_settings").select("*").limit(1),
        ]);

        if (medsRes.data) {
          setMedicines(medsRes.data.map((m: any) => ({
            id: m.id, name: m.name, generic: m.generic, form: m.form,
            manufacturer: m.manufacturer, mrp: Number(m.mrp), tp: Number(m.tp),
            stock: m.stock, batch: m.batch, expiry: m.expiry, minStock: m.min_stock,
          })));
        }

        if (custRes.data) {
          setCustomers(custRes.data.map((c: any) => ({
            id: c.id, name: c.name, phone: c.phone,
            address: c.address, dueBalance: Number(c.due_balance),
          })));
        }

        if (salesRes.data) {
          // Fetch sale items for all sales
          const saleIds = salesRes.data.map((s: any) => s.id);
          const itemsRes = await supabase.from("sale_items").select("*").in("sale_id", saleIds);
          const itemsBySale: Record<string, any[]> = {};
          (itemsRes.data || []).forEach((item: any) => {
            if (!itemsBySale[item.sale_id]) itemsBySale[item.sale_id] = [];
            itemsBySale[item.sale_id].push({
              medicineId: item.medicine_id || "",
              medicineName: item.medicine_name,
              generic: item.generic,
              qty: item.qty,
              unitPrice: Number(item.unit_price),
              total: Number(item.total),
            });
          });

          setSales(salesRes.data.map((s: any) => ({
            id: s.id, invoiceNo: s.invoice_no,
            customerId: s.customer_id, customerName: s.customer_name,
            items: itemsBySale[s.id] || [],
            subtotal: Number(s.subtotal), vat: Number(s.vat),
            discount: Number(s.discount), total: Number(s.total),
            paidAmount: Number(s.paid_amount), dueAmount: Number(s.due_amount),
            paymentMethod: s.payment_method, date: s.date, salesperson: s.salesperson,
          })));
        }

        if (paymentsRes.data) {
          setPayments(paymentsRes.data.map((p: any) => ({
            id: p.id, customerId: p.customer_id, amount: Number(p.amount),
            method: p.method, date: p.date, note: p.note,
          })));
        }

        if (settingsRes.data && settingsRes.data.length > 0) {
          const s = settingsRes.data[0] as any;
          setSettings({
            name: s.name, address: s.address, phone: s.phone,
            vatRate: Number(s.vat_rate), currency: s.currency,
            receiptWidth: s.receipt_width as "80mm" | "58mm",
          });
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const addMedicine = useCallback(async (med: Omit<Medicine, "id">) => {
    const { data, error } = await supabase.from("medicines").insert({
      name: med.name, generic: med.generic, form: med.form,
      manufacturer: med.manufacturer, mrp: med.mrp, tp: med.tp,
      stock: med.stock, batch: med.batch, expiry: med.expiry, min_stock: med.minStock,
    }).select().single();
    if (error) { console.error(error); return; }
    setMedicines((prev) => [...prev, {
      id: data.id, name: data.name, generic: data.generic, form: data.form,
      manufacturer: data.manufacturer, mrp: Number(data.mrp), tp: Number(data.tp),
      stock: data.stock, batch: data.batch, expiry: data.expiry, minStock: data.min_stock,
    }]);
  }, []);

  const updateMedicine = useCallback(async (med: Medicine) => {
    const { error } = await supabase.from("medicines").update({
      name: med.name, generic: med.generic, form: med.form,
      manufacturer: med.manufacturer, mrp: med.mrp, tp: med.tp,
      stock: med.stock, batch: med.batch, expiry: med.expiry, min_stock: med.minStock,
    }).eq("id", med.id);
    if (error) { console.error(error); return; }
    setMedicines((prev) => prev.map((m) => (m.id === med.id ? med : m)));
  }, []);

  const deleteMedicine = useCallback(async (id: string) => {
    const { error } = await supabase.from("medicines").delete().eq("id", id);
    if (error) { console.error(error); return; }
    setMedicines((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const importMedicines = useCallback(async (meds: Omit<Medicine, "id">[]) => {
    const rows = meds.map((m) => ({
      name: m.name, generic: m.generic, form: m.form,
      manufacturer: m.manufacturer, mrp: m.mrp, tp: m.tp,
      stock: m.stock, batch: m.batch, expiry: m.expiry, min_stock: m.minStock,
    }));
    const { data, error } = await supabase.from("medicines").insert(rows).select();
    if (error) { console.error(error); return; }
    const newMeds = (data || []).map((d: any) => ({
      id: d.id, name: d.name, generic: d.generic, form: d.form,
      manufacturer: d.manufacturer, mrp: Number(d.mrp), tp: Number(d.tp),
      stock: d.stock, batch: d.batch, expiry: d.expiry, minStock: d.min_stock,
    }));
    setMedicines((prev) => [...prev, ...newMeds]);
  }, []);

  const addCustomer = useCallback(async (cust: Omit<Customer, "id">) => {
    const { data, error } = await supabase.from("customers").insert({
      name: cust.name, phone: cust.phone, address: cust.address, due_balance: cust.dueBalance,
    }).select().single();
    if (error) { console.error(error); return; }
    setCustomers((prev) => [...prev, {
      id: data.id, name: data.name, phone: data.phone,
      address: data.address, dueBalance: Number(data.due_balance),
    }]);
  }, []);

  const updateCustomer = useCallback(async (cust: Customer) => {
    const { error } = await supabase.from("customers").update({
      name: cust.name, phone: cust.phone, address: cust.address, due_balance: cust.dueBalance,
    }).eq("id", cust.id);
    if (error) { console.error(error); return; }
    setCustomers((prev) => prev.map((c) => (c.id === cust.id ? cust : c)));
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) { console.error(error); return; }
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addSale = useCallback(async (sale: Omit<Sale, "id" | "invoiceNo">) => {
    // Get next invoice number
    const { data: salesCount } = await supabase.from("sales").select("id", { count: "exact", head: true });
    const num = (salesCount as any)?.length || 0;
    const invoiceNo = `INV-${num + 1001}`;

    const { data: saleData, error: saleError } = await supabase.from("sales").insert({
      invoice_no: invoiceNo,
      customer_id: sale.customerId,
      customer_name: sale.customerName,
      subtotal: sale.subtotal, vat: sale.vat, discount: sale.discount, total: sale.total,
      paid_amount: sale.paidAmount, due_amount: sale.dueAmount,
      payment_method: sale.paymentMethod, salesperson: sale.salesperson,
      date: sale.date,
    }).select().single();

    if (saleError || !saleData) { console.error(saleError); return; }

    // Insert sale items
    const items = sale.items.map((i) => ({
      sale_id: saleData.id,
      medicine_id: i.medicineId || null,
      medicine_name: i.medicineName,
      generic: i.generic,
      qty: i.qty, unit_price: i.unitPrice, total: i.total,
    }));
    await supabase.from("sale_items").insert(items);

    // Deduct stock
    for (const item of sale.items) {
      if (item.medicineId) {
        const med = medicines.find((m) => m.id === item.medicineId);
        if (med) {
          const newStock = Math.max(0, med.stock - item.qty);
          await supabase.from("medicines").update({ stock: newStock }).eq("id", item.medicineId);
        }
      }
    }

    // Update customer due
    if (sale.dueAmount > 0 && sale.customerId) {
      const cust = customers.find((c) => c.id === sale.customerId);
      if (cust) {
        await supabase.from("customers").update({
          due_balance: cust.dueBalance + sale.dueAmount,
        }).eq("id", sale.customerId);
      }
    }

    // Update local state
    const newSale: Sale = {
      ...sale, id: saleData.id, invoiceNo: saleData.invoice_no,
    };
    setSales((prev) => [newSale, ...prev]);
    setMedicines((prev) =>
      prev.map((m) => {
        const item = sale.items.find((i) => i.medicineId === m.id);
        if (item) return { ...m, stock: Math.max(0, m.stock - item.qty) };
        return m;
      })
    );
    if (sale.dueAmount > 0 && sale.customerId) {
      setCustomers((prev) =>
        prev.map((c) => c.id === sale.customerId ? { ...c, dueBalance: c.dueBalance + sale.dueAmount } : c)
      );
    }
  }, [medicines, customers]);

  const addPayment = useCallback(async (payment: Omit<Payment, "id">) => {
    const { data, error } = await supabase.from("payments").insert({
      customer_id: payment.customerId, amount: payment.amount,
      method: payment.method, date: payment.date, note: payment.note,
    }).select().single();
    if (error) { console.error(error); return; }

    // Update customer due balance
    const cust = customers.find((c) => c.id === payment.customerId);
    if (cust) {
      const newDue = Math.max(0, cust.dueBalance - payment.amount);
      await supabase.from("customers").update({ due_balance: newDue }).eq("id", payment.customerId);
    }

    setPayments((prev) => [{
      id: data.id, customerId: data.customer_id, amount: Number(data.amount),
      method: data.method, date: data.date, note: data.note,
    }, ...prev]);
    setCustomers((prev) =>
      prev.map((c) => c.id === payment.customerId ? { ...c, dueBalance: Math.max(0, c.dueBalance - payment.amount) } : c)
    );
  }, [customers]);

  const updateSettings = useCallback(async (s: PharmacySettings) => {
    const { error } = await supabase.from("pharmacy_settings").update({
      name: s.name, address: s.address, phone: s.phone,
      vat_rate: s.vatRate, currency: s.currency, receipt_width: s.receiptWidth,
    }).neq("id", "00000000-0000-0000-0000-000000000000"); // update all rows
    if (error) console.error(error);
    setSettings(s);
  }, []);

  return (
    <PharmacyContext.Provider
      value={{
        medicines, customers, sales, payments, settings, loading,
        addMedicine, updateMedicine, deleteMedicine, importMedicines,
        addCustomer, updateCustomer, deleteCustomer,
        addSale, addPayment, updateSettings,
      }}
    >
      {children}
    </PharmacyContext.Provider>
  );
}

export function usePharmacy() {
  const ctx = useContext(PharmacyContext);
  if (!ctx) throw new Error("usePharmacy must be used within PharmacyProvider");
  return ctx;
}
