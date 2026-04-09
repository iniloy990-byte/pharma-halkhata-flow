export interface Medicine {
  id: string;
  name: string;
  generic: string;
  form: string;
  manufacturer: string;
  mrp: number;
  tp: number;
  stock: number;
  batch: string;
  expiry: string; // YYYY-MM
  minStock: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  dueBalance: number;
}

export interface SaleItem {
  medicineId: string;
  medicineName: string;
  generic: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  customerId: string | null;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  vat: number;
  discount: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  date: string; // ISO
  salesperson: string;
}

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  method: string;
  date: string;
  note: string;
}

export interface DueEntry {
  id: string;
  customerId: string;
  amount: number;
  note: string;
  date: string;
}

export interface PharmacySettings {
  name: string;
  address: string;
  phone: string;
  vatRate: number;
  currency: string;
  receiptWidth: "80mm" | "58mm";
}
