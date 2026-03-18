import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

import { Medicine, Customer, Sale, Payment, PharmacySettings } from "@/types/pharmacy";
import { defaultMedicines, defaultCustomers, defaultSales, defaultPayments } from "@/data/defaults";

interface PharmacyContextType {
  medicines: Medicine[];
  customers: Customer[];
  sales: Sale[];
  payments: Payment[];
  settings: PharmacySettings;
  addMedicine: (med: Omit<Medicine, "id">) => void;
  updateMedicine: (med: Medicine) => void;
  deleteMedicine: (id: string) => void;
  importMedicines: (meds: Omit<Medicine, "id">[]) => void;
  addCustomer: (cust: Omit<Customer, "id">) => void;
  updateCustomer: (cust: Customer) => void;
  deleteCustomer: (id: string) => void;
  addSale: (sale: Omit<Sale, "id" | "invoiceNo">) => void;
  addPayment: (payment: Omit<Payment, "id">) => void;
  updateSettings: (s: PharmacySettings) => void;
}

const PharmacyContext = createContext<PharmacyContextType | null>(null);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

const defaultSettings: PharmacySettings = {
  name: "PharmaStream Pharmacy",
  address: "123 Mirpur Road, Dhaka-1205",
  phone: "01712345678",
  vatRate: 5,
  currency: "৳",
  receiptWidth: "80mm",
};

export function PharmacyProvider({ children }: { children: ReactNode }) {
  const [medicines, setMedicines] = useState<Medicine[]>(() => loadFromStorage("ps_medicines", defaultMedicines));
  const [customers, setCustomers] = useState<Customer[]>(() => loadFromStorage("ps_customers", defaultCustomers));
  const [sales, setSales] = useState<Sale[]>(() => loadFromStorage("ps_sales", defaultSales));
  const [payments, setPayments] = useState<Payment[]>(() => loadFromStorage("ps_payments", defaultPayments));
  const [settings, setSettings] = useState<PharmacySettings>(() => loadFromStorage("ps_settings", defaultSettings));

  useEffect(() => { localStorage.setItem("ps_medicines", JSON.stringify(medicines)); }, [medicines]);
  useEffect(() => { localStorage.setItem("ps_customers", JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem("ps_sales", JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem("ps_payments", JSON.stringify(payments)); }, [payments]);
  useEffect(() => { localStorage.setItem("ps_settings", JSON.stringify(settings)); }, [settings]);

  const uid = () => crypto.randomUUID();

  const addMedicine = useCallback((med: Omit<Medicine, "id">) => {
    setMedicines((prev) => [...prev, { ...med, id: uid() }]);
  }, []);

  const updateMedicine = useCallback((med: Medicine) => {
    setMedicines((prev) => prev.map((m) => (m.id === med.id ? med : m)));
  }, []);

  const deleteMedicine = useCallback((id: string) => {
    setMedicines((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const importMedicines = useCallback((meds: Omit<Medicine, "id">[]) => {
    const newMeds = meds.map((m) => ({ ...m, id: uid() }));
    setMedicines((prev) => [...prev, ...newMeds]);
  }, []);

  const addCustomer = useCallback((cust: Omit<Customer, "id">) => {
    setCustomers((prev) => [...prev, { ...cust, id: uid() }]);
  }, []);

  const updateCustomer = useCallback((cust: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === cust.id ? cust : c)));
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addSale = useCallback((sale: Omit<Sale, "id" | "invoiceNo">) => {
    setSales((prev) => {
      const num = prev.length + 1001;
      const newSale: Sale = { ...sale, id: uid(), invoiceNo: `INV-${num}` };
      return [newSale, ...prev];
    });
    // Deduct stock
    setMedicines((prev) =>
      prev.map((m) => {
        const item = sale.items.find((i) => i.medicineId === m.id);
        if (item) return { ...m, stock: Math.max(0, m.stock - item.qty) };
        return m;
      })
    );
    // Update customer due if there's any due amount
    if (sale.dueAmount > 0 && sale.customerId) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === sale.customerId ? { ...c, dueBalance: c.dueBalance + sale.dueAmount } : c))
      );
    }
  }, []);

  const addPayment = useCallback((payment: Omit<Payment, "id">) => {
    setPayments((prev) => [{ ...payment, id: uid() }, ...prev]);
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === payment.customerId ? { ...c, dueBalance: Math.max(0, c.dueBalance - payment.amount) } : c
      )
    );
  }, []);

  const updateSettings = useCallback((s: PharmacySettings) => {
    setSettings(s);
  }, []);

  return (
    <PharmacyContext.Provider
      value={{
        medicines, customers, sales, payments, settings,
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
