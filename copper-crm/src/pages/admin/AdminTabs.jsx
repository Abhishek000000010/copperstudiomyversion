import { useMemo, useState } from "react";
import {
  BarChart3, CalendarDays, Clock3, Copy, FileDown, FileText,
  PackageCheck, PieChart, Plus, ReceiptText, Send,
  Tag, TrendingUp, Users, WalletCards, Table2
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart as RePieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { Button } from "../../components/ui";
import { coupons, dailyRevenue, orders, projects } from "../../data/mockData";
import { useToast } from "../../components/useToast";
import { useCrmRecords } from "../../hooks/useCrmRecords";

function Card({ children, className = "" }) {
  return <section className={`rounded-xl border border-gray-200 bg-[#f0ede4] shadow-sm shadow-gray-100/60 ${className}`}>{children}</section>;
}

function PageShell({ title, subtitle, action, children }) {
  return (
    <div className="p-5 xl:p-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Admin</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder = "", type = "text" }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-gray-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
      />
    </label>
  );
}

function DateTimeField({ label, value, onChange }) {
  const [date = "", time = ""] = String(value || "").split("T");
  const update = (nextDate, nextTime) => onChange(`${nextDate || date}T${nextTime || time || "23:59"}`);

  return (
    <div className="block">
      <span className="text-xs font-bold text-gray-600">{label}</span>
      <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50">
          <CalendarDays size={15} className="shrink-0 text-gray-400" />
          <input
            type="date"
            value={date}
            onChange={(event) => update(event.target.value, time)}
            className="w-full bg-transparent outline-none"
          />
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50">
          <Clock3 size={15} className="shrink-0 text-gray-400" />
          <input
            type="time"
            step="900"
            value={time || "23:59"}
            onChange={(event) => update(date, event.target.value)}
            className="w-full bg-transparent outline-none"
          />
        </label>
      </div>
    </div>
  );
}

const statusData = [
  { name: "On time", value: 71, color: "#10b981" },
  { name: "Delayed", value: 18, color: "#f59e0b" },
  { name: "At risk", value: 11, color: "#ef4444" },
];

const packageRevenue = [
  { name: "Starter", revenue: 29499, tier: 9 },
  { name: "Growth", revenue: 176997, tier: 14 },
  { name: "Enterprise", revenue: 212398, tier: 8 },
];

function toDateTimeLocal(date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
  const zoned = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return zoned.toISOString().slice(0, 16);
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true
  });
}

function safeFileName(value) {
  return String(value || "proposal").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function AnalyticsPage() {
  const [timeFilter, setTimeFilter] = useState("Last 30 days");
  const revenue = 298520;
  const paidOrders = orders.filter((order) => order.status === "Paid").length;
  const paymentRate = Math.round((paidOrders / orders.length) * 100);
  const avgProjectValue = Math.round(revenue / projects.length);

  const metrics = [
    ["Total revenue", `Rs ${revenue.toLocaleString("en-IN")}`, WalletCards],
    ["Total projects", projects.length, PackageCheck],
    ["Avg project value", `Rs ${avgProjectValue.toLocaleString("en-IN")}`, TrendingUp],
    ["New clients", 12, Users],
    ["Payment rate", `${paymentRate}%`, ReceiptText],
    ["Avg completion", "18 days", BarChart3],
    ["On-time", "71%", PieChart],
    ["Delayed", 3, FileText],
  ];

  return (
    <PageShell
      title="Analytics"
      subtitle="Revenue, projects, payments, package tiers, product performance, and delivery health."
      action={
        <select value={timeFilter} onChange={(event) => setTimeFilter(event.target.value)} className="h-10 rounded-xl border border-gray-200 bg-[#f0ede4] px-3 text-xs font-bold text-gray-600 outline-none">
          {["Last 7 days", "Last 30 days", "This quarter", "This year"].map((item) => <option key={item}>{item}</option>)}
        </select>
      }
    >
      <div className="mb-5 grid gap-4 md:grid-cols-4">
        {metrics.map(([label, value, Icon]) => (
          <Card key={label} className="p-4">
            <Icon size={18} className="text-[#2563EB]" />
            <p className="mt-3 text-2xl font-bold text-gray-950">{value}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.8fr)]">
        <Card>
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="text-sm font-bold text-gray-950">Revenue and orders graph</h3>
            <p className="text-xs text-gray-400">{timeFilter}</p>
          </div>
          <div className="h-80 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyRevenue.slice(-45)}>
                <CartesianGrid vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="day" hide />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line dataKey="revenue" stroke="#2563EB" strokeWidth={2} dot={false} />
                <Line dataKey="trend" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="text-sm font-bold text-gray-950">Status breakdown</h3>
          </div>
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={statusData} dataKey="value" innerRadius={54} outerRadius={86} paddingAngle={4}>
                  {statusData.map((item) => <Cell key={item.name} fill={item.color} />)}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 px-4 pb-4">
            {statusData.map((item) => (
              <div key={item.name} className="rounded-xl bg-gray-50 p-3">
                <span className="block h-2 w-2 rounded-full" style={{ background: item.color }} />
                <p className="mt-2 text-xs font-bold text-gray-700">{item.name}</p>
                <p className="text-sm font-bold text-gray-950">{item.value}%</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <h3 className="text-sm font-bold text-gray-950">Top products by revenue</h3>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={packageRevenue}>
                    <CartesianGrid vertical={false} stroke="#eef2f7" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#2563EB" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-950">Total tier under package</h3>
              <div className="mt-4 space-y-3">
                {packageRevenue.map((item) => (
                  <div key={item.name} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900">{item.name}</p>
                      <p className="text-xs font-bold text-[#2563EB]">{item.tier} tiers</p>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Rs {item.revenue.toLocaleString("en-IN")} revenue</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

export function ProposalGeneratorPage() {
  const { showToast } = useToast();
  const [proposal, setProposal] = useState({
    client: "Zara India",
    company: "Zara India Pvt Ltd",
    gstin: "27ABCDE1234F1Z5",
    service: "Retail App Design",
    value: "89999",
    timeline: "21 days",
  });

  const proposalText = useMemo(() => (
    `PDF Contents\n\nPage 1 - Intro / Cover Page\nClient: ${proposal.client}\nCompany: ${proposal.company}\nGSTIN: ${proposal.gstin}\n\nPage 2 - About The Copper Studio\nPage 3 - Pricing of various packages\nPage 4 - Detailed comparison\nPage 5 - Process / timeline details\nTimeline: ${proposal.timeline}\nService: ${proposal.service}\nValue: Rs ${Number(proposal.value || 0).toLocaleString("en-IN")}\n\nPage 6 - Contact us / outro page`
  ), [proposal]);

  async function copyText(text, title) {
    await navigator.clipboard.writeText(text);
    showToast({ title, message: "Copied to clipboard." });
  }

  async function createProposalPdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 48;
    const value = Number(proposal.value || 0);
    const proposalNo = `DCS-${Date.now().toString().slice(-6)}`;
    let y = 190;

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 150, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("DataCircles", margin, 58);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("The Copper Studio Proposal", margin, 82);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text(proposal.service || "Project Proposal", margin, 122);
    doc.setFontSize(10);
    doc.text(`Proposal ${proposalNo}`, pageWidth - 168, 58);
    doc.text(formatDateTime(new Date()), pageWidth - 168, 78);

    doc.setTextColor(17, 24, 39);
    doc.setFontSize(18);
    doc.text(`Prepared for ${proposal.client}`, margin, y);
    y += 30;

    const details = [
      ["Company", proposal.company],
      ["GSTIN", proposal.gstin],
      ["Service", proposal.service],
      ["Project value", `Rs ${value.toLocaleString("en-IN")}`],
      ["Estimated timeline", proposal.timeline]
    ];

    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 118, 10, 10);
    details.forEach(([label, detail], index) => {
      const rowY = y + 24 + index * 19;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(label.toUpperCase(), margin + 20, rowY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(17, 24, 39);
      doc.text(String(detail || "-"), margin + 150, rowY);
    });
    y += 158;

    const sections = [
      {
        title: "About The Copper Studio",
        body: "A focused implementation workspace for designing, deploying, and supporting professional client-facing digital systems with a clear onboarding and delivery process."
      },
      {
        title: "Scope and Deliverables",
        body: `${proposal.service} includes planning, design coordination, implementation, review cycles, and handover documentation aligned to the selected package.`
      },
      {
        title: "Pricing and Commercials",
        body: `Estimated project value is Rs ${value.toLocaleString("en-IN")}. Taxes, final package inclusions, and payment milestones can be confirmed during checkout or invoice generation.`
      },
      {
        title: "Process and Timeline",
        body: `The expected completion timeline is ${proposal.timeline}. Work moves through discovery, setup, build, review, launch, and support.`
      }
    ];

    sections.forEach((section) => {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 86, 8, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(17, 24, 39);
      doc.text(section.title, margin + 18, y + 24);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.text(doc.splitTextToSize(section.body, pageWidth - margin * 2 - 36), margin + 18, y + 45);
      y += 104;
    });

    doc.setDrawColor(37, 99, 235);
    doc.line(margin, 780, pageWidth - margin, 780);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(37, 99, 235);
    doc.text("DataCircles Technology", margin, 802);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text("Contact us for package confirmation, onboarding, and next steps.", margin, 818);

    doc.save(`${safeFileName(proposal.company)}-${safeFileName(proposal.service)}.pdf`);
    showToast({ title: "Proposal PDF created", message: "Professional proposal downloaded successfully." });
  }

  return (
    <PageShell title="Proposal Generator" subtitle="Create a ready-to-send, branded proposal draft." action={<Button onClick={() => copyText(proposalText, "Proposal copied")}><Send size={14} /> Send Proposal</Button>}>
      <Card className="max-w-3xl">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-bold text-gray-950">Proposal Generator</h3>
          <p className="text-xs text-gray-400">Create a ready-to-send proposal draft.</p>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Client" value={proposal.client} onChange={(value) => setProposal((prev) => ({ ...prev, client: value }))} />
          <Field label="Company" value={proposal.company} onChange={(value) => setProposal((prev) => ({ ...prev, company: value }))} />
          <Field label="GSTIN" value={proposal.gstin} onChange={(value) => setProposal((prev) => ({ ...prev, gstin: value }))} />
          <Field label="Service" value={proposal.service} onChange={(value) => setProposal((prev) => ({ ...prev, service: value }))} />
          <Field label="Value" type="number" value={proposal.value} onChange={(value) => setProposal((prev) => ({ ...prev, value }))} />
          <Field label="Timeline" value={proposal.timeline} onChange={(value) => setProposal((prev) => ({ ...prev, timeline: value }))} />
        </div>
        <div className="px-5 pb-5">
          <pre className="min-h-44 whitespace-pre-wrap rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs leading-6 text-gray-700">{proposalText}</pre>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => copyText(proposalText, "Proposal copied")}><Copy size={14} /> Copy</Button>
            <Button onClick={createProposalPdf}><FileDown size={14} /> Save PDF</Button>
          </div>
        </div>
      </Card>
    </PageShell>
  );
}

export function ServicesPage() {
  const { showToast } = useToast();
  const couponFallback = useMemo(() => coupons.map((coupon) => ({
    code: coupon.code,
    generatedAt: "15 Jun 2026 10:30",
    validity: coupon.expiry,
    amountType: coupon.type === "Percentage" ? "percentage" : "fixed",
    amount: coupon.value,
    status: coupon.status,
    clientName: "",
    companyName: "",
    email: "",
    phone: "",
  })), []);
  const { records: savedCoupons, save: saveCoupon } = useCrmRecords("coupons", couponFallback);
  const [coupon, setCoupon] = useState({
    prefix: "DATACIRCLES",
    discount: "15",
    packageName: "Growth Studio",
    validity: toDateTimeLocal(),
    amountType: "percentage",
    clientName: "",
    companyName: "",
    email: "",
    phone: "",
  });

  const couponCode = `${coupon.prefix}-${coupon.discount}-${coupon.packageName.replace(/\s+/g, "").toUpperCase()}`.slice(0, 28);

  async function copyText(text, title) {
    await navigator.clipboard.writeText(text);
    showToast({ title, message: "Copied to clipboard." });
  }

  function nineDigitCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 9 }, (_, index) => {
      const char = alphabet[Math.floor(Math.random() * alphabet.length)];
      return index === 3 || index === 6 ? `-${char}` : char;
    }).join("");
  }

  async function createCoupon() {
    const code = `${coupon.prefix.slice(0, 6).toUpperCase()}-${nineDigitCode()}`;
    const validUntil = coupon.validity ? new Date(coupon.validity).toISOString() : null;
    await saveCoupon({
      code,
      generatedAt: new Date().toLocaleString("en-IN"),
      validity: formatDateTime(validUntil),
      validUntil,
      amountType: coupon.amountType,
      amount: coupon.amountType === "percentage" ? `${coupon.discount}%` : `Rs ${coupon.discount}`,
      status: "Not used",
      clientName: coupon.clientName,
      companyName: coupon.companyName,
      email: coupon.email,
      phone: coupon.phone,
      packageName: coupon.packageName,
    });
    showToast({ title: "Coupon created", message: `${code} stored successfully.` });
  }

  return (
    <PageShell title="Coupon Code Generator" subtitle="Generate package-specific coupon codes.">
      <Card className="max-w-3xl">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-bold text-gray-950">Coupon Code Generator</h3>
          <p className="text-xs text-gray-400">Create package-specific coupon codes.</p>
        </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Prefix" value={coupon.prefix} onChange={(value) => setCoupon((prev) => ({ ...prev, prefix: value }))} />
            <Field label="Amount" type="number" value={coupon.discount} onChange={(value) => setCoupon((prev) => ({ ...prev, discount: value }))} />
            <Field label="Package" value={coupon.packageName} onChange={(value) => setCoupon((prev) => ({ ...prev, packageName: value }))} />
            <label className="block">
              <span className="text-xs font-bold text-gray-600">Amount type</span>
              <select value={coupon.amountType} onChange={(event) => setCoupon((prev) => ({ ...prev, amountType: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50">
                <option value="percentage">In %</option>
                <option value="fixed">In Rs</option>
              </select>
            </label>
            <DateTimeField label="Validity date + time" value={coupon.validity} onChange={(value) => setCoupon((prev) => ({ ...prev, validity: value }))} />
            <Field label="Client name" value={coupon.clientName} onChange={(value) => setCoupon((prev) => ({ ...prev, clientName: value }))} />
            <Field label="Company name" value={coupon.companyName} onChange={(value) => setCoupon((prev) => ({ ...prev, companyName: value }))} />
            <Field label="Email ID" value={coupon.email} onChange={(value) => setCoupon((prev) => ({ ...prev, email: value }))} />
            <Field label="Phone no." value={coupon.phone} onChange={(value) => setCoupon((prev) => ({ ...prev, phone: value }))} />
          </div>
          <div className="px-5 pb-5">
            <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-5 text-center">
              <Tag size={22} className="mx-auto text-[#2563EB]" />
              <p className="mt-3 font-mono text-xl font-bold text-gray-950">{couponCode}</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">{coupon.amountType === "percentage" ? `${coupon.discount}%` : `Rs ${coupon.discount}`} off on {coupon.packageName}</p>
              <p className="mt-1 text-[11px] font-semibold text-blue-700">Valid till {formatDateTime(coupon.validity)}</p>
            </div>
            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              {savedCoupons.slice(0, 6).map((item) => (
                <div key={item._id || item.code} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-gray-700">{item.code}</span>
                    <span className="text-xs font-bold text-gray-400">{item.status}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500">{item.generatedAt} - Valid till {item.validity || formatDateTime(item.validUntil)}</p>
                  <p className="text-[11px] text-gray-500">{item.clientName || "No client"} / {item.companyName || "No company"}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => copyText(couponCode, "Coupon copied")}><Copy size={14} /> Copy</Button>
              <Button onClick={createCoupon}><Plus size={14} /> Create Coupon</Button>
            </div>
          </div>
      </Card>
    </PageShell>
  );
}

const tableColumns = {
  companies: ["name", "gstin", "industry", "contact", "status"],
  contacts: ["name", "company", "email", "phone", "designation"],
  tasks: ["title", "project", "status", "priority", "deadline"],
  coupons: ["code", "validity", "amount", "status", "companyName"],
};

function DataTablePreview({ type, title }) {
  const emptyFallback = useMemo(() => [], []);
  const { records, loading } = useCrmRecords(type, emptyFallback);
  const columns = tableColumns[type];
  return (
    <Card>
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Table2 size={16} className="text-[#2563EB]" />
          <h3 className="text-sm font-bold text-gray-950">{title}</h3>
        </div>
        <span className="rounded-full bg-gray-50 px-2 py-1 text-[11px] font-bold text-gray-500">{loading ? "Loading" : `${records.length} rows`}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px]">
          <thead>
            <tr className="bg-gray-50/80">
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(records.length ? records : [{}].slice(0, 6)).map((row, index) => (
              <tr key={row._id || index} className="border-t border-gray-100">
                {columns.map((column) => (
                  <td key={column} className="max-w-40 truncate px-4 py-3 text-xs font-semibold text-gray-600">{row[column] || "-"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function DatabaseTablesPage() {
  return (
    <PageShell title="Database Tables" subtitle="Separate MongoDB collections for companies, contacts, tasks, and coupons." action={null}>
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-4">
          {Object.keys(tableColumns).map((type) => (
            <Card key={type} className="p-4">
              <Table2 size={18} className="text-[#2563EB]" />
              <p className="mt-3 text-lg font-bold capitalize text-gray-950">{type}</p>
              <p className="text-xs font-semibold text-gray-500">Dedicated collection</p>
            </Card>
          ))}
        </div>
        <DataTablePreview type="companies" title="Companies table" />
        <DataTablePreview type="contacts" title="Contacts table" />
        <DataTablePreview type="tasks" title="Tasks table" />
        <DataTablePreview type="coupons" title="Coupons table" />
      </div>
    </PageShell>
  );
}

