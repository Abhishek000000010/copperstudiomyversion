import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  BadgeIndianRupee,
  CalendarDays,
  Download,
  FileSpreadsheet,
  Filter,
  ReceiptText,
  Search,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import { Badge, Button, Card } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";



function Metric({ icon: Icon, label, value, hint, tone = "copper" }) {
  const tones = {
    copper: "bg-[#f3dfd7] text-[#331405]",
    teal: "bg-[#dff4eb] text-[#026769]",
    amber: "bg-[#f8ead0] text-[#99621b]",
    rose: "bg-[#f6dddc] text-[#a23b33]",
  };

  return (
    <Card className="p-5 shadow-[0_14px_35px_rgba(79,39,16,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b6f63]">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-[#101010]">{value}</p>
          <p className="mt-1 text-xs text-[#331405]">{hint}</p>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-full ${tones[tone]}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
      </div>
    </Card>
  );
}

export default function Invoices() {
  const location = useLocation();
  const [search, setSearch] = useState(location.state?.query || "");

  const { records: contacts, loading: dbLoading } = useCrmRecords("contacts", []);

  const invoicesData = useMemo(() => {
    const paidOrBilled = contacts.filter((c) => c.package?.name);
    return paidOrBilled.map((c) => {
      const basePrice = c.package?.price || 0;
      const total = c.package?.total || Math.round(basePrice * 1.18);
      const gst = total - basePrice;
      const status = c.payment?.status === "paid" ? "Paid" : c.payment?.status === "failed" ? "Failed" : "Pending";
      const dateVal = c.payment?.paidAt || c.createdAt;
      const dateStr = dateVal ? new Date(dateVal).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }) : "—";

      return {
        _id: c._id,
        id: c.payment?.invoiceId || c.payment?.razorpayOrderId || `ORD-${c._id.toString().slice(-6).toUpperCase()}`,
        client: c.name,
        companyName: c.company,
        email: c.email,
        phone: c.phone,
        gstin: c.gstin,
        billingAddress: c.billingAddress,
        packageName: c.package?.name || "Standard Package",
        amount: `₹${basePrice.toLocaleString("en-IN")}`,
        amountNum: basePrice,
        gst: `₹${gst.toLocaleString("en-IN")}`,
        gstNum: gst,
        total: `₹${total.toLocaleString("en-IN")}`,
        totalNum: total,
        status,
        date: dateStr,
        paymentId: c.payment?.razorpayPaymentId || "—"
      };
    });
  }, [contacts]);

  const filtered = useMemo(
    () => invoicesData.filter((invoice) =>
      `${invoice.id} ${invoice.client} ${invoice.status} ${invoice.companyName || ""}`.toLowerCase().includes(search.toLowerCase())
    ),
    [invoicesData, search]
  );

  const totals = useMemo(() => {
    const gross = invoicesData.reduce((sum, invoice) => sum + invoice.totalNum, 0);
    const gst = invoicesData.reduce((sum, invoice) => sum + invoice.gstNum, 0);
    const paid = invoicesData.filter((invoice) => invoice.status === "Paid").length;
    const overdue = invoicesData.filter((invoice) => invoice.status === "Failed").length;
    return { gross, gst, paid, overdue };
  }, [invoicesData]);

  async function downloadInvoicePdf(invoice) {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 48;
    let y = 50;

    // Header bar (copper theme)
    doc.setFillColor(136, 76, 45); // #331405
    doc.rect(0, 0, pageWidth, 110, "F");
    
    // Logo & Header text
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("The Copper Studio", margin, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("PREMIUM DIGITAL CREATIVE STUDIO", margin, 70);

    // Invoice Title on the right side of header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("TAX INVOICE", pageWidth - margin - 180, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Invoice No: ${invoice.id}`, pageWidth - margin - 180, 72);
    doc.text(`Date: ${invoice.date}`, pageWidth - margin - 180, 87);

    y = 145;

    // Two-column Address info
    doc.setTextColor(17, 24, 39);
    
    // Left: From / Seller
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("FROM / SELLER:", margin, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("The Copper Studio", margin, y + 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text("Delhi/NCR, India", margin, y + 33);
    doc.text("Email: studio@coppercrm.in", margin, y + 48);
    doc.text("Web: www.thecopperstudio.com", margin, y + 63);

    // Right: To / Buyer
    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("BILL TO / CLIENT:", pageWidth / 2 + 20, y);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.client || "Client", pageWidth / 2 + 20, y + 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    
    const company = invoice.companyName || "Individual Client";
    const phone = invoice.phone || "";
    const email = invoice.email || "";
    const gstin = invoice.gstin ? `GSTIN: ${invoice.gstin}` : "";
    
    doc.text(company, pageWidth / 2 + 20, y + 33);
    doc.text(`Email: ${email}`, pageWidth / 2 + 20, y + 48);
    if (phone) doc.text(`Phone: ${phone}`, pageWidth / 2 + 20, y + 63);
    if (gstin) doc.text(gstin, pageWidth / 2 + 20, y + 78);

    // Billing Address below client info if available
    if (invoice.billingAddress && (invoice.billingAddress.line1 || invoice.billingAddress.city)) {
      const addr = invoice.billingAddress;
      const line1 = addr.line1 || "";
      const line2 = addr.line2 ? `, ${addr.line2}` : "";
      const cityState = `${addr.city || ""}, ${addr.state || ""} - ${addr.pincode || ""}`;
      doc.text("Billing Address:", pageWidth / 2 + 20, y + 93);
      doc.text(`${line1}${line2}`, pageWidth / 2 + 20, y + 106);
      doc.text(cityState, pageWidth / 2 + 20, y + 119);
      y += 135;
    } else {
      y += 95;
    }

    // Divider Line
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageWidth - margin, y);
    y += 25;

    // Table Header
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, pageWidth - margin * 2, 25, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text("ITEM DESCRIPTION", margin + 15, y + 16);
    doc.text("BASE AMOUNT", pageWidth - margin - 260, y + 16, { align: "right" });
    doc.text("GST (18%)", pageWidth - margin - 130, y + 16, { align: "right" });
    doc.text("TOTAL AMOUNT", pageWidth - margin - 15, y + 16, { align: "right" });

    y += 25;

    // Table Row
    doc.setFont("helvetica", "normal");
    doc.setTextColor(17, 24, 39);
    doc.text(invoice.packageName, margin + 15, y + 25);
    doc.text(invoice.amount, pageWidth - margin - 260, y + 25, { align: "right" });
    doc.text(invoice.gst, pageWidth - margin - 130, y + 25, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(invoice.total, pageWidth - margin - 15, y + 25, { align: "right" });

    y += 45;
    doc.line(margin, y, pageWidth - margin, y);
    y += 20;

    // Payment Info & Summary
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text("PAYMENT DETAILS", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(17, 24, 39);
    doc.text(`Status: ${invoice.status}`, margin, y + 18);
    doc.text(`Gateway: Razorpay`, margin, y + 33);
    doc.text(`Razorpay Payment ID: ${invoice.paymentId}`, margin, y + 48);

    // Summary calculations on the right
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal:", pageWidth - margin - 150, y + 18);
    doc.text(invoice.amount, pageWidth - margin - 15, y + 18, { align: "right" });
    doc.text("Integrated GST (18%):", pageWidth - margin - 150, y + 33);
    doc.text(invoice.gst, pageWidth - margin - 15, y + 33, { align: "right" });
    
    // Solid line before total
    doc.line(pageWidth - margin - 160, y + 43, pageWidth - margin, y + 43);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Total Paid:", pageWidth - margin - 150, y + 60);
    doc.text(invoice.total, pageWidth - margin - 15, y + 60, { align: "right" });

    // Footer note
    y = 750;
    doc.setDrawColor(136, 76, 45); // #331405
    doc.line(margin, y, pageWidth - margin, y);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(136, 76, 45);
    doc.text("Thank you for your business!", margin, y + 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text("If you have any questions regarding this invoice, please contact studio@coppercrm.in", margin, y + 35);

    doc.save(`Invoice-${invoice.id}.pdf`);
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b6f63]">Finance workspace</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#101010]">Invoices & GST</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#331405]">
            Monitor invoice generation, GST totals, paid billing, and overdue recovery from one cleaner finance screen.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 items-center gap-3 rounded-2xl border border-[#e3d6c5] bg-[#e3d6c5] px-4">
            <CalendarDays size={16} className="text-[#331405]" />
            <span className="text-sm font-semibold text-[#101010]">Current cycle</span>
          </div>
          <Button variant="secondary" size="lg">
            <Filter size={15} />
            Filter
          </Button>
          <Button size="lg">
            <Download size={15} />
            Export PDF
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={BadgeIndianRupee}
          label="Gross Billing"
          value={new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(totals.gross)}
          hint="Total invoice value"
        />
        <Metric
          icon={ReceiptText}
          label="GST Collected"
          value={new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(totals.gst)}
          hint="Across generated invoices"
          tone="amber"
        />
        <Metric
          icon={ShieldCheck}
          label="Paid Invoices"
          value={totals.paid}
          hint="Settled successfully"
          tone="teal"
        />
        <Metric
          icon={WalletCards}
          label="Overdue"
          value={totals.overdue}
          hint="Need collection follow-up"
          tone="rose"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
          <div className="border-b border-[#e3d6c5] bg-[#fff3ef] px-6 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#101010]">Invoice Register</h3>
                <p className="mt-1 text-sm text-[#331405]">GST-ready invoice history with payment state and totals.</p>
              </div>
              <div className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-[#e3d6c5] bg-[#e3d6c5] px-3 py-2.5">
                <Search size={15} className="text-[#7b6f63]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search invoice, client, status..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#a8948b]"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[#fffaf8]">
                <tr className="text-left text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b6f63]">
                  {["Invoice", "Client", "Base Amount", "GST", "Total", "Status", "Date", "Action"].map((heading) => (
                    <th key={heading} className="px-6 py-4">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1e2dd] bg-[#e3d6c5]">
                {filtered.map((invoice) => (
                  <tr key={invoice.id} className="transition-colors hover:bg-[#fff3ef]">
                    <td className="px-6 py-4 text-xs font-mono font-semibold text-[#331405]">{invoice.id}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-[#101010]">{invoice.client}</p>
                      <p className="text-xs text-[#331405]">GST billing record</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4b433d]">{invoice.amount}</td>
                    <td className="px-6 py-4 text-sm text-[#4b433d]">{invoice.gst}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#101010]">{invoice.total}</td>
                    <td className="px-6 py-4">
                      <Badge color={invoice.status === "Paid" ? "green" : invoice.status === "Overdue" ? "red" : "orange"}>
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#331405]">{invoice.date}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => downloadInvoicePdf(invoice)}
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-[#331405] transition-colors hover:bg-[#f3dfd7]"
                      >
                        <FileSpreadsheet size={12} />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
            <h3 className="text-lg font-semibold text-[#101010]">Billing Snapshot</h3>
            <div className="mt-5 space-y-3">
              {[
                ["Invoice prefix", "INV"],
                ["GST mode", "18% enabled"],
                ["Payment gateway", "Razorpay"],
                ["Portal invite trigger", "After payment success"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl border border-[#e3d6c5] bg-[#fffdfc] px-4 py-3">
                  <span className="text-sm text-[#331405]">{label}</span>
                  <span className="text-sm font-semibold text-[#101010]">{value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
            <h3 className="text-lg font-semibold text-[#101010]">Collections Notes</h3>
            <div className="mt-5 space-y-3">
              {[
                "Paid invoices should remain linked to client onboarding records.",
                "Overdue invoices should push visible follow-up reminders for admin review.",
                "Invoice exports should stay consistent with GST-ready formatting and client company details.",
              ].map((note) => (
                <div key={note} className="rounded-2xl border border-[#e3d6c5] bg-[#fffdfc] px-4 py-4 text-sm leading-6 text-[#4b433d]">
                  {note}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
