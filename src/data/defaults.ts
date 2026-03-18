import { Medicine, Customer, Sale, Payment } from "@/types/pharmacy";

export const defaultMedicines: Medicine[] = [
  { id: "m1", name: "Napa Extra", generic: "Paracetamol 500mg + Caffeine 65mg", form: "Tablet", manufacturer: "Beximco", mrp: 2.5, tp: 1.8, stock: 450, batch: "NE-2024-031", expiry: "2025-08", minStock: 50 },
  { id: "m2", name: "Seclo 20", generic: "Omeprazole 20mg", form: "Capsule", manufacturer: "Square", mrp: 6, tp: 4.5, stock: 120, batch: "SC-2024-088", expiry: "2025-11", minStock: 20 },
  { id: "m3", name: "Ace Plus", generic: "Paracetamol 500mg + Caffeine 65mg", form: "Tablet", manufacturer: "Square", mrp: 2.5, tp: 1.8, stock: 0, batch: "AP-2024-012", expiry: "2025-06", minStock: 50 },
  { id: "m4", name: "Zimax 500", generic: "Azithromycin 500mg", form: "Tablet", manufacturer: "Square", mrp: 30, tp: 22, stock: 85, batch: "ZM-2024-055", expiry: "2026-02", minStock: 10 },
  { id: "m5", name: "Losectil 20", generic: "Omeprazole 20mg", form: "Capsule", manufacturer: "Incepta", mrp: 5, tp: 3.5, stock: 200, batch: "LS-2024-019", expiry: "2025-09", minStock: 30 },
  { id: "m6", name: "Sergel 20", generic: "Esomeprazole 20mg", form: "Capsule", manufacturer: "Square", mrp: 8, tp: 6, stock: 15, batch: "SG-2024-043", expiry: "2025-04", minStock: 20 },
  { id: "m7", name: "Amoxil 500", generic: "Amoxicillin 500mg", form: "Capsule", manufacturer: "Square", mrp: 12, tp: 9, stock: 300, batch: "AX-2024-077", expiry: "2026-06", minStock: 30 },
  { id: "m8", name: "Ciprocin 500", generic: "Ciprofloxacin 500mg", form: "Tablet", manufacturer: "Square", mrp: 10, tp: 7, stock: 4, batch: "CP-2024-091", expiry: "2025-12", minStock: 20 },
  { id: "m9", name: "Monas 10", generic: "Montelukast 10mg", form: "Tablet", manufacturer: "Square", mrp: 14, tp: 10, stock: 90, batch: "MN-2024-066", expiry: "2026-01", minStock: 15 },
  { id: "m10", name: "Insulin Mixtard", generic: "Insulin (Human) 70/30", form: "Injection", manufacturer: "Novo Nordisk", mrp: 440, tp: 385, stock: 25, batch: "IM-2024-008", expiry: "2025-05", minStock: 5 },
  { id: "m11", name: "Tofen 400", generic: "Ibuprofen 400mg", form: "Tablet", manufacturer: "Incepta", mrp: 4, tp: 2.8, stock: 500, batch: "TF-2024-102", expiry: "2026-09", minStock: 50 },
  { id: "m12", name: "Maxpro 20", generic: "Esomeprazole 20mg", form: "Capsule", manufacturer: "Renata", mrp: 7, tp: 5, stock: 180, batch: "MX-2024-033", expiry: "2026-04", minStock: 25 },
  { id: "m13", name: "Fluclav 500", generic: "Amoxicillin + Clavulanic Acid", form: "Tablet", manufacturer: "Incepta", mrp: 25, tp: 18, stock: 60, batch: "FC-2024-045", expiry: "2025-10", minStock: 10 },
  { id: "m14", name: "Neurodin 75", generic: "Pregabalin 75mg", form: "Capsule", manufacturer: "Square", mrp: 12, tp: 8.5, stock: 140, batch: "ND-2024-078", expiry: "2026-03", minStock: 20 },
  { id: "m15", name: "Cef-3 200", generic: "Cefixime 200mg", form: "Capsule", manufacturer: "Square", mrp: 20, tp: 15, stock: 75, batch: "CF-2024-056", expiry: "2025-07", minStock: 15 },
];

export const defaultCustomers: Customer[] = [];

const now = new Date();
const today = now.toISOString().split("T")[0];
const yesterday = new Date(now.getTime() - 86400000).toISOString().split("T")[0];

export const defaultSales: Sale[] = [
  { id: "s1", invoiceNo: "INV-1024", customerId: null, customerName: "Walk-in", items: [
    { medicineId: "m1", medicineName: "Napa Extra", generic: "Paracetamol", qty: 10, unitPrice: 2.5, total: 25 },
    { medicineId: "m2", medicineName: "Seclo 20", generic: "Omeprazole", qty: 5, unitPrice: 6, total: 30 },
  ], subtotal: 55, vat: 2.75, discount: 0, total: 57.75, paymentMethod: "Cash", date: today + "T10:30:00", salesperson: "Admin" },
  { id: "s2", invoiceNo: "INV-1023", customerId: "c1", customerName: "Rahim Uddin", items: [
    { medicineId: "m4", medicineName: "Zimax 500", generic: "Azithromycin", qty: 6, unitPrice: 30, total: 180 },
    { medicineId: "m7", medicineName: "Amoxil 500", generic: "Amoxicillin", qty: 14, unitPrice: 12, total: 168 },
  ], subtotal: 348, vat: 17.4, discount: 0, total: 365.4, paymentMethod: "bKash", date: today + "T09:15:00", salesperson: "Admin" },
  { id: "s3", invoiceNo: "INV-1022", customerId: null, customerName: "Walk-in", items: [
    { medicineId: "m10", medicineName: "Insulin Mixtard", generic: "Insulin", qty: 1, unitPrice: 440, total: 440 },
  ], subtotal: 440, vat: 22, discount: 0, total: 462, paymentMethod: "Cash", date: today + "T08:45:00", salesperson: "Admin" },
  { id: "s4", invoiceNo: "INV-1021", customerId: "c2", customerName: "Fatema Begum", items: [
    { medicineId: "m9", medicineName: "Monas 10", generic: "Montelukast", qty: 30, unitPrice: 14, total: 420 },
  ], subtotal: 420, vat: 21, discount: 0, total: 441, paymentMethod: "Due", date: today + "T08:00:00", salesperson: "Admin" },
  { id: "s5", invoiceNo: "INV-1020", customerId: null, customerName: "Walk-in", items: [
    { medicineId: "m11", medicineName: "Tofen 400", generic: "Ibuprofen", qty: 20, unitPrice: 4, total: 80 },
    { medicineId: "m12", medicineName: "Maxpro 20", generic: "Esomeprazole", qty: 10, unitPrice: 7, total: 70 },
  ], subtotal: 150, vat: 7.5, discount: 0, total: 157.5, paymentMethod: "Nagad", date: yesterday + "T16:30:00", salesperson: "Admin" },
  { id: "s6", invoiceNo: "INV-1019", customerId: "c5", customerName: "Abdul Mannan", items: [
    { medicineId: "m14", medicineName: "Neurodin 75", generic: "Pregabalin", qty: 60, unitPrice: 12, total: 720 },
  ], subtotal: 720, vat: 36, discount: 20, total: 736, paymentMethod: "Due", date: yesterday + "T14:00:00", salesperson: "Admin" },
];

export const defaultPayments: Payment[] = [
  { id: "p1", customerId: "c1", amount: 500, method: "Cash", date: today + "T11:00:00", note: "Partial payment" },
  { id: "p2", customerId: "c2", amount: 200, method: "bKash", date: yesterday + "T15:00:00", note: "" },
];
