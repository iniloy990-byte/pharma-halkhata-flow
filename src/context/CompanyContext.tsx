import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Company, CompanyPurchase, CompanyPayment } from "@/types/pharmacy";

interface CompanyContextType {
  companies: Company[];
  companyPurchases: CompanyPurchase[];
  companyPayments: CompanyPayment[];
  loading: boolean;
  addCompany: (c: Omit<Company, "id">) => Promise<void>;
  updateCompany: (c: Company) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  addPurchase: (p: Omit<CompanyPurchase, "id">) => Promise<void>;
  addCompanyPayment: (p: Omit<CompanyPayment, "id">) => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | null>(null);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyPurchases, setCompanyPurchases] = useState<CompanyPurchase[]>([]);
  const [companyPayments, setCompanyPayments] = useState<CompanyPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [compRes, purchRes, payRes] = await Promise.all([
          supabase.from("companies").select("*").order("name"),
          supabase.from("company_purchases").select("*").order("date", { ascending: false }),
          supabase.from("company_payments").select("*").order("date", { ascending: false }),
        ]);

        if (compRes.data) {
          setCompanies(compRes.data.map((c: any) => ({
            id: c.id, name: c.name, address: c.address, phone: c.phone,
            contactPerson: c.contact_person, dueBalance: Number(c.due_balance),
          })));
        }
        if (purchRes.data) {
          setCompanyPurchases(purchRes.data.map((p: any) => ({
            id: p.id, companyId: p.company_id, invoiceNo: p.invoice_no,
            date: p.date, totalAmount: Number(p.total_amount),
            paidAmount: Number(p.paid_amount), dueAmount: Number(p.due_amount), note: p.note,
          })));
        }
        if (payRes.data) {
          setCompanyPayments(payRes.data.map((p: any) => ({
            id: p.id, companyId: p.company_id, amount: Number(p.amount),
            method: p.method, date: p.date, note: p.note,
          })));
        }
      } catch (err) {
        console.error("Failed to fetch company data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const addCompany = useCallback(async (c: Omit<Company, "id">) => {
    const { data, error } = await supabase.from("companies").insert({
      name: c.name, address: c.address, phone: c.phone,
      contact_person: c.contactPerson, due_balance: c.dueBalance,
    }).select().single();
    if (error) { console.error(error); return; }
    setCompanies(prev => [...prev, {
      id: data.id, name: data.name, address: data.address, phone: data.phone,
      contactPerson: data.contact_person, dueBalance: Number(data.due_balance),
    }]);
  }, []);

  const updateCompany = useCallback(async (c: Company) => {
    const { error } = await supabase.from("companies").update({
      name: c.name, address: c.address, phone: c.phone,
      contact_person: c.contactPerson, due_balance: c.dueBalance,
    }).eq("id", c.id);
    if (error) { console.error(error); return; }
    setCompanies(prev => prev.map(co => co.id === c.id ? c : co));
  }, []);

  const deleteCompany = useCallback(async (id: string) => {
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) { console.error(error); return; }
    setCompanies(prev => prev.filter(c => c.id !== id));
  }, []);

  const addPurchase = useCallback(async (p: Omit<CompanyPurchase, "id">) => {
    const { data, error } = await supabase.from("company_purchases").insert({
      company_id: p.companyId, invoice_no: p.invoiceNo, date: p.date,
      total_amount: p.totalAmount, paid_amount: p.paidAmount,
      due_amount: p.dueAmount, note: p.note,
    }).select().single();
    if (error) { console.error(error); return; }

    // Update company due balance
    if (p.dueAmount > 0) {
      const comp = companies.find(c => c.id === p.companyId);
      if (comp) {
        const newDue = comp.dueBalance + p.dueAmount;
        await supabase.from("companies").update({ due_balance: newDue }).eq("id", p.companyId);
        setCompanies(prev => prev.map(c => c.id === p.companyId ? { ...c, dueBalance: newDue } : c));
      }
    }

    setCompanyPurchases(prev => [{
      id: data.id, companyId: data.company_id, invoiceNo: data.invoice_no,
      date: data.date, totalAmount: Number(data.total_amount),
      paidAmount: Number(data.paid_amount), dueAmount: Number(data.due_amount), note: data.note,
    }, ...prev]);
  }, [companies]);

  const addCompanyPayment = useCallback(async (p: Omit<CompanyPayment, "id">) => {
    const { data, error } = await supabase.from("company_payments").insert({
      company_id: p.companyId, amount: p.amount,
      method: p.method, date: p.date, note: p.note,
    }).select().single();
    if (error) { console.error(error); return; }

    // Update company due balance
    const comp = companies.find(c => c.id === p.companyId);
    if (comp) {
      const newDue = Math.max(0, comp.dueBalance - p.amount);
      await supabase.from("companies").update({ due_balance: newDue }).eq("id", p.companyId);
      setCompanies(prev => prev.map(c => c.id === p.companyId ? { ...c, dueBalance: newDue } : c));
    }

    setCompanyPayments(prev => [{
      id: data.id, companyId: data.company_id, amount: Number(data.amount),
      method: data.method, date: data.date, note: data.note,
    }, ...prev]);
  }, [companies]);

  return (
    <CompanyContext.Provider value={{
      companies, companyPurchases, companyPayments, loading,
      addCompany, updateCompany, deleteCompany, addPurchase, addCompanyPayment,
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}
