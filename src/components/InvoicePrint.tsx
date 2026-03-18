import { Sale, PharmacySettings } from "@/types/pharmacy";
import { Button } from "@/components/ui/button";
import { Printer, Download, X } from "lucide-react";

interface InvoicePrintProps {
  sale: Sale;
  settings: PharmacySettings;
  onClose: () => void;
}

export default function InvoicePrint({ sale, settings, onClose }: InvoicePrintProps) {
  const handlePrint = () => {
    window.print();
  };

  const date = new Date(sale.date);
  const formattedDate = date.toLocaleDateString("en-BD", {
    year: "numeric", month: "short", day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-BD", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 print:bg-transparent print:items-start">
      {/* Print controls - hidden during print */}
      <div className="absolute top-4 right-4 flex gap-2 print:hidden z-50">
        <Button variant="default" size="sm" onClick={handlePrint} className="gap-2">
          <Printer className="w-4 h-4" /> Print
        </Button>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Invoice */}
      <div
        className="bg-card rounded-outer shadow-2xl w-full max-w-md mx-4 overflow-auto max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none print:mx-0 print:max-w-full"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <div className="p-6 print:p-4" style={{ width: settings.receiptWidth === "58mm" ? "58mm" : "80mm", margin: "0 auto" }}>
          {/* Header */}
          <div className="text-center border-b border-dashed border-border pb-3 mb-3">
            <h1 className="text-base font-bold text-foreground">{settings.name}</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">{settings.address}</p>
            <p className="text-[10px] text-muted-foreground">Phone: {settings.phone}</p>
          </div>

          {/* Invoice Info */}
          <div className="flex justify-between text-[10px] text-muted-foreground mb-3">
            <div>
              <p className="font-semibold text-foreground text-xs">{sale.invoiceNo}</p>
              <p>{formattedDate} {formattedTime}</p>
            </div>
            <div className="text-right">
              <p>Customer:</p>
              <p className="font-medium text-foreground">{sale.customerName}</p>
            </div>
          </div>

          {/* Items */}
          <table className="w-full text-[10px] mb-3">
            <thead>
              <tr className="border-b border-dashed border-border">
                <th className="text-left py-1 font-semibold text-foreground">Item</th>
                <th className="text-center py-1 font-semibold text-foreground w-8">Qty</th>
                <th className="text-right py-1 font-semibold text-foreground w-14">Price</th>
                <th className="text-right py-1 font-semibold text-foreground w-16">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, idx) => (
                <tr key={idx} className="border-b border-dotted border-border/50">
                  <td className="py-1">
                    <span className="text-foreground">{item.medicineName}</span>
                    <br />
                    <span className="text-muted-foreground text-[9px]">{item.generic}</span>
                  </td>
                  <td className="text-center py-1 font-mono text-foreground">{item.qty}</td>
                  <td className="text-right py-1 font-mono text-foreground">{settings.currency}{item.unitPrice.toFixed(2)}</td>
                  <td className="text-right py-1 font-mono font-medium text-foreground">{settings.currency}{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t border-dashed border-border pt-2 space-y-0.5 text-[10px]">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-mono">{settings.currency}{sale.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>VAT ({settings.vatRate}%)</span>
              <span className="font-mono">{settings.currency}{sale.vat.toFixed(2)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Discount</span>
                <span className="font-mono">-{settings.currency}{sale.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-foreground border-t border-dashed border-border pt-1 mt-1">
              <span>Total</span>
              <span className="font-mono">{settings.currency}{sale.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Payment</span>
              <span className="font-medium text-foreground">{sale.paymentMethod}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-4 pt-3 border-t border-dashed border-border">
            <p className="text-[9px] text-muted-foreground">Thank you for your purchase!</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">Powered by PharmaStream BD</p>
          </div>
        </div>
      </div>
    </div>
  );
}
